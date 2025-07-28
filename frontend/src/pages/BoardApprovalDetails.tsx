import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberApi } from '@/services/memberApi';
import { useToast } from '@/components/ui/use-toast';
import PageContainer from '@/components/PageContainer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EquityComparisonTable from '@/components/equity/EquityComparisonTable';
import ValidationWarnings from '@/components/equity/ValidationWarnings';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Calendar,
  Users,
  TrendingUp,
  Download,
  Send,
  Check
} from 'lucide-react';

interface BoardApproval {
  id: string;
  title: string;
  description?: string;
  approvalType: string;
  approvalDate: string;
  effectiveDate: string;
  status: string;
  totalEquityBefore: number;
  totalEquityAfter: number;
  documentUrls: string[];
  metadata: any;
  submittedBy: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  updates: any[];
}

export default function BoardApprovalDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [approval, setApproval] = useState<BoardApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApprovalDetails();
  }, [id]);

  const loadApprovalDetails = async () => {
    try {
      // In a real implementation, you would have a dedicated endpoint
      // For now, we'll use a placeholder
      setLoading(false);
      
      // Mock data for demonstration
      setApproval({
        id: id!,
        title: 'Annual Equity Update FY2025',
        description: 'Annual equity reallocation based on performance and contributions',
        approvalType: 'ANNUAL_EQUITY_UPDATE',
        approvalDate: '2025-01-15',
        effectiveDate: '2025-02-01',
        status: 'APPROVED',
        totalEquityBefore: 99.5,
        totalEquityAfter: 100,
        documentUrls: ['https://example.com/board-minutes.pdf'],
        metadata: {
          fiscalYear: 2025,
          warnings: ['Total equity was 99.5%, adjusted to 100%'],
        },
        submittedBy: 'admin@example.com',
        submittedAt: '2025-01-10T10:00:00Z',
        approvedBy: 'board@example.com',
        approvedAt: '2025-01-15T14:30:00Z',
        updates: [],
      });
    } catch (error) {
      toast({
        title: 'Failed to load approval details',
        description: 'Please try again later',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approval) return;
    
    setProcessing(true);
    try {
      await memberApi.approveBoardApproval(approval.id);
      toast({
        title: 'Board approval approved',
        description: 'The equity update has been approved',
      });
      await loadApprovalDetails();
    } catch (error) {
      toast({
        title: 'Failed to approve',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!approval) return;
    
    setProcessing(true);
    try {
      await memberApi.applyBoardApproval(approval.id);
      toast({
        title: 'Equity update applied',
        description: 'All member equity percentages have been updated',
      });
      navigate('/members');
    } catch (error) {
      toast({
        title: 'Failed to apply',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'PENDING_APPROVAL':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'APPLIED':
        return <Check className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary';
      case 'PENDING_APPROVAL':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'APPLIED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!approval) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Approval not found</h2>
          <Button onClick={() => navigate('/members')} className="mt-4">
            Back to Members
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{approval.title}</h1>
            {approval.description && (
              <p className="mt-2 text-gray-600">{approval.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4">
              <Badge variant={getStatusColor(approval.status) as any}>
                {getStatusIcon(approval.status)}
                <span className="ml-1">{approval.status.replace('_', ' ')}</span>
              </Badge>
              <span className="text-sm text-gray-500">
                Submitted by {approval.submittedBy} on{' '}
                {new Date(approval.submittedAt!).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {approval.status === 'DRAFT' && (
              <Button onClick={handleApprove} disabled={processing}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            )}
            {approval.status === 'PENDING_APPROVAL' && (
              <Button onClick={handleApprove} disabled={processing}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}
            {approval.status === 'APPROVED' && (
              <Button onClick={handleApply} disabled={processing}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Apply Changes
              </Button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                <Calendar className="inline h-4 w-4 mr-1" />
                Board Approval Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {new Date(approval.approvalDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                <Calendar className="inline h-4 w-4 mr-1" />
                Effective Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {new Date(approval.effectiveDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                <Users className="inline h-4 w-4 mr-1" />
                Members Affected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{approval.updates.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Warnings */}
        {approval.metadata.warnings && approval.metadata.warnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ValidationWarnings
                errors={[]}
                warnings={approval.metadata.warnings}
                totalBefore={approval.totalEquityBefore}
                totalAfter={approval.totalEquityAfter}
              />
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {approval.documentUrls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Supporting Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {approval.documentUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4" />
                    {url.split('/').pop()}
                    <Download className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Equity Changes Table */}
        {approval.updates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Equity Changes</CardTitle>
              <CardDescription>
                Review all member equity changes in this update
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquityComparisonTable
                updates={approval.updates}
                showWarnings={approval.status === 'DRAFT' || approval.status === 'PENDING_APPROVAL'}
              />
            </CardContent>
          </Card>
        )}

        {/* Approval History */}
        {approval.approvedBy && (
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Approved by {approval.approvedBy}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(approval.approvedAt!).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {approval.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{approval.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}