import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVendor, RateCard } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  FolderPlus,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  MapPin,
  IndianRupee,
  FileText,
  Truck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Package,
  AlertCircle,
  Check,
  Pause,
} from 'lucide-react';

const supportTypes = [
  'pm activity',
  'breakfix',
  'on call',
] as const;

const supportTypeLabels: Record<string, string> = {
  'pm activity': 'PM Activity',
  'breakfix': 'Breakfix',
  'on call': 'On Call Support',
};

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  supportType: z.enum(supportTypes, { required_error: 'Please select a support type' }),
  l1SupportName: z.string().min(2, 'L1 support name is required'),
  l1SupportNumber: z.string().regex(/^\d{10}$/, 'Enter valid 10-digit phone number'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

// Backend CSV required columns
const REQUIRED_CSV_COLUMNS = [
  "State Name",
  "BRANCH NAME",
  "branch catg.",
  "Branch code",
  "Complete Address",
  "Pincode",
  "Branch Contact Name",
  "Branch Telephone Number",
  "Assets Count",
  "Support Type",
  "Asset Type"
];

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

interface LocationWithStatus extends ParsedCall {
  serviceable: boolean;
  reason?: string;
}

interface CreateProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadType = 'bulk' | 'single' | null;

// Mock serviceable pincodes
const serviceablePincodes = [
  '400050', '400051', '400052', '400053', '400054', '400055', '400056', '400057', '400058', '400059',
  '400060', '400061', '400062', '400063', '400064', '400065', '400066', '400067', '400068', '400069',
  '400070', '400071', '400072', '400073', '400074', '400075', '400076', '400077', '400078', '400079',
  '400080', '400081', '400082', '400083', '400084', '400085', '400086', '400087', '400088', '400089',
  '560001', '560002', '560003', '560004', '560005', '560008', '560010', '560011', '560017', '560018',
  '560025', '560029', '560030', '560034', '560038', '560041', '560043', '560047', '560048', '560050',
  '110001', '110002', '110003', '110005', '110006', '110007', '110008', '110009', '110010', '110011',
];

const nonServiceableReasons: Record<string, string> = {
  'remote': 'Remote location - No engineer coverage available',
  'restricted': 'Restricted zone - Special permits required',
  'discontinued': 'Service discontinued in this area',
  'capacity': 'Area at full capacity - No slots available',
};

const getServiceabilityStatus = (pincode: string): { serviceable: boolean; reason?: string } => {
  if (serviceablePincodes.includes(pincode)) {
    return { serviceable: true };
  }
  const reasons = Object.keys(nonServiceableReasons);
  const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
  return { serviceable: false, reason: nonServiceableReasons[randomReason] };
};

const CreateProjectWizard = ({ open, onOpenChange }: CreateProjectWizardProps) => {
  const { currentVendor, addProject, addCalls, rateCards } = useVendor();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1 data
  const [projectData, setProjectData] = useState<ProjectFormData | null>(null);
  
  // Step 2 data
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCall[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [problemDescription, setProblemDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step 3 data - validated locations
  const [locationAnalysis, setLocationAnalysis] = useState<LocationWithStatus[]>([]);
  
  // Step 5 data
  const [projectStatus, setProjectStatus] = useState<'approved' | 'on-hold' | null>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const steps = [
    { number: 1, title: 'Project Details' },
    { number: 2, title: 'Upload CSV' },
    { number: 3, title: 'Address Validation' },
    { number: 4, title: 'Cost Summary' },
    { number: 5, title: 'Approval' },
  ];

  const parseCSV = (text: string): { data: ParsedCall[]; errors: string[] } => {
    const lines = text.trim().split('\n');
    const data: ParsedCall[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push('CSV must contain at least a header row and one data row');
      return { data, errors };
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    
    // Check for required columns (case-insensitive)
    const headerLower = headers.map(h => h.toLowerCase());
    const missingColumns = REQUIRED_CSV_COLUMNS.filter(
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

  const handleStep1Submit = (data: ProjectFormData) => {
    setProjectData(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = () => {
    if (!uploadType) {
      toast({
        title: 'Error',
        description: 'Please select an upload type.',
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

    // Validate addresses and move to step 3
    const analysis = parsedData.map((location) => ({
      ...location,
      ...getServiceabilityStatus(location.pincode),
    }));
    setLocationAnalysis(analysis);
    setCurrentStep(3);
  };

  const serviceableLocations = locationAnalysis.filter((loc) => loc.serviceable);
  const nonServiceableLocations = locationAnalysis.filter((loc) => !loc.serviceable);

  const getApplicableRate = (): RateCard | undefined => {
    if (!projectData) return undefined;
    const rateMapping: Record<string, string> = {
      'breakfix': 'Standard Delivery',
      'pm activity': 'Bulk Shipment',
      'on call': 'Express Delivery',
    };
    const serviceType = rateMapping[projectData.supportType] || 'Standard Delivery';
    return rateCards.find((card) => card.serviceType === serviceType && card.isActive);
  };

  const applicableRate = getApplicableRate();

  const calculateLocationCost = (location: ParsedCall): number => {
    if (!applicableRate) return location.assetsCount * 100;
    const baseCost = applicableRate.baseRate;
    const estimatedKm = 10;
    const kmCost = applicableRate.perKmRate * estimatedKm;
    return baseCost + kmCost + (location.assetsCount * 100);
  };

  const totalServiceableValue = serviceableLocations.reduce(
    (sum, loc) => sum + calculateLocationCost(loc),
    0
  );

  const ratePerRecord = serviceableLocations.length > 0 
    ? Math.round(totalServiceableValue / serviceableLocations.length) 
    : 0;

  const handleFinalSubmit = () => {
    if (!projectData || !currentVendor || !projectStatus) return;

    setIsSubmitting(true);
    try {
      // Create project
      const newProject = addProject({
        vendorId: currentVendor.id,
        name: projectData.name,
        supportType: projectData.supportType,
        l1SupportName: projectData.l1SupportName,
        l1SupportNumber: projectData.l1SupportNumber,
        status: projectStatus === 'approved' ? 'active' : 'on-hold',
      });

      // Add serviceable calls to the project
      if (projectStatus === 'approved' && serviceableLocations.length > 0) {
        const callsToAdd = serviceableLocations.map((call) => ({
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
          projectId: newProject.id,
        }));
        addCalls(callsToAdd, newProject.id);
      }

      toast({
        title: projectStatus === 'approved' ? 'Project Approved' : 'Project On Hold',
        description: projectStatus === 'approved' 
          ? `Project "${projectData.name}" has been created with ${serviceableLocations.length} serviceable locations.`
          : `Project "${projectData.name}" has been placed on hold for review.`,
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setProjectData(null);
    setUploadType(null);
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setProblemDescription('');
    setLocationAnalysis([]);
    setProjectStatus(null);
    reset();
    onOpenChange(false);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStep2Valid = uploadType && parsedData.length > 0 && problemDescription.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[85vh] max-h-[85vh] flex flex-col p-0">
        <div className="p-4 sm:p-6 pb-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FolderPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-semibold">Create New Project</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  {steps[currentStep - 1].title} - Step {currentStep} of {steps.length}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-between px-0 sm:px-2 py-3 sm:py-4 border-b mt-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors',
                      currentStep > step.number
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.number
                        ? 'bg-primary text-primary-foreground ring-2 sm:ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1 text-muted-foreground hidden sm:block text-center max-w-[60px]">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-4 sm:w-8 md:w-16 mx-1 sm:mx-2',
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 sm:px-6">
          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <form onSubmit={handleSubmit(handleStep1Submit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Mumbai Metro Deliveries"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportType">Support Type *</Label>
                <Select
                  onValueChange={(value: typeof supportTypes[number]) => setValue('supportType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select support type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {supportTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {supportTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supportType && (
                  <p className="text-sm text-destructive">{errors.supportType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l1SupportName">L1 Support Name *</Label>
                <Input
                  id="l1SupportName"
                  placeholder="e.g., Amit Kumar"
                  {...register('l1SupportName')}
                />
                {errors.l1SupportName && (
                  <p className="text-sm text-destructive">{errors.l1SupportName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l1SupportNumber">L1 Support Number *</Label>
                <Input
                  id="l1SupportNumber"
                  placeholder="e.g., 9876543210"
                  {...register('l1SupportNumber')}
                />
                {errors.l1SupportNumber && (
                  <p className="text-sm text-destructive">{errors.l1SupportNumber.message}</p>
                )}
              </div>

            </form>
          )}

          {/* Step 2: Upload CSV */}
          {currentStep === 2 && (
            <div className="space-y-4 py-4">
              {/* Upload Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Upload Type *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/50',
                      uploadType === 'bulk' && 'border-primary ring-2 ring-primary/20'
                    )}
                    onClick={() => setUploadType('bulk')}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-primary" />
                      <span className="font-medium">Bulk CSV</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Upload multiple entries at once
                      </span>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/50',
                      uploadType === 'single' && 'border-primary ring-2 ring-primary/20'
                    )}
                    onClick={() => setUploadType('single')}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                      <span className="font-medium">Single CSV</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Upload a single entry file
                      </span>
                    </CardContent>
                  </Card>
                </div>
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
                        CSV files only
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Required Columns Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-foreground text-sm">Required CSV Columns:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• Customer Name</div>
                  <div>• Customer Phone</div>
                  <div>• Customer Address</div>
                  <div>• Pincode (6-digit)</div>
                  <div>• Order Amount (₹)</div>
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
                      {parsedData.length} record(s) ready for validation
                    </p>
                  </div>
                </div>
              )}

              {/* Problem Description */}
              <div className="space-y-2">
                <Label htmlFor="problemDescription" className="text-sm font-medium">Problem Description *</Label>
                <Textarea
                  id="problemDescription"
                  placeholder="Describe the project requirements or any issues..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Address Validation */}
          {currentStep === 3 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="pt-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{serviceableLocations.length}</p>
                    <p className="text-sm text-muted-foreground">Service Available</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="pt-4 text-center">
                    <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold text-destructive">{nonServiceableLocations.length}</p>
                    <p className="text-sm text-muted-foreground">Service Not Available</p>
                  </CardContent>
                </Card>
              </div>

              {/* Serviceable Locations */}
              {serviceableLocations.length > 0 && (
                <Card className="border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Serviceable Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {serviceableLocations.map((loc, idx) => (
                        <div key={idx} className="bg-green-500/5 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{loc.branchName}</p>
                            <p className="text-xs text-muted-foreground">{loc.address}</p>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600">{loc.pincode}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Non-Serviceable Locations */}
              {nonServiceableLocations.length > 0 && (
                <Card className="border-destructive/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Non-Serviceable Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {nonServiceableLocations.map((loc, idx) => (
                        <div key={idx} className="bg-destructive/5 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm">{loc.branchName}</p>
                            <Badge variant="destructive">{loc.pincode}</Badge>
                          </div>
                          <p className="text-xs text-destructive">{loc.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 4: Cost Summary */}
          {currentStep === 4 && (
            <div className="space-y-4 py-4">
              {/* Summary Card */}
              <Card className="bg-primary/5 border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    Cost Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-background rounded-lg">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">{serviceableLocations.length}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Records</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-background rounded-lg">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">₹{ratePerRecord}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Rate/Record</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-background rounded-lg">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">₹{totalServiceableValue.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Card Info */}
              {applicableRate && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Applied Rate Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Base Rate</p>
                        <p className="font-mono font-semibold text-xs sm:text-sm">₹{applicableRate.baseRate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Per KM Rate</p>
                        <p className="font-mono font-semibold text-xs sm:text-sm">₹{applicableRate.perKmRate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Urgent Multiplier</p>
                        <p className="font-mono font-semibold text-xs sm:text-sm">{applicableRate.urgentMultiplier}×</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Project Details Recap */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project Name</span>
                    <span className="font-medium">{projectData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Support Type</span>
                    <Badge variant="outline">{projectData?.supportType}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Problem Description</p>
                    <p className="text-sm bg-muted/50 rounded p-2">{problemDescription}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Vendor Approval */}
          {currentStep === 5 && (
            <div className="space-y-6 py-4">
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Project Submission</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Review complete. Choose to approve and submit this project, or place it on hold for further review.
                </p>
              </div>

              {/* Quick Summary */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground">Project</p>
                      <p className="font-medium truncate">{projectData?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Support Type</p>
                      <p className="font-medium">{projectData?.supportType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Serviceable Locations</p>
                      <p className="font-medium text-green-600">{serviceableLocations.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Value</p>
                      <p className="font-medium text-primary">₹{totalServiceableValue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:border-green-500/50',
                    projectStatus === 'approved' && 'border-green-500 ring-2 ring-green-500/20'
                  )}
                  onClick={() => setProjectStatus('approved')}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-600 text-sm sm:text-base">Accept</span>
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                      Approve and proceed
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:border-amber-500/50',
                    projectStatus === 'on-hold' && 'border-amber-500 ring-2 ring-amber-500/20'
                  )}
                  onClick={() => setProjectStatus('on-hold')}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    </div>
                    <span className="font-semibold text-amber-600 text-sm sm:text-base">Hold</span>
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                      Review or corrections
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Sticky Footer with Action Buttons */}
        <div className="p-4 sm:p-6 pt-4 border-t bg-background">
          {currentStep === 1 && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" form="step1-form" className="flex-1" onClick={handleSubmit(handleStep1Submit)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          {currentStep === 2 && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button className="flex-1" disabled={!isStep2Valid} onClick={handleStep2Submit}>
                Validate Addresses
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          {currentStep === 3 && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button className="flex-1" onClick={() => setCurrentStep(4)}>
                View Cost Summary
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          {currentStep === 4 && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button className="flex-1" onClick={() => setCurrentStep(5)}>
                Proceed to Approval
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          {currentStep === 5 && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                className="flex-1" 
                disabled={!projectStatus || isSubmitting}
                onClick={handleFinalSubmit}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Project'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectWizard;
