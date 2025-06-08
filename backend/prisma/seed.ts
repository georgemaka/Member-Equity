import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Sukut Construction company
  const company = await prisma.company.upsert({
    where: { name: 'Sukut Construction, LLC' },
    update: {},
    create: {
      name: 'Sukut Construction, LLC',
      taxId: '95-1234567',
      foundedDate: new Date('1971-01-01'),
      fiscalYearEnd: '12-31',
      equityTotalValue: new Decimal(100000000), // $100M company value
      businessAddress: {
        street: '123 Construction Way',
        city: 'Orange',
        state: 'CA',
        zipCode: '92867',
        country: 'US'
      }
    }
  });

  console.log('✅ Created company:', company.name);

  // Create sample members
  const members = [
    {
      firstName: 'John',
      lastName: 'Sukut',
      email: 'john.sukut@sukut.com',
      phone: '+1-714-555-0101',
      equityPercentage: new Decimal(25.0000),
      taxWithholdingPercentage: new Decimal(25.00),
      joinDate: new Date('1971-01-01'),
      address: {
        street: '456 Executive Dr',
        city: 'Newport Beach',
        state: 'CA',
        zipCode: '92660',
        country: 'US'
      }
    },
    {
      firstName: 'Mike',
      lastName: 'Anderson',
      email: 'mike.anderson@sukut.com',
      phone: '+1-714-555-0102',
      equityPercentage: new Decimal(15.0000),
      taxWithholdingPercentage: new Decimal(22.00),
      joinDate: new Date('1985-03-15'),
      address: {
        street: '789 Manager Ln',
        city: 'Irvine',
        state: 'CA',
        zipCode: '92614',
        country: 'US'
      }
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@sukut.com',
      phone: '+1-714-555-0103',
      equityPercentage: new Decimal(8.5000),
      taxWithholdingPercentage: new Decimal(20.00),
      joinDate: new Date('1992-07-01'),
      address: {
        street: '321 Partner St',
        city: 'Costa Mesa',
        state: 'CA',
        zipCode: '92626',
        country: 'US'
      }
    }
  ];

  for (const memberData of members) {
    const member = await prisma.member.upsert({
      where: { email: memberData.email },
      update: {},
      create: {
        ...memberData,
        companyId: company.id,
        bankingInfo: {
          accountType: 'checking',
          routingNumber: '121000248',
          accountNumber: '1234567890',
          bankName: 'Wells Fargo'
        }
      }
    });

    // Create initial equity event
    await prisma.equityEvent.create({
      data: {
        memberId: member.id,
        eventType: 'INITIAL_GRANT',
        newPercentage: memberData.equityPercentage,
        effectiveDate: memberData.joinDate,
        reason: 'Initial equity grant'
      }
    });

    console.log('✅ Created member:', member.firstName, member.lastName);
  }

  // Create sample company profit data
  const currentYear = new Date().getFullYear();
  // For annual profits, we'll use quarter = 0 as a convention
  const profit = await prisma.companyProfit.upsert({
    where: {
      companyId_year_quarter: {
        companyId: company.id,
        year: currentYear - 1,
        quarter: 0
      }
    },
    update: {},
    create: {
      companyId: company.id,
      year: currentYear - 1,
      quarter: 0, // 0 for annual, 1-4 for quarterly
      revenue: new Decimal(50000000), // $50M revenue
      expenses: new Decimal(42000000), // $42M expenses
      netProfit: new Decimal(8000000), // $8M profit
      distributableAmount: new Decimal(6000000), // $6M distributable
      taxReserve: new Decimal(2000000), // $2M tax reserve
      reportDate: new Date(`${currentYear - 1}-12-31`)
    }
  });

  console.log('✅ Created company profit data for', currentYear - 1);

  // Create sample distribution
  const distribution = await prisma.distribution.create({
    data: {
      companyId: company.id,
      companyProfitId: profit.id,
      totalAmount: new Decimal(6000000),
      distributionDate: new Date(`${currentYear}-01-15`),
      status: 'COMPLETED',
      approvedAt: new Date(`${currentYear}-01-10`),
      processedAt: new Date(`${currentYear}-01-15`)
    }
  });

  // Create member distributions
  const allMembers = await prisma.member.findMany({
    where: { companyId: company.id }
  });

  for (const member of allMembers) {
    const memberAmount = new Decimal(6000000).mul(member.equityPercentage).div(100);
    const taxWithholding = memberAmount.mul(member.taxWithholdingPercentage).div(100);
    const netAmount = memberAmount.sub(taxWithholding);

    await prisma.memberDistribution.create({
      data: {
        distributionId: distribution.id,
        memberId: member.id,
        amount: memberAmount,
        taxWithholding: taxWithholding,
        netAmount: netAmount,
        paymentStatus: 'COMPLETED',
        paymentDate: new Date(`${currentYear}-01-15`)
      }
    });

    console.log(`✅ Created distribution for ${member.firstName} ${member.lastName}: $${netAmount.toFixed(2)}`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });