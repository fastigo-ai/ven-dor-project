import { useEffect, useState } from 'react';
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
import Logo from '@/components/Logo';
import { toast } from '@/hooks/use-toast';
import {
  holdCall,
  resumeCall,
  pauseProject,
  resumeProject,
  ProjectCallRow,
} from '@/services/projectApi';
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
    backendProjects 
  } = useVendor();

  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'pause' | 'resume' | 'holdCall' | 'resumeCall';
    callId?: string;
  }>({ open: false, type: 'pause' });

  // Find project from list for basic info
  const project = backendProjects.find(p => p.id === projectId);
  const details = selectedProjectDetails;

  useEffect(() => {
    if (projectId) {
      loadProjectDetails(projectId);
    }
  }, [projectId]);

  const status = project?.status?.toUpperCase() || details?.project?.status?.toUpperCase() || 'DRAFT';
  const supportTypeKey = project?.supportType?.toLowerCase() || details?.project?.support_type?.toLowerCase() || 'breakfix';
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
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 shadow-glow">
                    <FolderKanban className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {project?.projectName || details?.project?.project_name || 'Project Details'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <Badge variant="outline" className={statusColors[status]}>
                        {status}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {supportTypeInfo.icon}
                        {supportTypeInfo.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(project?.createdAt || details?.project?.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Pause/Resume Project Button */}
                  <Button 
                    variant={isProjectPaused ? 'default' : 'outline'}
                    onClick={() => setConfirmDialog({ 
                      open: true, 
                      type: isProjectPaused ? 'resume' : 'pause' 
                    })}
                    disabled={actionLoading === 'project' || status === 'COMPLETED' || (isProjectPaused && isProjectHeldByAdmin)}
                    className={isProjectPaused ? 'bg-success hover:bg-success/90' : 'border-warning text-warning hover:bg-warning/10'}
                    title={isProjectPaused && isProjectHeldByAdmin ? 'This project was paused by admin. Only admin can resume it.' : undefined}
                  >
                    {actionLoading === 'project' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isProjectPaused ? (
                      <Play className="h-4 w-4 mr-2" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    {isProjectPaused && isProjectHeldByAdmin ? 'Paused by Admin' : isProjectPaused ? 'Resume Project' : 'Pause Project'}
                  </Button>
                  
                  <Button variant="outline" onClick={() => navigate('/projects')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-none shadow-card overflow-hidden">
                  <div className="h-1 bg-primary" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Calls</p>
                        <p className="text-2xl font-bold text-foreground">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-12" /> : (summary?.total_calls || project?.totalCalls || 0)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-card overflow-hidden">
                  <div className="h-1 bg-success" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Calls</p>
                        <p className="text-2xl font-bold text-success">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-12" /> : (summary?.active_calls || project?.activeCalls || 0)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-success/10">
                        <Activity className="h-5 w-5 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-card overflow-hidden">
                  <div className="h-1 bg-warning" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">On Hold</p>
                        <p className="text-2xl font-bold text-warning">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-12" /> : (calls.filter(c => c.status?.toUpperCase() === 'HOLD').length)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-warning/10">
                        <Pause className="h-5 w-5 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-card overflow-hidden">
                  <div className="h-1 gradient-primary" />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold text-primary">
                          {selectedProjectLoading ? <Skeleton className="h-8 w-16" /> : `₹${(summary?.total_cost || project?.totalCost || 0).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IndianRupee className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs */}
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
                          <Badge variant="outline" className={statusColors[status]}>
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
                              <TableHead className="text-right">Assets</TableHead>
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
                                  <TableCell className="text-right">
                                    <span className="font-medium">{call.asset_count || 0}</span>
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
          </>
        )}
      </main>

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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProjectPauseResume}
              className={confirmDialog.type === 'resume' ? 'bg-success hover:bg-success/90' : 'bg-warning hover:bg-warning/90'}
            >
              {confirmDialog.type === 'pause' ? 'Pause Project' : 'Resume Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDetails;