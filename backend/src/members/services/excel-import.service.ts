import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Decimal } from '@prisma/client/runtime/library';

export interface EquityUpdateRow {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentEquity: number;
  newEquity: number;
  change: number;
  changeReason?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  updates: EquityUpdateRow[];
  totalBefore: number;
  totalAfter: number;
  memberCount: number;
}

@Injectable()
export class ExcelImportService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAndParseEquityUpdate(
    buffer: Buffer,
    companyId: string
  ): Promise<ImportValidationResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet('Current Equity State');
    if (!worksheet) {
      throw new BadRequestException('Worksheet "Current Equity State" not found');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const updates: EquityUpdateRow[] = [];
    let totalBefore = 0;
    let totalAfter = 0;

    // Get all members for validation
    const members = await this.prisma.member.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        equityPercentage: true,
        status: true,
      },
    });

    const memberMap = new Map(members.map(m => [m.id, m]));
    const processedMemberIds = new Set<string>();

    // Process rows (skip header and total row)
    let rowIndex = 2;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const memberId = row.getCell(1).value?.toString();
      if (!memberId || memberId === 'TOTAL') return; // Skip total row

      const member = memberMap.get(memberId);
      if (!member) {
        errors.push(`Row ${rowNumber}: Member ID ${memberId} not found`);
        return;
      }

      if (processedMemberIds.has(memberId)) {
        errors.push(`Row ${rowNumber}: Duplicate member ID ${memberId}`);
        return;
      }
      processedMemberIds.add(memberId);

      const currentEquity = parseFloat(row.getCell(6).value?.toString() || '0');
      const newEquity = parseFloat(row.getCell(7).value?.toString() || '0');
      const changeReason = row.getCell(9).value?.toString() || '';

      // Validate equity values
      if (isNaN(newEquity) || newEquity < 0 || newEquity > 100) {
        errors.push(`Row ${rowNumber}: Invalid new equity percentage ${newEquity}`);
        return;
      }

      const actualCurrentEquity = parseFloat(member.equityPercentage.toString());
      if (Math.abs(currentEquity - actualCurrentEquity) > 0.0001) {
        errors.push(
          `Row ${rowNumber}: Current equity mismatch. Excel: ${currentEquity}, Database: ${actualCurrentEquity}`
        );
      }

      const change = newEquity - currentEquity;

      // Check for significant changes without reason
      if (Math.abs(change) > 0.0001 && !changeReason) {
        warnings.push(
          `Row ${rowNumber}: ${member.firstName} ${member.lastName} has equity change of ${change.toFixed(4)}% without a reason`
        );
      }

      // Warn about large changes
      if (Math.abs(change) > 10) {
        warnings.push(
          `Row ${rowNumber}: ${member.firstName} ${member.lastName} has a large equity change of ${change.toFixed(4)}%`
        );
      }

      // Check member status
      if (member.status !== 'ACTIVE' && member.status !== 'PROBATIONARY' && newEquity > 0) {
        warnings.push(
          `Row ${rowNumber}: ${member.firstName} ${member.lastName} has status ${member.status} but is assigned ${newEquity}% equity`
        );
      }

      totalBefore += currentEquity;
      totalAfter += newEquity;

      updates.push({
        memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        currentEquity,
        newEquity,
        change,
        changeReason,
      });

      rowIndex++;
    });

    // Check if all active members are included
    const activeMemberIds = members
      .filter(m => m.status === 'ACTIVE' || m.status === 'PROBATIONARY')
      .map(m => m.id);
    
    const missingMembers = activeMemberIds.filter(id => !processedMemberIds.has(id));
    if (missingMembers.length > 0) {
      const missingMemberDetails = missingMembers.map(id => {
        const member = memberMap.get(id)!;
        return `${member.firstName} ${member.lastName} (${member.email})`;
      });
      errors.push(`Missing active members: ${missingMemberDetails.join(', ')}`);
    }

    // Check total equity
    const totalDifference = Math.abs(totalAfter - 100);
    if (totalDifference > 0.01) {
      warnings.push(
        `Total equity after update is ${totalAfter.toFixed(4)}%, not 100%. Difference: ${totalDifference.toFixed(4)}%`
      );
      
      if (totalDifference > 1) {
        errors.push(`Total equity deviation too large: ${totalDifference.toFixed(4)}%`);
      }
    }

    // Check for inactive members with equity
    const inactiveWithEquity = updates.filter(u => {
      const member = memberMap.get(u.memberId);
      return member && 
        member.status !== 'ACTIVE' && 
        member.status !== 'PROBATIONARY' && 
        u.newEquity > 0;
    });

    if (inactiveWithEquity.length > 0) {
      warnings.push(
        `${inactiveWithEquity.length} inactive member(s) have equity assigned`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      updates,
      totalBefore,
      totalAfter,
      memberCount: updates.length,
    };
  }

  async generateValidationReport(
    validationResult: ImportValidationResult
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Create validation report worksheet
    const worksheet = workbook.addWorksheet('Validation Report', {
      properties: {
        tabColor: { argb: 'FFFF5722' },
      },
    });

    // Add summary section
    worksheet.addRow(['Validation Summary']);
    worksheet.addRow(['Status:', validationResult.isValid ? 'VALID' : 'INVALID']);
    worksheet.addRow(['Total Members:', validationResult.memberCount]);
    worksheet.addRow(['Total Equity Before:', `${validationResult.totalBefore.toFixed(4)}%`]);
    worksheet.addRow(['Total Equity After:', `${validationResult.totalAfter.toFixed(4)}%`]);
    worksheet.addRow(['']);

    // Style summary section
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(2).getCell(2).font = {
      bold: true,
      color: { argb: validationResult.isValid ? 'FF4CAF50' : 'FFF44336' },
    };

    // Add errors section
    if (validationResult.errors.length > 0) {
      worksheet.addRow(['Errors']);
      worksheet.getRow(worksheet.rowCount).font = { bold: true, size: 14, color: { argb: 'FFF44336' } };
      
      validationResult.errors.forEach(error => {
        const row = worksheet.addRow(['', error]);
        row.getCell(2).font = { color: { argb: 'FFB71C1C' } };
      });
      worksheet.addRow(['']);
    }

    // Add warnings section
    if (validationResult.warnings.length > 0) {
      worksheet.addRow(['Warnings']);
      worksheet.getRow(worksheet.rowCount).font = { bold: true, size: 14, color: { argb: 'FFFF9800' } };
      
      validationResult.warnings.forEach(warning => {
        const row = worksheet.addRow(['', warning]);
        row.getCell(2).font = { color: { argb: 'FFE65100' } };
      });
      worksheet.addRow(['']);
    }

    // Add changes summary
    worksheet.addRow(['Equity Changes Summary']);
    worksheet.getRow(worksheet.rowCount).font = { bold: true, size: 14 };
    worksheet.addRow(['']);

    // Create table for changes
    const changesStartRow = worksheet.rowCount + 1;
    worksheet.addRow(['Member', 'Current %', 'New %', 'Change %', 'Reason']);
    worksheet.getRow(worksheet.rowCount).font = { bold: true };

    validationResult.updates
      .filter(u => Math.abs(u.change) > 0.0001)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .forEach(update => {
        const row = worksheet.addRow([
          `${update.firstName} ${update.lastName}`,
          update.currentEquity.toFixed(4),
          update.newEquity.toFixed(4),
          update.change.toFixed(4),
          update.changeReason || 'No reason provided',
        ]);

        // Color code based on change magnitude
        if (Math.abs(update.change) > 10) {
          row.getCell(4).font = { bold: true, color: { argb: 'FFF44336' } };
        } else if (Math.abs(update.change) > 5) {
          row.getCell(4).font = { color: { argb: 'FFFF9800' } };
        }
      });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.values) {
        let maxLength = 0;
        column.values.forEach(value => {
          if (value && value.toString().length > maxLength) {
            maxLength = value.toString().length;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}