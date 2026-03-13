import { IsString, IsOptional, IsObject } from 'class-validator';

export class ResendWebhookDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
