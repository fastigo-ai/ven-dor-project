import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import { useVendor } from '@/contexts/VendorContext';
import { ProjectData } from '@/types/vendor';
import ProjectDetailsDialog from '@/components/vendor/ProjectDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  ShieldCheck,
  IndianRupee,
  Edit2,
  Ban,
  FolderKanban,
  PhoneCall,
  Loader2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Plus,
  ArrowLeft,
  Pause,
  Play,
  Bell,
  Check,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listVendors,
  listRateCards,
  approveVendor,
  rejectVendor,
  blockVendor,
  updateRateCard as updateRateCardApi,
  addRateCard as addRateCardApi,
  listProjectsByVendor,
  getProjectDetails,
  pauseProject,
  resumeProject,
  holdCall,
  resumeCall,
  Vendor,
  RateCard,
  RateCardCreate,
  AdminProject,
  AdminCall,
  ProjectDetailsResponse,
  isAdminAuthenticated,
  adminLogout,
} from '@/services/adminApi';
import AdminFinancialsTab from '@/components/admin/AdminFinancialsTab';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { calls, projects } = useVendor();
  const { toast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // API data state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [adminCalls, setAdminCalls] = useState<AdminCall[]>([]);

  // Loading states
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [rateCardsLoading, setRateCardsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [callsLoading, setCallsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Error states
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [rateCardsError, setRateCardsError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [callsError, setCallsError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingRate, setEditingRate] = useState<RateCard | null>(null);
  const [rateForm, setRateForm] = useState({
    base_price: 0,
    per_asset_price: 0,
    sla_minutes: 240,
    sla_multipliers: { urgent: 1.5, express: 1.25 } as Record<string, number>,
    vendor_id: null as string | null
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [selectedVendorForProjects, setSelectedVendorForProjects] = useState<string | null>(null);
  const [selectedProjectForCalls, setSelectedProjectForCalls] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('vendors');
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);

  // Hold call dialog state
  const [showHoldCallDialog, setShowHoldCallDialog] = useState(false);
  const [holdCallId, setHoldCallId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState('');

  // Vendor summary state
  const [vendorSummary, setVendorSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Admin notifications state
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);

  // Create Rate Card state
  const [showCreateRate, setShowCreateRate] = useState(false);
  const [createRateForm, setCreateRateForm] = useState<RateCardCreate>({
    support_type: '',
    base_price: 0,
    per_asset_price: 0,
    sla_minutes: 240,
    sla_multipliers: { urgent: 1.5, express: 1.25 },
    vendor_id: null
  });

  // Handle logout
  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const fetchAdminAlerts = async () => {
    const { fetchAdminNotifications, fetchAdminUnreadCount } = await import('@/services/adminApi');
    const [notifs, count] = await Promise.all([
      fetchAdminNotifications(),
      fetchAdminUnreadCount()
    ]);
    
    if (notifs.data) setAdminNotifications(notifs.data);
    if (count.data) setUnreadAdminCount(count.data.unread_count);
  };

  const handleMarkNotifRead = async (id: string) => {
    const { markAdminNotificationRead } = await import('@/services/adminApi');
    await markAdminNotificationRead(id);
    fetchAdminAlerts();
  };

  useEffect(() => {
    fetchAdminAlerts();
    const interval = setInterval(fetchAdminAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle vendor selection and fetch stats
  const handleVendorSelect = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSummaryLoading(true);
    setVendorSummary(null);

    const { getVendorFinancialSummary } = await import('@/services/adminApi');
    const result = await getVendorFinancialSummary(vendor._id);
    
    if (result.data) {
      setVendorSummary(result.data);
    }
    setSummaryLoading(false);
  };

  // Fetch vendors from API
  const fetchVendors = async () => {
    setVendorsLoading(true);
    setVendorsError(null);

    const statusParam = statusFilter === 'all' ? undefined : statusFilter;
    const result = await listVendors(statusParam);

    if (result.error) {
      setVendorsError(result.error);
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else if (result.data) {
      setVendors(result.data);
    }

    setVendorsLoading(false);
  };

  // Fetch rate cards from API
  const fetchRateCards = async () => {
    setRateCardsLoading(true);
    setRateCardsError(null);

    const result = await listRateCards();

    if (result.error) {
      setRateCardsError(result.error);
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else if (result.data) {
      setRateCards(result.data);
    }

    setRateCardsLoading(false);
  };

  // Fetch projects by vendor ID
  const fetchProjectsByVendor = async (vendorId: string) => {
    setProjectsLoading(true);
    setProjectsError(null);
    setSelectedVendorForProjects(vendorId);

    const result = await listProjectsByVendor(vendorId);

    if (result.error) {
      setProjectsError(result.error);
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else if (result.data) {
      setAdminProjects(result.data);
    }

    setProjectsLoading(false);
  };

  // Fetch project details with calls and navigate to All Calls tab
  const fetchProjectDetails = async (projectId: string, projectName: string) => {
    setCallsLoading(true);
    setCallsError(null);
    setSelectedProjectForCalls(projectId);
    setSelectedProjectName(projectName);

    const result = await getProjectDetails(projectId);

    if (result.error) {
      setCallsError(result.error);
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else if (result.data) {
      setAdminCalls(result.data.calls);
      // Switch to All Calls tab after loading
      setActiveTab('calls');
    }

    setCallsLoading(false);
  };

  // Handle back from calls to projects
  const handleBackToProjects = () => {
    setActiveTab('projects');
  };

  // Helper to check if status indicates paused/on-hold
  const isHoldStatus = (status: string) => {
    const normalized = status?.toLowerCase() || '';
    return normalized === 'on-hold' || normalized === 'on_hold' || normalized === 'hold' || normalized === 'paused';
  };

  // Handle project pause/resume
  const handleProjectPauseResume = async (projectId: string, currentStatus: string) => {
    setActionLoading(true);
    const isPaused = isHoldStatus(currentStatus);

    const result = isPaused
      ? await resumeProject(projectId)
      : await pauseProject(projectId);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({
        title: isPaused ? 'Project Resumed' : 'Project Paused',
        description: result.data?.message
      });
      // Refresh project list
      if (selectedVendorForProjects) {
        await fetchProjectsByVendor(selectedVendorForProjects);
      }
    }
    setActionLoading(false);
  };

  // Open hold call dialog
  const openHoldCallDialog = (callId: string) => {
    setHoldCallId(callId);
    setHoldReason('');
    setShowHoldCallDialog(true);
  };

  // Handle call hold with reason
  const handleHoldCall = async () => {
    if (!holdCallId || !holdReason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason for holding the call', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    const result = await holdCall(holdCallId, holdReason.trim());

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Call Held', description: result.data?.message });
      setShowHoldCallDialog(false);
      setHoldCallId(null);
      setHoldReason('');
      // Refresh calls list
      if (selectedProjectForCalls) {
        await fetchProjectDetails(selectedProjectForCalls, selectedProjectName || '');
      }
    }
    setActionLoading(false);
  };

  // Handle call resume
  const handleResumeCall = async (callId: string) => {
    setActionLoading(true);
    const result = await resumeCall(callId);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Call Resumed', description: result.data?.message });
      // Refresh calls list
      if (selectedProjectForCalls) {
        await fetchProjectDetails(selectedProjectForCalls, selectedProjectName || '');
      }
    }
    setActionLoading(false);
  };

  // Initial data fetch
  useEffect(() => {
    fetchVendors();
    fetchRateCards();
  }, []);

  // Refetch vendors when status filter changes
  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const allCalls = calls.map((call) => {
    const project = projects.find((p) => p.id === call.projectId);
    const vendor = vendors.find((v) => v._id === project?.vendorId);
    return { ...call, project, vendor };
  });

  const handleRateEdit = (rate: RateCard) => {
    setEditingRate(rate);
    setRateForm({
      base_price: rate.base_price,
      per_asset_price: rate.per_asset_price,
      sla_minutes: rate.sla_minutes,
      sla_multipliers: rate.sla_multipliers || { urgent: 1.5, express: 1.25 },
      vendor_id: rate.vendor_id || null
    });
  };

  const handleRateSave = async () => {
    if (!editingRate) return;

    setActionLoading(true);
    const result = await updateRateCardApi(editingRate.support_type, rateForm);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      const scopeText = rateForm.vendor_id
        ? `custom rate for ${vendors.find(v => v._id === rateForm.vendor_id)?.company_name}`
        : 'global rates';

      toast({
        title: 'Rate Updated',
        description: `${editingRate.support_type} ${scopeText} have been updated.`
      });
      setEditingRate(null);
      fetchRateCards(); // Refresh rate cards
    }

    setActionLoading(false);
  };

  // Handle Create Rate Card
  const handleCreateRate = async () => {
    if (!createRateForm.support_type.trim()) {
      toast({ title: 'Error', description: 'Support type is required', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    const result = await addRateCardApi(createRateForm);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Rate Card Created', description: `${createRateForm.support_type} rate card has been created.` });
      setShowCreateRate(false);
      setCreateRateForm({ support_type: '', base_price: 0, per_asset_price: 0, sla_minutes: 240, sla_multipliers: { urgent: 1.5, express: 1.25 }, vendor_id: null });
      fetchRateCards(); // Refresh rate cards
    }

    setActionLoading(false);
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.gst_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: vendors.length,
    pending: vendors.filter((v) => v.status === 'PENDING').length,
    approved: vendors.filter((v) => v.status === 'APPROVED').length,
    rejected: vendors.filter((v) => v.status === 'REJECTED').length,
  };

  const handleApproveVendor = async (vendorId: string) => {
    setActionLoading(true);
    const result = await approveVendor(vendorId);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Vendor Approved', description: 'The vendor has been approved successfully.' });
      setSelectedVendor(null);
      fetchVendors(); // Refresh vendors list
    }

    setActionLoading(false);
  };

  const handleRejectVendor = async (vendorId: string, reason?: string) => {
    setActionLoading(true);
    const result = await rejectVendor(vendorId, reason);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({
        title: 'Vendor Rejected',
        description: reason ? `Rejected: ${reason}` : 'The vendor has been rejected.',
      });
      setSelectedVendor(null);
      setRejectionReason('');
      setShowRejectConfirm(false);
      fetchVendors(); // Refresh vendors list
    }

    setActionLoading(false);
  };

  const handleBlockVendor = async (vendorId: string) => {
    setActionLoading(true);
    const result = await blockVendor(vendorId);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({
        title: 'Vendor Blocked',
        description: 'The vendor has been blocked and cannot access the portal.',
        variant: 'destructive',
      });
      setSelectedVendor(null);
      fetchVendors(); // Refresh vendors list
    }

    setActionLoading(false);
  };

  // Get vendor stats (using local projects/calls for now)
  const getVendorStats = (vendorId: string) => {
    const vendorProjects = projects.filter(p => p.vendorId === vendorId);
    const vendorCalls = calls.filter(c => vendorProjects.some(p => p.id === c.projectId));
    const totalRevenue = vendorCalls.reduce((sum, call) => sum + call.assetsCount * 100, 0);
    return {
      projectCount: vendorProjects.length,
      callCount: vendorCalls.length,
      revenue: totalRevenue,
      activeProjects: vendorProjects.filter(p => p.status === 'active').length,
    };
  };

  // All projects with vendor info
  const allProjects = projects.map(project => {
    const vendor = vendors.find(v => v._id === project.vendorId);
    const projectCalls = calls.filter(c => c.projectId === project.id);
    return { ...project, vendor, calls: projectCalls };
  });

  // Loading skeleton component
  const VendorSkeleton = () => (
    <div className="bg-card rounded-xl p-5 shadow-card border border-border">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );

  const RateCardSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  );

  // Error component
  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="text-center py-12 bg-card rounded-xl border border-destructive/30">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground mb-2">Failed to load data</p>
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Exit Admin
              </Button>
            </Link>

            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-muted/50">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadAdminCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground animate-pulse">
                      {unreadAdminCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4 mt-2 border-border/50 shadow-2xl backdrop-blur-xl bg-background/95" align="end">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-widest">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadAdminCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary"
                        onClick={async () => {
                          const { markAllAdminNotificationsRead } = await import('@/services/adminApi');
                          await markAllAdminNotificationsRead();
                          fetchAdminAlerts();
                        }}
                      >
                        Mark all as read
                      </Button>
                    )}
                    <Badge variant="secondary" className="text-[10px] font-black">{unreadAdminCount} New</Badge>
                  </div>
                </div>
                <ScrollArea className="h-[400px]">
                  {adminNotifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto opacity-20 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {adminNotifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          className={cn(
                            "p-4 border-b border-border/40 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                            !notif.is_read && "bg-primary/5"
                          )}
                          onClick={() => !notif.is_read && handleMarkNotifRead(notif._id)}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-black text-[11px] uppercase tracking-tighter text-foreground leading-none">{notif.title}</h4>
                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-tight font-medium">{notif.message}</p>
                          {!notif.is_read && (
                            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 font-bold text-xs uppercase tracking-tighter">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Vendor Management
          </h1>
          <p className="text-muted-foreground">
            Review and manage vendor registration requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                {vendorsLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Vendors</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                {vendorsLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-3xl font-black tracking-tighter text-foreground">{stats.pending}</p>
                )}
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                {vendorsLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-3xl font-black tracking-tighter text-foreground">{stats.approved}</p>
                )}
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                {vendorsLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-3xl font-black tracking-tighter text-foreground">{stats.rejected}</p>
                )}
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by company, email, or GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status.toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="calls">All Calls</TabsTrigger>
            <TabsTrigger value="rates">Rate Cards</TabsTrigger>
            <TabsTrigger value="financials" className="gap-2">
              <IndianRupee className="h-4 w-4" />
              Financials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            {vendorsError ? (
              <ErrorState message={vendorsError} onRetry={fetchVendors} />
            ) : vendorsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <VendorSkeleton key={i} />)}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">No vendors found</p>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className="bg-card rounded-xl p-5 shadow-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => handleVendorSelect(vendor)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                          {vendor.company_name?.charAt(0) || 'V'}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{vendor.company_name}</h3>
                          <p className="text-sm text-muted-foreground">{vendor.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">GST: {vendor.gst_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={vendor.status?.toLowerCase() as any} />
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects">
            <div className="mb-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Select Vendor to View Projects</Label>
              <div className="flex flex-wrap gap-2">
                {vendors.filter(v => v.status === 'APPROVED').map((vendor) => (
                  <Button
                    key={vendor._id}
                    variant={selectedVendorForProjects === vendor._id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => fetchProjectsByVendor(vendor._id)}
                  >
                    {vendor.company_name}
                  </Button>
                ))}
              </div>
            </div>

            {projectsError ? (
              <div className="text-center py-12 bg-card rounded-xl border border-destructive/30">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Failed to load projects</p>
                <p className="text-muted-foreground mb-4">{projectsError}</p>
                {selectedVendorForProjects && (
                  <Button variant="outline" onClick={() => fetchProjectsByVendor(selectedVendorForProjects)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            ) : !selectedVendorForProjects ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Select a vendor</p>
                <p className="text-muted-foreground">Choose a vendor above to view their projects</p>
              </div>
            ) : projectsLoading ? (
              <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Project Name</TableHead>
                      <TableHead>Support Type</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : adminProjects.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">No projects found</p>
                <p className="text-muted-foreground">This vendor has no projects yet</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Project Name</TableHead>
                      <TableHead>Support Type</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminProjects.map((project) => (
                      <TableRow key={project.project_id}>
                        <TableCell className="font-medium">{project.project_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.support_type}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            project.status?.toLowerCase() === 'active' && 'bg-success/10 text-success',
                            isHoldStatus(project.status) && 'bg-warning/10 text-warning',
                            project.status?.toLowerCase() === 'completed' && 'bg-muted text-muted-foreground'
                          )}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchProjectDetails(project.project_id, project.project_name)}
                            >
                              <PhoneCall className="w-4 h-4 mr-1" />
                              View Calls
                            </Button>
                            {project.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant={isHoldStatus(project.status) ? 'default' : 'outline'}
                                onClick={() => handleProjectPauseResume(project.project_id, project.status)}
                                disabled={actionLoading}
                                className="gap-1"
                              >
                                {isHoldStatus(project.status) ? (
                                  <>
                                    <Play className="w-4 h-4" />
                                    Resume
                                  </>
                                ) : (
                                  <>
                                    <Pause className="w-4 h-4" />
                                    Pause
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calls">
            {selectedProjectForCalls && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Viewing calls for project:</span>
                  <Badge variant="secondary">
                    {selectedProjectName || adminProjects.find(p => p.project_id === selectedProjectForCalls)?.project_name || selectedProjectForCalls}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToProjects}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Projects
                </Button>
              </div>
            )}

            {callsError ? (
              <div className="text-center py-12 bg-card rounded-xl border border-destructive/30">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Failed to load calls</p>
                <p className="text-muted-foreground mb-4">{callsError}</p>
                {selectedProjectForCalls && (
                  <Button variant="outline" onClick={() => fetchProjectDetails(selectedProjectForCalls, '')}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            ) : !selectedProjectForCalls ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <PhoneCall className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Select a project first</p>
                <p className="text-muted-foreground">Go to the Projects tab, select a vendor, then click "View Calls" on a project</p>
              </div>
            ) : callsLoading ? (
              <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Pincode</TableHead>
                      <TableHead>Asset Type</TableHead>
                      <TableHead className="text-right">Assets</TableHead>
                      <TableHead>Serviceable</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : adminCalls.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <PhoneCall className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">No calls found</p>
                <p className="text-muted-foreground">This project has no calls yet</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Pincode</TableHead>
                      <TableHead>Asset Type</TableHead>
                      <TableHead className="text-right">Assets</TableHead>
                      <TableHead>Serviceable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminCalls.map((call) => (
                      <TableRow key={call.call_id}>
                        <TableCell className="font-medium">{call.branch_name || 'N/A'}</TableCell>
                        <TableCell>{call.pincode || 'N/A'}</TableCell>
                        <TableCell>{call.asset_type || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{call.assets_count || 0}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            call.serviceable && 'bg-success/10 text-success',
                            !call.serviceable && 'bg-muted text-muted-foreground'
                          )}>
                            {call.serviceable ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            call.status?.toLowerCase() === 'completed' && 'bg-success/10 text-success',
                            call.status?.toLowerCase() === 'pending' && 'bg-warning/10 text-warning',
                            call.status?.toLowerCase() === 'assigned' && 'bg-primary/10 text-primary',
                            isHoldStatus(call.status) && 'bg-warning/10 text-warning'
                          )}>
                            {call.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {call.status?.toLowerCase() !== 'completed' && call.status?.toLowerCase() !== 'cancelled' && (
                            isHoldStatus(call.status) ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleResumeCall(call.call_id)}
                                disabled={actionLoading}
                                className="gap-1"
                              >
                                <Play className="w-4 h-4" />
                                Resume
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openHoldCallDialog(call.call_id)}
                                disabled={actionLoading}
                                className="gap-1"
                              >
                                <Pause className="w-4 h-4" />
                                Hold
                              </Button>
                            )
                          )}
                          {(call.status?.toLowerCase() === 'completed' || call.status?.toLowerCase() === 'cancelled') && (
                            <Badge variant="outline" className={cn(
                              call.status?.toLowerCase() === 'completed' && 'bg-success/10 text-success',
                              call.status?.toLowerCase() === 'cancelled' && 'bg-destructive/10 text-destructive'
                            )}>
                              {call.status?.toLowerCase() === 'completed' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" />Done</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" />Cancelled</>
                              )}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rates">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-lg text-foreground">Rate Cards</h3>
              <Button onClick={() => setShowCreateRate(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Rate Card
              </Button>
            </div>
            {rateCardsError ? (
              <ErrorState message={rateCardsError} onRetry={fetchRateCards} />
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Support Type</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="text-right">Base Price (₹)</TableHead>
                      <TableHead className="text-right">Per Asset (₹)</TableHead>
                      <TableHead className="text-right">SLA (m)</TableHead>
                      <TableHead className="text-right">Multipliers</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateCardsLoading ? (
                      [1, 2, 3].map((i) => <RateCardSkeleton key={i} />)
                    ) : rateCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No rate cards found. Click "Add Rate Card" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rateCards.map((card) => (
                        <TableRow key={card._id || `${card.support_type}-${card.vendor_id}`}>
                          <TableCell className="font-medium capitalize">{card.support_type}</TableCell>
                          <TableCell>
                            {card.vendor_id ? (
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                {vendors.find(v => v._id === card.vendor_id)?.company_name || 'Specific Vendor'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Global Default</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">₹{card.base_price}</TableCell>
                          <TableCell className="text-right font-mono">₹{card.per_asset_price}</TableCell>
                          <TableCell className="text-right font-mono">{card.sla_minutes}m</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {card.sla_multipliers ? Object.entries(card.sla_multipliers).map(([key, val]) => `${key}: ${val}×`).join(', ') : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" variant="ghost" onClick={() => handleRateEdit(card)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="financials">
            <AdminFinancialsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Rate Edit Dialog */}
      <Dialog open={!!editingRate} onOpenChange={() => setEditingRate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rate: {editingRate?.support_type}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2 py-2 -mr-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Target Scope (Vendor)</Label>
                <Select
                  value={rateForm.vendor_id || "global"}
                  onValueChange={(value) => setRateForm({ ...rateForm, vendor_id: value === "global" ? null : value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select target scope" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="global">Global Default (All Vendors)</SelectItem>
                    {vendors.filter(v => v.status === 'APPROVED').map(vendor => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        {vendor.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base Price (₹)</Label>
                <Input type="number" value={rateForm.base_price} onChange={(e) => setRateForm({ ...rateForm, base_price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Per Asset Price (₹)</Label>
                <Input type="number" value={rateForm.per_asset_price} onChange={(e) => setRateForm({ ...rateForm, per_asset_price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>SLA Minutes</Label>
                <Input type="number" value={rateForm.sla_minutes} onChange={(e) => setRateForm({ ...rateForm, sla_minutes: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Urgent Multiplier</Label>
                <Input type="number" step="0.1" value={rateForm.sla_multipliers.urgent || 1.5} onChange={(e) => setRateForm({ ...rateForm, sla_multipliers: { ...rateForm.sla_multipliers, urgent: Number(e.target.value) } })} />
              </div>
              <div className="space-y-2">
                <Label>Express Multiplier</Label>
                <Input type="number" step="0.1" value={rateForm.sla_multipliers.express || 1.25} onChange={(e) => setRateForm({ ...rateForm, sla_multipliers: { ...rateForm.sla_multipliers, express: Number(e.target.value) } })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingRate(null)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleRateSave} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Rate Card Dialog */}
      <Dialog open={showCreateRate} onOpenChange={(open) => {
        setShowCreateRate(open);
        if (!open) setCreateRateForm({ support_type: '', base_price: 0, per_asset_price: 0, sla_minutes: 240, sla_multipliers: { urgent: 1.5, express: 1.25 }, vendor_id: null });
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Rate Card</DialogTitle>
            <DialogDescription>
              Add a new support type with pricing details.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2 py-2 -mr-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Support Type *</Label>
                <Select
                  value={createRateForm.support_type}
                  onValueChange={(value) => setCreateRateForm({ ...createRateForm, support_type: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select support type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="pm activity">PM Activity</SelectItem>
                    <SelectItem value="breakfix">Breakfix</SelectItem>
                    <SelectItem value="on call">On Call</SelectItem>
                    <SelectItem value="server call">Server Call</SelectItem>
                    <SelectItem value="desktop installation">Desktop Installation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Scope (Vendor) *</Label>
                <Select
                  value={createRateForm.vendor_id || "global"}
                  onValueChange={(value) => setCreateRateForm({ ...createRateForm, vendor_id: value === "global" ? null : value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select target scope" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="global">Global Default (All Vendors)</SelectItem>
                    {vendors.filter(v => v.status === 'APPROVED').map(vendor => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        {vendor.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground ">
                  {createRateForm.vendor_id
                    ? "This rate will only apply to the selected vendor, overriding global defaults."
                    : "This will be the standard rate for all vendors who don't have an override."}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Base Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={createRateForm.base_price}
                  onChange={(e) => setCreateRateForm({ ...createRateForm, base_price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Per Asset Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={createRateForm.per_asset_price}
                  onChange={(e) => setCreateRateForm({ ...createRateForm, per_asset_price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>SLA Minutes</Label>
                <Input
                  type="number"
                  placeholder="240"
                  value={createRateForm.sla_minutes}
                  onChange={(e) => setCreateRateForm({ ...createRateForm, sla_minutes: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Service Level Agreement response time in minutes</p>
              </div>
              <div className="space-y-2">
                <Label>Urgent Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                  value={createRateForm.sla_multipliers.urgent}
                  onChange={(e) => setCreateRateForm({ ...createRateForm, sla_multipliers: { ...createRateForm.sla_multipliers, urgent: Number(e.target.value) } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Express Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1.25"
                  value={createRateForm.sla_multipliers.express}
                  onChange={(e) => setCreateRateForm({ ...createRateForm, sla_multipliers: { ...createRateForm.sla_multipliers, express: Number(e.target.value) } })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateRate(false);
                    setCreateRateForm({ support_type: '', base_price: 0, per_asset_price: 0, sla_minutes: 240, sla_multipliers: { urgent: 1.5, express: 1.25 }, vendor_id: null });
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreateRate} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Rate Card
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Detail Dialog */}
      <Dialog open={!!selectedVendor && !showRejectConfirm} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVendor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl">
                    {selectedVendor.company_name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <DialogTitle className="font-display text-xl">
                      {selectedVendor.company_name}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedVendor.status?.toLowerCase() as any} size="sm" />
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Vendor Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 bg-primary/5 rounded-lg text-center">
                  <FolderKanban className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {summaryLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : vendorSummary?.project_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="p-3 bg-success/5 rounded-lg text-center">
                  <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {summaryLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : vendorSummary?.active_project_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="p-3 bg-warning/5 rounded-lg text-center">
                  <PhoneCall className="w-5 h-5 text-warning mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {summaryLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : vendorSummary?.call_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Calls</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg text-center">
                  <IndianRupee className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {summaryLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : `₹${(vendorSummary?.paid_total || 0).toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{selectedVendor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground">{selectedVendor.phone_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Address</p>
                    <p className="text-sm font-medium text-foreground">{selectedVendor.business_address || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">GST Number</p>
                  <p className="text-sm font-mono font-medium text-foreground">{selectedVendor.gst_number}</p>
                </div>

                {selectedVendor.contact_person_name && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <p className="text-sm font-medium text-foreground">{selectedVendor.contact_person_name}</p>
                    </div>
                  </div>
                )}

                {selectedVendor.created_at && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Registration Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selectedVendor.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedVendor.status === 'PENDING' && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={() => handleApproveVendor(selectedVendor._id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve Vendor
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedVendor.status === 'APPROVED' && (
                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleBlockVendor(selectedVendor._id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                    Block Vendor
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectConfirm} onOpenChange={(open) => {
        setShowRejectConfirm(open);
        if (!open) setRejectionReason('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Vendor</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedVendor?.company_name}. This will be sent to the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rejection Reason (Optional)</Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectConfirm(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => selectedVendor && handleRejectVendor(selectedVendor._id, rejectionReason)}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
        project={selectedProject}
        calls={calls}
      />

      {/* Hold Call Dialog */}
      <Dialog open={showHoldCallDialog} onOpenChange={(open) => {
        setShowHoldCallDialog(open);
        if (!open) {
          setHoldCallId(null);
          setHoldReason('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hold Call</DialogTitle>
            <DialogDescription>
              Provide a reason for holding this call. This will be recorded in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Hold Reason <span className="text-destructive">*</span></Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter reason for holding the call..."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowHoldCallDialog(false);
                  setHoldCallId(null);
                  setHoldReason('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleHoldCall}
                disabled={actionLoading || !holdReason.trim()}
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Pause className="w-4 h-4 mr-2" />
                Hold Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
