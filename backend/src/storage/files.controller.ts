import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { StorageService } from './storage.service';
import type { Response } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Get('*path')
  async serveFile(@Param('path') filePath: string, @Res() res: Response) {
    const localPath = this.storageService.getLocalFilePath(filePath);
    if (!localPath) {
      throw new NotFoundException('File not found');
    }
    res.sendFile(localPath);
  }
}
