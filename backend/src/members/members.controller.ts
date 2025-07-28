import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import { ExcelUploadService } from './excel-upload.service';
import { ExcelExportService } from './services/excel-export.service';
import { ExcelImportService } from './services/excel-import.service';
import { BoardApprovalService } from './services/board-approval.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto, UpdateEquityDto } from './dto/update-member.dto';
import { UpdateMemberStatusDto } from './dto/update-status.dto';
import { UploadMembersDto } from './dto/upload-members.dto';
import { BulkEquityUpdateDto } from './dto/bulk-equity-update.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorator';
import { CompanyId } from '../common/decorators/user.decorator';

@ApiTags('members')
@Controller('members')
@UseGuards(DevAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly excelUploadService: ExcelUploadService,
    private readonly excelExportService: ExcelExportService,
    private readonly excelImportService: ExcelImportService,
    private readonly boardApprovalService: BoardApprovalService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new member' })
  create(
    @CompanyId() companyId: string,
    @Body() createMemberDto: CreateMemberDto
  ) {
    return this.membersService.create(companyId, createMemberDto);
  }

  @Post('upload')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload members from Excel file' })
  @ApiBody({ type: UploadMembersDto })
  async uploadMembers(
    @CompanyId() companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadMembersDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed');
    }

    return this.excelUploadService.uploadMembers(
      companyId,
      file,
      uploadDto.skipValidation,
      uploadDto.dryRun,
    );
  }

  @Get('upload/template')
  @Roles('admin')
  @ApiOperation({ summary: 'Download Excel template for member upload' })
  downloadTemplate(@Res() res: Response) {
    const buffer = this.excelUploadService.generateExampleTemplate();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="member-upload-template.xlsx"',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Get all members with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'fiscalYear', required: false, example: 2025 })
  @ApiQuery({ name: 'includeEquity', required: false, example: true })
  findAll(
    @CompanyId() companyId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.membersService.findAll(companyId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member by ID' })
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update member information' })
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Patch(':id/equity')
  @Roles('admin')
  @ApiOperation({ summary: 'Update member equity percentage' })
  updateEquity(@Param('id') id: string, @Body() updateEquityDto: UpdateEquityDto) {
    return this.membersService.updateEquity(id, updateEquityDto);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Update member status' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateMemberStatusDto) {
    return this.membersService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/retire')
  @Roles('admin')
  @ApiOperation({ summary: 'Retire a member' })
  retire(
    @Param('id') id: string,
    @Body() retireDto: { retirementDate: string; reason: string },
  ) {
    return this.membersService.retire(
      id,
      new Date(retireDto.retirementDate),
      retireDto.reason,
    );
  }

  @Get(':id/equity-history')
  @ApiOperation({ summary: 'Get member equity history' })
  @ApiQuery({ name: 'year', required: false, example: 2024 })
  getEquityHistory(@Param('id') id: string, @Query('year') year?: number) {
    return this.membersService.getEquityHistory(id, year);
  }

  @Get(':id/balance-history')
  @ApiOperation({ summary: 'Get member balance history' })
  @ApiQuery({ name: 'year', required: false, example: 2024 })
  getBalanceHistory(@Param('id') id: string, @Query('year') year?: number) {
    return this.membersService.getBalanceHistory(id, year);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get member status change history' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getStatusHistory(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.membersService.getStatusHistory(id, limit);
  }

  @Post('bulk-equity-update')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk update member equity percentages' })
  bulkUpdateEquity(
    @CompanyId() companyId: string,
    @Body() bulkUpdateDto: BulkEquityUpdateDto
  ) {
    return this.membersService.bulkUpdateEquity(companyId, bulkUpdateDto);
  }

  @Get('equity/export')
  @Roles('admin')
  @ApiOperation({ summary: 'Export current equity state to Excel' })
  async exportEquityState(
    @CompanyId() companyId: string,
    @Res() res: Response
  ) {
    const buffer = await this.excelExportService.exportCurrentEquityState(companyId);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="equity-state-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });
    
    res.send(buffer);
  }

  @Post('equity/import/validate')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Validate equity update Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async validateEquityImport(
    @CompanyId() companyId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const validation = await this.excelImportService.validateAndParseEquityUpdate(
      file.buffer,
      companyId
    );

    return validation;
  }

  @Post('equity/board-approval')
  @Roles('admin')
  @ApiOperation({ summary: 'Create board approval for equity updates' })
  async createBoardApproval(
    @CompanyId() companyId: string,
    @Body() dto: BulkEquityUpdateDto,
    @CompanyId() userId: string // In real implementation, get from auth context
  ) {
    return this.boardApprovalService.createBoardApproval(companyId, dto, userId);
  }

  @Post('equity/board-approval/:id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve board approval' })
  async approveBoardApproval(
    @Param('id') approvalId: string,
    @CompanyId() userId: string // In real implementation, get from auth context
  ) {
    return this.boardApprovalService.approveBoardApproval(approvalId, userId);
  }

  @Post('equity/board-approval/:id/apply')
  @Roles('admin')
  @ApiOperation({ summary: 'Apply approved board approval' })
  async applyBoardApproval(@Param('id') approvalId: string) {
    await this.boardApprovalService.applyBoardApproval(approvalId);
    return { message: 'Board approval applied successfully' };
  }

  @Get('equity/pro-rata-calculation')
  @Roles('admin')
  @ApiOperation({ summary: 'Calculate pro-rata distribution for unallocated equity' })
  @ApiQuery({ name: 'excludeIds', required: false, type: [String] })
  async calculateProRata(
    @CompanyId() companyId: string,
    @Query('excludeIds') excludeIds?: string | string[]
  ) {
    const excludeArray = Array.isArray(excludeIds) ? excludeIds : excludeIds ? [excludeIds] : [];
    return this.boardApprovalService.calculateProRataAdjustment(companyId, excludeArray);
  }

  @Post('equity/import')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import and process equity updates from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        boardApprovalTitle: { type: 'string' },
        boardApprovalDescription: { type: 'string' },
        boardApprovalType: { type: 'string', enum: ['ANNUAL_EQUITY_UPDATE', 'MID_YEAR_ADJUSTMENT'] },
        boardApprovalDate: { type: 'string', format: 'date' },
        effectiveDate: { type: 'string', format: 'date' },
        documentUrls: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
        forceApply: { type: 'boolean' },
      },
      required: ['file', 'boardApprovalTitle', 'boardApprovalType', 'boardApprovalDate', 'effectiveDate'],
    },
  })
  async importEquityUpdates(
    @CompanyId() companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CompanyId() userId: string // In real implementation, get from auth context
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // First validate the file
    const validation = await this.excelImportService.validateAndParseEquityUpdate(
      file.buffer,
      companyId
    );

    if (!validation.isValid && !body.forceApply) {
      return {
        success: false,
        validation,
        message: 'Validation failed. Set forceApply=true to proceed anyway.',
      };
    }

    // Convert validation results to bulk update DTO
    const bulkUpdateDto: BulkEquityUpdateDto = {
      updates: validation.updates.map(u => ({
        memberId: u.memberId,
        newEquityPercentage: u.newEquity,
        changeReason: u.changeReason,
      })),
      boardApprovalTitle: body.boardApprovalTitle,
      boardApprovalDescription: body.boardApprovalDescription,
      boardApprovalType: body.boardApprovalType,
      boardApprovalDate: body.boardApprovalDate,
      effectiveDate: body.effectiveDate,
      documentUrls: body.documentUrls || [],
      notes: body.notes,
      forceApply: body.forceApply || false,
    };

    // Create board approval
    const result = await this.boardApprovalService.createBoardApproval(
      companyId,
      bulkUpdateDto,
      userId
    );

    return {
      success: true,
      boardApproval: result.approval,
      validation: result.validation,
    };
  }
}