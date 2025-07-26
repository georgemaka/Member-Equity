import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/services/memberApi';
import { useToast } from '@/contexts/ToastContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { CreateMemberDto, UpdateMemberDto, UpdateEquityDto, UploadResult } from '@/types/member';

export function useMembers() {
  const { currentFiscalYear } = useFiscalYear();
  
  return useQuery({
    queryKey: ['members', currentFiscalYear],
    queryFn: () => memberApi.getMembersForYear(currentFiscalYear),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => memberApi.getMember(id),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: (data: CreateMemberDto) => memberApi.createMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      showToast('Member created successfully', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to create member', 'error');
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberDto }) => 
      memberApi.updateMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      showToast('Member updated successfully', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to update member', 'error');
    },
  });
}

export function useUpdateEquity() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquityDto }) => 
      memberApi.updateEquity(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['equity'] });
      showToast('Equity updated successfully', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to update equity', 'error');
    },
  });
}

export function useRetireMember() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, retirementDate, reason }: { 
      id: string; 
      retirementDate: string; 
      reason: string 
    }) => memberApi.retireMember(id, retirementDate, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      showToast('Member retired successfully', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to retire member', 'error');
    },
  });
}

export function useUploadMembers() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: ({ file, skipValidation = false, dryRun = false }: {
      file: File;
      skipValidation?: boolean;
      dryRun?: boolean;
    }) => memberApi.uploadMembers(file, skipValidation, dryRun),
    onSuccess: (result: UploadResult) => {
      if (!result.dryRun) {
        queryClient.invalidateQueries({ queryKey: ['members'] });
        showToast(`Successfully imported ${result.importedMembers} members`, 'success');
      } else {
        showToast(`Validation complete: ${result.validRows} valid rows`, 'info');
      }
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to upload members', 'error');
    },
  });
}

export function useMemberEquityHistory(id: string, year?: number) {
  return useQuery({
    queryKey: ['member', id, 'equity-history', year],
    queryFn: () => memberApi.getEquityHistory(id, year),
    enabled: !!id,
  });
}

export function useMemberBalanceHistory(id: string, year?: number) {
  return useQuery({
    queryKey: ['member', id, 'balance-history', year],
    queryFn: () => memberApi.getBalanceHistory(id, year),
    enabled: !!id,
  });
}