import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsString, ValidateNested, IsNumber, Min, Max, IsOptional, IsDateString, IsEnum, IsUrl, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BoardApprovalType } from '@prisma/client';

export class MemberEquityUpdateDto {
  @ApiProperty({ example: 'member-id-123' })
  @IsString()
  memberId: string;

  @ApiProperty({ example: 8.5, description: 'New equity percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  newEquityPercentage: number;

  @ApiProperty({ example: 'Promoted to senior role', description: 'Reason for equity change', required: false })
  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class BulkEquityUpdateDto {
  @ApiProperty({ type: [MemberEquityUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberEquityUpdateDto)
  updates: MemberEquityUpdateDto[];

  @ApiProperty({ example: 'Annual Equity Update FY2025' })
  @IsString()
  boardApprovalTitle: string;

  @ApiProperty({ example: 'Annual equity reallocation based on performance and contributions', required: false })
  @IsString()
  @IsOptional()
  boardApprovalDescription?: string;

  @ApiProperty({ enum: BoardApprovalType, example: BoardApprovalType.ANNUAL_EQUITY_UPDATE })
  @IsEnum(BoardApprovalType)
  boardApprovalType: BoardApprovalType;

  @ApiProperty({ example: '2025-01-15', description: 'Date of board approval' })
  @IsDateString()
  boardApprovalDate: string;

  @ApiProperty({ example: '2025-02-01', description: 'Date when changes take effect' })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({ type: [String], example: ['https://s3.amazonaws.com/docs/board-minutes-2025-01.pdf'], required: false })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  documentUrls?: string[];

  @ApiProperty({ example: 'Approved in board meeting on Jan 15, 2025', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: false, description: 'Force apply despite warnings', required: false })
  @IsBoolean()
  @IsOptional()
  forceApply?: boolean;
}