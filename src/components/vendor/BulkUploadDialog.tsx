import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useVendor, CallData } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import UploadSummaryDialog from './UploadSummaryDialog';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedCall {
  stateName: string;
  branchName: string;
  branchCategory: string;
  branchCode: string;
  address: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  assetsCount: number;
  supportType: string;
  assetType: string;
}

const REQUIRED_COLUMNS = [
  "State Name", "BRANCH NAME", "branch catg.", "Branch code", "Complete Address",
  "Pincode", "Branch Contact Name", "Branch Telephone Number", "Assets Count",
  "Support Type", "Asset Type"
];

const BulkUploadDialog = ({ open, onOpenChange }: BulkUploadDialogProps) => {
  const { currentVendor, projects, addCalls } = useVendor();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCall[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [problemDescription, setProblemDescription] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vendorProjects = projects.filter((p) => p.vendorId === currentVendor?.id);
  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  const parseCSV = (text: string): { data: ParsedCall[]; errors: string[] } => {
    const lines = text.trim().split('\n');
    const errors: string[] = [];
    const data: ParsedCall[] = [];

    if (lines.length < 2) {
      errors.push('CSV must contain at least a header row and one data row');
      return { data, errors };
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const headerLower = headers.map(h => h.toLowerCase());

    // Check required columns
    const missingColumns = REQUIRED_COLUMNS.filter(
      col => !headerLower.includes(col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      return { data, errors };
    }

    // Build column index map
    const colIndex: Record<string, number> = {};
    headers.forEach((h, idx) => {
      colIndex[h.toLowerCase()] = idx;
    });

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      
      if (values.length === 0 || (values.length === 1 && values[0] === '')) {
        continue;
      }

      const getValue = (colName: string) => values[colIndex[colName.toLowerCase()]] || '';

      // Validate pincode
      const pincode = getValue('Pincode');
      if (!/^\d{6}$/.test(pincode)) {
        errors.push(`Row ${i + 1}: Invalid pincode "${pincode}" - must be 6 digits`);
        continue;
      }

      // Validate assets count
      const assetsCount = parseInt(getValue('Assets Count'), 10);
      if (isNaN(assetsCount) || assetsCount < 0) {
        errors.push(`Row ${i + 1}: Invalid Assets Count`);
        continue;
      }

      data.push({
        stateName: getValue('State Name'),
        branchName: getValue('BRANCH NAME'),
        branchCategory: getValue('branch catg.'),
        branchCode: getValue('Branch code'),
        address: getValue('Complete Address'),
        pincode: pincode,
        contactName: getValue('Branch Contact Name'),
        contactPhone: getValue('Branch Telephone Number'),
        assetsCount: assetsCount,
        supportType: getValue('Support Type').toLowerCase(),
        assetType: getValue('Asset Type'),
      });
    }

    return { data, errors };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file only.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { data, errors } = parseCSV(text);
      setParsedData(data);
      setValidationErrors(errors);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!selectedProject) {
      toast({
        title: 'Error',
        description: 'Please select a project.',
        variant: 'destructive',
      });
      return;
    }

    if (parsedData.length === 0) {
      toast({
        title: 'Error',
        description: 'Please upload a valid CSV file.',
        variant: 'destructive',
      });
      return;
    }

    if (!problemDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a problem description.',
        variant: 'destructive',
      });
      return;
    }

    // Show summary dialog instead of directly uploading
    setShowSummary(true);
  };

  const handleConfirmUpload = () => {
    setIsUploading(true);
    try {
      const callsToAdd: Omit<CallData, 'id' | 'createdAt' | 'status'>[] = parsedData.map((call) => ({
        ...call,
        projectId: selectedProject,
      }));

      addCalls(callsToAdd, selectedProject);

      toast({
        title: 'Bulk Upload Successful',
        description: `${parsedData.length} call(s) have been added to the project.`,
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload calls. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setSelectedProject('');
    setProblemDescription('');
    setShowSummary(false);
    onOpenChange(false);
  };

  const isFormValid = selectedProject && parsedData.length > 0 && problemDescription.trim() && validationErrors.length === 0;

  return (
    <>
      <Dialog open={open && !showSummary} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Bulk CSV Upload</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Upload a CSV file to add multiple calls at once
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {vendorProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vendorProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No projects found. Create a project first.
                </p>
              )}
            </div>

            {/* CSV Upload Area */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload CSV File *</Label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parsedData.length} valid row(s) found
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV files only (multiple entries)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Required Columns Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-foreground text-sm">Required CSV Columns:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>• State Name</div>
                <div>• BRANCH NAME</div>
                <div>• branch catg.</div>
                <div>• Branch code</div>
                <div>• Complete Address</div>
                <div>• Pincode (6-digit)</div>
                <div>• Branch Contact Name</div>
                <div>• Branch Telephone Number</div>
                <div>• Assets Count</div>
                <div>• Support Type</div>
                <div>• Asset Type</div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="font-medium text-destructive text-sm">Validation Errors</p>
                </div>
                <ul className="text-xs text-destructive space-y-1 max-h-24 overflow-y-auto">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>... and {validationErrors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {parsedData.length > 0 && validationErrors.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="font-medium text-green-600 text-sm">
                    {parsedData.length} call(s) ready to upload
                  </p>
                </div>
              </div>
            )}

            {/* Problem Description */}
            <div className="space-y-2">
              <Label htmlFor="problemDescription" className="text-sm font-medium">Problem Description *</Label>
              <Textarea
                id="problemDescription"
                placeholder="Describe any issues or problems you are facing..."
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!isFormValid || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? 'Processing...' : 'Review Summary'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <UploadSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        uploadedData={parsedData}
        projectName={selectedProjectData?.name || ''}
        supportType={selectedProjectData?.supportType || ''}
        problemDescription={problemDescription}
        onNext={handleConfirmUpload}
      />
    </>
  );
};

export default BulkUploadDialog;
