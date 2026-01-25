import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor, BackendProjectData } from '@/contexts/VendorContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from '@/components/Logo';
import CreateProjectWizard from '@/components/vendor/CreateProjectWizard';
import { removeAuthToken } from '@/services/authApi';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Phone,
  IndianRupee,
  Calendar,
  MapPin,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Bell,
  LayoutGrid,
  List,
  RefreshCw,
  Briefcase,
  TrendingUp,
  Clock,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success border-success/30',
  APPROVED: 'bg-success/10 text-success border-success/30',
  COMPLETED: 'bg-primary/10 text-primary border-primary/30',
  'ON-HOLD': 'bg-warning/10 text-warning border-warning/30',
  HOLD: 'bg-warning/10 text-warning border-warning/30',
  PENDING: 'bg-warning/10 text-warning border-warning/30',
  DRAFT: 'bg-muted text-muted-foreground border-muted',
};

const supportTypeLabels: Record<string, string> = {
  'pm activity': 'PM Activity',
  'breakfix': 'Breakfix',
  'on call': 'On Call',
  'PM ACTIVITY': 'PM Activity',
  'BREAKFIX': 'Breakfix',
  'ON CALL': 'On Call',
};

const VendorProjects = () => {
  const navigate = useNavigate();
  const { 
    currentVendor, 
    setCurrentVendor, 
    backendProjects, 
    backendProjectsLoading, 
    backendProjectsError,
    loadBackendProjects 
  } = useVendor();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (currentVendor) {
      loadBackendProjects();
    }
  }, [currentVendor]);

  const handleLogout = () => {
    setCurrentVendor(null);
    removeAuthToken();
    navigate('/login');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBackendProjects();
    setIsRefreshing(false);
  };

  const filteredProjects = backendProjects.filter((project) => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: backendProjects.length,
    active: backendProjects.filter(p => p.status.toUpperCase() === 'ACTIVE' || p.status.toUpperCase() === 'APPROVED').length,
    onHold: backendProjects.filter(p => p.status.toUpperCase() === 'HOLD' || p.status.toUpperCase() === 'ON-HOLD').length,
    totalCalls: backendProjects.reduce((sum, p) => sum + (p.totalCalls || 0), 0),
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
                onClick={() => navigate('/dashboard')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo />
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {currentVendor?.companyName ? getInitials(currentVendor.companyName) : 'V'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {currentVendor?.companyName || 'Vendor'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Title & Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                My Projects
              </h1>
              <p className="text-muted-foreground mt-1">Manage and track all your service projects</p>
            </div>
            
            <Button 
              onClick={() => setCreateProjectOpen(true)}
              className="gradient-primary text-primary-foreground shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-none shadow-card bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-card bg-gradient-to-br from-success/5 to-success/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-card bg-gradient-to-br from-warning/5 to-warning/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.onHold}</p>
                    <p className="text-xs text-muted-foreground">On Hold</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-card bg-gradient-to-br from-accent to-accent/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalCalls}</p>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="HOLD">On Hold</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {backendProjectsLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : backendProjectsError ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <p className="text-destructive">{backendProjectsError}</p>
              <Button variant="outline" onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Create your first project to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setCreateProjectOpen(true)} className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectListItem 
                key={project.id} 
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateProjectWizard 
        open={createProjectOpen} 
        onOpenChange={(open) => {
          setCreateProjectOpen(open);
          if (!open) loadBackendProjects();
        }}
      />
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, onClick }: { project: BackendProjectData; onClick: () => void }) => {
  const status = project.status?.toUpperCase() || 'DRAFT';
  const supportType = supportTypeLabels[project.supportType?.toLowerCase()] || project.supportType || 'N/A';
  
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden"
      onClick={onClick}
    >
      <div className="h-2 gradient-primary" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {project.projectName}
          </h3>
          <Badge variant="outline" className={statusColors[status] || statusColors.DRAFT}>
            {status}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>{supportType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Calls:</span>
              <span className="ml-1 font-medium text-foreground">{project.totalCalls || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>
              <span className="ml-1 font-medium text-primary">₹{(project.totalCost || 0).toLocaleString()}</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
};

// Project List Item Component
const ProjectListItem = ({ project, onClick }: { project: BackendProjectData; onClick: () => void }) => {
  const status = project.status?.toUpperCase() || 'DRAFT';
  const supportType = supportTypeLabels[project.supportType?.toLowerCase()] || project.supportType || 'N/A';
  
  return (
    <Card 
      className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {project.projectName}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{supportType}</span>
                <span>•</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex gap-6 text-sm">
              <div className="text-center">
                <p className="font-medium text-foreground">{project.totalCalls || 0}</p>
                <p className="text-xs text-muted-foreground">Calls</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-primary">₹{(project.totalCost || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Cost</p>
              </div>
            </div>
            
            <Badge variant="outline" className={statusColors[status] || statusColors.DRAFT}>
              {status}
            </Badge>
            
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorProjects;
