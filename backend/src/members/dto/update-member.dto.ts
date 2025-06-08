import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsDateString, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { CreateMemberDto } from './create-member.dto';

export class UpdateMemberDto extends PartialType(
  OmitType(CreateMemberDto, ['equityPercentage', 'joinDate'] as const)
) {}

export class UpdateEquityDto {
  @ApiProperty({ example: '20.0000', description: 'New equity percentage' })
  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  newPercentage: Decimal;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({ example: 'Promotion to senior partner' })
  @IsString()
  reason: string;
}