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
import { TsaService } from '../tsa/tsa.service';
import { SignContractDto } from './dto/sign.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID, randomInt } from 'crypto';

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class SignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly contactsService: ContactsService,
    private readonly tsaService: TsaService,
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
    }) as any; // variablesData field access

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

    // Extract signer fields from variablesData if structured format
    let signerFields: any[] = [];
    try {
      if (signer.contract.variablesData) {
        const parsed = typeof signer.contract.variablesData === 'string'
          ? JSON.parse(signer.contract.variablesData)
          : signer.contract.variablesData;
        if (parsed && parsed.schema && Array.isArray(parsed.schema)) {
          const signerIndex = signer.signingOrder - 1; // 0-based
          signerFields = parsed.schema.filter((v: any) => {
            if (v.filledBy !== 'signer') return false;
            // If signerIndex is defined on the var, only include if it matches this signer
            if (v.signerIndex !== undefined) {
              return v.signerIndex === signerIndex;
            }
            // If signerIndex is undefined on the var, all signers get it
            return true;
          });
        }
      }
    } catch {
      // Non-critical — if parsing fails, just return empty signerFields
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
        otpVerified: signer.otpVerified,
      },
      signerFields,
    };
  }

  // ─── OTP VERIFICATION ──────────────────────────────────
  async requestOtp(token: string) {
    const signer = await this.prisma.signer.findUnique({
      where: { signToken: token },
      include: { contract: true },
    });

    if (!signer) throw new NotFoundException('Érvénytelen aláírási link');
    if (signer.tokenExpiresAt && signer.tokenExpiresAt < new Date())
      throw new ForbiddenException('Az aláírási link lejárt');
    if (signer.status !== 'pending')
      throw new BadRequestException('Ez az aláírás már nem módosítható');

    // If already verified, no need to send again
    if (signer.otpVerified) {
      return { message: 'Email cím már hitelesítve', verified: true };
    }

    // Rate limit: don't send if last OTP was less than 60 seconds ago
    if (signer.otpExpiresAt) {
      const lastSentAt = new Date(signer.otpExpiresAt.getTime() - OTP_EXPIRY_MINUTES * 60000);
      if (Date.now() - lastSentAt.getTime() < 60000) {
        return { message: 'Kód elküldve, kérjük várjon', cooldown: true };
      }
    }

    // Generate 6-digit OTP
    const otpCode = String(randomInt(100000, 999999));
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    await this.prisma.signer.update({
      where: { id: signer.id },
      data: { otpCode, otpExpiresAt, otpAttempts: 0 },
    });

    await this.notificationsService.sendSignerOtp({
      to: signer.email,
      signerName: signer.name,
      otpCode,
      contractTitle: signer.contract.title,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    // Mask email for frontend display
    const [local, domain] = signer.email.split('@');
    const maskedEmail = `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`;

    return { message: 'Hitelesítési kód elküldve', maskedEmail };
  }

  async verifyOtp(token: string, code: string) {
    const signer = await this.prisma.signer.findUnique({
      where: { signToken: token },
    });

    if (!signer) throw new NotFoundException('Érvénytelen aláírási link');
    if (signer.status !== 'pending')
      throw new BadRequestException('Ez az aláírás már nem módosítható');

    if (signer.otpVerified) {
      return { verified: true, message: 'Már hitelesítve' };
    }

    if (signer.otpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Túl sok sikertelen próbálkozás. Kérjen új kódot.',
      );
    }

    if (!signer.otpCode || !signer.otpExpiresAt || signer.otpExpiresAt < new Date()) {
      throw new BadRequestException('A kód lejárt. Kérjen új kódot.');
    }

    if (signer.otpCode !== code?.trim()) {
      await this.prisma.signer.update({
        where: { id: signer.id },
        data: { otpAttempts: { increment: 1 } },
      });
      const remaining = OTP_MAX_ATTEMPTS - signer.otpAttempts - 1;
      throw new BadRequestException(
        `Hibás kód. ${remaining > 0 ? `Még ${remaining} próbálkozása van.` : 'Kérjen új kódot.'}`,
      );
    }

    // OTP matches — mark as verified
    await this.prisma.signer.update({
      where: { id: signer.id },
      data: { otpVerified: true, otpCode: null },
    });

    return { verified: true, message: 'Email cím sikeresen hitelesítve' };
  }

  async signContract(
    token: string,
    dto: SignContractDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const signer = await this.prisma.signer.findUnique({
      where: { signToken: token },
      include: { contract: { include: { signers: true, template: true } } },
    });

    if (!signer) throw new NotFoundException('Érvénytelen aláírási link');
    if (signer.tokenExpiresAt && signer.tokenExpiresAt < new Date())
      throw new ForbiddenException('Az aláírási link lejárt');
    if (signer.status !== 'pending')
      throw new BadRequestException('Ez az aláírás már nem módosítható');

    // Check data consent
    if (!dto.dataConsent) {
      throw new BadRequestException(
        'Az adatkezelési hozzájárulás elfogadása kötelező az aláíráshoz.',
      );
    }

    // Check OTP verification
    if (!signer.otpVerified) {
      throw new BadRequestException(
        'Az email cím hitelesítése szükséges az aláírás előtt',
      );
    }

    // Check signing order
    const earlierSigners = signer.contract.signers.filter(
      (s) => s.signingOrder < signer.signingOrder && s.status === 'pending',
    );
    if (earlierSigners.length > 0) {
      throw new BadRequestException(
        'Még nem Ön következik az aláírási sorrendben',
      );
    }

    // Handle signer variables — replace placeholder spans in contentHtml
    let updatedContentHtml = signer.contract.contentHtml;
    if (dto.signerVariables && Object.keys(dto.signerVariables).length > 0) {
      // Parse variablesData to get schema
      let schema: any[] = [];
      let variablesDataParsed: any = null;
      try {
        if (signer.contract.variablesData) {
          variablesDataParsed = typeof signer.contract.variablesData === 'string'
            ? JSON.parse(signer.contract.variablesData)
            : signer.contract.variablesData;
          if (variablesDataParsed?.schema) {
            schema = variablesDataParsed.schema;
          }
        }
      } catch {
        // If parsing fails, skip validation
      }

      // Validate only allowed signer fields are being set
      const signerIndex = signer.signingOrder - 1;
      const allowedFields = new Set(
        schema
          .filter((v: any) => {
            if (v.filledBy !== 'signer') return false;
            if (v.signerIndex !== undefined) return v.signerIndex === signerIndex;
            return true;
          })
          .map((v: any) => v.name),
      );

      for (const key of Object.keys(dto.signerVariables)) {
        if (allowedFields.size > 0 && !allowedFields.has(key)) {
          throw new BadRequestException(`Nem engedélyezett mező: ${key}`);
        }
      }

      // Replace signer-field placeholder spans with actual values
      for (const [key, value] of Object.entries(dto.signerVariables)) {
        const escapedValue = value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
        const placeholderRegex = new RegExp(
          `<span class="signer-field" data-var="${key}"[^>]*>\\[.*?\\]</span>`,
          'g',
        );
        updatedContentHtml = updatedContentHtml.replace(placeholderRegex, escapedValue);
        // Also handle raw {{key}} placeholders
        updatedContentHtml = updatedContentHtml.replaceAll(`{{${key}}}`, escapedValue);
      }

      // Update contentHtml in the database
      await this.prisma.contract.update({
        where: { id: signer.contractId },
        data: { contentHtml: updatedContentHtml },
      });

      // Update variablesData with signer-filled values
      if (variablesDataParsed?.values) {
        for (const [key, value] of Object.entries(dto.signerVariables)) {
          variablesDataParsed.values[key] = value;
        }
        await this.prisma.contract.update({
          where: { id: signer.contractId },
          data: { variablesData: JSON.stringify(variablesDataParsed) },
        });
      }
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

    // Handle stamp image upload
    let stampImageUrl: string | undefined;
    if (dto.stampImageBase64) {
      const stampBuffer = Buffer.from(
        dto.stampImageBase64.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );
      const stampKey = `stamps/${signer.contractId}/${randomUUID()}.png`;
      await this.storageService.uploadImage(stampKey, stampBuffer);
      stampImageUrl = stampKey;
    }

    // Save/update partner as Contact + Company (only if signer consented)
    let contactId: string | undefined;
    if (dto.partnerConsent) try {
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

      // Auto-create Company and link to Contact
      if (dto.companyName) {
        const company = await this.prisma.company.upsert({
          where: {
            userId_name: {
              userId: signer.contract.ownerId,
              name: dto.companyName,
            },
          },
          update: {
            taxNumber: dto.companyTaxNumber ?? undefined,
            address: dto.companyAddress ?? undefined,
          },
          create: {
            userId: signer.contract.ownerId,
            name: dto.companyName,
            taxNumber: dto.companyTaxNumber,
            address: dto.companyAddress,
          },
        });
        // Link contact to company (ignore if already linked)
        await this.prisma.contactCompany.upsert({
          where: {
            contactId_companyId: {
              contactId: contact.id,
              companyId: company.id,
            },
          },
          update: {},
          create: {
            contactId: contact.id,
            companyId: company.id,
          },
        });
      }
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
        stampImageUrl: stampImageUrl ?? null,
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
      Buffer.from(updatedContentHtml),
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
        stampImageUrl: s.id === signer.id ? stampImageUrl : s.stampImageUrl ?? undefined,
        typedName: s.id === signer.id ? dto.typedName : s.typedName ?? undefined,
        signedAt:
          (s.id === signer.id ? new Date() : s.signedAt)?.toLocaleDateString(
            'hu-HU',
          ) ?? '',
        method: s.id === signer.id ? dto.signatureMethod : s.signatureMethod ?? 'simple',
        companyName: s.id === signer.id ? dto.companyName : s.companyName ?? undefined,
        companyTaxNumber: s.id === signer.id ? dto.companyTaxNumber : s.companyTaxNumber ?? undefined,
        companyAddress: s.id === signer.id ? dto.companyAddress : s.companyAddress ?? undefined,
        ipAddress: s.id === signer.id ? ipAddress : s.ipAddress ?? undefined,
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
          let stampImageBase64: string | undefined;
          if (s.stampImageUrl) {
            try {
              const stampBuffer = await this.storageService.downloadFile(s.stampImageUrl);
              stampImageBase64 = `data:image/png;base64,${stampBuffer.toString('base64')}`;
            } catch {
              // If download fails, skip the stamp
            }
          }
          return {
            name: s.name,
            role: s.role,
            signatureImageBase64,
            stampImageBase64,
            typedName: s.typedName,
            signedAt: s.signedAt,
            method: s.method,
            companyName: s.companyName,
            companyTaxNumber: s.companyTaxNumber,
            companyAddress: s.companyAddress,
            ipAddress: s.ipAddress,
          };
        }),
      );

      // Get owner branding for the final signed PDF
      const owner = await this.prisma.user.findUnique({
        where: { id: signer.contract.ownerId },
        select: { brandLogoUrl: true, brandColor: true, companyName: true, subscriptionTier: true },
      });
      let branding: any = undefined;
      if (owner && (owner.brandLogoUrl || owner.brandColor || owner.companyName)) {
        const flag = await this.prisma.featureFlag.findUnique({ where: { key: 'custom_branding' } });
        const tierOrder = ['free', 'starter', 'medium', 'premium', 'enterprise'];
        const hasTier = !flag?.minTier || tierOrder.indexOf(owner.subscriptionTier) >= tierOrder.indexOf(flag.minTier);
        if (!flag || !flag.enabled || hasTier) {
          branding = { logoUrl: owner.brandLogoUrl, companyName: owner.companyName, brandColor: owner.brandColor };
        } else {
          branding = owner.companyName ? { companyName: owner.companyName } : undefined;
        }
      }

      const finalPdf = await this.pdfService.addSignatureToPdf(
        updatedContentHtml,
        signer.contract.title,
        signaturesWithImages,
        branding,
        (signer.contract as any).verificationHash ?? undefined,
        {
          registrationNumber: (signer.contract as any).registrationNumber ?? undefined,
          documentHash: (signer.contract as any).documentHash ?? documentHash,
          variablesHash: (signer.contract as any).variablesHash ?? undefined,
          createdAt: signer.contract.createdAt?.toLocaleDateString('hu-HU') ?? undefined,
        },
      );

      const finalPdfKey = `contracts/signed/${signer.contractId}/final.pdf`;
      await this.storageService.uploadPdf(finalPdfKey, finalPdf);

      // Request TSA timestamp for the signed document
      let tsaData: { tsaToken?: string; tsaTimestamp?: Date; tsaAuthority?: string; tsaSerialNumber?: string } = {};
      try {
        const pdfHash = this.pdfService.hashDocument(finalPdf);
        const tsaResult = await this.tsaService.requestTimestamp(pdfHash);
        tsaData = {
          tsaToken: tsaResult.token,
          tsaTimestamp: tsaResult.timestamp,
          tsaAuthority: tsaResult.authority,
          tsaSerialNumber: tsaResult.serialNumber,
        };

        // Re-generate PDF with TSA info embedded in audit block
        const auditMetaWithTsa = {
          registrationNumber: (signer.contract as any).registrationNumber ?? undefined,
          documentHash: (signer.contract as any).documentHash ?? documentHash,
          variablesHash: (signer.contract as any).variablesHash ?? undefined,
          createdAt: signer.contract.createdAt?.toLocaleDateString('hu-HU') ?? undefined,
          tsaTimestamp: tsaResult.timestamp.toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' }),
          tsaAuthority: tsaResult.authority,
          tsaSerialNumber: tsaResult.serialNumber,
        };

        const finalPdfWithTsa = await this.pdfService.addSignatureToPdf(
          updatedContentHtml,
          signer.contract.title,
          signaturesWithImages,
          branding,
          (signer.contract as any).verificationHash ?? undefined,
          auditMetaWithTsa,
        );
        await this.storageService.uploadPdf(finalPdfKey, finalPdfWithTsa);
      } catch (err) {
        // TSA is non-critical — log but don't block the signing
        console.error('TSA timestamp request failed:', err?.message);
      }

      await this.prisma.contract.update({
        where: { id: signer.contractId },
        data: { status: 'completed', pdfUrl: finalPdfKey, ...tsaData },
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
              senderEmail: ownerForNotif?.email ?? '',
              senderPhone: (ownerForNotif as any)?.phone ?? undefined,
              contractTitle: signer.contract.title,
              signUrl,
              expiresAt: nextSigner.tokenExpiresAt?.toLocaleDateString('hu-HU') ?? '',
              registrationNumber: (signer.contract as any).registrationNumber ?? undefined,
              documentType: (signer.contract as any).template?.name ?? undefined,
              documentHash: (signer.contract as any).documentHash ?? undefined,
              variablesHash: (signer.contract as any).variablesHash ?? undefined,
              totalSigners: allSigners.length,
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
