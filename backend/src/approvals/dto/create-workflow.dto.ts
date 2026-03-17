import {
  IsString,
  IsArray,
  ValidateNested,
  IsEmail,
  IsOptional,
  IsInt,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStepDto {
  @IsString()
  name: string;

  @IsEmail()
  approverEmail: string;

  @IsOptional()
  @IsString()
  approverName?: string;

  @IsInt()
  @Min(1)
  order: number;
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}
