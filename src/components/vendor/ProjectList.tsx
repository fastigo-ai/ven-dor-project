import { useState } from 'react';
import { ProjectData, CallData } from '@/contexts/VendorContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Phone, 
  CheckCircle, 
  IndianRupee,
  MoreHorizontal,
  Eye 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import ProjectDetailsDialog from './ProjectDetailsDialog';

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
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewDetails = (project: ProjectData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedProject(project);
    setDetailsOpen(true);
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
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(project)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-primary" />
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Badge 
                variant="outline" 
                className={cn('capitalize mb-4', statusColors[project.status])}
              >
                {project.status}
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
    </>
  );
};

export default ProjectList;
