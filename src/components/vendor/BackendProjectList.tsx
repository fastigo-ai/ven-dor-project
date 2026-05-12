import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '@/contexts/VendorContext';
import { BackendProjectData } from '@/types/vendor';
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
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { pauseProject, resumeProject } from '@/services/projectApi';

interface BackendProjectListProps {
  projects: BackendProjectData[];
  loading: boolean;
  error: string | null;
  onRefresh: (page?: number, pageSize?: number) => void | Promise<void>;
  onCreateProject?: () => void;
  hidePagination?: boolean;
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

const BackendProjectList = ({ projects, loading, error, onRefresh, onCreateProject, hidePagination = false }: BackendProjectListProps) => {
  const navigate = useNavigate();
  const {
    projectsPagination,
  } = useVendor();
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  // Backend-driven pagination state
  const currentPage = projectsPagination.page;
  const pageSize = projectsPagination.pageSize;
  const totalPages = projectsPagination.totalPages;
  const totalProjects = projectsPagination.total;

  const startIndex = totalProjects === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalProjects === 0 ? 0 : Math.min(startIndex + projects.length - 1, totalProjects);

  const handleViewDetails = (project: BackendProjectData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/projects/${project.id}`);
  };

  const handlePauseResume = async (project: BackendProjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPaused = project.status.toUpperCase() === 'PAUSED' ||
      project.status.toUpperCase() === 'HOLD' ||
      project.status.toUpperCase() === 'ON-HOLD';

    try {
      if (isPaused) {
        await resumeProject(project.id);
        toast({ title: 'Project Resumed' });
      } else {
        await pauseProject(project.id);
        toast({ title: 'Project Paused' });
      }
      onRefresh(currentPage, pageSize);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === 'APPROVED' || normalized === 'ACTIVE') return 'Active';
    if (normalized === 'ON-HOLD' || normalized === 'HOLD') return 'On Hold';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handlePageChange = (page: number) => {
    onRefresh(page, pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <Button onClick={() => onRefresh(currentPage, pageSize)} variant="outline" size="sm">
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
        <Button onClick={() => onRefresh(currentPage, pageSize)} variant="outline" size="sm" disabled={loading}>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handlePauseResume(project, e)}
                        className={isOnHold ? "text-success" : "text-warning"}
                      >
                        {isOnHold ? (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Resume Project
                          </>
                        ) : (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause Project
                          </>
                        )}
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
                      <span className="font-semibold">{project.totalCalls ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-success">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-semibold">{project.activeCalls ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-accent">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span className="font-semibold">
                        {project.totalCost != null && project.totalCost > 0
                          ? `${(project.totalCost / 1000).toFixed(1)}K`
                          : '₹0'}
                      </span>
                    </div>
                    <p className="text-xs">Amount</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {!hidePagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and adjacent pages
              const showPage =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1;

              const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
              const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

              if (showEllipsisBefore || showEllipsisAfter) {
                return <span key={page} className="px-2 text-muted-foreground">...</span>;
              }

              if (!showPage) return null;

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="min-w-[36px]"
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground ml-2">
            {startIndex}-{endIndex} of {totalProjects}
          </span>
        </div>
      )}

    </>
  );
};

export default BackendProjectList;
