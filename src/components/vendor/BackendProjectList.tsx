import { useState } from 'react';
import { BackendProjectData, useVendor } from '@/contexts/VendorContext';
import { ProjectDetailsResponse, ProjectCallRow } from '@/services/projectApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderOpen,
  Phone,
  CheckCircle,
  IndianRupee,
  MoreHorizontal,
  Eye,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import BackendProjectDetailsDialog from './BackendProjectDetailsDialog';

interface BackendProjectListProps {
  projects: BackendProjectData[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreateProject?: () => void;
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

const BackendProjectList = ({ projects, loading, error, onRefresh, onCreateProject }: BackendProjectListProps) => {
  const { loadProjectDetails, selectedProjectDetails, selectedProjectLoading } = useVendor();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<BackendProjectData | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  const handleViewDetails = async (project: BackendProjectData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedProject(project);
    setLoadingProjectId(project.id);
    
    const details = await loadProjectDetails(project.id);
    setLoadingProjectId(null);
    
    if (details) {
      setDetailsOpen(true);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to load project details',
        variant: 'destructive',
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === 'APPROVED' || normalized === 'ACTIVE') return 'Active';
    if (normalized === 'ON-HOLD' || normalized === 'HOLD') return 'On Hold';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="text-center">
                    <Skeleton className="h-5 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Error Loading Projects</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Projects Yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Create your first project to start managing delivery calls
          </p>
          <Button onClick={onCreateProject} variant="default">
            Create New Project
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const statusKey = project.status.toUpperCase();
          const isOnHold = statusKey === 'ON-HOLD' || statusKey === 'HOLD';
          const isLoadingThis = loadingProjectId === project.id;
          
          return (
            <Card
              key={project.id}
              className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                isOnHold && "border-warning/30 bg-warning/5"
              )}
              onClick={() => handleViewDetails(project)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      isOnHold ? "bg-warning/10" : "bg-primary/10"
                    )}>
                      {isLoadingThis ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <FolderOpen className={cn(
                          "h-5 w-5",
                          isOnHold ? "text-warning" : "text-primary"
                        )} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{project.projectName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border z-50">
                      <DropdownMenuItem onClick={(e) => handleViewDetails(project, e)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Badge
                  variant="outline"
                  className={cn('capitalize mb-4', statusColors[statusKey] || statusColors['PENDING'])}
                >
                  {getStatusLabel(project.status)}
                </Badge>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="font-semibold">{project.totalCalls ?? '-'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-success">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-semibold">{project.activeCalls ?? '-'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-accent">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span className="font-semibold">
                        {project.totalCost != null ? `${(project.totalCost / 1000).toFixed(1)}K` : '-'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <BackendProjectDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        project={selectedProject}
        details={selectedProjectDetails}
        loading={selectedProjectLoading}
      />
    </>
  );
};

export default BackendProjectList;
