import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { ExcelUploadService } from './excel-upload.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateEquityDto } from './dto/update-member.dto';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';

describe('MembersController', () => {
  let controller: MembersController;
  let membersService: MembersService;
  let excelUploadService: ExcelUploadService;

  const mockMembersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateEquity: jest.fn(),
    retire: jest.fn(),
    getEquityHistory: jest.fn(),
    getBalanceHistory: jest.fn(),
  };

  const mockExcelUploadService = {
    uploadMembers: jest.fn(),
    generateExampleTemplate: jest.fn(),
  };

  const mockUserContext = {
    userId: 'user-123',
    companyId: 'company-1',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['members:write'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        { provide: MembersService, useValue: mockMembersService },
        { provide: ExcelUploadService, useValue: mockExcelUploadService },
      ],
    }).compile();

    controller = module.get<MembersController>(MembersController);
    membersService = module.get<MembersService>(MembersService);
    excelUploadService = module.get<ExcelUploadService>(ExcelUploadService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new member', async () => {
      const createDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        equityPercentage: new Decimal(10),
        taxWithholdingPercentage: new Decimal(24),
        joinDate: '2024-01-01',
        address: { 
          street: '123 Main St', 
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        },
      } as CreateMemberDto;

      const expectedResult = {
        id: 'member-123',
        ...createDto,
        companyId: mockUserContext.companyId,
      };

      mockMembersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUserContext.companyId, createDto);

      expect(result).toEqual(expectedResult);
      expect(mockMembersService.create).toHaveBeenCalledWith(
        mockUserContext.companyId,
        createDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated members list', async () => {
      const pagination = { page: 1, limit: 10, skip: 0, take: 10 };
      const expectedResult = {
        data: [
          { id: '1', firstName: 'John', equityPercentage: new Decimal('50') },
          { id: '2', firstName: 'Jane', equityPercentage: new Decimal('50') },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockMembersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUserContext.companyId, pagination);

      expect(result).toEqual(expectedResult);
      expect(mockMembersService.findAll).toHaveBeenCalledWith(
        mockUserContext.companyId,
        pagination,
      );
    });
  });

  describe('updateEquity', () => {
    it('should update member equity percentage', async () => {
      const memberId = 'member-123';
      const updateDto: UpdateEquityDto = {
        newPercentage: new Decimal(15),
        effectiveDate: '2024-02-01',
        reason: 'Annual adjustment',
      };

      const expectedResult = {
        id: memberId,
        equityPercentage: new Decimal(updateDto.newPercentage),
      };

      mockMembersService.updateEquity.mockResolvedValue(expectedResult);

      const result = await controller.updateEquity(memberId, updateDto);

      expect(result).toEqual(expectedResult);
      expect(mockMembersService.updateEquity).toHaveBeenCalledWith(
        memberId,
        updateDto,
      );
    });
  });

  describe('retire', () => {
    it('should retire a member', async () => {
      const memberId = 'member-123';
      const retireDto = {
        retirementDate: '2024-12-31',
        reason: 'Voluntary retirement',
      };

      const expectedResult = {
        id: memberId,
        status: 'RETIRED',
        retirementDate: new Date(retireDto.retirementDate),
      };

      mockMembersService.retire.mockResolvedValue(expectedResult);

      const result = await controller.retire(memberId, retireDto);

      expect(result).toEqual(expectedResult);
      expect(mockMembersService.retire).toHaveBeenCalledWith(
        memberId,
        new Date(retireDto.retirementDate),
        retireDto.reason,
      );
    });
  });

  describe('uploadMembers', () => {
    it('should upload members from Excel file', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'members.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('test'),
        size: 1000,
      } as Express.Multer.File;

      const uploadDto = {
        skipValidation: false,
        dryRun: false,
      };

      const expectedResult = {
        success: true,
        created: 5,
        errors: [],
      };

      mockExcelUploadService.uploadMembers.mockResolvedValue(expectedResult);

      const result = await controller.uploadMembers(
        mockUserContext.companyId,
        mockFile,
        uploadDto,
      );

      expect(result).toEqual(expectedResult);
      expect(mockExcelUploadService.uploadMembers).toHaveBeenCalledWith(
        mockUserContext.companyId,
        mockFile,
        uploadDto.skipValidation,
        uploadDto.dryRun,
      );
    });

    it('should throw BadRequestException when no file is uploaded', async () => {
      await expect(
        controller.uploadMembers(mockUserContext.companyId, null as any, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-Excel files', async () => {
      const mockFile = {
        originalname: 'members.pdf',
      } as Express.Multer.File;

      await expect(
        controller.uploadMembers(mockUserContext.companyId, mockFile, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEquityHistory', () => {
    it('should return member equity history', async () => {
      const memberId = 'member-123';
      const year = 2024;
      const expectedHistory = [
        {
          id: 'event-1',
          eventType: 'INITIAL_GRANT',
          newPercentage: new Decimal('10'),
          effectiveDate: new Date('2024-01-01'),
        },
        {
          id: 'event-2',
          eventType: 'PERCENTAGE_CHANGE',
          previousPercentage: new Decimal('10'),
          newPercentage: new Decimal('15'),
          effectiveDate: new Date('2024-06-01'),
        },
      ];

      mockMembersService.getEquityHistory.mockResolvedValue(expectedHistory);

      const result = await controller.getEquityHistory(memberId, year);

      expect(result).toEqual(expectedHistory);
      expect(mockMembersService.getEquityHistory).toHaveBeenCalledWith(
        memberId,
        year,
      );
    });
  });
});