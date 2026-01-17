import { useState, useRef } from 'react';
import { useVendor } from '@/contexts/VendorContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, X } from 'lucide-react';

interface AddCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
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

const AddCallDialog = ({ open, onOpenChange, projectId }: AddCallDialogProps) => {
  const { addSingleCall } = useVendor();
  const [file, setFile] = useState<File | null>(null);
  const [parsedCalls, setParsedCalls] = useState<ParsedCall[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFile(null);
    setParsedCalls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSV = (text: string): ParsedCall[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const headerLower = headers.map(h => h.toLowerCase());
    
    // Check required columns
    const missing = REQUIRED_COLUMNS.filter(col => !headerLower.includes(col.toLowerCase()));
    if (missing.length > 0) {
      toast({
        title: 'Invalid CSV Format',
        description: `Missing columns: ${missing.join(', ')}`,
        variant: 'destructive',
      });
      return [];
    }

    const colIndex: Record<string, number> = {};
    headers.forEach((h, idx) => {
      colIndex[h.toLowerCase()] = idx;
    });

    const calls: ParsedCall[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < headers.length) continue;

      const getValue = (colName: string) => values[colIndex[colName.toLowerCase()]] || '';

      calls.push({
        stateName: getValue('State Name'),
        branchName: getValue('BRANCH NAME'),
        branchCategory: getValue('branch catg.'),
        branchCode: getValue('Branch code'),
        address: getValue('Complete Address'),
        pincode: getValue('Pincode'),
        contactName: getValue('Branch Contact Name'),
        contactPhone: getValue('Branch Telephone Number'),
        assetsCount: parseInt(getValue('Assets Count'), 10) || 0,
        supportType: getValue('Support Type').toLowerCase(),
        assetType: getValue('Asset Type'),
      });
    }
    
    return calls;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const calls = parseCSV(text);
      setParsedCalls(calls);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = () => {
    if (parsedCalls.length === 0) {
      toast({
        title: 'No Data',
        description: 'No valid call records found in the CSV file.',
        variant: 'destructive',
      });
      return;
    }

    parsedCalls.forEach((call) => {
      addSingleCall({
        projectId,
        stateName: call.stateName,
        branchName: call.branchName,
        branchCategory: call.branchCategory,
        branchCode: call.branchCode,
        address: call.address,
        pincode: call.pincode,
        contactName: call.contactName,
        contactPhone: call.contactPhone,
        assetsCount: call.assetsCount,
        supportType: call.supportType,
        assetType: call.assetType,
      });
    });

    toast({
      title: 'Calls Added',
      description: `${parsedCalls.length} call records have been added successfully.`,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const removeFile = () => {
    setFile(null);
    setParsedCalls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Call Records</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">
                Required: State Name, Branch Name, Address, Pincode, etc.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedCalls.length} records found
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {parsedCalls.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2">Branch</th>
                        <th className="text-left p-2">Contact</th>
                        <th className="text-left p-2">Pincode</th>
                        <th className="text-right p-2">Assets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedCalls.slice(0, 10).map((call, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 truncate max-w-[80px]">{call.branchName}</td>
                          <td className="p-2">{call.contactName}</td>
                          <td className="p-2">{call.pincode}</td>
                          <td className="p-2 text-right">{call.assetsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedCalls.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2 border-t">
                      +{parsedCalls.length - 10} more records
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={parsedCalls.length === 0}>
            Upload {parsedCalls.length > 0 && `(${parsedCalls.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCallDialog;
