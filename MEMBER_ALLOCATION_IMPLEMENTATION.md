# Member Allocation Calculation Implementation

This document describes the implementation of the member allocation calculation system with Balance Incentive Return and Equity-Based Allocation.

## Calculation Logic

### 1. Balance Incentive Return
Members who maintain a balance with the company are rewarded with a return calculated as:

```
Balance Incentive Return = Min(SOFR + 5%, 10%) × Member Balance
```

- **SOFR Rate**: Annual average Secured Overnight Financing Rate
- **Cap**: Maximum return rate is capped at 10%
- **Floor**: Minimum return rate is SOFR + 5%

### 2. Equity-Based Allocation
After deducting all Balance Incentive Returns from Net Income, the remaining amount is allocated based on equity ownership:

```
Remaining Net Income = Final Allocable Amount - Total Balance Incentive Returns
Equity-Based Allocation = Remaining Net Income × Member's Equity %
```

### 3. Total Member Allocation
```
Total Allocation = Balance Incentive Return + Equity-Based Allocation
```

## Implementation Details

### Updated Type Definitions (`types/financials.ts`)

```typescript
export interface AllocationPreview {
  member: {
    id: string
    firstName: string
    lastName: string
    equityPercentage: number
    currentCapitalBalance: number
  }
  allocationAmount: number // Total allocation
  balanceIncentiveReturn: number // Min(SOFR + 5%, 10%) × Member Balance
  equityBasedAllocation: number // Remaining Net Income × Member's Equity %
  effectiveReturnRate: number // The rate used for balance incentive
  newCapitalBalance: number
  distributionsToDate: number
}
```

### Mock Data Implementation (`hooks/useMockFinancialsData.ts`)

The allocation calculation follows this process:

1. **Calculate Effective Return Rate**: `Math.min(sofrRate + 5, 10)`
2. **First Pass**: Calculate balance incentive returns for all members
3. **Calculate Remaining Income**: `finalAllocableAmount - totalBalanceIncentiveReturns`
4. **Second Pass**: Calculate equity-based allocations using remaining income
5. **Combine**: Total allocation = balance incentive + equity-based

### Year-End Allocation Preview

The preview table now shows:
- **Balance Incentive Return**: Blue color, shows rate and percentage of total
- **Equity-Based Allocation**: Purple color, shows equity percentage and portion
- **Total Allocation**: Green color, shows combined amount
- **Summary Cards**: Display breakdown totals and effective return rate
- **Table Footer**: Shows totals for each allocation type

## Components Created

### 1. MemberAllocationDetails Component
Located: `components/MemberAllocationDetails.tsx`

**Props:**
- `memberId`: Member ID to fetch allocation data
- `memberName?`: Optional member name for display
- `showTitle?`: Whether to show component title (default: true)
- `compact?`: Show compact version (default: false)

**Features:**
- Full calculation breakdown
- Visual summary cards
- Performance metrics
- Allocation date and notes

### 2. MemberAllocationModal Component
Located: `components/MemberAllocationModal.tsx`

**Props:**
- `isOpen`: Modal visibility state
- `onClose`: Close handler function
- `memberId`: Member ID
- `memberName`: Member name for title

**Usage:**
```tsx
<MemberAllocationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  memberId="member-123"
  memberName="John Smith"
/>
```

## Usage Examples

### In Member List/Table
Add an "Allocation" button to each member row:

```tsx
<button
  onClick={() => {
    setSelectedMemberId(member.id)
    setSelectedMemberName(`${member.firstName} ${member.lastName}`)
    setShowAllocationModal(true)
  }}
  className="text-indigo-600 hover:text-indigo-900"
>
  View Allocation
</button>
```

### In Member Detail Page
Include the component directly:

```tsx
<MemberAllocationDetails
  memberId={member.id}
  memberName={`${member.firstName} ${member.lastName}`}
/>
```

### Compact Version in Dashboard
Use compact mode for dashboard widgets:

```tsx
<MemberAllocationDetails
  memberId={member.id}
  compact={true}
  showTitle={false}
/>
```

## Data Flow

1. **User Input**: SOFR rate and net income entered in Year-End Allocation setup
2. **Calculation**: Mock hooks calculate allocations using the defined logic
3. **Preview**: Year-End Allocation page shows detailed breakdown
4. **Member View**: Individual member allocation details available via components
5. **Processing**: Allocation amounts are saved to member records

## Visual Design

### Color Coding
- **Blue**: Balance Incentive Return (tied to member balance)
- **Purple**: Equity-Based Allocation (tied to ownership percentage)
- **Green**: Total allocation (sum of both)
- **Gray**: Supporting information and calculations

### Layout
- **Summary Cards**: High-level metrics at the top
- **Breakdown Panel**: Detailed calculation explanation
- **Data Table**: Row-by-row member allocations
- **Footer Totals**: Aggregate amounts for verification

## Integration Points

### Existing Components
- Year-End Allocation page: Enhanced with new calculation display
- Member pages: Can integrate MemberAllocationDetails component
- Dashboard: Can use compact allocation displays

### API Integration
When connecting to real backend:
- Update `financialsApi.ts` to call actual endpoints
- Replace mock hooks with real API calls
- Maintain the same component interfaces

### Testing
- Mock data provides realistic scenarios
- Calculations can be verified manually
- UI shows clear breakdown for auditing

## Benefits

1. **Transparency**: Clear breakdown of how allocations are calculated
2. **Flexibility**: Two-tier system rewards both balance maintenance and ownership
3. **Auditable**: Detailed calculation steps shown in UI
4. **Reusable**: Components can be used across different pages
5. **Scalable**: Logic handles any number of members and SOFR rate changes