import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';
import { StorageService } from '../storage/storage.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  async create(@Body() dto: CreateContractDto, @Req() req: any) {
    try {
      const contract = await this.contractsService.create(dto, req.user.userId);
      return ApiResponse.ok(contract);
    } catch (err) {
      console.error('Contract creation error:', err?.message, err?.stack);
      throw err;
    }
  }

  @Post('bulk-send')
  async bulkSend(
    @Body() body: { contractIds: string[] },
    @Req() req: any,
  ) {
    const result = await this.contractsService.bulkSend(
      body.contractIds,
      req.user.userId,
    );
    return ApiResponse.ok(result);
  }

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'), false);
      }
    },
  }))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      return ApiResponse.error('BAD_REQUEST', 'No file uploaded');
    }
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
    const key = `uploads/${req.user.userId}/${Date.now()}-${safeName}`;
    await this.storageService.uploadFile(key, file.buffer, 'application/pdf');
    return ApiResponse.ok({ key, originalName: file.originalname, size: file.size });
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @Req() req: any) {
    const contract = await this.contractsService.duplicate(id, req.user.userId);
    return ApiResponse.ok(contract);
  }

  @Post(':id/send')
  async sendForSigning(@Param('id') id: string, @Req() req: any) {
    const result = await this.contractsService.sendForSigning(
      id,
      req.user.userId,
    );
    return ApiResponse.ok(result);
  }

  @Post(':id/remind/:signerId')
  async sendReminder(
    @Param('id') id: string,
    @Param('signerId') signerId: string,
    @Req() req: any,
  ) {
    const result = await this.contractsService.sendReminder(id, signerId, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Put(':id/content')
  async updateContent(
    @Param('id') id: string,
    @Body() body: { contentHtml: string; changeNote?: string },
    @Req() req: any,
  ) {
    const contract = await this.contractsService.updateContent(
      id,
      req.user.userId,
      body.contentHtml,
      body.changeNote,
    );
    return ApiResponse.ok(contract);
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string, @Req() req: any) {
    const versions = await this.contractsService.getVersions(id, req.user.userId);
    return ApiResponse.ok(versions);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('tagId') tagId?: string,
    @Query('folderId') folderId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.contractsService.findAllByUser(
      req.user.userId,
      status,
      search,
      tagId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      folderId,
      dateFrom,
      dateTo,
    );
    return ApiResponse.ok(result);
  }

  @Get('export')
  async exportContracts(
    @Req() req: any,
    @Res() res: Response,
    @Query('format') format?: string,
    @Query('status') status?: string,
  ) {
    const contracts = await this.contractsService.exportContracts(
      req.user.userId,
      status,
    );

    const statusLabels: Record<string, string> = {
      draft: 'Piszkozat',
      sent: 'Elküldve',
      partially_signed: 'Részben aláírt',
      completed: 'Teljesítve',
      declined: 'Visszautasítva',
      expired: 'Lejárt',
      cancelled: 'Visszavonva',
    };

    const rows = contracts.map((c: any) => ({
      cim: c.title,
      statusz: statusLabels[c.status] ?? c.status,
      sablon: c.template?.name ?? '-',
      alairok: c.signers.map((s: any) => `${s.name} <${s.email}>`).join('; '),
      letrehozva: new Date(c.createdAt).toLocaleDateString('hu-HU'),
      lejarat: c.expiresAt
        ? new Date(c.expiresAt).toLocaleDateString('hu-HU')
        : '-',
      pdf: c.pdfUrl ?? '-',
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="szerzodesek.json"',
      );
      return res.send(JSON.stringify(rows, null, 2));
    }

    // CSV with UTF-8 BOM for Hungarian Excel support
    const BOM = '\uFEFF';
    const headers = ['Cím', 'Státusz', 'Sablon', 'Aláírók', 'Létrehozva', 'Lejárat', 'PDF'];
    const csvLines = [
      headers.join(','),
      ...rows.map((r: any) =>
        [r.cim, r.statusz, r.sablon, r.alairok, r.letrehozva, r.lejarat, r.pdf]
          .map((v: string) => `"${v.replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    const csvContent = BOM + csvLines.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="szerzodesek.csv"',
    );
    return res.send(csvContent);
  }

  @Get('analytics')
  async getAnalytics(@Req() req: any) {
    const analytics = await this.contractsService.getAnalytics(
      req.user.userId,
    );
    return ApiResponse.ok(analytics);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const stats = await this.contractsService.getDashboardStats(
      req.user.userId,
    );
    return ApiResponse.ok(stats);
  }

  @Get('widgets')
  async getWidgets(@Req() req: any) {
    const widgets = await this.contractsService.getDashboardWidgets(
      req.user.userId,
    );
    return ApiResponse.ok(widgets);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const contract = await this.contractsService.findOneWithDetails(
      id,
      req.user.userId,
    );
    return ApiResponse.ok(contract);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Req() req: any) {
    const result = await this.contractsService.getDownloadUrl(
      id,
      req.user.userId,
    );
    return ApiResponse.ok(result);
  }

  @Post(':id/clone-as-template')
  async cloneAsTemplate(@Param('id') id: string, @Req() req: any) {
    const result = await this.contractsService.cloneAsTemplate(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @Req() req: any) {
    const result = await this.contractsService.archive(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':id/unarchive')
  async unarchive(@Param('id') id: string, @Req() req: any) {
    const result = await this.contractsService.unarchive(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: any) {
    const result = await this.contractsService.cancel(id, req.user.userId);
    return ApiResponse.ok(result);
  }
}
