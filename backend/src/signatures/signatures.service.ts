import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ContactsService } from '../contacts/contacts.service';
import { SignContractDto } from './dto/sign.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class SignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly contactsService: ContactsService,
    private readonly config: ConfigService,
  ) {}

  async getContractByToken(token: string) {
    const signer = await this.prisma.signer.findUnique({
      where: { signToken: token },
      include: {
        contract: {
          include: {
            signers: {
              select: {
                id: true,
                name: true,
                role: true,
                status: true,
                signingOrder: true,
              },
            },
          },
        },
      },
    });

    if (!signer) {
      throw new NotFoundException('Érvénytelen aláírási link');
    }
    if (signer.tokenExpiresAt && signer.tokenExpiresAt < new Date()) {
      throw new ForbiddenException('Az aláírási link lejárt');
    }
    if (signer.status === 'signed') {
      throw new BadRequestException('Már aláírta ezt a szerződést');
    }
    if (signer.status === 'declined') {
      throw new BadRequestException('Korábban visszautasította ezt a szerződést');
    }

    return {
      contract: {
        id: signer.contract.id,
        title: signer.contract.title,
        contentHtml: signer.contract.contentHtml,
        status: signer.contract.status,
        signers: signer.contract.signers,
      },
      signer: {
        id: signer.id,
        name: signer.name,
        email: signer.email,
        role: signer.role,
        signingOrder: signer.signingOrder,
      },
    };
  }

  async signContract(
    token: string,
    dto: SignContractDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const signer = await this.prisma.signer.findUnique({
      where: { signToken: token },
      include: { contract: { include: { signers: true } } },
    });

    if (!signer) throw new NotFoundException('Érvénytelen aláírási link');
    if (signer.tokenExpiresAt && signer.tokenExpiresAt < new Date())
      throw new ForbiddenException('Az aláírási link lejárt');
    if (signer.status !== 'pending')
      throw new BadRequestException('Ez az aláírás már nem módosítható');

    // Check signing order
    const earlierSigners = signer.contract.signers.filter(
      (s) => s.signingOrder < signer.signingOrder && s.status === 'pending',
    );
    if (earlierSigners.length > 0) {
      throw new BadRequestException(
        'Még nem Ön következik az aláírási sorrendben',
      );
    }

    // Handle signature image upload
    let signatureImageUrl: string | undefined;
    if (dto.signatureImageBase64) {
      const imageBuffer = Buffer.from(
        dto.signatureImageBase64.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );
      const imageKey = `signatures/${signer.contractId}/${randomUUID()}.png`;
      await this.storageService.uploadImage(imageKey, imageBuffer);
      signatureImageUrl = imageKey;
    }

    // Save/update partner as Contact
    let contactId: string | undefined;
    try {
      const contact = await this.prisma.contact.upsert({
        where: {
          userId_email: {
            userId: signer.contract.ownerId,
            email: signer.email,
          },
        },
        update: {
          name: dto.signerFullName,
          company: dto.companyName,
          taxNumber: dto.companyTaxNumber,
          address: dto.companyAddress,
          group: 'Partnerek',
        },
        create: {
          userId: signer.contract.ownerId,
          name: dto.signerFullName,
          email: signer.email,
          company: dto.companyName,
          taxNumber: dto.companyTaxNumber,
          address: dto.companyAddress,
          group: 'Partnerek',
        },
      });
      contactId = contact.id;
    } catch {
      // Non-critical — continue signing even if contact save fails
    }

    // Atomic update: only update if signer is still 'pending' (prevents race condition)
    const updateResult = await this.prisma.signer.updateMany({
      where: { id: signer.id, status: 'pending' },
      data: {
        status: 'signed',
        signedAt: new Date(),
        ipAddress,
        userAgent,
        signatureMethod: dto.signatureMethod,
        signatureImageUrl,
        typedName: dto.typedName,
        signerNote: dto.note ?? null,
        companyName: dto.companyName,
        companyTaxNumber: dto.companyTaxNumber,
        companyAddress: dto.companyAddress,
        ...(contactId ? { contactId } : {}),
      },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException('Ez az aláírás már megtörtént vagy nem módosítható');
    }

    // Get current document hash
    const documentHash = this.pdfService.hashDocument(
      Buffer.from(signer.contract.contentHtml),
    );

    await this.auditService.log({
      contractId: signer.contractId,
      signerId: signer.id,
      eventType: 'signed',
      eventData: { method: dto.signatureMethod, typedName: dto.typedName },
      ipAddress,
      userAgent,
      documentHash,
    });

    // Check if all signers have signed
    const allSigners = await this.prisma.signer.findMany({
      where: { contractId: signer.contractId },
    });
    const allSigned = allSigners.every(
      (s) => s.id === signer.id || s.status === 'signed',
    );

    if (allSigned) {
      // Generate final PDF with all signatures
      const signatures = allSigners.map((s) => ({
        name: s.id === signer.id ? dto.signerFullName : s.name,
        role: s.role ?? 'Aláíró',
        signatureImageUrl: s.signatureImageUrl ?? undefined,
        typedName: s.id === signer.id ? dto.typedName : s.typedName ?? undefined,
        signedAt:
          (s.id === signer.id ? new Date() : s.signedAt)?.toLocaleDateString(
            'hu-HU',
          ) ?? '',
        method: s.id === signer.id ? dto.signatureMethod : s.signatureMethod ?? 'simple',
        companyName: s.id === signer.id ? dto.companyName : s.companyName ?? undefined,
        companyTaxNumber: s.id === signer.id ? dto.companyTaxNumber : s.companyTaxNumber ?? undefined,
        companyAddress: s.id === signer.id ? dto.companyAddress : s.companyAddress ?? undefined,
      }));

      // Download signature images from R2/local and embed as base64
      const signaturesWithImages = await Promise.all(
        signatures.map(async (s) => {
          let signatureImageBase64: string | undefined;
          if (s.signatureImageUrl) {
            try {
              const imageBuffer = await this.storageService.downloadFile(s.signatureImageUrl);
              signatureImageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
            } catch {
              // If download fails, skip the image
            }
          }
          return {
            name: s.name,
            role: s.role,
            signatureImageBase64,
            typedName: s.typedName,
            signedAt: s.signedAt,
            method: s.method,
            companyName: s.companyName,
            companyTaxNumber: s.companyTaxNumber,
            companyAddress: s.companyAddress,
          };
        }),
      );

      const finalPdf = await this.pdfService.addSignatureToPdf(
        signer.contract.contentHtml,
        signer.contract.title,
        signaturesWithImages,
        undefined,
        (signer.contract as any).verificationHash ?? undefined,
      );

      const finalPdfKey = `contracts/signed/${signer.contractId}/final.pdf`;
      await this.storageService.uploadPdf(finalPdfKey, finalPdf);

      await this.prisma.contract.update({
        where: { id: signer.contractId },
        data: { status: 'completed', pdfUrl: finalPdfKey },
      });
    } else {
      await this.prisma.contract.update({
        where: { id: signer.contractId },
        data: { status: 'partially_signed' },
      });

      // Notify next signer(s) in order if all signers at the current level are done
      const currentOrder = signer.signingOrder;
      const signersAtCurrentOrder = allSigners.filter((s) => s.signingOrder === currentOrder);
      const allCurrentDone = signersAtCurrentOrder.every(
        (s) => s.id === signer.id || s.status === 'signed',
      );

      if (allCurrentDone) {
        // Find the next signing order level
        const higherOrders = allSigners
          .filter((s) => s.signingOrder > currentOrder && s.status === 'pending')
          .map((s) => s.signingOrder);

        if (higherOrders.length > 0) {
          const nextOrder = Math.min(...higherOrders);
          const nextSigners = allSigners.filter(
            (s) => s.signingOrder === nextOrder && s.status === 'pending',
          );

          const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
          const ownerForNotif = await this.prisma.user.findUnique({
            where: { id: signer.contract.ownerId },
          });

          for (const nextSigner of nextSigners) {
            const signUrl = `${frontendUrl}/sign/${nextSigner.signToken}`;
            await this.notificationsService.sendSigningInvitation({
              to: nextSigner.email,
              signerName: nextSigner.name,
              senderName: ownerForNotif?.name ?? 'Ismeretlen',
              contractTitle: signer.contract.title,
              signUrl,
              expiresAt: nextSigner.tokenExpiresAt?.toLocaleDateString('hu-HU') ?? '',
            });
          }
        }
      }
    }

    // Send confirmation emails
    const owner = await this.prisma.user.findUnique({
      where: { id: signer.contract.ownerId },
    });

    if (allSigned) {
      // Send the signed PDF to all signers via email
      const finalPdfBuffer = await this.storageService.downloadFile(
        `contracts/signed/${signer.contractId}/final.pdf`,
      );

      for (const s of allSigners) {
        await this.notificationsService.sendSignedContractPdf({
          to: s.email,
          name: s.name,
          contractTitle: signer.contract.title,
          pdfBuffer: finalPdfBuffer,
        });
      }

      // Also send to contract owner
      if (owner && !allSigners.some((s) => s.email === owner.email)) {
        await this.notificationsService.sendSignedContractPdf({
          to: owner.email,
          name: owner.name,
          contractTitle: signer.contract.title,
          pdfBuffer: finalPdfBuffer,
        });
      }
    } else {
      // Partial signing — just send confirmations
      await this.notificationsService.sendSignedConfirmation({
        to: signer.email,
        name: dto.signerFullName,
        contractTitle: signer.contract.title,
        allSigned: false,
      });

      if (owner) {
        await this.notificationsService.sendSignedConfirmation({
          to: owner.email,
          name: owner.name,
          contractTitle: signer.contract.title,
          allSigned: false,
        });
      }
    }

    return {
      message: allSigned
        ? 'Minden fél aláírt, a szerződés teljesítve'
        : 'Sikeresen aláírta a szerződést',
      allSigned,
    };
  }

  async declineContract(
    token: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
    note?: string,
  ) {
    const signer = await this.prisma.signer.findUnique({
      where: { signToken: token },
      include: { contract: true },
    });

    if (!signer) throw new NotFoundException('Érvénytelen aláírási link');
    if (signer.status !== 'pending')
      throw new BadRequestException('Ez az aláírás már nem módosítható');

    await this.prisma.signer.update({
      where: { id: signer.id },
      data: { status: 'declined', ipAddress, userAgent, signerNote: note ?? null },
    });

    await this.prisma.contract.update({
      where: { id: signer.contractId },
      data: { status: 'declined' },
    });

    await this.auditService.log({
      contractId: signer.contractId,
      signerId: signer.id,
      eventType: 'declined',
      eventData: { reason },
      ipAddress,
      userAgent,
    });

    return { message: 'Szerződés visszautasítva' };
  }
}
