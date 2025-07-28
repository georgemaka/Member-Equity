import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  ArrowRight,
  ArrowLeft,
  Download,
  Save,
  Send
} from 'lucide-react';
import BoardApprovalUpload from './BoardApprovalUpload';
import EquityComparisonTable from './EquityComparisonTable';
import ProRataCalculator from './ProRataCalculator';
import ValidationWarnings from './ValidationWarnings';
import { memberApi } from '@/services/memberApi';
import { useToast } from '@/components/ui/use-toast';

interface EquityUpdateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

type WizardStep = 'method' | 'upload' | 'validation' | 'board-approval' | 'review' | 'submit';

const EquityUpdateWizard: React.FC<EquityUpdateWizardProps> = ({
  isOpen,
  onClose,
  companyId,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>('method');
  const [updateMethod, setUpdateMethod] = useState<'excel' | 'manual'>('excel');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [boardApprovalData, setBoardApprovalData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proRataAdjustments, setProRataAdjustments] = useState<any>(null);

  const steps: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
    { id: 'method', label: 'Choose Method', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload Data', icon: <Upload className="w-4 h-4" /> },
    { id: 'validation', label: 'Validate', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'board-approval', label: 'Board Approval', icon: <Check className="w-4 h-4" /> },
    { id: 'review', label: 'Review', icon: <Check className="w-4 h-4" /> },
    { id: 'submit', label: 'Submit', icon: <Send className="w-4 h-4" /> },
  ];

  const getStepIndex = (step: WizardStep) => steps.findIndex(s => s.id === step);
  const progressPercentage = ((getStepIndex(currentStep) + 1) / steps.length) * 100;

  const handleExcelDownload = async () => {
    try {
      const response = await memberApi.exportEquityState(companyId);
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equity-state-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Excel template downloaded',
        description: 'Update the "New Equity %" column and upload when ready.',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download equity template',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    try {
      const validation = await memberApi.validateEquityImport(companyId, file);
      setValidationResult(validation);
      
      if (validation.warnings.length > 0 || !validation.isValid) {
        setCurrentStep('validation');
      } else {
        setCurrentStep('board-approval');
      }
    } catch (error) {
      toast({
        title: 'Validation failed',
        description: 'Failed to validate the uploaded file',
        variant: 'destructive',
      });
    }
  };

  const handleProRataApplication = async (adjustments: any) => {
    setProRataAdjustments(adjustments);
    // Update validation result with pro-rata adjustments
    if (validationResult) {
      const updatedValidation = {
        ...validationResult,
        updates: adjustments.adjusted.map((adj: any) => {
          const original = validationResult.updates.find((u: any) => u.memberId === adj.memberId);
          return {
            ...original,
            newEquity: adj.finalPercentage,
            change: adj.finalPercentage - original.currentEquity,
          };
        }),
        totalAfter: 100,
      };
      setValidationResult(updatedValidation);
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !validationResult || !boardApprovalData) {
      toast({
        title: 'Missing data',
        description: 'Please complete all steps before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      Object.keys(boardApprovalData).forEach(key => {
        if (Array.isArray(boardApprovalData[key])) {
          boardApprovalData[key].forEach((value: any) => {
            formData.append(`${key}[]`, value);
          });
        } else {
          formData.append(key, boardApprovalData[key]);
        }
      });
      
      // Add force apply if there are warnings
      if (validationResult.warnings.length > 0) {
        formData.append('forceApply', 'true');
      }

      const result = await memberApi.importEquityUpdates(companyId, formData);
      
      if (result.success) {
        toast({
          title: 'Equity update created',
          description: 'Board approval has been created successfully',
        });
        onClose();
        navigate(`/equity/board-approvals/${result.boardApproval.id}`);
      }
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Failed to create equity update',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'method':
        return true;
      case 'upload':
        return uploadedFile !== null;
      case 'validation':
        return validationResult && (validationResult.isValid || validationResult.warnings.length > 0);
      case 'board-approval':
        return boardApprovalData.boardApprovalTitle && boardApprovalData.effectiveDate;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Equity Update Wizard</DialogTitle>
          <DialogDescription>
            Follow the steps to update member equity percentages with board approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-500">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 ${
                    getStepIndex(currentStep) >= index ? 'text-primary' : ''
                  }`}
                >
                  {step.icon}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'method' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Choose Update Method</h3>
                <Tabs value={updateMethod} onValueChange={(v) => setUpdateMethod(v as 'excel' | 'manual')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="excel">Excel Upload</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  </TabsList>
                  <TabsContent value="excel" className="space-y-4">
                    <Alert>
                      <FileSpreadsheet className="h-4 w-4" />
                      <AlertDescription>
                        Download the current equity state as an Excel file, update the percentages, 
                        and upload it back for processing.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={handleExcelDownload} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Current Equity State
                    </Button>
                  </TabsContent>
                  <TabsContent value="manual">
                    <Alert>
                      <AlertDescription>
                        Manual entry allows you to update equity percentages directly in the web interface.
                        This is suitable for small changes or adjustments.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => navigate('/equity/manual-update')} 
                      variant="outline"
                      className="w-full"
                    >
                      Go to Manual Entry
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {currentStep === 'upload' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upload Equity Update File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-12 w-12 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      Excel files only (.xlsx, .xls)
                    </span>
                  </label>
                  {uploadedFile && (
                    <div className="mt-4 text-sm text-gray-600">
                      Uploaded: {uploadedFile.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'validation' && validationResult && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Validation Results</h3>
                <ValidationWarnings
                  errors={validationResult.errors}
                  warnings={validationResult.warnings}
                  totalBefore={validationResult.totalBefore}
                  totalAfter={validationResult.totalAfter}
                />
                
                {Math.abs(validationResult.totalAfter - 100) > 0.01 && (
                  <ProRataCalculator
                    unallocated={100 - validationResult.totalAfter}
                    members={validationResult.updates}
                    onApply={handleProRataApplication}
                  />
                )}

                {validationResult.updates && (
                  <EquityComparisonTable
                    updates={validationResult.updates}
                    showWarnings={true}
                  />
                )}
              </div>
            )}

            {currentStep === 'board-approval' && (
              <BoardApprovalUpload
                onDataChange={setBoardApprovalData}
                initialData={boardApprovalData}
              />
            )}

            {currentStep === 'review' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Review & Confirm</h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Board Approval Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                    <p><strong>Title:</strong> {boardApprovalData.boardApprovalTitle}</p>
                    <p><strong>Type:</strong> {boardApprovalData.boardApprovalType}</p>
                    <p><strong>Approval Date:</strong> {boardApprovalData.boardApprovalDate}</p>
                    <p><strong>Effective Date:</strong> {boardApprovalData.effectiveDate}</p>
                    {boardApprovalData.notes && (
                      <p><strong>Notes:</strong> {boardApprovalData.notes}</p>
                    )}
                  </div>
                </div>

                {validationResult && (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium">Summary</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                        <p><strong>Total Members:</strong> {validationResult.memberCount}</p>
                        <p><strong>Total Before:</strong> {validationResult.totalBefore.toFixed(4)}%</p>
                        <p><strong>Total After:</strong> {validationResult.totalAfter.toFixed(4)}%</p>
                        <p><strong>Changes:</strong> {validationResult.updates.filter((u: any) => Math.abs(u.change) > 0.01).length}</p>
                      </div>
                    </div>

                    <EquityComparisonTable
                      updates={validationResult.updates}
                      showWarnings={false}
                    />
                  </>
                )}
              </div>
            )}

            {currentStep === 'submit' && (
              <div className="space-y-4 text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Ready to Submit</h3>
                <p className="text-gray-600">
                  Your equity update is ready to be submitted for processing. 
                  Once submitted, it will create a board approval record that can be 
                  reviewed and applied.
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full max-w-xs mx-auto"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Equity Update
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'method'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep !== 'submit' && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquityUpdateWizard;