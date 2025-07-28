import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { MemberCreatedEvent } from '../events/domain-events';
import * as XLSX from 'xlsx';
import { Decimal } from 'decimal.js';
import { MemberExcelRow, ValidationError, UploadResult } from './dto/upload-members.dto';

@Injectable()
export class ExcelUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async uploadMembers(
    companyId: string,
    file: Express.Multer.File,
    skipValidation: boolean = false,
    dryRun: boolean = false,
  ): Promise<UploadResult> {
    try {
      // Parse Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      // Validate and transform data
      const { validMembers, errors, warnings } = await this.validateMemberData(
        jsonData as any[],
        companyId,
        skipValidation,
      );

      const result: UploadResult = {
        success: errors.length === 0 || skipValidation,
        totalRows: jsonData.length,
        validRows: validMembers.length,
        invalidRows: errors.length,
        importedMembers: 0,
        errors,
        warnings,
        dryRun,
      };

      // If dry run, return validation results without importing
      if (dryRun) {
        return result;
      }

      // If there are errors and not skipping validation, don't import
      if (errors.length > 0 && !skipValidation) {
        return result;
      }

      // Import valid members
      const importedMembers = await this.importMembers(companyId, validMembers);
      result.importedMembers = importedMembers.length;
      result.success = true;

      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to process Excel file: ${error.message}`);
    }
  }

  private async validateMemberData(
    data: any[],
    companyId: string,
    skipValidation: boolean,
  ): Promise<{
    validMembers: MemberExcelRow[];
    errors: ValidationError[];
    warnings: string[];
  }> {
    const validMembers: MemberExcelRow[] = [];
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const existingEmails = new Set<string>();

    // Get existing member emails to check for duplicates
    if (!skipValidation) {
      const existingMembers = await this.prisma.member.findMany({
        where: { companyId },
        select: { email: true },
      });
      existingMembers.forEach(m => existingEmails.add(m.email.toLowerCase()));
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel rows start at 1, plus header row
      const rowErrors: ValidationError[] = [];

      // Validate required fields
      const requiredFields = [
        'firstName',
        'lastName', 
        'email',
        'street',
        'city',
        'state',
        'zipCode',
        'equityPercentage',
        'joinDate'
      ];

      for (const field of requiredFields) {
        if (!row[field] || String(row[field]).trim() === '') {
          rowErrors.push({
            row: rowNumber,
            field,
            value: row[field],
            message: `${field} is required`,
          });
        }
      }

      // Validate email format
      if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
        rowErrors.push({
          row: rowNumber,
          field: 'email',
          value: row.email,
          message: 'Invalid email format',
        });
      }

      // Check for duplicate emails in file and database
      if (row.email) {
        const emailLower = row.email.toLowerCase();
        if (existingEmails.has(emailLower)) {
          rowErrors.push({
            row: rowNumber,
            field: 'email',
            value: row.email,
            message: 'Email already exists in system',
          });
        }
        existingEmails.add(emailLower);
      }

      // Validate equity percentage
      if (row.equityPercentage) {
        const equity = Number(row.equityPercentage);
        if (isNaN(equity) || equity < 0 || equity > 100) {
          rowErrors.push({
            row: rowNumber,
            field: 'equityPercentage',
            value: row.equityPercentage,
            message: 'Equity percentage must be between 0 and 100',
          });
        }
      }

      // Validate tax withholding percentage

      // Validate join date
      if (row.joinDate) {
        const joinDate = new Date(row.joinDate);
        if (isNaN(joinDate.getTime())) {
          rowErrors.push({
            row: rowNumber,
            field: 'joinDate',
            value: row.joinDate,
            message: 'Invalid date format. Use YYYY-MM-DD',
          });
        }
      }

      // Validate phone number format (if provided)
      if (row.phone && !/^\+?[\d\s\-\(\)]+$/.test(row.phone)) {
        rowErrors.push({
          row: rowNumber,
          field: 'phone',
          value: row.phone,
          message: 'Invalid phone number format',
        });
      }

      // If no errors or skipping validation, add to valid members
      if (rowErrors.length === 0 || skipValidation) {
        const memberData: MemberExcelRow = {
          firstName: String(row.firstName).trim(),
          lastName: String(row.lastName).trim(),
          email: String(row.email).trim().toLowerCase(),
          phone: row.phone ? String(row.phone).trim() : undefined,
          ssn: row.ssn ? String(row.ssn).trim() : undefined,
          taxId: row.taxId ? String(row.taxId).trim() : undefined,
          street: String(row.street).trim(),
          city: String(row.city).trim(),
          state: String(row.state).trim(),
          zipCode: String(row.zipCode).trim(),
          country: row.country ? String(row.country).trim() : 'US',
          equityPercentage: Number(row.equityPercentage),
          joinDate: String(row.joinDate),
          accountType: row.accountType ? String(row.accountType).trim() : undefined,
          routingNumber: row.routingNumber ? String(row.routingNumber).trim() : undefined,
          accountNumber: row.accountNumber ? String(row.accountNumber).trim() : undefined,
          bankName: row.bankName ? String(row.bankName).trim() : undefined,
        };

        validMembers.push(memberData);

        if (rowErrors.length > 0) {
          warnings.push(`Row ${rowNumber}: Contains errors but included due to skipValidation`);
        }
      }

      errors.push(...rowErrors);
    }

    return { validMembers, errors, warnings };
  }

  private async importMembers(companyId: string, members: MemberExcelRow[]) {
    const importedMembers = [];

    for (const memberData of members) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const member = await tx.member.create({
            data: {
              companyId,
              firstName: memberData.firstName,
              lastName: memberData.lastName,
              email: memberData.email,
              phone: memberData.phone,
              ssn: memberData.ssn,
              taxId: memberData.taxId,
              address: {
                street: memberData.street,
                city: memberData.city,
                state: memberData.state,
                zipCode: memberData.zipCode,
                country: memberData.country,
              },
              equityPercentage: new Decimal(memberData.equityPercentage),
              joinDate: new Date(memberData.joinDate),
              bankingInfo: memberData.accountNumber ? {
                accountType: memberData.accountType || 'checking',
                routingNumber: memberData.routingNumber,
                accountNumber: memberData.accountNumber,
                bankName: memberData.bankName,
              } : undefined,
            },
          });

          // Create initial equity event
          await tx.equityEvent.create({
            data: {
              memberId: member.id,
              eventType: 'INITIAL_GRANT',
              newPercentage: new Decimal(memberData.equityPercentage),
              effectiveDate: new Date(memberData.joinDate),
              reason: 'Initial equity grant via Excel import',
            },
          });

          return member;
        });

        // Publish domain event
        await this.eventBus.publish(
          new MemberCreatedEvent(result.id, {
            companyId,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            email: memberData.email,
            equityPercentage: new Decimal(memberData.equityPercentage),
            joinDate: new Date(memberData.joinDate),
          }),
        );

        importedMembers.push(result);
      } catch (error) {
        console.error(`Failed to import member ${memberData.email}:`, error);
        // Continue with other members even if one fails
      }
    }

    return importedMembers;
  }

  generateExampleTemplate(): Buffer {
    const exampleData = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@sukut.com',
        phone: '+1-714-555-0101',
        ssn: '123-45-6789',
        taxId: '',
        street: '123 Main Street',
        city: 'Orange',
        state: 'CA',
        zipCode: '92867',
        country: 'US',
        equityPercentage: 15.5,
        joinDate: '2024-01-01',
        accountType: 'checking',
        routingNumber: '121000248',
        accountNumber: '1234567890',
        bankName: 'Wells Fargo'
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@sukut.com',
        phone: '+1-714-555-0102',
        ssn: '987-65-4321',
        taxId: '',
        street: '456 Oak Avenue',
        city: 'Irvine',
        state: 'CA',
        zipCode: '92614',
        country: 'US',
        equityPercentage: 8.25,
        joinDate: '2024-02-15',
        accountType: 'checking',
        routingNumber: '121000248',
        accountNumber: '0987654321',
        bankName: 'Wells Fargo'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}