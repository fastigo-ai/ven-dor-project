import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
import { BackendProjectData } from '@/contexts/VendorContext';
import { ProjectDetailsResponse, ProjectCallRow } from '@/services/projectApi';
import { pauseProject, resumeProject, holdCall, resumeCall } from '@/services/projectApi';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  FolderOpen,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  IndianRupee,
  MapPin,
  User,
  Calendar,
  Wrench,
  Truck,
  Pause,
  Play,
  Loader2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackendProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: BackendProjectData | null;
  details: ProjectDetailsResponse | null;
  loading: boolean;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success border-success/30',
  APPROVED: 'bg-success/10 text-success border-success/30',
  COMPLETED: 'bg-primary/10 text-primary border-primary/30',
  'ON-HOLD': 'bg-warning/10 text-warning border-warning/30',
  HOLD: 'bg-warning/10 text-warning border-warning/30',
  PENDING: 'bg-warning/10 text-warning border-warning/30',
  DRAFT: 'bg-muted/50 text-muted-foreground border-muted',
};

const callStatusColors: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning border-warning/30',
  VALIDATED: 'bg-primary/10 text-primary border-primary/30',
  ASSIGNED: 'bg-primary/10 text-primary border-primary/30',
  DISPATCHED: 'bg-accent/10 text-accent border-accent/30',
  COMPLETED: 'bg-success/10 text-success border-success/30',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/30',
};

const callStatusIcons: Record<string, React.ElementType> = {
  PENDING: Clock,
  VALIDATED: AlertCircle,
  ASSIGNED: Truck,
  DISPATCHED: Truck,
  COMPLETED: CheckCircle,
  CANCELLED: AlertCircle,
};

const supportTypeLabels: Record<string, string> = {
  'pm activity': 'PM Activity',
  'PM ACTIVITY': 'PM Activity',
  'breakfix': 'Breakfix',
  'BREAKFIX': 'Breakfix',
  'on call': 'On Call Support',
  'ON CALL': 'On Call Support',
};

const BackendProjectDetailsDialog = ({
  open,
  onOpenChange,
  project,
  details,
  loading,
}: BackendProjectDetailsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [actioningCallId, setActioningCallId] = useState<string | null>(null);

  if (!project) return null;

  const projectInfo = details?.project;
  const summary = details?.summary;
  const calls = details?.calls || [];

  const getStatusLabel = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === 'APPROVED' || normalized === 'ACTIVE') return 'Active';
    if (normalized === 'ON-HOLD' || normalized === 'HOLD') return 'On Hold';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const isPaused = project.status.toUpperCase() === 'PAUSED' || 
                   project.status.toUpperCase() === 'HOLD' || 
                   project.status.toUpperCase() === 'ON-HOLD';

  const handleProjectPauseResume = async () => {
    setIsLoading(true);
    try {
      if (isPaused) {
        await resumeProject(project.id);
        toast({
          title: 'Project Resumed',
          description: 'Project and all held calls have been resumed successfully.',
        });
      } else {
        await pauseProject(project.id);
        toast({
          title: 'Project Paused',
          description: 'Project and all active calls have been put on hold.',
        });
      }
      // Reload the project details
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowPauseDialog(false);
    }
  };

  const handleCallHoldResume = async (callId: string, isResume: boolean) => {
    setActioningCallId(callId);
    try {
      if (isResume) {
        await resumeCall(project.id, callId);
        toast({
          title: 'Call Resumed',
          description: 'Call has been resumed successfully.',
        });
      } else {
        await holdCall(project.id, callId);
        toast({
          title: 'Call On Hold',
          description: 'Call has been put on hold successfully.',
        });
      }
      // Reload the project details
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update call status',
        variant: 'destructive',
      });
    } finally {
      setActioningCallId(null);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl h-[85vh] max-h-[85vh] flex flex-col p-0">
        <div className="p-4 sm:p-6 pb-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl font-semibold truncate">
                  {project.projectName}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Created on {new Date(project.createdAt).toLocaleDateString()}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn('capitalize', statusColors[project.status.toUpperCase()] || statusColors['PENDING'])}
                >
                  {getStatusLabel(project.status)}
                </Badge>
                <Button
                  variant={isPaused ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (isPaused) {
                      handleProjectPauseResume();
                    } else {
                      setShowPauseDialog(true);
                    }
                  }}
                  disabled={isLoading}
                  className={cn(
                    'h-8 gap-1',
                    isPaused && 'bg-success hover:bg-success/90'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isPaused ? (
                    <>
                      <Play className="h-3 w-3" />
                      <span className="hidden sm:inline">Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-3 w-3" />
                      <span className="hidden sm:inline">Pause</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-4 sm:px-6">
          {loading ? (
            <div className="space-y-6 py-4">
              <Card>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 text-center">
                      <Skeleton className="h-5 w-5 mx-auto mb-1" />
                      <Skeleton className="h-8 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Project Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Support Type</p>
                      <p className="font-medium">
                        {supportTypeLabels[project.supportType] || supportTypeLabels[project.supportType.toUpperCase()] || project.supportType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="outline" className={cn('capitalize', statusColors[project.status.toUpperCase()] || statusColors['PENDING'])}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">L1 Support Name</p>
                      <p className="font-medium flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {project.l1SupportName || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">L1 Support Number</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {project.l1SupportNumber || '-'}
                      </p>
                    </div>
                    {project.sla && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">SLA Priority</p>
                          <p className="font-medium">{project.sla.priority}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Response Time</p>
                          <p className="font-medium">{project.sla.response_time_minutes} mins</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Created Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {project.activatedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">Activated Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(project.activatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 text-center">
                      <Phone className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold">{summary.total_calls}</p>
                      <p className="text-xs text-muted-foreground">Total Calls</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4 text-center">
                      <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold text-primary">{summary.active_calls}</p>
                      <p className="text-xs text-muted-foreground">Active Calls</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-success/5 border-success/20">
                    <CardContent className="pt-4 text-center">
                      <IndianRupee className="h-5 w-5 text-success mx-auto mb-1" />
                      <p className="text-2xl font-bold text-success">₹{summary.total_cost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Calls List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Call Records ({calls.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {calls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No calls recorded for this project</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {calls.map((call) => {
                        const statusKey = call.status?.toUpperCase() || 'PENDING';
                        const StatusIcon = callStatusIcons[statusKey] || Clock;
                        const onHold = statusKey === 'HOLD';
                        const canHold = ['PENDING', 'DISPATCHED', 'ASSIGNED'].includes(statusKey);
                        const isCompleted = statusKey === 'COMPLETED';
                        const isCancelled = statusKey === 'CANCELLED';
                        const isActioningThis = actioningCallId === call.call_id;

                        return (
                          <div
                            key={call.call_id}
                            className="bg-muted/30 rounded-lg p-3 border"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{call.branch_name || 'N/A'}</span>
                                <span className="text-xs text-muted-foreground">({call.branch_code})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn('capitalize text-xs', callStatusColors[statusKey] || callStatusColors['PENDING'])}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {call.status?.toLowerCase() || 'pending'}
                                </Badge>
                                {isCompleted ? (
                                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Done
                                  </Badge>
                                ) : isCancelled ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Cancelled
                                  </Badge>
                                ) : onHold ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleCallHoldResume(call.call_id, true)}
                                    disabled={isActioningThis}
                                    className="bg-success hover:bg-success/90 h-7 gap-1 text-xs"
                                  >
                                    {isActioningThis ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Play className="h-3 w-3" />
                                        Resume
                                      </>
                                    )}
                                  </Button>
                                ) : canHold ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCallHoldResume(call.call_id, false)}
                                    disabled={isActioningThis}
                                    className="border-warning text-warning hover:bg-warning/10 h-7 gap-1 text-xs"
                                  >
                                    {isActioningThis ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Pause className="h-3 w-3" />
                                        Hold
                                      </>
                                    )}
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                {call.asset_type || 'N/A'} ({call.asset_count ?? 0} assets)
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {call.support_type || 'N/A'}
                              </div>
                              {call.sla_priority && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Priority: {call.sla_priority}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {call.serviceable ? 'Serviceable' : 'Not Serviceable'}
                              </div>
                              {call.engineer_name && (
                                <div className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {call.engineer_name}
                                </div>
                              )}
                              {call.distance_km != null && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {call.distance_km} km
                                </div>
                              )}
                            </div>
                            <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-1">
                                {call.address || call.pincode ? (
                                  <>
                                    {call.address && <>{call.address} - </>}
                                    {call.pincode || 'No Pincode'}
                                  </>
                                ) : 'No address available'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 sm:p-6 pt-4 border-t bg-background">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {summary && (
                <>Total Value: <span className="font-semibold text-primary">₹{summary.total_cost.toLocaleString()}</span></>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pause Project?</AlertDialogTitle>
          <AlertDialogDescription>
            This will pause the project and put all active calls (Pending, Dispatched, Assigned) on hold.
            The dispatch engine will stop until you resume the project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleProjectPauseResume} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pausing...
              </>
            ) : (
              'Pause Project'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default BackendProjectDetailsDialog;
