import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3: S3Client | null = null;
  private bucket: string;
  private useLocal: boolean;
  private localDir: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('R2_BUCKET_NAME', 'szerzodes-portal');
    const endpoint = config.get<string>('R2_ENDPOINT');
    this.useLocal = !endpoint;

    if (this.useLocal) {
      this.localDir = path.resolve(__dirname, '../../storage-local');
      fs.mkdirSync(this.localDir, { recursive: true });
      this.logger.warn('Using local file storage (no R2 configured)');
    } else {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: config.get<string>('R2_ACCESS_KEY_ID', ''),
          secretAccessKey: config.get<string>('R2_SECRET_ACCESS_KEY', ''),
        },
      });
    }
  }

  async uploadPdf(key: string, buffer: Buffer): Promise<string> {
    if (this.useLocal) {
      return this.saveLocal(key, buffer);
    }
    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      }),
    );
    return key;
  }

  async uploadImage(key: string, buffer: Buffer): Promise<string> {
    if (this.useLocal) {
      return this.saveLocal(key, buffer);
    }
    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      }),
    );
    return key;
  }

  async getSignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    if (this.useLocal) {
      return `/api/files/${encodeURIComponent(key)}`;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3!, command, { expiresIn });
  }

  async downloadFile(key: string): Promise<Buffer> {
    if (this.useLocal) {
      const filePath = path.join(this.localDir, key);
      return fs.readFileSync(filePath) as Buffer;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3!.send(command);
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (this.useLocal) {
      return this.saveLocal(key, buffer);
    }
    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return key;
  }

  getLocalFilePath(key: string): string | null {
    if (!this.useLocal) return null;
    const filePath = path.join(this.localDir, key);
    return fs.existsSync(filePath) ? filePath : null;
  }

  private saveLocal(key: string, buffer: Buffer): string {
    const filePath = path.join(this.localDir, key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return key;
  }
}
