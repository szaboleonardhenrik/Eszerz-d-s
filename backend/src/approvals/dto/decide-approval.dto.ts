import { IsString, IsOptional, IsIn } from 'class-validator';

export class DecideApprovalDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  comment?: string;
}
