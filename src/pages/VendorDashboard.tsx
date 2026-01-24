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
  TrendingUp,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import BackendProjectList from '@/components/vendor/BackendProjectList';
import RateCardView from '@/components/vendor/RateCardView';
import CreateProjectWizard from '@/components/vendor/CreateProjectWizard';
import { useVendor } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';
import { removeAuthToken } from '@/services/authApi';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { 
    currentVendor, 
    setCurrentVendor, 
    rateCards,
    backendProjects,
    backendProjectsLoading,
    backendProjectsError,
    loadBackendProjects,
  } = useVendor();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // Load projects on mount - AuthLoader handles auth rehydration
  useEffect(() => {
    if (currentVendor && !backendProjectsLoading) {
      loadBackendProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVendor]);

  // Show loading while auth is being verified
  if (!currentVendor) {
    return null;
  }

  // Redirect non-approved vendors
  if (currentVendor.status !== 'approved') {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    setCurrentVendor(null);
    removeAuthToken();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

  const handleProjectCreated = () => {
    // Refresh project list after creating a new project
    loadBackendProjects();
  };

  // Calculate stats from backend projects
  const totalProjects = backendProjects.length;
  const activeProjects = backendProjects.filter(p => 
    p.status.toUpperCase() === 'ACTIVE' || p.status.toUpperCase() === 'APPROVED'
  ).length;
  
  // Sum total calls and total cost from all projects
  const totalCalls = backendProjects.reduce((sum, p) => sum + (p.totalCalls ?? 0), 0);
  const totalAmount = backendProjects.reduce((sum, p) => sum + (p.totalCost ?? 0), 0);
  const totalActiveCalls = backendProjects.reduce((sum, p) => sum + (p.activeCalls ?? 0), 0);

  const stats = [
    {
      title: 'Total Projects',
      value: totalProjects.toString(),
      change: `${activeProjects} active`,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Calls',
      value: totalCalls.toString(),
      change: `${totalActiveCalls} active`,
      icon: FileSpreadsheet,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Amount',
      value: totalAmount > 0 ? `₹${(totalAmount / 1000).toFixed(1)}K` : '₹0',
      change: 'Project value',
      icon: IndianRupee,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  // Pie chart for call status overview
  const pieChartData = totalCalls > 0 ? [
    { name: 'Active Calls', value: totalActiveCalls, fill: 'hsl(142, 72%, 40%)' },
    { name: 'Other Calls', value: Math.max(0, totalCalls - totalActiveCalls), fill: 'hsl(38, 92%, 50%)' },
  ].filter(item => item.value > 0) : [];

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

        {/* Stats Grid with Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground mt-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 text-success" />
                        <p className="text-xs text-muted-foreground">
                          {stat.change}
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pie Chart Card */}
          <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Call Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {pieChartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No call data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button
                variant="hero"
                size="lg"
                className="h-auto py-4 px-8 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setCreateProjectOpen(true)}
              >
                <FolderPlus className="h-5 w-5" />
                <span className="font-semibold">Create New Project</span>
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
            <BackendProjectList
              projects={backendProjects}
              loading={backendProjectsLoading}
              error={backendProjectsError}
              onRefresh={loadBackendProjects}
              onCreateProject={() => setCreateProjectOpen(true)}
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
        onOpenChange={(open) => {
          setCreateProjectOpen(open);
          if (!open) loadBackendProjects(); // Refresh when wizard closes
        }}
      />
    </div>
  );
};

export default VendorDashboard;
