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
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import { useVendor, ProjectData } from '@/contexts/VendorContext';
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
} from 'lucide-react';
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
  Vendor,
  RateCard,
  isAdminAuthenticated,
  clearAdminToken,
} from '@/services/adminApi';

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
  
  // Loading states
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [rateCardsLoading, setRateCardsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Error states
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [rateCardsError, setRateCardsError] = useState<string | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingRate, setEditingRate] = useState<RateCard | null>(null);
  const [rateForm, setRateForm] = useState({ base_rate: 0, per_km_rate: 0, urgent_multiplier: 0 });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Handle logout
  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin/login');
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
      base_rate: rate.base_rate, 
      per_km_rate: rate.per_km_rate, 
      urgent_multiplier: rate.urgent_multiplier 
    });
  };

  const handleRateSave = async () => {
    if (!editingRate) return;
    
    setActionLoading(true);
    const result = await updateRateCardApi(editingRate.support_type, rateForm);
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Rate Updated', description: `${editingRate.support_type} rates have been updated.` });
      setEditingRate(null);
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
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">
                Exit Admin
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
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
                  <p className="text-2xl font-display font-bold text-foreground">{stats.pending}</p>
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
                  <p className="text-2xl font-display font-bold text-foreground">{stats.approved}</p>
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
                  <p className="text-2xl font-display font-bold text-foreground">{stats.rejected}</p>
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
        <Tabs defaultValue="vendors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="calls">All Calls</TabsTrigger>
            <TabsTrigger value="rates">Rate Cards</TabsTrigger>
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
                    onClick={() => setSelectedVendor(vendor)}
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
            <div className="bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Vendor</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Support Type</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Total Calls</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProjects.map((project) => (
                    <TableRow 
                      key={project.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedProject(project)}
                    >
                      <TableCell className="font-medium">{project.vendor?.company_name || 'N/A'}</TableCell>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.supportType}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          project.status === 'active' && 'bg-success/10 text-success',
                          project.status === 'on-hold' && 'bg-warning/10 text-warning',
                          project.status === 'completed' && 'bg-muted text-muted-foreground'
                        )}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{project.totalCalls}</TableCell>
                      <TableCell className="text-center">{project.completedCalls}</TableCell>
                      <TableCell className="text-right font-mono">₹{project.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <div className="bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Company</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {allCalls.slice(0, 20).map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">{call.vendor?.company_name || 'N/A'}</TableCell>
                        <TableCell>{call.branchName}</TableCell>
                        <TableCell>{call.project?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{call.assetsCount} assets</TableCell>
                        <TableCell>
                        <Badge variant="outline" className={cn(
                          call.status === 'completed' && 'bg-success/10 text-success',
                          call.status === 'pending' && 'bg-warning/10 text-warning',
                          call.status === 'assigned' && 'bg-primary/10 text-primary'
                        )}>
                          {call.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="rates">
            {rateCardsError ? (
              <ErrorState message={rateCardsError} onRetry={fetchRateCards} />
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Support Type</TableHead>
                      <TableHead className="text-right">Base Rate</TableHead>
                      <TableHead className="text-right">Per KM</TableHead>
                      <TableHead className="text-right">Urgent (×)</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateCardsLoading ? (
                      [1, 2, 3].map((i) => <RateCardSkeleton key={i} />)
                    ) : rateCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No rate cards found
                        </TableCell>
                      </TableRow>
                    ) : (
                      rateCards.map((card) => (
                        <TableRow key={card._id || card.support_type}>
                          <TableCell className="font-medium">{card.support_type}</TableCell>
                          <TableCell className="text-right font-mono">₹{card.base_rate}</TableCell>
                          <TableCell className="text-right font-mono">₹{card.per_km_rate}</TableCell>
                          <TableCell className="text-right font-mono">{card.urgent_multiplier}×</TableCell>
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
        </Tabs>
      </main>

      {/* Rate Edit Dialog */}
      <Dialog open={!!editingRate} onOpenChange={() => setEditingRate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rate: {editingRate?.support_type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Base Rate (₹)</Label>
              <Input type="number" value={rateForm.base_rate} onChange={(e) => setRateForm({ ...rateForm, base_rate: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Per KM Rate (₹)</Label>
              <Input type="number" value={rateForm.per_km_rate} onChange={(e) => setRateForm({ ...rateForm, per_km_rate: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Urgent Multiplier</Label>
              <Input type="number" step="0.1" value={rateForm.urgent_multiplier} onChange={(e) => setRateForm({ ...rateForm, urgent_multiplier: Number(e.target.value) })} />
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
              {(() => {
                const vendorStats = getVendorStats(selectedVendor._id);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="p-3 bg-primary/5 rounded-lg text-center">
                      <FolderKanban className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{vendorStats.projectCount}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="p-3 bg-success/5 rounded-lg text-center">
                      <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{vendorStats.activeProjects}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="p-3 bg-warning/5 rounded-lg text-center">
                      <PhoneCall className="w-5 h-5 text-warning mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{vendorStats.callCount}</p>
                      <p className="text-xs text-muted-foreground">Calls</p>
                    </div>
                    <div className="p-3 bg-accent/10 rounded-lg text-center">
                      <IndianRupee className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">₹{vendorStats.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                );
              })()}

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
                      <p className="text-sm font-medium text-foreground">{selectedVendor.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Address</p>
                    <p className="text-sm font-medium text-foreground">{selectedVendor.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">GST Number</p>
                  <p className="text-sm font-mono font-medium text-foreground">{selectedVendor.gst_number}</p>
                </div>

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
    </div>
  );
};

export default AdminPanel;
