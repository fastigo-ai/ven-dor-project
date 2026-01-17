import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FolderPlus,
  Bell,
  Settings,
  LogOut,
  User,
  BarChart3,
  FileSpreadsheet,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import ProjectList from '@/components/vendor/ProjectList';
import RateCardView from '@/components/vendor/RateCardView';
import CreateProjectWizard from '@/components/vendor/CreateProjectWizard';
import { useVendor, ProjectData } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { currentVendor, setCurrentVendor, projects, calls, rateCards } = useVendor();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  useEffect(() => {
    if (!currentVendor || currentVendor.status !== 'approved') {
      navigate('/login');
    }
  }, [currentVendor, navigate]);

  if (!currentVendor) {
    return null;
  }

  const vendorProjects = projects.filter((p) => p.vendorId === currentVendor.id);
  const vendorCalls = calls.filter((c) => 
    vendorProjects.some((p) => p.id === c.projectId)
  );

  const handleLogout = () => {
    setCurrentVendor(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

  const handleViewProject = (project: ProjectData) => {
    toast({
      title: project.name,
      description: `Total calls: ${project.totalCalls}, Amount: ₹${project.totalAmount.toLocaleString()}`,
    });
  };

  const stats = [
    {
      title: 'Total Projects',
      value: vendorProjects.length.toString(),
      change: `${vendorProjects.filter(p => p.status === 'active').length} active`,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Calls',
      value: vendorCalls.length.toString(),
      change: `${vendorCalls.filter(c => c.status === 'completed').length} completed`,
      icon: FileSpreadsheet,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Amount',
      value: `₹${(vendorCalls.reduce((sum, c) => sum + c.assetsCount * 100, 0) / 1000).toFixed(1)}K`,
      change: 'All projects',
      icon: IndianRupee,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

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
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(currentVendor.contactPersonName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {currentVendor.contactPersonName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{currentVendor.contactPersonName}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {currentVendor.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {currentVendor.contactPersonName.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your projects and delivery calls from here.
              </p>
            </div>
            <StatusBadge status={currentVendor.status} />
          </div>
        </div>

        {/* Company Info Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {currentVendor.companyName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  GST: {currentVendor.gstNumber} • Reg: {currentVendor.registrationNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentVendor.businessAddress}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="h-auto py-6 px-12 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => setCreateProjectOpen(true)}
              >
                <FolderPlus className="h-6 w-6 text-primary" />
                <span className="text-sm">Create Project</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="ratecard">Rate Card</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectList 
              projects={vendorProjects}
              calls={vendorCalls}
              onViewProject={handleViewProject}
            />
          </TabsContent>

          <TabsContent value="ratecard">
            <RateCardView rateCards={rateCards} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateProjectWizard 
        open={createProjectOpen} 
        onOpenChange={setCreateProjectOpen} 
      />
    </div>
  );
};

export default VendorDashboard;
