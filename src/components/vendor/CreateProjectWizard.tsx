import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendor } from "@/contexts/VendorContext";
import { RateCard } from "@/types/vendor";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helper to safely format API errors for display
const formatError = (error: any): string => {
  if (!error) return "An unknown error occurred";
  if (typeof error === 'string') return error;

  if (Array.isArray(error)) {
    return error.map(err => err.msg || JSON.stringify(err)).join(', ');
  }

  if (typeof error === 'object') {
    if (error.detail) return formatError(error.detail);
    if (error.message) return error.message;
    return JSON.stringify(error);
  }

  return String(error);
};

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
  Loader2,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const supportTypes = ["pm activity", "breakfix", "on call"] as const;

const supportTypeLabels: Record<string, string> = {
  "pm activity": "PM Activity",
  breakfix: "Breakfix",
  "on call": "On Call Support",
};

const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  supportType: z.enum(supportTypes, {
    required_error: "Please select a support type",
  }),
  l1SupportName: z.string().min(2, "L1 support name is required"),
  l1SupportNumber: z
    .string()
    .regex(/^\d{10}$/, "Enter valid 10-digit phone number"),
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
  "Asset Type",
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

type UploadType = "bulk" | "single" | null;

const CreateProjectWizard = ({
  open,
  onOpenChange,
}: CreateProjectWizardProps) => {
  const {
    currentVendor,
    addProject,
    addCalls,
    rateCards,
    loadBackendProjects,
  } = useVendor();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAddresses, setIsValidatingAddresses] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // Step 1 data
  const [projectData, setProjectData] = useState<ProjectFormData | null>(null);

  // Step 2 data
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCall[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [problemDescription, setProblemDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SLA data - only priority is user-configurable, other values are hardcoded
  const [slaPriority, setSlaPriority] = useState<
    "HIGH" | "MEDIUM" | "LOW" | ""
  >("");

  // API project ID after creation
  const [apiProjectId, setApiProjectId] = useState<string | null>(null);

  // Step 3 data - validated locations
  const [locationAnalysis, setLocationAnalysis] = useState<
    LocationWithStatus[]
  >([]);
  const [validationSummary, setValidationSummary] = useState({
    serviceable: 0,
    unserviceable: 0,
    processing: 0,
    isProcessing: false
  });

  // Step 4 data - Cost from backend
  const [backendTotalCost, setBackendTotalCost] = useState<number | null>(null);
  const [isFetchingCost, setIsFetchingCost] = useState(false);

  // Step 5 data
  const [projectStatus, setProjectStatus] = useState<
    "approved" | "on-hold" | null
  >(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

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
    { number: 1, title: "Project Details" },
    { number: 2, title: "Upload CSV" },
    { number: 3, title: "Address Validation" },
    { number: 4, title: "Cost Summary" },
    { number: 5, title: "Approval" },
  ];

  const parseCSV = (text: string): { data: ParsedCall[]; errors: string[] } => {
    const lines = text.trim().split("\n");
    const data: ParsedCall[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      return { data, errors };
    }

    const headers = lines[0].split(",").map((h) => h.trim());

    // Build column index map
    const colIndex: Record<string, number> = {};
    headers.forEach((h, idx) => {
      colIndex[h.toLowerCase()] = idx;
    });

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      if (values.length === 0 || (values.length === 1 && values[0] === "")) {
        continue;
      }

      const getValue = (colName: string) =>
        values[colIndex[colName.toLowerCase()]] || "";

      const pincode = getValue("Pincode");
      const assetsCount = parseInt(getValue("Assets Count"), 10) || 0;

      data.push({
        stateName: getValue("State Name"),
        branchName: getValue("BRANCH NAME"),
        branchCategory: getValue("branch catg."),
        branchCode: getValue("Branch code"),
        address: getValue("Complete Address"),
        pincode: pincode,
        contactName: getValue("Branch Contact Name"),
        contactPhone: getValue("Branch Telephone Number"),
        assetsCount: assetsCount,
        supportType: getValue("Support Type").toLowerCase(),
        assetType: getValue("Asset Type"),
      });
    }

    return { data, errors };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file only.",
        variant: "destructive",
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

  const handleStep2Submit = async () => {
    if (!uploadType) {
      toast({
        title: "Error",
        description: "Please select an upload type.",
        variant: "destructive",
      });
      return;
    }

    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "Please upload a valid CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (!problemDescription.trim()) {
      toast({
        title: "Error",
        description: "Please provide a problem description.",
        variant: "destructive",
      });
      return;
    }

    if (!projectData || !file) return;

    setIsValidatingAddresses(true);

    try {
      // Step 1: Create project via API
      const projectApi = await import("@/services/projectApi");
      const {
        createProject,
        uploadCallsBulk,
        validateProjectAddresses,
        attachSlaToProject,
      } = projectApi;

      const projectResult = await createProject({
        project_name: projectData.name,
        support_type: projectData.supportType,
        l1_support_name: projectData.l1SupportName,
        l1_support_phone: projectData.l1SupportNumber,
      });

      if (projectResult.error || !projectResult.data?.project_id) {
        // API returned an error or missing project_id
        console.warn(
          "API project creation failed:",
          projectResult.error || "No project_id returned",
        );
        toast({
          title: "API Error",
          description: formatError(projectResult.error) || "Backend did not return project_id",
          variant: "destructive",
        });
        // Show error and stop - no fallback to mock data
        setIsValidatingAddresses(false);
        return;
      }

      // Project created successfully with project_id
      const projectId = projectResult.data.project_id;
      console.log("Project created with ID:", projectId);
      setApiProjectId(projectId);

      toast({
        title: "Project Created",
        description: "Attaching SLA configuration...",
      });

      // Step 2: Attach SLA to project with hardcoded values
      if (slaPriority) {
        const slaPayload = {
          priority: slaPriority,
          response_time_minutes: 800, // Hardcoded
          resolution_time_minutes: 1550, // Hardcoded
          breach_penalty: 600, // Hardcoded
          escalation_time_minutes: 750, // Hardcoded
          description: problemDescription || "Standard SLA",
        };
        console.log("Sending SLA payload:", slaPayload);

        const slaResult = await attachSlaToProject(projectId, slaPayload);
        if (slaResult.error) {
          console.warn("SLA attachment failed:", slaResult.error);
          toast({
            title: "Warning",
            description: "SLA attachment failed. Continuing...",
            variant: "destructive",
          });
        } else {
          console.log("SLA attached successfully");
        }
      }

      toast({
        title: "SLA Configured",
        description: "Uploading call records...",
      });

      // Step 3: Upload CSV calls
      const uploadResult = await uploadCallsBulk(file, projectId);
      if (uploadResult.error) {
        console.warn("CSV upload failed:", uploadResult.error);
        toast({
          title: "Warning",
          description: "CSV upload failed. Using local validation.",
          variant: "destructive",
        });
      }

      // Step 3: API Address Validation with Polling
      let pollingCount = 0;
      const MAX_POLLS = 12; // ~30 seconds total
      let validationResult;

      setValidationMessage("Initiating address validation...");

      while (pollingCount < MAX_POLLS) {
        validationResult = await validateProjectAddresses(projectId);

        if (validationResult.error) {
          throw new Error(validationResult.error);
        }

        const apiData = validationResult.data;
        if (!apiData) throw new Error("No validation data returned");

        // Update real-time summary even while processing
        setValidationSummary({
          serviceable: apiData.summary?.service_available || 0,
          unserviceable: apiData.summary?.service_not_available || 0,
          processing: apiData.summary?.processing_count || 0,
          isProcessing: apiData.is_processing
        });

        if (!apiData.is_processing) {
          // Task is finished!
          console.log("Validation complete:", apiData);

          const serviceableFromApi = (
            apiData["Service available locations"] || (apiData as any).serviceable_locations || (apiData as any).service_available_locations || []
          ).map((s: any) => ({
            stateName: s.state_name || "",
            branchName: s.branch_name || "",
            branchCategory: "",
            branchCode: s.branch_code || "",
            address: s.address || "",
            pincode: s.pincode || "",
            contactName: s.contact_name || "",
            contactPhone: s.contact_phone || "",
            assetsCount: s.assets_count || 0,
            supportType: s.support_type || "",
            assetType: s.asset_type || "",
            serviceable: true,
            reason: undefined,
          }));

          const nonServiceableFromApi = (
            apiData.non_serviceable_locations || []
          ).map((ns) => ({
            stateName: ns.state_name || "",
            branchName: ns.branch_name || "",
            branchCategory: "",
            branchCode: ns.branch_code || "",
            address: ns.address || "",
            pincode: ns.pincode || "",
            contactName: ns.contact_name || "",
            contactPhone: ns.contact_phone || "",
            assetsCount: ns.assets_count || 0,
            supportType: ns.support_type || "",
            assetType: ns.asset_type || "",
            serviceable: false,
            reason: ns.reason || "No engineer available in this area",
          }));

          setLocationAnalysis([...serviceableFromApi, ...nonServiceableFromApi]);
          setCurrentStep(3);
          return;
        }

        pollingCount++;
        setValidationMessage(`Validating addresses (${pollingCount}/${MAX_POLLS})...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // If we reached here, polling timed out
      setIsValidatingAddresses(false);
      setValidationMessage("Taking longer than expected...");
      toast({
        title: "Validation taking longer than expected",
        description:
          "The background task is still running. You can click 'Resume' below or check back later.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Address validation error:", error);
      toast({
        title: "Error",
        description: "Failed to validate addresses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingAddresses(false);
    }
  };

  const serviceableLocations = locationAnalysis.filter(
    (loc) => loc.serviceable,
  );
  const nonServiceableLocations = locationAnalysis.filter(
    (loc) => !loc.serviceable,
  );

  const getApplicableRate = (): RateCard | undefined => {
    if (!projectData) return undefined;

    // VendorContext standardized support_type, so we search directly
    const targetType = projectData.supportType.toLowerCase();

    // Find the prioritized rate (Vendor-specific if exists, else Global Default)
    // The fetchMyRateCards call already returns prioritized results, so we just find by type.
    return rateCards.find(
      (card) => card.support_type.toLowerCase() === targetType
    );
  };

  const applicableRate = getApplicableRate();

  const calculateLocationCost = (location: ParsedCall): number => {
    if (!applicableRate) return location.assetsCount * 100; // Fallback

    const baseCost = applicableRate.base_price;
    const assetsCost = location.assetsCount * applicableRate.per_asset_price;

    // Use multiplier based on priority
    let multiplier = 1.0;
    if (slaPriority === "HIGH") multiplier = applicableRate.sla_multipliers?.urgent || 1.5;
    else if (slaPriority === "MEDIUM") multiplier = applicableRate.sla_multipliers?.express || 1.25;

    return (baseCost + assetsCost) * multiplier;
  };

  const totalServiceableValue = serviceableLocations.reduce(
    (sum, loc) => sum + calculateLocationCost(loc),
    0,
  );

  const ratePerRecord =
    serviceableLocations.length > 0
      ? Math.round(totalServiceableValue / serviceableLocations.length)
      : 0;

  // Fetch cost summary from backend when entering Step 4
  const handleGoToStep4 = async () => {
    if (!apiProjectId) {
      // No API project, use local calculation
      setCurrentStep(4);
      return;
    }

    setIsFetchingCost(true);
    try {
      const projectApi = await import("@/services/projectApi");
      const { getProjectCostSummary } = projectApi;

      const result = await getProjectCostSummary(apiProjectId);
      if (result.error) {
        console.warn("Failed to fetch cost summary:", result.error);
        toast({
          title: "Warning",
          description:
            "Could not fetch cost from server. Using local calculation.",
          variant: "destructive",
        });
      } else if (result.data) {
        setBackendTotalCost(result.data.total_cost);
      }
    } catch (error) {
      console.error("Cost summary error:", error);
    } finally {
      setIsFetchingCost(false);
      setCurrentStep(4);
    }
  };

  const handleFinalSubmit = async () => {
    if (!projectData || !currentVendor || !projectStatus) return;

    // If Hold selected, just close without API call
    if (projectStatus === "on-hold") {
      toast({
        title: "Project On Hold",
        description: `Project "${projectData.name}" has been placed on hold for review.`,
      });
      handleClose();
      return;
    }

    // If Accept selected, show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmActivation = async () => {
    if (!projectData || !apiProjectId) return;

    setShowConfirmDialog(false);
    setIsActivating(true);

    try {
      const projectApi = await import("@/services/projectApi");
      const { activateProject } = projectApi;

      const result = await activateProject(apiProjectId);

      if (result.error) {
        toast({
          title: "Activation Failed",
          description: result.error,
          variant: "destructive",
        });
        setIsActivating(false);
        return;
      }

      toast({
        title: "Project Activated",
        description: result.data?.message || `Project "${projectData.name}" has been approved and activated successfully! Engineer dispatching has started.`,
      });

      // Refresh project list
      loadBackendProjects?.();

      handleClose();
    } catch (error) {
      console.error("Activation error:", error);
      toast({
        title: "Error",
        description: "Failed to activate project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setProjectData(null);
    setUploadType(null);
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setProblemDescription("");
    setSlaPriority("");
    setLocationAnalysis([]);
    setProjectStatus(null);
    setApiProjectId(null);
    setIsValidatingAddresses(false);
    setBackendTotalCost(null);
    setIsFetchingCost(false);
    setShowConfirmDialog(false);
    setIsActivating(false);
    reset();
    onOpenChange(false);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStep2Valid =
    uploadType &&
    parsedData.length > 0 &&
    problemDescription.trim() &&
    slaPriority;

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
                <DialogTitle className="text-lg sm:text-xl font-semibold">
                  Create New Project
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  {steps[currentStep - 1].title} - Step {currentStep} of{" "}
                  {steps.length}
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
                      "h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors",
                      currentStep > step.number
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.number
                          ? "bg-primary text-primary-foreground ring-2 sm:ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground",
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
                      "h-0.5 w-4 sm:w-8 md:w-16 mx-1 sm:mx-2",
                      currentStep > step.number ? "bg-primary" : "bg-muted",
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
            <form
              onSubmit={handleSubmit(handleStep1Submit)}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Mumbai Metro Deliveries"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportType">Support Type *</Label>
                <Select
                  onValueChange={(value: (typeof supportTypes)[number]) =>
                    setValue("supportType", value)
                  }
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
                  <p className="text-sm text-destructive">
                    {errors.supportType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l1SupportName">L1 Support Name *</Label>
                <Input
                  id="l1SupportName"
                  placeholder="e.g., Amit Kumar"
                  {...register("l1SupportName")}
                />
                {errors.l1SupportName && (
                  <p className="text-sm text-destructive">
                    {errors.l1SupportName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l1SupportNumber">L1 Support Number *</Label>
                <Input
                  id="l1SupportNumber"
                  placeholder="e.g., 9876543210"
                  {...register("l1SupportNumber")}
                />
                {errors.l1SupportNumber && (
                  <p className="text-sm text-destructive">
                    {errors.l1SupportNumber.message}
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Step 2: Upload CSV */}
          {currentStep === 2 && (
            <div className="space-y-4 py-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href =
                    "/templates/branch_assets_template_fixed_pincode.csv";
                  link.download = "branch_assets_template.csv";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              {/* Upload Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select Upload Type *
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      uploadType === "bulk" &&
                      "border-primary ring-2 ring-primary/20",
                    )}
                    onClick={() => setUploadType("bulk")}
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
                      "cursor-pointer transition-all hover:border-primary/50",
                      uploadType === "single" &&
                      "border-primary ring-2 ring-primary/20",
                    )}
                    onClick={() => setUploadType("single")}
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
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    file
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
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
                        <p className="font-medium text-foreground">
                          {file.name}
                        </p>
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
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground text-sm">
                    Required CSV Columns:
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• Customer Name</div>
                  <div>• Customer Phone</div>
                  <div>• Customer Address</div>
                  <div>• Pincode (6-digit)</div>
                  <div>• Order Amount (₹)</div>
                </div>
              </div>

              {/* Success Message */}
              {parsedData.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-green-600 text-sm">
                      {parsedData.length} record(s) ready for validation
                    </p>
                  </div>
                </div>
              )}

              {/* SLA Configuration Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  SLA Configuration *
                </Label>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="slaPriority"
                        className="text-xs text-muted-foreground"
                      >
                        Priority Level
                      </Label>
                      <Select
                        value={slaPriority}
                        onValueChange={(value: "HIGH" | "MEDIUM" | "LOW") =>
                          setSlaPriority(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          <SelectItem value="HIGH">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              High
                            </span>
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              Medium
                            </span>
                          </SelectItem>
                          <SelectItem value="LOW">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              Low
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select the priority level for this project. Higher
                      priority calls are processed first.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Problem Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="problemDescription"
                  className="text-sm font-medium"
                >
                  Problem Description *
                </Label>
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
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-1">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {validationSummary.serviceable || serviceableLocations.length}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Serviceable
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-500">
                    {validationSummary.unserviceable || nonServiceableLocations.length}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Unserviceable
                  </p>
                </div>

                <div className={cn(
                  "border rounded-lg p-4 text-center transition-colors",
                  validationSummary.isProcessing
                    ? "bg-blue-50 border-blue-200 animate-pulse"
                    : "bg-muted/30 border-muted"
                )}>
                  <div className="flex justify-center mb-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      validationSummary.isProcessing ? "bg-blue-100" : "bg-muted"
                    )}>
                      {validationSummary.isProcessing ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    validationSummary.isProcessing ? "text-blue-600" : "text-muted-foreground"
                  )}>
                    {validationSummary.processing}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Processing
                  </p>
                </div>
              </div>

              {validationSummary.isProcessing && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-xs text-primary font-medium">
                    Geocoding in progress... Some locations are still being validated by our engine.
                  </p>
                </div>
              )}

              {/* Serviceable Locations */}
              {serviceableLocations.length > 0 && (
                <Card className="border-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Serviceable Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {serviceableLocations.map((loc, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-2 border-b border-muted last:border-0"
                        >
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {loc.branchName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {loc.address}
                            </p>
                          </div>
                          <span className="px-3 py-1 text-sm font-medium text-primary border border-primary rounded-full">
                            {loc.pincode}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Non-Serviceable Locations */}
              {nonServiceableLocations.length > 0 && (
                <Card className="border-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-red-500">
                      <XCircle className="h-4 w-4" />
                      Non-Serviceable Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {nonServiceableLocations.map((loc, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start py-2 border-b border-muted last:border-0"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="font-medium text-sm text-foreground">
                              {loc.branchName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {loc.address}
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              {loc.reason}
                            </p>
                          </div>
                          <span className="px-3 py-1 text-sm font-medium text-red-500 border border-red-300 rounded-full whitespace-nowrap flex-shrink-0">
                            {loc.pincode}
                          </span>
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
              {/* Loading State */}
              {isFetchingCost && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">
                    Fetching cost summary...
                  </span>
                </div>
              )}

              {/* Summary Card */}
              {!isFetchingCost && (
                <>
                  <Card className="bg-primary/5 border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        Cost Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-background rounded-lg">
                          <p className="text-2xl sm:text-3xl font-bold text-primary">
                            {validationSummary.serviceable || serviceableLocations.length}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Serviceable Locations
                          </p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-background rounded-lg border-2 border-primary/30">
                          <p className="text-2xl sm:text-3xl font-bold text-primary">
                            ₹
                            {(
                              backendTotalCost ?? totalServiceableValue
                            ).toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Total Value
                          </p>
                          {backendTotalCost !== null && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              (from server)
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                        <span className="text-muted-foreground">
                          Project Name
                        </span>
                        <span className="font-medium">{projectData?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Support Type
                        </span>
                        <Badge variant="outline">
                          {projectData?.supportType}
                        </Badge>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">
                          Problem Description
                        </p>
                        <p className="text-sm bg-muted/50 rounded p-2">
                          {problemDescription}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Read-only notice */}
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      This is a read-only summary. Proceed to approval to
                      finalize.
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Vendor Approval */}
          {currentStep === 5 && (
            <div className="space-y-6 py-4">
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Project Submission
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Review complete. Choose to approve and submit this project, or
                  place it on hold for further review.
                </p>
              </div>

              {/* Quick Summary */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground">Project</p>
                      <p className="font-medium truncate">
                        {projectData?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Support Type</p>
                      <p className="font-medium">{projectData?.supportType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Serviceable Locations
                      </p>
                      <p className="font-medium text-green-600">
                        {validationSummary.serviceable || serviceableLocations.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Value</p>
                      <p className="font-medium text-primary">
                        ₹
                        {(
                          backendTotalCost ?? totalServiceableValue
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:border-green-500/50",
                    projectStatus === "approved" &&
                    "border-green-500 ring-2 ring-green-500/20",
                  )}
                  onClick={() => setProjectStatus("approved")}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-600 text-sm sm:text-base">
                      Accept
                    </span>
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                      Approve and proceed
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:border-amber-500/50",
                    projectStatus === "on-hold" &&
                    "border-amber-500 ring-2 ring-amber-500/20",
                  )}
                  onClick={() => setProjectStatus("on-hold")}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    </div>
                    <span className="font-semibold text-amber-600 text-sm sm:text-base">
                      Hold
                    </span>
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
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="step1-form"
                className="flex-1"
                onClick={handleSubmit(handleStep1Submit)}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={goBack}
                  disabled={isValidatingAddresses}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!isStep2Valid || isValidatingAddresses}
                  onClick={handleStep2Submit}
                >
                  {isValidatingAddresses ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {validationMessage || "Validating..."}
                    </>
                  ) : validationMessage === "Taking longer than expected..." ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resume Validation
                    </>
                  ) : (
                    <>
                      Validate Addresses
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              {isValidatingAddresses && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex flex-col items-center gap-3 animate-pulse">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <p className="text-sm font-medium text-primary">
                    {validationMessage || "Processing addresses..."}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Geocoding and mapping locations against available engineer
                    coverage. This may take a few moments.
                  </p>
                </div>
              )}
            </div>
          )}
          {currentStep === 3 && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleGoToStep4}
                disabled={isFetchingCost}
              >
                {isFetchingCost ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    View Cost Summary
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
          {currentStep === 4 && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={goBack}
              >
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
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={goBack}
                disabled={isActivating}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!projectStatus || isActivating}
                onClick={handleFinalSubmit}
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  "Submit Project"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Confirmation Dialog for Activation */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Project Activation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to activate this project? This will start the
                matching process to assign engineers to your calls.
                <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Project:</span>
                    <span className="font-medium">{projectData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium text-primary">
                      ₹
                      {(
                        backendTotalCost ?? totalServiceableValue
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActivating}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmActivation}
                disabled={isActivating}
                className="bg-primary"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  "Activate & Dispatch"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectWizard;
