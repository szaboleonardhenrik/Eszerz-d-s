import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { DecideApprovalDto } from './dto/decide-approval.dto';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── WORKFLOW CRUD ──────────────────────────────────

  async createWorkflow(dto: CreateWorkflowDto, userId: string) {
    // Get user's team
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { userId },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const teamId = teamMember?.teamId ?? userId; // fallback to userId if no team

    return this.prisma.approvalWorkflow.create({
      data: {
        name: dto.name,
        teamId,
        createdBy: userId,
        steps: {
          create: dto.steps.map((s) => ({
            order: s.order,
            name: s.name,
            approverEmail: s.approverEmail,
            approverName: s.approverName,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  async listWorkflows(userId: string) {
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { userId },
    });
    const teamId = teamMember?.teamId ?? userId;

    return this.prisma.approvalWorkflow.findMany({
      where: { teamId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { contracts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkflow(id: string, userId: string) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: 'asc' } },
        contracts: {
          select: { id: true, title: true, status: true },
          take: 10,
        },
      },
    });

    if (!workflow) throw new NotFoundException('Workflow not found');
    return workflow;
  }

  async deleteWorkflow(id: string, userId: string) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');
    if (workflow.createdBy !== userId) {
      throw new ForbiddenException('Only the creator can delete this workflow');
    }

    await this.prisma.approvalWorkflow.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── START APPROVAL PROCESS ─────────────────────────

  async startApproval(contractId: string, workflowId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { owner: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.ownerId !== userId) {
      throw new ForbiddenException('Only the contract owner can start approval');
    }

    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');
    if (workflow.steps.length === 0) {
      throw new BadRequestException('Workflow has no steps');
    }

    // Check if there are already pending approvals
    const existingApprovals = await this.prisma.approval.findMany({
      where: { contractId, status: 'pending' },
    });
    if (existingApprovals.length > 0) {
      throw new BadRequestException('Contract already has pending approvals');
    }

    // Link workflow to contract and create approval records
    await this.prisma.contract.update({
      where: { id: contractId },
      data: { workflowId, status: 'pending_approval' },
    });

    const approvals = await Promise.all(
      workflow.steps.map((step) =>
        this.prisma.approval.create({
          data: {
            contractId,
            stepId: step.id,
            status: 'pending',
          },
        }),
      ),
    );

    // Notify first step's approver
    const firstStep = workflow.steps[0];
    await this.sendApprovalRequestEmail(
      firstStep.approverEmail,
      firstStep.approverName ?? firstStep.approverEmail,
      contract.title,
      firstStep.name,
      contract.owner.name,
      contractId,
    );

    return {
      contractId,
      workflowId,
      approvalsCreated: approvals.length,
    };
  }

  // ─── DECIDE (APPROVE / REJECT) ─────────────────────

  async decide(approvalId: string, dto: DecideApprovalDto, userId: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        step: { include: { workflow: { include: { steps: { orderBy: { order: 'asc' } } } } } },
        contract: { include: { owner: true } },
      },
    });

    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.status !== 'pending') {
      throw new BadRequestException('This approval has already been decided');
    }

    // Verify the user is the approver for this step (by email)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email.toLowerCase() !== approval.step.approverEmail.toLowerCase()) {
      throw new ForbiddenException('You are not the approver for this step');
    }

    // Check that all previous steps are approved
    const allSteps = approval.step.workflow.steps;
    const currentStepOrder = approval.step.order;
    const previousSteps = allSteps.filter((s) => s.order < currentStepOrder);

    if (previousSteps.length > 0) {
      const previousApprovals = await this.prisma.approval.findMany({
        where: {
          contractId: approval.contractId,
          stepId: { in: previousSteps.map((s) => s.id) },
        },
      });
      const allPreviousApproved = previousApprovals.every(
        (a) => a.status === 'approved',
      );
      if (!allPreviousApproved) {
        throw new BadRequestException(
          'Previous approval steps must be completed first',
        );
      }
    }

    // Update approval
    const updated = await this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: dto.status,
        comment: dto.comment,
        decidedBy: userId,
        decidedAt: new Date(),
      },
      include: { step: true, contract: { include: { owner: true } } },
    });

    if (dto.status === 'approved') {
      // Check if there's a next step
      const nextStep = allSteps.find((s) => s.order > currentStepOrder);
      if (nextStep) {
        // Notify next approver
        await this.sendApprovalRequestEmail(
          nextStep.approverEmail,
          nextStep.approverName ?? nextStep.approverEmail,
          approval.contract.title,
          nextStep.name,
          approval.contract.owner.name,
          approval.contractId,
        );
      } else {
        // All steps approved — update contract status
        await this.prisma.contract.update({
          where: { id: approval.contractId },
          data: { status: 'approved' },
        });

        // Notify contract owner
        await this.sendAllApprovedEmail(
          approval.contract.owner.email,
          approval.contract.owner.name,
          approval.contract.title,
          approval.contractId,
        );
      }
    } else if (dto.status === 'rejected') {
      // Update contract status
      await this.prisma.contract.update({
        where: { id: approval.contractId },
        data: { status: 'approval_rejected' },
      });

      // Notify contract owner of rejection
      await this.sendRejectionEmail(
        approval.contract.owner.email,
        approval.contract.owner.name,
        approval.contract.title,
        updated.step.name,
        user.name,
        dto.comment,
        approval.contractId,
      );
    }

    return updated;
  }

  // ─── PENDING APPROVALS FOR USER ─────────────────────

  async getPendingForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Find all approval steps assigned to this user's email
    const steps = await this.prisma.approvalStep.findMany({
      where: { approverEmail: { equals: user.email, mode: 'insensitive' } },
      select: { id: true },
    });

    if (steps.length === 0) return [];

    const stepIds = steps.map((s) => s.id);

    // Find pending approvals for these steps
    const approvals = await this.prisma.approval.findMany({
      where: {
        stepId: { in: stepIds },
        status: 'pending',
      },
      include: {
        step: {
          include: {
            workflow: { select: { name: true, steps: { orderBy: { order: 'asc' }, select: { id: true, order: true } } } },
          },
        },
        contract: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter: only return approvals where all previous steps are done
    const result = [];
    for (const approval of approvals) {
      const allSteps = approval.step.workflow.steps;
      const currentOrder = approval.step.order;
      const previousStepIds = allSteps
        .filter((s) => s.order < currentOrder)
        .map((s) => s.id);

      if (previousStepIds.length === 0) {
        result.push(approval);
        continue;
      }

      const previousApprovals = await this.prisma.approval.findMany({
        where: {
          contractId: approval.contractId,
          stepId: { in: previousStepIds },
        },
      });

      const allPreviousApproved = previousApprovals.every(
        (a) => a.status === 'approved',
      );
      if (allPreviousApproved) {
        result.push(approval);
      }
    }

    return result;
  }

  // ─── GET APPROVALS FOR A CONTRACT ───────────────────

  async getContractApprovals(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    return this.prisma.approval.findMany({
      where: { contractId },
      include: {
        step: { select: { name: true, order: true, approverEmail: true, approverName: true } },
      },
      orderBy: { step: { order: 'asc' } },
    });
  }

  // ─── EMAIL HELPERS ──────────────────────────────────

  private async sendApprovalRequestEmail(
    to: string,
    approverName: string,
    contractTitle: string,
    stepName: string,
    senderName: string,
    contractId: string,
  ) {
    try {
      await (this.notifications as any).sendAndLog(
        {
          from: (this.notifications as any).fromEmail,
          to,
          subject: `Jóváhagyásra vár: ${contractTitle}`,
          html: (this.notifications as any).wrap(
            `<p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#198296;text-transform:uppercase;letter-spacing:1px;">Jóváhagyási kérelem</p>
             <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${contractTitle}</p>
             ${(this.notifications as any).greeting(approverName)}
             ${(this.notifications as any).text(`<strong>${senderName}</strong> jóváhagyást kér Öntől a fenti szerződéshez. Az Ön feladata: <strong>${stepName}</strong>.`)}
             ${(this.notifications as any).text('Kérjük, jelentkezzen be a Legitas platformra a szerződés áttekintéséhez és jóváhagyásához vagy elutasításához.')}
             ${(this.notifications as any).btn(`${(this.notifications as any).frontendUrl}/approvals`, 'Jóváhagyások megtekintése')}
             ${(this.notifications as any).hint('Ez egy automatikus értesítés a Legitas jóváhagyási rendszerből.')}`,
            { preheader: `${senderName} jóváhagyást kér: ${contractTitle}` },
          ),
        },
        { type: 'approval_request', contractId },
      );
      this.logger.log(`Approval request email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send approval request email to ${to}`, error);
    }
  }

  private async sendAllApprovedEmail(
    to: string,
    ownerName: string,
    contractTitle: string,
    contractId: string,
  ) {
    try {
      await (this.notifications as any).sendAndLog(
        {
          from: (this.notifications as any).fromEmail,
          to,
          subject: `Jóváhagyva: ${contractTitle}`,
          html: (this.notifications as any).wrap(
            `<p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:1px;">Szerződés jóváhagyva</p>
             <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${contractTitle}</p>
             ${(this.notifications as any).greeting(ownerName)}
             ${(this.notifications as any).text('A szerződés minden jóváhagyási lépésen átment. A szerződés készen áll az aláírásra küldéshez.')}
             ${(this.notifications as any).btn(`${(this.notifications as any).frontendUrl}/contracts/${contractId}`, 'Szerződés megtekintése')}`,
            { preheader: `A(z) ${contractTitle} szerződés minden jóváhagyást megkapott` },
          ),
        },
        { type: 'approval_completed', contractId },
      );
      this.logger.log(`All-approved email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send all-approved email to ${to}`, error);
    }
  }

  private async sendRejectionEmail(
    to: string,
    ownerName: string,
    contractTitle: string,
    stepName: string,
    rejectorName: string,
    comment: string | undefined,
    contractId: string,
  ) {
    try {
      const commentHtml = comment
        ? `${(this.notifications as any).text(`<strong>Megjegyzés:</strong> ${comment}`)}`
        : '';

      await (this.notifications as any).sendAndLog(
        {
          from: (this.notifications as any).fromEmail,
          to,
          subject: `Elutasítva: ${contractTitle}`,
          html: (this.notifications as any).wrap(
            `<p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Szerződés elutasítva</p>
             <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${contractTitle}</p>
             ${(this.notifications as any).greeting(ownerName)}
             ${(this.notifications as any).text(`A(z) <strong>${contractTitle}</strong> szerződést <strong>${rejectorName}</strong> elutasította a(z) <strong>${stepName}</strong> lépésnél.`)}
             ${commentHtml}
             ${(this.notifications as any).btn(`${(this.notifications as any).frontendUrl}/contracts/${contractId}`, 'Szerződés megtekintése')}`,
            { preheader: `${rejectorName} elutasította: ${contractTitle}` },
          ),
        },
        { type: 'approval_rejected', contractId },
      );
      this.logger.log(`Rejection email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send rejection email to ${to}`, error);
    }
  }
}
