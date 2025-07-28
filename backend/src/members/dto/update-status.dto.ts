import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  RETIRED = 'RETIRED',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
  DECEASED = 'DECEASED',
  SUSPENDED = 'SUSPENDED',
  PROBATIONARY = 'PROBATIONARY',
}

export class UpdateMemberStatusDto {
  @ApiProperty({ 
    description: 'Fiscal year for the status change',
    example: 2025
  })
  @IsOptional()
  fiscalYear?: number;

  @ApiProperty({ 
    enum: MemberStatus,
    description: 'New member status',
    example: MemberStatus.ACTIVE
  })
  @IsEnum(MemberStatus)
  status: MemberStatus;

  @ApiProperty({ 
    description: 'Effective date of the status change',
    example: '2025-01-01'
  })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({ 
    description: 'Reason for status change',
    example: 'Voluntary retirement'
  })
  @IsString()
  reason: string;

  @ApiProperty({ 
    description: 'Additional notes',
    example: 'Employee requested early retirement',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
}