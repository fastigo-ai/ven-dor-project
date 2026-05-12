import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  holdCall,
  resumeCall,
  pauseProject,
  resumeProject,
  resumeProjectProcessing,
  activateProject,
  ProjectCallRow,
} from '@/services/projectApi';
import { getDraftProjectStep } from '@/utils/projectStatus';
import { fetchProjectBillingSummary, ProjectBillingSummary } from '@/services/billingApi';
import {
  ArrowLeft,
  FolderKanban,
  Phone,
  User,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  FileText,
  Activity,
  AlertTriangle,
  Wrench,
  Hash,
  Pause,
  Play,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Image as ImageIcon,
  ExternalLink,
  Search,
  Download,
  AlertCircle,
  Package,
  Upload,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success border-success/30',
  APPROVED: 'bg-success/10 text-success border-success/30',
  COMPLETED: 'bg-primary/10 text-primary border-primary/30',
  'ON-HOLD': 'bg-warning/10 text-warning border-warning/30',
  HOLD: 'bg-warning/10 text-warning border-warning/30',
  PAUSED: 'bg-warning/10 text-warning border-warning/30',
  PENDING: 'bg-muted text-muted-foreground border-muted',
  DRAFT: 'bg-muted text-muted-foreground border-muted',
  DISPATCHED: 'bg-primary/10 text-primary border-primary/30',
  ASSIGNED: 'bg-success/10 text-success border-success/30',
};

const callStatusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  pending: 'bg-muted text-muted-foreground border-muted',
  completed: 'bg-primary/10 text-primary border-primary/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  hold: 'bg-warning/10 text-warning border-warning/30',
  dispatched: 'bg-primary/10 text-primary border-primary/30',
  assigned: 'bg-success/10 text-success border-success/30',
};

const callStatusIcons: Record<string, React.ReactNode> = {
  active: <Activity className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  hold: <Pause className="h-3 w-3" />,
  dispatched: <Activity className="h-3 w-3" />,
  assigned: <User className="h-3 w-3" />,
};

const supportTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  'pm activity': { label: 'PM Activity', icon: <Wrench className="h-4 w-4" /> },
  'breakfix': { label: 'Breakfix', icon: <AlertTriangle className="h-4 w-4" /> },
  'on call': { label: 'On Call', icon: <Phone className="h-4 w-4" /> },
  'PM ACTIVITY': { label: 'PM Activity', icon: <Wrench className="h-4 w-4" /> },
  'BREAKFIX': { label: 'Breakfix', icon: <AlertTriangle className="h-4 w-4" /> },
  'ON CALL': { label: 'On Call', icon: <Phone className="h-4 w-4" /> },
};

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    loadProjectDetails,
    selectedProjectDetails,
    selectedProjectLoading,
    selectedProjectError,
    backendProjects,
    loadBackendProjects,
    clearSelectedProject
  } = useVendor();

  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'pause' | 'resume' | 'holdCall' | 'resumeCall' | 'activate';
    callId?: string;
  }>({ open: false, type: 'pause' });

  const [financials, setFinancials] = useState<ProjectBillingSummary | null>(null);
  const [financialsLoading, setFinancialsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Setup Flow States
  const [locationAnalysis, setLocationAnalysis] = useState<any[]>([]);
  const [isValidatingAddresses, setIsValidatingAddresses] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [validationSummary, setValidationSummary] = useState({
    serviceable: 0,
    unserviceable: 0,
    processing: 0,
    isProcessing: false
  });
  const [backendTotalCost, setBackendTotalCost] = useState<number | null>(null);
  const [isFetchingCost, setIsFetchingCost] = useState(false);
  const [activeSetupStep, setActiveSetupStep] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find project from list for basic info
  const project = backendProjects.find(p => p.id === projectId);
  const details = selectedProjectDetails;

  const status = (project?.status?.toUpperCase() || details?.project?.status?.toUpperCase() || 'DRAFT');

  // Helper to extract and deduplicate all images from a call
  const getAllProofImages = (call: ProjectCallRow) => {
    const images: string[] = [];
    if (call.proof_images && Array.isArray(call.proof_images)) {
      images.push(...call.proof_images);
    }
    // Check old/alternative fields
    const altImg = (call as any).image_url || (call as any).thumbnail;
    if (altImg && typeof altImg === 'string' && !images.includes(altImg)) {
      images.push(altImg);
    }
    // Filter out empties and duplicates
    return Array.from(new Set(images.filter(Boolean)));
  };

  useEffect(() => {
    if (projectId) {
      loadProjectDetails(projectId);
      loadFinancials();

      const checkDraftStatus = async () => {
        // Guard against undefined project data initially
        if (!project && !details?.project) return;

        const stepInfo = getDraftProjectStep(project || (details?.project as any));
        if (status === 'DRAFT') {
          if (!activeSetupStep) {
            setActiveSetupStep(stepInfo.step);
          }

          if (stepInfo.step >= 3) {
            checkAndResumeValidation();
          }
          if (stepInfo.step === 4 || activeSetupStep === 4) {
            fetchCostSummary();
          }
        }
      };
      checkDraftStatus();
    }
  }, [projectId, status]);

  const checkAndResumeValidation = async () => {
    if (!projectId) return;

    try {
      const stepInfo = getDraftProjectStep(project || (details?.project as any));

      // If we are in or past validation, fetch latest results
      if (stepInfo.step >= 3) {
        const { validateProjectAddresses } = await import("@/services/projectApi");
        const result = await validateProjectAddresses(projectId);

        if (result.data) {
          const apiData = result.data;
          setValidationSummary({
            serviceable: apiData.summary?.service_available || 0,
            unserviceable: apiData.summary?.service_not_available || 0,
            processing: apiData.summary?.processing_count || 0,
            isProcessing: apiData.is_processing
          });

          // If still processing, start polling
          if (apiData.is_processing) {
            startPollingValidation();
          } else {
            // Processing complete, format results for table
            formatValidationResults(apiData);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to check validation status:", error);
    }
  };

  const startPollingValidation = async () => {
    if (!projectId || isValidatingAddresses) return;

    setIsValidatingAddresses(true);
    setValidationMessage("Checking validation progress...");

    try {
      const { validateProjectAddresses } = await import("@/services/projectApi");
      let pollingCount = 0;
      const MAX_POLLS = 30; // ~60 seconds total

      while (pollingCount < MAX_POLLS) {
        const result = await validateProjectAddresses(projectId);
        if (result.error) throw new Error(result.error);

        const apiData = result.data;
        if (!apiData) break;

        setValidationSummary({
          serviceable: apiData.summary?.service_available || 0,
          unserviceable: apiData.summary?.service_not_available || 0,
          processing: apiData.summary?.processing_count || 0,
          isProcessing: apiData.is_processing
        });

        if (!apiData.is_processing) {
          formatValidationResults(apiData);
          toast({ title: "Validation Complete", description: "Your addresses have been verified." });
          loadProjectDetails(projectId); // Refresh project info
          break;
        }

        pollingCount++;
        setValidationMessage(`Validating addresses (${pollingCount}/${MAX_POLLS})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Polling error:", error);
    } finally {
      setIsValidatingAddresses(false);
    }
  };

  const formatValidationResults = (apiData: any) => {
    const serviceable = (apiData["Service available locations"] || (apiData as any).serviceable_locations || (apiData as any).service_available_locations || []).map((s: any) => ({ ...s, serviceable: true }));
    const nonServiceable = (apiData.non_serviceable_locations || []).map((ns: any) => ({ ...ns, serviceable: false }));
    setLocationAnalysis([...serviceable, ...nonServiceable]);
  };

  const loadFinancials = async () => {
    if (!projectId) return;
    setFinancialsLoading(true);
    const result = await fetchProjectBillingSummary(projectId);
    if (result.data) {
      setFinancials(result.data);
    }
    setFinancialsLoading(false);
  };

  const handleResumeEnrichment = async () => {
    if (!projectId) return;

    // Check if we are in Step 4 (Activation)
    const stepInfo = getDraftProjectStep(project || (details?.project as any));
    if (stepInfo.step === 4) {
      setConfirmDialog({ open: true, type: 'activate' });
      return;
    }

    if (stepInfo.step === 2) {
      // If in Step 2, just trigger file input
      fileInputRef.current?.click();
      return;
    }

    if (stepInfo.step === 3) {
      // If in Step 3, start/resume polling
      startPollingValidation();
      return;
    }

    setActionLoading('resume-processing');
    const { resumeProjectProcessing } = await import("@/services/projectApi");
    const result = await resumeProjectProcessing(projectId);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Validation resumed successfully.',
      });
      loadProjectDetails(projectId);
    }
    setActionLoading(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setActionLoading('resume-processing');
    try {
      const { uploadCallsBulk, attachSlaToProject } = await import("@/services/projectApi");

      // 1. Attach a default SLA (Required by backend usually)
      toast({ title: "Configuring", description: "Attaching standard SLA..." });
      await attachSlaToProject(projectId, {
        priority: 'MEDIUM',
        response_time_minutes: 800,
        resolution_time_minutes: 1550,
        breach_penalty: 600,
        escalation_time_minutes: 750,
        description: "Resumed from dashboard"
      });

      // 2. Upload CSV
      toast({ title: "Uploading", description: "Uploading call records..." });
      const result = await uploadCallsBulk(file, projectId);

      if (result.error) {
        toast({ title: "Upload Failed", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Upload Success", description: "Wait for validation to start..." });
        setActiveSetupStep(3);
        await startPollingValidation();
        loadProjectDetails(projectId);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to fetch cost summary
  const fetchCostSummary = async () => {
    if (!projectId) return;
    setIsFetchingCost(true);
    try {
      const { getProjectCostSummary } = await import("@/services/projectApi");
      const result = await getProjectCostSummary(projectId);
      if (result.data) {
        setBackendTotalCost(result.data.total_cost);
      }
    } catch (error) {
      console.error("Cost fetch error:", error);
    } finally {
      setIsFetchingCost(false);
      setActiveSetupStep(4);
    }
  };

  // Handle actual activation
  const handleActivateProject = async () => {
    if (!projectId) return;

    setConfirmDialog({ open: false, type: 'activate' });
    setActionLoading('resume-processing');

    try {
      const result = await activateProject(projectId);
      if (result.error) {
        toast({
          title: 'Activation Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Project Activated',
          description: result.data?.message || 'Your project has been activated and engineer dispatching has started.',
        });
        loadProjectDetails(projectId);
        loadBackendProjects();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate project',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const supportTypeKey = (project?.support_type?.toLowerCase() || details?.project?.support_type?.toLowerCase() || 'breakfix');
  const supportTypeInfo = supportTypeLabels[supportTypeKey] || { label: 'Support', icon: <Briefcase className="h-4 w-4" /> };

  const summary = details?.summary;
  const calls = details?.calls || [];

  const isProjectPaused = status === 'PAUSED' || status === 'ON-HOLD' || status === 'HOLD';
  const isProjectHeldByAdmin = details?.project?.held_by === 'admin';

  // Handle pause/resume project
  const handleProjectPauseResume = async () => {
    if (!projectId) return;

    setActionLoading('project');
    try {
      const result = isProjectPaused
        ? await resumeProject(projectId)
        : await pauseProject(projectId);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: result.data?.message || (isProjectPaused ? 'Project resumed successfully' : 'Project paused successfully'),
        });
        // Reload project details
        loadProjectDetails(projectId);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, type: 'pause' });
    }
  };

  // Handle hold/resume call
  const handleCallHoldResume = async (callId: string, isOnHold: boolean) => {
    if (!projectId) return;

    setActionLoading(callId);
    try {
      const result = isOnHold
        ? await resumeCall(projectId, callId)
        : await holdCall(projectId, callId);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: result.data?.message || (isOnHold ? 'Call resumed successfully' : 'Call put on hold'),
        });
        // Reload project details
        loadProjectDetails(projectId);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update call status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, type: 'holdCall' });
    }
  };

  const canHoldCall = (call: ProjectCallRow) => {
    const s = call.status?.toUpperCase();
    return s === 'PENDING' || s === 'DISPATCHED' || s === 'ASSIGNED';
  };

  const isCallOnHold = (call: ProjectCallRow) => {
    return call.status?.toUpperCase() === 'HOLD';
  };

  const isCallHeldByAdmin = (call: ProjectCallRow) => {
    return call.held_by === 'admin';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/projects')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loading State */}
        {selectedProjectLoading && !project ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : selectedProjectError ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <p className="text-destructive">{selectedProjectError}</p>
              <Button variant="outline" onClick={() => navigate('/projects')} className="mt-4">
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Project Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow shrink-0">
                    <FolderKanban className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                        {project?.projectName || details?.project?.project_name || 'Project Details'}
                      </h1>
                      <Badge variant="outline" className={cn(statusColors[status] || statusColors.DRAFT, "font-bold px-3 py-1 shadow-sm")}>
                        {status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {supportTypeInfo.label}</span>
                      <span className="flex items-center gap-1.5 font-mono"><Hash className="h-4 w-4" /> {projectId?.slice(-8)}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {status === 'DRAFT' && (project || details?.project) && (() => {
                    const stepInfo = getDraftProjectStep(project || (details?.project as any));
                    return (
                      <Button
                        onClick={handleResumeEnrichment}
                        disabled={actionLoading === 'resume-processing'}
                        className="gradient-primary shadow-glow group px-6"
                      >
                        {actionLoading === 'resume-processing' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                        )}
                        {stepInfo.nextAction}
                      </Button>
                    );
                  })()}

                  {status !== 'DRAFT' && status !== 'COMPLETED' && (
                    <Button
                      variant={isProjectPaused ? 'default' : 'outline'}
                      onClick={() => setConfirmDialog({
                        open: true,
                        type: isProjectPaused ? 'resume' : 'pause'
                      })}
                      disabled={actionLoading === 'project' || (isProjectPaused && isProjectHeldByAdmin)}
                      className={cn("gap-2", isProjectPaused ? 'bg-success hover:bg-success/90' : 'border-warning text-warning hover:bg-warning/10')}
                    >
                      {actionLoading === 'project' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isProjectPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                      {isProjectPaused && isProjectHeldByAdmin ? 'Paused by Admin' : isProjectPaused ? 'Resume Project' : 'Pause Project'}
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => navigate('/projects')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>
            </div>

            {/* Step Progress Tracker for Draft Projects */}
            {status === 'DRAFT' && (() => {
              const stepInfoFromProject = getDraftProjectStep(project || (details?.project as any));
              const currentDisplayStep = activeSetupStep || stepInfoFromProject.step;

              // Use the step info from the logic but override the step number for display
              const stepInfo = {
                ...stepInfoFromProject,
                step: currentDisplayStep
              };

              return (
                <Card className="p-6 bg-muted/20 border-border/40 shadow-sm animate-in slide-in-from-top duration-500 overflow-hidden relative mb-8">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <TrendingUp className="h-24 w-24" />
                  </div>
                  <div className="flex items-center justify-between mb-6 relative">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <Activity className="h-5 w-5 text-primary" />
                        Setup Progress: {stepInfo.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">{stepInfo.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-mono">Step {stepInfo.step} of 4</Badge>
                    </div>
                  </div>

                  <div className="relative pt-2 pb-8 px-2">
                    <div className="absolute top-[21px] left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000 shadow-glow"
                        style={{ width: `${Math.max(0, Math.min(100, ((stepInfo.step - 1) / 3) * 100))}%` }}
                      />
                    </div>
                    <div className="relative flex justify-between">
                      {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex flex-col items-center gap-2">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 z-10",
                              s < stepInfo.step ? "bg-primary text-primary-foreground shadow-glow" :
                                s === stepInfo.step ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-glow animate-pulse-subtle" :
                                  "bg-muted text-muted-foreground border-2 border-transparent"
                            )}
                          >
                            {s < stepInfo.step ? <CheckCircle className="h-5 w-5" /> : s}
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            s <= stepInfo.step ? "text-primary" : "text-muted-foreground"
                          )}>
                            {['Setup', 'Upload', 'Validation', 'Activate'][s - 1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })()}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv"
            />

            {/* Step Components for DRAFT status */}
            {(() => {
              if (status !== 'DRAFT') return null;
              const projectData = project || details?.project;
              if (!projectData) return <div className="p-8 text-center text-muted-foreground">Loading setup step...</div>;

              const stepInfoFromProject = getDraftProjectStep(projectData as any);
              const currentDisplayStep = activeSetupStep || stepInfoFromProject.step;

              return (
                <div className="space-y-6">
                  {/* Step 2: Upload CSV */}
                  {currentDisplayStep === 2 && (
                    <Card className="border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                      <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Upload your branch list</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          Please upload a CSV file with your location details to start the serviceability check.
                        </p>
                        <Button className="gradient-primary px-8">
                          Select CSV File
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Validation Progress & Results */}
                  {currentDisplayStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-success/5 border-success/20">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-full bg-success/20 text-success">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs uppercase font-bold text-muted-foreground">Serviceable</p>
                              <p className="text-2xl font-bold text-success">{validationSummary.serviceable}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-destructive/5 border-destructive/20">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-full bg-destructive/20 text-destructive">
                              <XCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs uppercase font-bold text-muted-foreground">Unserviceable</p>
                              <p className="text-2xl font-bold text-destructive">{validationSummary.unserviceable}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className={cn(validationSummary.isProcessing ? "bg-primary/5 border-primary/20 animate-pulse" : "bg-muted/50 border-border")}>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-full bg-primary/20 text-primary">
                              {validationSummary.isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-xs uppercase font-bold text-muted-foreground">Processing</p>
                              <p className="text-2xl font-bold">{validationSummary.processing}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {locationAnalysis.length > 0 && (
                        <Card className="shadow-smooth overflow-hidden">
                          <CardHeader className="bg-muted/30 border-b pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Validation Results
                              </CardTitle>
                              {!validationSummary.isProcessing && (
                                <Button size="sm" onClick={() => loadProjectDetails(projectId)} variant="ghost" className="h-8 gap-1">
                                  <RefreshCw className="h-3 w-3" /> Refresh
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <ScrollArea className="h-[400px]">
                              <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 bg-background z-10">
                                  <TableRow>
                                    <TableHead className="w-[200px]">Branch</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {locationAnalysis.map((loc, i) => (
                                    <TableRow key={i}>
                                      <TableCell className="font-medium text-xs">{loc.branch_name}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{loc.address}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className={cn(
                                          "text-[10px] font-bold",
                                          loc.serviceable ? "bg-success/5 text-success border-success/20" : "bg-destructive/5 text-destructive border-destructive/20"
                                        )}>
                                          {loc.serviceable ? "SERVICEABLE" : "UNSERVICEABLE"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </CardContent>
                          {!validationSummary.isProcessing && validationSummary.serviceable > 0 && (
                            <div className="p-4 border-t bg-muted/5 flex justify-end">
                              <Button onClick={fetchCostSummary} className="gradient-primary px-10">
                                Proceed to Review <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          )}
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Step 4: Final Review & Activation */}
                  {currentDisplayStep === 4 && (
                    <Card className="overflow-hidden border-2 border-primary/10">
                      <CardHeader className="bg-primary/5 border-b py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <IndianRupee className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">Project Review & Activation</CardTitle>
                            <p className="text-sm text-muted-foreground">Finalize your project and start dispatching engineers.</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Configuration Summary
                              </h4>
                              <div className="space-y-3 bg-muted/30 p-4 rounded-xl">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Serviceable Areas</span>
                                  <span className="font-bold">{validationSummary.serviceable || project?.totalCalls || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Support Type</span>
                                  <span className="font-bold uppercase">{supportTypeKey}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Project Name</span>
                                  <span className="font-bold">{project?.projectName || details?.project?.project_name}</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl border-2 border-warning/20 bg-warning/5 space-y-2">
                              <p className="text-sm font-bold flex items-center gap-2 text-warning">
                                <TrendingUp className="h-4 w-4" />
                                Note on Activation
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Activating your project will immediately initiate our matching algorithm. Make sure your branch list and SLA requirements are finalized before proceeding.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 text-center relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-1000">
                                <IndianRupee className="h-24 w-24" />
                              </div>
                              <p className="text-sm font-bold text-primary mb-2 uppercase tracking-widest">Total Estimated Budget</p>
                              {isFetchingCost ? (
                                <div className="flex items-center justify-center gap-2 h-16">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <span className="text-5xl font-display font-black text-foreground">₹{(backendTotalCost || project?.totalCost || 0).toLocaleString()}</span>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">Includes base platform service and initial call matching</p>
                            </div>

                            <Button
                              className="w-full h-14 gradient-primary text-lg font-bold shadow-glow group"
                              onClick={handleActivateProject}
                              disabled={actionLoading === 'resume-processing'}
                            >
                              {actionLoading === 'resume-processing' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <>
                                  Activate & Start Dispatching
                                  <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                                </>
                              )}
                            </Button>
                            <p className="text-center text-[10px] text-muted-foreground">
                              By activating, you agree to Door2fy's Vendor Terms of Service and Payout Policies.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}

            {/* Stats Cards - ONLY FOR NON-DRAFT */}
            {status !== 'DRAFT' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-none shadow-card overflow-hidden">
                  <div className="h-1 bg-primary" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Calls</div>
                        <div className="text-2xl font-bold text-foreground">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-12" /> : (summary?.total_calls || project?.totalCalls || 0)}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Phone className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-card overflow-hidden">
                  <div className="h-1 bg-success" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Active Calls</div>
                        <div className="text-2xl font-bold text-success">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-12" /> : (summary?.active_calls || project?.activeCalls || 0)}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-success/10 text-success">
                        <Activity className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-card overflow-hidden">
                  <div className="h-1 bg-warning" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">On Hold</div>
                        <div className="text-2xl font-bold text-warning">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-12" /> : (calls.filter(c => c.status?.toUpperCase() === 'HOLD').length)}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-warning/10 text-warning">
                        <Pause className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-card overflow-hidden text-primary">
                  <div className="h-1 gradient-primary" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Cost</div>
                        <div className="text-2xl font-bold">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-20" /> : `₹${(summary?.total_cost || project?.totalCost || 0).toLocaleString()}`}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IndianRupee className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs - ONLY FOR NON-DRAFT */}
            {status !== 'DRAFT' && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                    <FileText className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="calls" className="data-[state=active]:bg-background">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Records
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Info */}
                    <Card className="shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          Project Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Project ID</p>
                            <p className="font-mono text-sm font-medium">{projectId?.slice(0, 12)}...</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant="outline" className={cn(statusColors[status] || statusColors.DRAFT)}>
                              {status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Support Type</p>
                            <div className="flex items-center gap-1">
                              {supportTypeInfo.icon}
                              <span className="font-medium">{supportTypeInfo.label}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Created Date</p>
                            <p className="font-medium">
                              {new Date(project?.createdAt || details?.project?.created_at || Date.now()).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Latest Proof of Work Gallery */}
                    {calls.some(c => getAllProofImages(c).length > 0) && (
                      <Card className="shadow-card lg:col-span-2">
                        <CardHeader className="pb-3 border-b bg-muted/30">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <ImageIcon className="h-5 w-5 text-primary" />
                              Latest Field Proofs
                            </CardTitle>
                            <Badge variant="outline" className="bg-primary/5">Real-time Updates</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {calls
                              .flatMap(c => getAllProofImages(c).map(img => ({ img, callId: c.call_id, branch: c.branch_name })))
                              .slice(0, 12)
                              .map((item, i) => (
                                <div
                                  key={i}
                                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-muted hover:border-primary/50 transition-all cursor-pointer bg-muted shadow-sm"
                                  onClick={() => setPreviewImage(item.img)}
                                >
                                  <img
                                    src={item.img}
                                    alt="Field Proof"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                    <p className="text-[10px] font-bold text-white truncate">{item.branch}</p>
                                    <p className="text-[8px] text-white/70">ID: {item.callId?.slice(-6)}</p>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* L1 Support */}
                    <Card className="shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          L1 Support Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {details?.project?.l1_support_name || project?.l1SupportName || 'Not Assigned'}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {details?.project?.l1_support_number || project?.l1SupportNumber || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Project Financials Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 shadow-card overflow-hidden">
                      <CardHeader className="pb-3 border-b bg-muted/30">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IndianRupee className="h-5 w-5 text-primary" />
                          Project Billing Life-cycle
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Successfully Paid</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-blue-600">₹{financials?.paid_amount.toLocaleString() || 0}</span>
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200 font-bold">PAID</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Settled with platform</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Billable Dues</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-emerald-600">₹{financials?.billable_amount.toLocaleString() || 0}</span>
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 font-bold">DUE</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Ready for your payment</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Unbilled Dues</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-amber-600">₹{financials?.unbilled_amount.toLocaleString() || 0}</span>
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 font-bold">WAIT</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">In maturation window</p>
                          </div>
                        </div>

                        {/* Revenue Progress */}
                        <div className="mt-8 pt-6 border-t">
                          <div className="flex justify-between items-end mb-2">
                            <div className="space-y-1">
                              <p className="text-sm font-bold uppercase tracking-tighter text-foreground">Settlement Progress</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Invoiced vs Realized Collections</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-primary">
                                {financials && financials.total_earned > 0
                                  ? Math.round(((financials.paid_amount + financials.matured_amount) / financials.total_earned) * 100)
                                  : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-1000"
                              style={{
                                width: `${financials && financials.total_earned > 0
                                  ? ((financials.paid_amount + financials.matured_amount) / financials.total_earned) * 100
                                  : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card overflow-hidden">
                      <CardHeader className="pb-3 border-b bg-muted/30">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                          Settlement Policy
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1 bg-primary/10 rounded-full">
                            <Clock className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Verification Window</p>
                            <p className="text-[10px] text-muted-foreground">Job costs mature after the platform-specified window (default 7 days) post-completion.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1 bg-success/10 rounded-full">
                            <CheckCircle className="h-3 w-3 text-success" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Self-Settlement</p>
                            <p className="text-[10px] text-muted-foreground">You can initiate settlement for matured dues directly from your financials tab.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats */}
                  <Card className="shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Call Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-success/5 rounded-xl border border-success/20">
                          <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                          <p className="text-2xl font-bold text-success">
                            {calls.filter(c => c.status?.toUpperCase() === 'COMPLETED').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Completed</p>
                        </div>
                        <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                          <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold text-primary">
                            {calls.filter(c => ['ASSIGNED', 'DISPATCHED'].includes(c.status?.toUpperCase() || '')).length}
                          </p>
                          <p className="text-sm text-muted-foreground">Active</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-xl border border-muted">
                          <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-2xl font-bold text-muted-foreground">
                            {calls.filter(c => c.status?.toUpperCase() === 'PENDING').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Pending</p>
                        </div>
                        <div className="text-center p-4 bg-warning/5 rounded-xl border border-warning/20">
                          <Pause className="h-6 w-6 text-warning mx-auto mb-2" />
                          <p className="text-2xl font-bold text-warning">
                            {calls.filter(c => c.status?.toUpperCase() === 'HOLD').length}
                          </p>
                          <p className="text-sm text-muted-foreground">On Hold</p>
                        </div>
                        <div className="text-center p-4 bg-destructive/5 rounded-xl border border-destructive/20">
                          <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                          <p className="text-2xl font-bold text-destructive">
                            {calls.filter(c => c.status?.toUpperCase() === 'CANCELLED').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Cancelled</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Calls Tab */}
                <TabsContent value="calls">
                  <Card className="shadow-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Phone className="h-5 w-5 text-primary" />
                          Call Records
                        </CardTitle>
                        <Badge variant="secondary">{calls.length} Records</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {selectedProjectLoading ? (
                        <div className="p-6 space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : calls.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <Phone className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No Call Records</h3>
                          <p className="text-muted-foreground">No call records found for this project.</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px]">
                          <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                              <TableRow>
                                <TableHead>Branch</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Engineer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Images</TableHead>
                                <TableHead className="text-right">Assets</TableHead>
                                <TableHead className="text-right">Payout</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {calls.map((call, idx) => {
                                const onHold = isCallOnHold(call);
                                const canHold = canHoldCall(call);
                                const isLoading = actionLoading === call.call_id;

                                return (
                                  <TableRow key={call.call_id || idx} className="hover:bg-muted/50">
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{call.branch_name || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Hash className="h-3 w-3" />
                                          {call.branch_code || 'N/A'}
                                        </p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-[200px]">
                                        <p className="text-sm truncate">{call.address || 'N/A'}</p>
                                        <Badge variant="outline" className="mt-1 text-xs">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          {call.pincode || 'N/A'}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="text-sm">{call.engineer_name || 'Not Assigned'}</p>
                                        {call.engineer_contact && (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {call.engineer_contact}
                                          </p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`flex items-center gap-1 w-fit ${callStatusColors[call.status?.toLowerCase() || ''] || callStatusColors.pending}`}
                                      >
                                        {callStatusIcons[call.status?.toLowerCase() || ''] || callStatusIcons.pending}
                                        {call.status || 'Pending'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex -space-x-2 overflow-hidden hover:overflow-visible transition-all">
                                        {(() => {
                                          const callImages = getAllProofImages(call);
                                          return callImages.length > 0 ? (
                                            callImages.map((img, i) => (
                                              <div
                                                key={i}
                                                className="relative w-8 h-8 rounded-full border-2 border-card cursor-pointer hover:z-10 transition-transform hover:scale-125 bg-muted flex items-center justify-center shadow-sm"
                                                onClick={() => setPreviewImage(img)}
                                              >
                                                <img
                                                  src={img}
                                                  alt={`Proof ${i + 1}`}
                                                  className="w-full h-full object-cover rounded-full"
                                                />
                                              </div>
                                            ))
                                          ) : (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-card text-muted-foreground/30">
                                              <ImageIcon className="h-3.5 w-3.5" />
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="font-medium">{call.asset_count || 0}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="font-bold text-success">
                                        {call.payout_amount !== undefined ? `₹${call.payout_amount.toLocaleString()}` : '—'}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {call.status?.toUpperCase() === 'COMPLETED' ? (
                                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Completed
                                        </Badge>
                                      ) : call.status?.toUpperCase() === 'CANCELLED' ? (
                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Cancelled
                                        </Badge>
                                      ) : onHold ? (
                                        isCallHeldByAdmin(call) ? (
                                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                                            <Pause className="h-3 w-3 mr-1" />
                                            Held by Admin
                                          </Badge>
                                        ) : (
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleCallHoldResume(call.call_id, true)}
                                            disabled={isLoading}
                                            className="bg-success hover:bg-success/90 h-8 gap-1"
                                          >
                                            {isLoading ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <>
                                                <Play className="h-3 w-3" />
                                                Resume
                                              </>
                                            )}
                                          </Button>
                                        )
                                      ) : canHold ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleCallHoldResume(call.call_id, false)}
                                          disabled={isLoading}
                                          className="border-warning text-warning hover:bg-warning/10 h-8 gap-1"
                                        >
                                          {isLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <>
                                              <Pause className="h-3 w-3" />
                                              Hold
                                            </>
                                          )}
                                        </Button>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          <DialogHeader className="absolute top-4 left-4 z-10 p-0">
            <DialogTitle className="text-white bg-black/50 px-3 py-1 rounded-md text-sm backdrop-blur-sm">
              Proof image
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video flex items-center justify-center bg-transparent">
            {previewImage && (
              <img
                src={previewImage}
                alt="Proof"
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => window.open(previewImage || '', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'pause' && 'Pause Project?'}
              {confirmDialog.type === 'resume' && 'Resume Project?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'pause' && 'This will pause the project and put all active calls on hold. You can resume it later.'}
              {confirmDialog.type === 'resume' && 'This will resume the project and all held calls will be set to pending for dispatch.'}
              {confirmDialog.type === 'activate' && 'This will activate the project and start the matching process to assign engineers to your calls.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialog.type === 'activate' ? handleActivateProject : handleProjectPauseResume}
              className={confirmDialog.type === 'resume' || confirmDialog.type === 'activate' ? 'bg-success hover:bg-success/90' : 'bg-warning hover:bg-warning/90'}
            >
              {confirmDialog.type === 'pause' && 'Pause Project'}
              {confirmDialog.type === 'resume' && 'Resume Project'}
              {confirmDialog.type === 'activate' && 'Activate & Dispatch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDetails;