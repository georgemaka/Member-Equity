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
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto, UpdateEquityDto } from './dto/update-member.dto';
import { UploadMembersDto } from './dto/upload-members.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorator';
import { CompanyId } from '../common/decorators/user.decorator';

@ApiTags('members')
@Controller('members')
// @UseGuards(JwtAuthGuard, RolesGuard) // TODO: Re-enable after testing
@ApiBearerAuth()
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly excelUploadService: ExcelUploadService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new member' })
  create(
    @CompanyId() companyId: string, // TODO: Get from JWT
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
    @CompanyId() companyId: string, // TODO: Get from JWT
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
  findAll(
    @CompanyId() companyId: string, // TODO: Get from JWT
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
}