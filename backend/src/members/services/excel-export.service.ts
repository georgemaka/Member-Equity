import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExcelExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCurrentEquityState(companyId: string): Promise<Buffer> {
    // Fetch all active members with their current equity
    const members = await this.prisma.member.findMany({
      where: {
        companyId,
        status: { in: ['ACTIVE', 'PROBATIONARY'] },
      },
      orderBy: [
        { equityPercentage: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Member Equity System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Create main worksheet
    const worksheet = workbook.addWorksheet('Current Equity State', {
      properties: {
        tabColor: { argb: 'FF1E88E5' },
      },
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
      },
    });

    // Define columns
    worksheet.columns = [
      { header: 'Member ID', key: 'id', width: 15 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Current Equity %', key: 'currentEquity', width: 18 },
      { header: 'New Equity %', key: 'newEquity', width: 18 },
      { header: 'Change %', key: 'change', width: 15 },
      { header: 'Change Reason', key: 'changeReason', width: 40 },
      { header: 'Join Date', key: 'joinDate', width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E88E5' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add data rows
    members.forEach((member, index) => {
      const row = worksheet.addRow({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
        currentEquity: this.formatDecimal(member.equityPercentage),
        newEquity: this.formatDecimal(member.equityPercentage),
        change: 0,
        changeReason: '',
        joinDate: member.joinDate.toISOString().split('T')[0],
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }

      // Center align numeric columns
      row.getCell('currentEquity').alignment = { horizontal: 'center' };
      row.getCell('newEquity').alignment = { horizontal: 'center' };
      row.getCell('change').alignment = { horizontal: 'center' };
      row.getCell('status').alignment = { horizontal: 'center' };
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      id: 'TOTAL',
      firstName: '',
      lastName: '',
      email: '',
      status: '',
      currentEquity: members.reduce((sum, m) => 
        sum + parseFloat(m.equityPercentage.toString()), 0
      ).toFixed(4),
      newEquity: members.reduce((sum, m) => 
        sum + parseFloat(m.equityPercentage.toString()), 0
      ).toFixed(4),
      change: 0,
      changeReason: '',
      joinDate: '',
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' },
    };

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add data validation for New Equity % column
    const newEquityColumn = worksheet.getColumn('newEquity');
    for (let i = 2; i <= members.length + 1; i++) {
      const cell = newEquityColumn.values[i];
      if (cell) {
        worksheet.getCell(`G${i}`).dataValidation = {
          type: 'decimal',
          operator: 'between',
          allowBlank: false,
          showInputMessage: true,
          showErrorMessage: true,
          errorStyle: 'stop',
          errorTitle: 'Invalid Equity Percentage',
          error: 'Equity percentage must be between 0 and 100',
          promptTitle: 'Equity Percentage',
          prompt: 'Enter a value between 0 and 100',
          formulae: [0, 100],
        };
      }
    }

    // Add conditional formatting for changes
    worksheet.addConditionalFormatting({
      ref: `H2:H${members.length + 1}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          priority: 1,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE8F5E9' },
            },
            font: {
              color: { argb: 'FF2E7D32' },
              bold: true,
            },
          },
          formulae: [10],
        },
        {
          type: 'cellIs',
          operator: 'lessThan',
          priority: 2,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFEBEE' },
            },
            font: {
              color: { argb: 'FFC62828' },
              bold: true,
            },
          },
          formulae: [-10],
        },
      ],
    });

    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Instructions', {
      properties: {
        tabColor: { argb: 'FF4CAF50' },
      },
    });

    instructionsSheet.columns = [
      { header: 'Instructions for Equity Updates', key: 'instructions', width: 80 },
    ];

    const instructions = [
      '1. Update the "New Equity %" column with the approved equity percentages',
      '2. The "Change %" column will automatically calculate the difference',
      '3. Provide a reason for any changes in the "Change Reason" column',
      '4. Ensure the total of all "New Equity %" equals 100%',
      '5. Changes greater than 10% will be highlighted and require special attention',
      '6. Save this file and upload it back to the system for processing',
      '',
      'WARNINGS:',
      '- Do not modify Member ID, First Name, Last Name, or Email columns',
      '- Do not add or remove rows',
      '- Do not change the order of rows',
      '- Ensure all equity percentages are between 0 and 100',
      '',
      'COLOR CODING:',
      '- Green highlight: Increase > 10%',
      '- Red highlight: Decrease > 10%',
      '- Blue row: Total row showing sum of all equity',
    ];

    instructions.forEach((instruction, index) => {
      const row = instructionsSheet.addRow({ instructions: instruction });
      if (instruction.startsWith('WARNINGS:') || instruction.startsWith('COLOR CODING:')) {
        row.font = { bold: true, size: 12 };
      }
    });

    // Add formulas to calculate changes
    for (let i = 2; i <= members.length + 1; i++) {
      worksheet.getCell(`H${i}`).value = { formula: `=G${i}-F${i}` };
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private formatDecimal(value: Decimal): number {
    return parseFloat(value.toString());
  }
}