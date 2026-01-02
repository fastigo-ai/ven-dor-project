import { useState } from 'react';
import { ProjectData, CallData, useVendor } from '@/contexts/VendorContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Phone, 
  CheckCircle, 
  IndianRupee,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
  Edit,
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
import ProjectDetailsDialog from './ProjectDetailsDialog';
import EditProjectDialog from './EditProjectDialog';

interface ProjectListProps {
  projects: ProjectData[];
  calls: CallData[];
  onViewProject: (project: ProjectData) => void;
}

const statusColors = {
  active: 'bg-success/10 text-success border-success/30',
  completed: 'bg-primary/10 text-primary border-primary/30',
  'on-hold': 'bg-warning/10 text-warning border-warning/30',
};

const ProjectList = ({ projects, calls, onViewProject }: ProjectListProps) => {
  const { updateProject } = useVendor();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectData | null>(null);

  const handleEditProject = (project: ProjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProject(project);
    setEditOpen(true);
  };

  const handleViewDetails = (project: ProjectData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedProject(project);
    setDetailsOpen(true);
  };

  const handleActivateProject = (project: ProjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    updateProject(project.id, { status: 'active' });
    toast({
      title: 'Project Activated',
      description: `"${project.name}" is now active.`,
    });
  };

  const handleHoldProject = (project: ProjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    updateProject(project.id, { status: 'on-hold' });
    toast({
      title: 'Project On Hold',
      description: `"${project.name}" has been placed on hold.`,
    });
  };

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Projects Yet</h3>
          <p className="text-sm text-muted-foreground text-center">
            Create your first project to start managing delivery calls
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className={cn(
              "hover:shadow-md transition-shadow cursor-pointer",
              project.status === 'on-hold' && "border-warning/30 bg-warning/5"
            )}
            onClick={() => handleViewDetails(project)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    project.status === 'on-hold' ? "bg-warning/10" : "bg-primary/10"
                  )}>
                    <FolderOpen className={cn(
                      "h-5 w-5",
                      project.status === 'on-hold' ? "text-warning" : "text-primary"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
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
                    <DropdownMenuItem onClick={(e) => handleEditProject(project, e)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {project.status === 'on-hold' ? (
                      <DropdownMenuItem onClick={(e) => handleActivateProject(project, e)} className="text-success">
                        <Play className="mr-2 h-4 w-4" />
                        Activate Project
                      </DropdownMenuItem>
                    ) : project.status === 'active' ? (
                      <DropdownMenuItem onClick={(e) => handleHoldProject(project, e)} className="text-warning">
                        <Pause className="mr-2 h-4 w-4" />
                        Put On Hold
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Badge 
                variant="outline" 
                className={cn('capitalize mb-4', statusColors[project.status])}
              >
                {project.status === 'on-hold' ? 'On Hold' : project.status}
              </Badge>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="font-semibold">{project.totalCalls}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Calls</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-success">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="font-semibold">{project.completedCalls}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-accent">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span className="font-semibold">
                      {(project.totalAmount / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        project={selectedProject}
        calls={calls}
      />

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={editProject}
      />
    </>
  );
};

export default ProjectList;
