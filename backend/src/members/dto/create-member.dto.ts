import { IsString, IsEmail, IsOptional, IsDecimal, IsDateString, IsObject, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';

export class CreateMemberDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john.doe@sukut.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1-714-555-0101', required: false })
  @IsOptional()
  @IsPhoneNumber('US')
  phone?: string;

  @ApiProperty({ example: '123-45-6789', required: false })
  @IsOptional()
  @IsString()
  ssn?: string;

  @ApiProperty({ example: '12-3456789', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({
    example: {
      street: '123 Main St',
      city: 'Orange',
      state: 'CA',
      zipCode: '92867',
      country: 'US'
    }
  })
  @IsObject()
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @ApiProperty({ example: '15.5000', description: 'Equity percentage (0.0000 to 100.0000)' })
  @Transform(({ value }) => new Decimal(value))
  @IsDecimal()
  equityPercentage: Decimal;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  joinDate: string;

  @ApiProperty({ example: 'Senior Engineer', required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    example: {
      accountType: 'checking',
      routingNumber: '121000248',
      accountNumber: '1234567890',
      bankName: 'Wells Fargo'
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  bankingInfo?: {
    accountType: string;
    routingNumber: string;
    accountNumber: string;
    bankName: string;
  };
}