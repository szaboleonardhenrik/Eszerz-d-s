/**
 * Unit tests for ContractsService — contract creation flow.
 *
 * All external dependencies (Prisma, PDF, Storage, Audit, Notifications,
 * Templates, Config, Credits) are fully mocked — no database or network calls.
 */

jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: Object.assign(
    (html: string) => html,
    { defaults: { allowedTags: [] } },
  ),
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TemplatesService } from '../templates/templates.service';
import { CreditsService } from '../credits/credits.service';
import { CreateContractDto } from './dto/create-contract.dto';

// ─── Factory helpers ─────────────────────────────────────────────

function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    subscriptionTier: 'free',
    role: 'USER',
    brandLogoUrl: null,
    brandColor: null,
    companyName: null,
    ...overrides,
  };
}

function createContractDto(overrides: Partial<CreateContractDto> = {}): CreateContractDto {
  return {
    title: 'Test Contract',
    contentHtml: '<p>Contract content</p>',
    signers: [
      { name: 'Signer One', email: 'signer1@example.com', role: 'Aláíró' },
    ],
    ...overrides,
  } as CreateContractDto;
}

function createMockContract(overrides: Record<string, any> = {}) {
  return {
    id: 'contract-1',
    title: 'Test Contract',
    ownerId: 'user-1',
    contentHtml: '<p>Contract content</p>',
    pdfUrl: 'contracts/user-1/abc.pdf',
    status: 'draft',
    verificationHash: 'abc123',
    documentHash: 'dochash',
    registrationNumber: '20260318-1200-ABCD-1234567-7654321',
    signers: [
      {
        id: 'signer-1',
        name: 'Signer One',
        email: 'signer1@example.com',
        role: 'Aláíró',
        signingOrder: 1,
        signToken: 'unique-token-1',
        status: 'pending',
      },
    ],
    ...overrides,
  };
}

// ─── Mock builders ───────────────────────────────────────────────

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
    },
    contract: {
      count: jest.fn(),
      create: jest.fn(),
    },
    featureFlag: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };
}

function buildPdfMock() {
  return {
    generatePdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
    hashDocument: jest.fn().mockReturnValue('doc-hash-abc'),
  };
}

function buildStorageMock() {
  return {
    uploadPdf: jest.fn().mockResolvedValue(undefined),
  };
}

function buildAuditMock() {
  return {
    log: jest.fn().mockResolvedValue(undefined),
  };
}

function buildNotificationsMock() {
  return {
    sendSigningInvitation: jest.fn().mockResolvedValue(undefined),
  };
}

function buildTemplatesMock() {
  return {
    findOne: jest.fn(),
    renderTemplate: jest.fn(),
  };
}

function buildConfigMock() {
  return {
    get: jest.fn((key: string, fallback?: string) => fallback ?? ''),
  };
}

function buildCreditsMock() {
  return {
    deductForSend: jest.fn().mockResolvedValue(undefined),
  };
}

// ─── Test suite ──────────────────────────────────────────────────

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let pdfService: ReturnType<typeof buildPdfMock>;
  let storageService: ReturnType<typeof buildStorageMock>;
  let auditService: ReturnType<typeof buildAuditMock>;
  let templatesService: ReturnType<typeof buildTemplatesMock>;

  beforeEach(async () => {
    prisma = buildPrismaMock();
    pdfService = buildPdfMock();
    storageService = buildStorageMock();
    auditService = buildAuditMock();
    templatesService = buildTemplatesMock();
    const notifications = buildNotificationsMock();
    const config = buildConfigMock();
    const credits = buildCreditsMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PdfService, useValue: pdfService },
        { provide: StorageService, useValue: storageService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notifications },
        { provide: TemplatesService, useValue: templatesService },
        { provide: ConfigService, useValue: config },
        { provide: CreditsService, useValue: credits },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  // ═══════════════════════════════════════════════════════════════
  // Contract creation — basic validation
  // ═══════════════════════════════════════════════════════════════
  describe('create — validation', () => {
    it('should throw BadRequestException when neither templateId+variables nor contentHtml is provided', async () => {
      const user = createMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);

      const dto = createContractDto({ contentHtml: undefined, templateId: undefined, variables: undefined });

      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should create a contract successfully with contentHtml', async () => {
      const user = createMockUser();
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(contract);

      const dto = createContractDto();
      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(contract);
      expect(prisma.contract.create).toHaveBeenCalledTimes(1);
      expect(pdfService.generatePdf).toHaveBeenCalledTimes(1);
      expect(storageService.uploadPdf).toHaveBeenCalledTimes(1);
    });

    it('should create a contract with templateId and variables', async () => {
      const user = createMockUser();
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(contract);
      templatesService.findOne.mockResolvedValue({
        id: 'tpl-1',
        contentHtml: '<p>{{name}}</p>',
        variables: [{ name: 'name', label: 'Name', filledBy: 'creator' }],
      });
      templatesService.renderTemplate.mockResolvedValue('<p>John Doe</p>');

      const dto = createContractDto({
        contentHtml: undefined,
        templateId: 'tpl-1',
        variables: { name: 'John Doe' },
      });
      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(contract);
      expect(templatesService.renderTemplate).toHaveBeenCalledWith(
        'tpl-1',
        { name: 'John Doe' },
        undefined,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Free tier limits
  // ═══════════════════════════════════════════════════════════════
  describe('create — free tier limits', () => {
    it('should throw ForbiddenException when monthly contract limit (3) is reached for free tier', async () => {
      const user = createMockUser({ subscriptionTier: 'free' });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(3); // already at limit

      const dto = createContractDto();

      await expect(service.create(dto, 'user-1')).rejects.toThrow(ForbiddenException);
      await expect(service.create(dto, 'user-1')).rejects.toThrow(/havi szerződés limit/);
    });

    it('should allow contract creation when under the monthly limit', async () => {
      const user = createMockUser({ subscriptionTier: 'free' });
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(2); // under limit of 3
      prisma.contract.create.mockResolvedValue(contract);

      const dto = createContractDto();
      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(contract);
    });

    it('should throw ForbiddenException when signers exceed free tier limit (2)', async () => {
      const user = createMockUser({ subscriptionTier: 'free' });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);

      const dto = createContractDto({
        signers: [
          { name: 'Signer 1', email: 's1@test.com' },
          { name: 'Signer 2', email: 's2@test.com' },
          { name: 'Signer 3', email: 's3@test.com' },
        ],
      });

      await expect(service.create(dto, 'user-1')).rejects.toThrow(ForbiddenException);
      await expect(service.create(dto, 'user-1')).rejects.toThrow(/legfeljebb 2 aláíró/);
    });

    it('should allow 2 signers on free tier', async () => {
      const user = createMockUser({ subscriptionTier: 'free' });
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(contract);

      const dto = createContractDto({
        signers: [
          { name: 'Signer 1', email: 's1@test.com' },
          { name: 'Signer 2', email: 's2@test.com' },
        ],
      });

      const result = await service.create(dto, 'user-1');
      expect(result).toEqual(contract);
    });

    it('should bypass limits for admin users (superadmin)', async () => {
      const adminUser = createMockUser({
        subscriptionTier: 'free',
        role: 'superadmin',
      });
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(adminUser);
      prisma.contract.count.mockResolvedValue(100); // way over limit
      prisma.contract.create.mockResolvedValue(contract);

      const dto = createContractDto({
        signers: [
          { name: 'S1', email: 's1@test.com' },
          { name: 'S2', email: 's2@test.com' },
          { name: 'S3', email: 's3@test.com' },
          { name: 'S4', email: 's4@test.com' },
          { name: 'S5', email: 's5@test.com' },
        ],
      });

      const result = await service.create(dto, 'user-1');
      expect(result).toEqual(contract);
      // count should not even be checked for admins
    });

    it('should bypass limits for employee role', async () => {
      const employeeUser = createMockUser({
        subscriptionTier: 'free',
        role: 'employee',
      });
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(employeeUser);
      prisma.contract.create.mockResolvedValue(contract);

      const dto = createContractDto();
      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(contract);
      expect(prisma.contract.count).not.toHaveBeenCalled();
    });

    it('should apply higher limits for premium tier', async () => {
      const premiumUser = createMockUser({ subscriptionTier: 'premium' });
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(premiumUser);
      prisma.contract.count.mockResolvedValue(34); // under premium limit of 35
      prisma.contract.create.mockResolvedValue(contract);

      // 10 signers — within premium limit of 10
      const signers = Array.from({ length: 10 }, (_, i) => ({
        name: `Signer ${i + 1}`,
        email: `s${i + 1}@test.com`,
      }));
      const dto = createContractDto({ signers });

      const result = await service.create(dto, 'user-1');
      expect(result).toEqual(contract);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Template rendering — variables substitution
  // ═══════════════════════════════════════════════════════════════
  describe('create — template rendering', () => {
    it('should call renderTemplate with variables and use rendered HTML', async () => {
      const user = createMockUser();
      const contract = createMockContract({ contentHtml: '<p>Rendered: John</p>' });

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(contract);

      templatesService.findOne.mockResolvedValue({
        id: 'tpl-1',
        contentHtml: '<p>Rendered: {{name}}</p>',
        variables: [{ name: 'name', label: 'Név', filledBy: 'creator' }],
      });
      templatesService.renderTemplate.mockResolvedValue('<p>Rendered: John</p>');

      const dto = createContractDto({
        contentHtml: undefined,
        templateId: 'tpl-1',
        variables: { name: 'John' },
      });

      await service.create(dto, 'user-1');

      expect(templatesService.renderTemplate).toHaveBeenCalledWith(
        'tpl-1',
        { name: 'John' },
        undefined, // no signer fields => no mode option
      );
      // The rendered HTML should be passed to PDF generation
      expect(pdfService.generatePdf).toHaveBeenCalledWith(
        '<p>Rendered: John</p>',
        'Test Contract',
        undefined, // no branding
        expect.any(String), // verificationHash
      );
    });

    it('should pass creator mode when template has signer fields', async () => {
      const user = createMockUser();
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(contract);

      templatesService.findOne.mockResolvedValue({
        id: 'tpl-2',
        contentHtml: '<p>{{company}} - {{signerName}}</p>',
        variables: [
          { name: 'company', label: 'Cég', filledBy: 'creator' },
          { name: 'signerName', label: 'Aláíró neve', filledBy: 'signer' },
        ],
      });
      templatesService.renderTemplate.mockResolvedValue('<p>Acme - {{signerName}}</p>');

      const dto = createContractDto({
        contentHtml: undefined,
        templateId: 'tpl-2',
        variables: { company: 'Acme' },
      });

      await service.create(dto, 'user-1');

      expect(templatesService.renderTemplate).toHaveBeenCalledWith(
        'tpl-2',
        { company: 'Acme' },
        { mode: 'creator' },
      );
    });

    it('should store variablesData with schema when template has signer fields', async () => {
      const user = createMockUser();
      const templateVars = [
        { name: 'company', label: 'Cég', filledBy: 'creator' },
        { name: 'signerName', label: 'Aláíró neve', filledBy: 'signer' },
      ];

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(createMockContract());

      templatesService.findOne.mockResolvedValue({
        id: 'tpl-2',
        contentHtml: '<p>test</p>',
        variables: templateVars,
      });
      templatesService.renderTemplate.mockResolvedValue('<p>test</p>');

      const dto = createContractDto({
        contentHtml: undefined,
        templateId: 'tpl-2',
        variables: { company: 'Acme' },
      });

      await service.create(dto, 'user-1');

      const createCall = prisma.contract.create.mock.calls[0][0];
      const variablesData = JSON.parse(createCall.data.variablesData);
      expect(variablesData).toHaveProperty('values', { company: 'Acme' });
      expect(variablesData).toHaveProperty('schema');
      expect(variablesData.schema).toEqual(templateVars);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Signer creation — unique signToken
  // ═══════════════════════════════════════════════════════════════
  describe('create — signer creation', () => {
    it('should create signers with unique signTokens', async () => {
      const user = createMockUser({ subscriptionTier: 'starter' }); // allows 5 signers
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(createMockContract());

      const dto = createContractDto({
        signers: [
          { name: 'Signer A', email: 'a@test.com', role: 'Aláíró' },
          { name: 'Signer B', email: 'b@test.com', role: 'Tanú' },
        ],
      });

      await service.create(dto, 'user-1');

      const createCall = prisma.contract.create.mock.calls[0][0];
      const signerData = createCall.data.signers.create;

      expect(signerData).toHaveLength(2);
      expect(signerData[0].name).toBe('Signer A');
      expect(signerData[0].email).toBe('a@test.com');
      expect(signerData[0].role).toBe('Aláíró');
      expect(signerData[1].name).toBe('Signer B');
      expect(signerData[1].email).toBe('b@test.com');
      expect(signerData[1].role).toBe('Tanú');

      // Each signer should have a unique signToken (64-char hex from 32 random bytes)
      expect(signerData[0].signToken).toBeDefined();
      expect(signerData[1].signToken).toBeDefined();
      expect(signerData[0].signToken).toHaveLength(64);
      expect(signerData[1].signToken).toHaveLength(64);
      expect(signerData[0].signToken).not.toBe(signerData[1].signToken);
    });

    it('should assign sequential signingOrder when not specified', async () => {
      const user = createMockUser({ subscriptionTier: 'starter' });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(createMockContract());

      const dto = createContractDto({
        signers: [
          { name: 'First', email: 'first@test.com' },
          { name: 'Second', email: 'second@test.com' },
          { name: 'Third', email: 'third@test.com' },
        ],
      });

      await service.create(dto, 'user-1');

      const signerData = prisma.contract.create.mock.calls[0][0].data.signers.create;
      expect(signerData[0].signingOrder).toBe(1);
      expect(signerData[1].signingOrder).toBe(2);
      expect(signerData[2].signingOrder).toBe(3);
    });

    it('should respect explicit signingOrder when provided', async () => {
      const user = createMockUser({ subscriptionTier: 'starter' });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(createMockContract());

      const dto = createContractDto({
        signers: [
          { name: 'First', email: 'first@test.com', signingOrder: 3 },
          { name: 'Second', email: 'second@test.com', signingOrder: 1 },
        ],
      });

      await service.create(dto, 'user-1');

      const signerData = prisma.contract.create.mock.calls[0][0].data.signers.create;
      expect(signerData[0].signingOrder).toBe(3);
      expect(signerData[1].signingOrder).toBe(1);
    });

    it('should set tokenExpiresAt to 7 days in the future', async () => {
      const user = createMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(createMockContract());

      const now = Date.now();
      const dto = createContractDto();

      await service.create(dto, 'user-1');

      const signerData = prisma.contract.create.mock.calls[0][0].data.signers.create;
      const expiresAt = signerData[0].tokenExpiresAt.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      // Should be approximately 7 days from now (within 5 seconds tolerance)
      expect(expiresAt).toBeGreaterThan(now + sevenDaysMs - 5000);
      expect(expiresAt).toBeLessThan(now + sevenDaysMs + 5000);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Audit logging
  // ═══════════════════════════════════════════════════════════════
  describe('create — audit logging', () => {
    it('should log contract_created event after successful creation', async () => {
      const user = createMockUser();
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(contract);

      const dto = createContractDto({
        signers: [
          { name: 'Signer 1', email: 's1@test.com' },
          { name: 'Signer 2', email: 's2@test.com' },
        ],
      });

      await service.create(dto, 'user-1');

      expect(auditService.log).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledWith({
        contractId: 'contract-1',
        eventType: 'contract_created',
        eventData: { title: 'Test Contract', signerCount: 2 },
        documentHash: 'doc-hash-abc',
      });
    });

    it('should not log audit event if contract creation fails', async () => {
      const user = createMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockRejectedValue(new Error('DB error'));

      const dto = createContractDto();

      await expect(service.create(dto, 'user-1')).rejects.toThrow('DB error');
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PDF and storage
  // ═══════════════════════════════════════════════════════════════
  describe('create — PDF generation and storage', () => {
    it('should generate PDF and upload to storage', async () => {
      const user = createMockUser();
      const contract = createMockContract();

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(contract);

      const dto = createContractDto();
      await service.create(dto, 'user-1');

      expect(pdfService.generatePdf).toHaveBeenCalledWith(
        '<p>Contract content</p>',
        'Test Contract',
        undefined, // no branding for basic user
        expect.any(String),
      );
      expect(storageService.uploadPdf).toHaveBeenCalledWith(
        expect.stringContaining('contracts/user-1/'),
        Buffer.from('fake-pdf'),
      );
      expect(pdfService.hashDocument).toHaveBeenCalledWith(Buffer.from('fake-pdf'));
    });

    it('should store documentHash and variablesHash in the contract', async () => {
      const user = createMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(createMockContract());

      const dto = createContractDto({
        templateId: 'tpl-1',
        variables: { name: 'Test' },
        contentHtml: undefined,
      });

      templatesService.findOne.mockResolvedValue({
        id: 'tpl-1',
        contentHtml: '<p>{{name}}</p>',
        variables: [],
      });
      templatesService.renderTemplate.mockResolvedValue('<p>Test</p>');

      await service.create(dto, 'user-1');

      const createCall = prisma.contract.create.mock.calls[0][0];
      expect(createCall.data.documentHash).toBe('doc-hash-abc');
      expect(createCall.data.variablesHash).toBeDefined();
      expect(typeof createCall.data.variablesHash).toBe('string');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Version creation
  // ═══════════════════════════════════════════════════════════════
  describe('create — version tracking', () => {
    it('should create initial version (version 1) along with the contract', async () => {
      const user = createMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.create.mockResolvedValue(createMockContract());

      const dto = createContractDto();
      await service.create(dto, 'user-1');

      const createCall = prisma.contract.create.mock.calls[0][0];
      expect(createCall.data.versions).toBeDefined();
      expect(createCall.data.versions.create.version).toBe(1);
      expect(createCall.data.versions.create.changeNote).toBe('Eredeti verzió');
      expect(createCall.data.versions.create.createdBy).toBe('user-1');
    });
  });
});
