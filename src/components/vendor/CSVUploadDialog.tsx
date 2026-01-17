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
import { useVendor, CallData } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadType: 'bulk' | 'single';
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

const CSVUploadDialog = ({ open, onOpenChange, uploadType }: CSVUploadDialogProps) => {
  const { currentVendor, projects, addCalls } = useVendor();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCall[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vendorProjects = projects.filter((p) => p.vendorId === currentVendor?.id);

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

    // Parse data rows
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
    if (!selectedProject || parsedData.length === 0) return;

    setIsUploading(true);
    try {
      const callsToAdd: Omit<CallData, 'id' | 'createdAt' | 'status'>[] = parsedData.map((call) => ({
        ...call,
        projectId: selectedProject,
      }));

      addCalls(callsToAdd, selectedProject);

      toast({
        title: 'Upload Successful',
        description: `${parsedData.length} call(s) have been added to the project.`,
      });

      // Reset state
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      setSelectedProject('');
      onOpenChange(false);
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {uploadType === 'bulk' ? 'Bulk Call Upload' : 'Single Call Upload'}
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file to add {uploadType === 'bulk' ? 'multiple calls' : 'a single call'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Select Project *</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Upload CSV File *</Label>
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
                <div className="flex items-center justify-center gap-2">
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
                    CSV files only
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CSV Format Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-foreground mb-1">Required CSV Columns:</p>
            <p className="text-muted-foreground text-xs">
              State Name, BRANCH NAME, branch catg., Branch code, Complete Address, Pincode, Branch Contact Name, Branch Telephone Number, Assets Count, Support Type, Asset Type
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
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

          {/* Success Preview */}
          {parsedData.length > 0 && validationErrors.length === 0 && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <p className="font-medium text-success text-sm">
                  {parsedData.length} call(s) ready to upload
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedProject || parsedData.length === 0 || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? 'Uploading...' : `Upload ${parsedData.length} Call(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVUploadDialog;
