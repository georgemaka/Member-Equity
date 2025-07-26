import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UploadMembersDto {
  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    description: 'Excel file containing member data'
  })
  @IsOptional()
  file?: Express.Multer.File;

  @ApiProperty({ 
    example: false, 
    description: 'Skip validation and import anyway',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  skipValidation?: boolean = false;

  @ApiProperty({ 
    example: false, 
    description: 'Only validate without importing',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;
}

export interface MemberExcelRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ssn?: string;
  taxId?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  equityPercentage: number;
  taxWithholdingPercentage: number;
  joinDate: string;
  accountType?: string;
  routingNumber?: string;
  accountNumber?: string;
  bankName?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface UploadResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedMembers: number;
  errors: ValidationError[];
  warnings: string[];
  dryRun?: boolean;
}