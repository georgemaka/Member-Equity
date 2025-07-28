import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X, FileText, ExternalLink } from 'lucide-react';

interface BoardApprovalUploadProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

const BoardApprovalUpload: React.FC<BoardApprovalUploadProps> = ({
  onDataChange,
  initialData = {},
}) => {
  const [formData, setFormData] = useState({
    boardApprovalTitle: initialData.boardApprovalTitle || '',
    boardApprovalDescription: initialData.boardApprovalDescription || '',
    boardApprovalType: initialData.boardApprovalType || 'ANNUAL_EQUITY_UPDATE',
    boardApprovalDate: initialData.boardApprovalDate ? new Date(initialData.boardApprovalDate) : new Date(),
    effectiveDate: initialData.effectiveDate ? new Date(initialData.effectiveDate) : new Date(),
    documentUrls: initialData.documentUrls || [],
    notes: initialData.notes || '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>(
    initialData.documentUrls?.map((url: string) => ({ 
      name: url.split('/').pop() || 'Document', 
      url 
    })) || []
  );

  const boardApprovalTypes = [
    { value: 'ANNUAL_EQUITY_UPDATE', label: 'Annual Equity Update' },
    { value: 'MID_YEAR_ADJUSTMENT', label: 'Mid-Year Adjustment' },
    { value: 'SPECIAL_ALLOCATION', label: 'Special Allocation' },
    { value: 'RETIREMENT_ADJUSTMENT', label: 'Retirement Adjustment' },
    { value: 'TERMINATION_ADJUSTMENT', label: 'Termination Adjustment' },
  ];

  const handleInputChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    
    // Convert dates to ISO strings for the parent
    const dataToSend = {
      ...updated,
      boardApprovalDate: updated.boardApprovalDate.toISOString().split('T')[0],
      effectiveDate: updated.effectiveDate.toISOString().split('T')[0],
    };
    
    onDataChange(dataToSend);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real implementation, you would upload to S3 or similar
    // For now, we'll create fake URLs
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      url: `https://example.com/documents/${file.name}`, // Replace with actual upload
    }));

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    
    const urls = updatedFiles.map(f => f.url);
    handleInputChange('documentUrls', urls);
  };

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    
    const urls = updated.map(f => f.url);
    handleInputChange('documentUrls', urls);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Board Approval Details</CardTitle>
          <CardDescription>
            Provide information about the board approval for this equity update
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Approval Title*</Label>
            <Input
              id="title"
              value={formData.boardApprovalTitle}
              onChange={(e) => handleInputChange('boardApprovalTitle', e.target.value)}
              placeholder="e.g., Annual Equity Update FY2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Approval Type*</Label>
            <Select
              value={formData.boardApprovalType}
              onValueChange={(value) => handleInputChange('boardApprovalType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select approval type" />
              </SelectTrigger>
              <SelectContent>
                {boardApprovalTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Board Approval Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.boardApprovalDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.boardApprovalDate ? (
                      format(formData.boardApprovalDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.boardApprovalDate}
                    onSelect={(date) => date && handleInputChange('boardApprovalDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Effective Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.effectiveDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.effectiveDate ? (
                      format(formData.effectiveDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.effectiveDate}
                    onSelect={(date) => date && handleInputChange('effectiveDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.boardApprovalDescription}
              onChange={(e) => handleInputChange('boardApprovalDescription', e.target.value)}
              placeholder="Provide additional context about this equity update..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any internal notes or comments..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supporting Documents</CardTitle>
          <CardDescription>
            Upload board meeting minutes, resolutions, or other supporting documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="doc-upload"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label
              htmlFor="doc-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                Click to upload documents
              </span>
              <span className="text-xs text-gray-500">
                PDF, DOC, DOCX, JPG, PNG (max 10MB each)
              </span>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Documents</Label>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BoardApprovalUpload;