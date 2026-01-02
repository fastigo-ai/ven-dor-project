import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ProjectData, CallData } from '@/contexts/VendorContext';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | null;
  calls: CallData[];
}

const statusColors = {
  active: 'bg-success/10 text-success border-success/30',
  completed: 'bg-primary/10 text-primary border-primary/30',
  'on-hold': 'bg-warning/10 text-warning border-warning/30',
};

const callStatusColors = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  assigned: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

const callStatusIcons = {
  pending: Clock,
  assigned: AlertCircle,
  completed: CheckCircle,
  cancelled: AlertCircle,
};

const ProjectDetailsDialog = ({
  open,
  onOpenChange,
  project,
  calls,
}: ProjectDetailsDialogProps) => {
  if (!project) return null;

  const projectCalls = calls.filter((c) => c.projectId === project.id);
  const pendingCalls = projectCalls.filter((c) => c.status === 'pending').length;
  const assignedCalls = projectCalls.filter((c) => c.status === 'assigned').length;
  const completedCalls = projectCalls.filter((c) => c.status === 'completed').length;

  return (
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
                  {project.name}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Created on {new Date(project.createdAt).toLocaleDateString()}
                </DialogDescription>
              </div>
              <Badge
                variant="outline"
                className={cn('capitalize shrink-0', statusColors[project.status])}
              >
                {project.status}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-4 sm:px-6">
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
                    <p className="font-medium">{project.supportType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className={cn('capitalize', statusColors[project.status])}>
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created Date</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="font-medium text-primary flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {project.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-muted/30">
                <CardContent className="pt-4 text-center">
                  <Phone className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{project.totalCalls}</p>
                  <p className="text-xs text-muted-foreground">Total Calls</p>
                </CardContent>
              </Card>
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="pt-4 text-center">
                  <Clock className="h-5 w-5 text-warning mx-auto mb-1" />
                  <p className="text-2xl font-bold text-warning">{pendingCalls}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 text-center">
                  <AlertCircle className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-primary">{assignedCalls}</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20">
                <CardContent className="pt-4 text-center">
                  <CheckCircle className="h-5 w-5 text-success mx-auto mb-1" />
                  <p className="text-2xl font-bold text-success">{completedCalls}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Calls List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Call Records ({projectCalls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectCalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No calls recorded for this project</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {projectCalls.map((call) => {
                      const StatusIcon = callStatusIcons[call.status];
                      return (
                        <div
                          key={call.id}
                          className="bg-muted/30 rounded-lg p-3 border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{call.customerName}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn('capitalize text-xs', callStatusColors[call.status])}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {call.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {call.customerPhone}
                            </div>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              ₹{call.orderAmount.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{call.customerAddress} - {call.pincode}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="p-4 sm:p-6 pt-4 border-t bg-background">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total Value: <span className="font-semibold text-primary">₹{project.totalAmount.toLocaleString()}</span>
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
  );
};

export default ProjectDetailsDialog;
