import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useVendor, VendorData, RateCard } from '@/contexts/VendorContext';
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
  FileSpreadsheet,
  Edit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AdminPanel = () => {
  const { vendors, updateVendorStatus, calls, projects, rateCards, updateRateCard } = useVendor();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [editingRate, setEditingRate] = useState<RateCard | null>(null);
  const [rateForm, setRateForm] = useState({ baseRate: 0, perKmRate: 0, urgentMultiplier: 0 });

  const allCalls = calls.map((call) => {
    const project = projects.find((p) => p.id === call.projectId);
    const vendor = vendors.find((v) => v.id === project?.vendorId);
    return { ...call, project, vendor };
  });

  const handleRateEdit = (rate: RateCard) => {
    setEditingRate(rate);
    setRateForm({ baseRate: rate.baseRate, perKmRate: rate.perKmRate, urgentMultiplier: rate.urgentMultiplier });
  };

  const handleRateSave = () => {
    if (editingRate) {
      updateRateCard(editingRate.id, rateForm);
      toast({ title: 'Rate Updated', description: `${editingRate.serviceType} rates have been updated.` });
      setEditingRate(null);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.gstNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: vendors.length,
    pending: vendors.filter((v) => v.status === 'pending').length,
    approved: vendors.filter((v) => v.status === 'approved').length,
    rejected: vendors.filter((v) => v.status === 'rejected').length,
  };

  const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
    updateVendorStatus(id, status);
    toast({
      title: `Vendor ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      description: `The vendor has been ${status}`,
    });
    setSelectedVendor(null);
  };

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
          <Link to="/">
            <Button variant="outline" size="sm">
              Exit Admin
            </Button>
          </Link>
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
                <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
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
                <p className="text-2xl font-display font-bold text-foreground">{stats.pending}</p>
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
                <p className="text-2xl font-display font-bold text-foreground">{stats.approved}</p>
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
                <p className="text-2xl font-display font-bold text-foreground">{stats.rejected}</p>
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
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="vendors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="calls">All Calls</TabsTrigger>
            <TabsTrigger value="rates">Rate Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            {/* Existing vendor list content - moved here */}
            <div className="space-y-4">
              {filteredVendors.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No vendors found</p>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-card rounded-xl p-5 shadow-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                          {vendor.companyName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{vendor.companyName}</h3>
                          <p className="text-sm text-muted-foreground">{vendor.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">GST: {vendor.gstNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={vendor.status} />
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                      <TableCell className="font-medium">{call.vendor?.companyName || 'N/A'}</TableCell>
                      <TableCell>{call.customerName}</TableCell>
                      <TableCell>{call.project?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-mono">₹{call.orderAmount}</TableCell>
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
            <div className="bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Service Type</TableHead>
                    <TableHead className="text-right">Base Rate</TableHead>
                    <TableHead className="text-right">Per KM</TableHead>
                    <TableHead className="text-right">Urgent (×)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.serviceType}</TableCell>
                      <TableCell className="text-right font-mono">₹{card.baseRate}</TableCell>
                      <TableCell className="text-right font-mono">₹{card.perKmRate}</TableCell>
                      <TableCell className="text-right font-mono">{card.urgentMultiplier}×</TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="ghost" onClick={() => handleRateEdit(card)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Rate Edit Dialog */}
      <Dialog open={!!editingRate} onOpenChange={() => setEditingRate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rate: {editingRate?.serviceType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Base Rate (₹)</Label>
              <Input type="number" value={rateForm.baseRate} onChange={(e) => setRateForm({ ...rateForm, baseRate: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Per KM Rate (₹)</Label>
              <Input type="number" value={rateForm.perKmRate} onChange={(e) => setRateForm({ ...rateForm, perKmRate: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Urgent Multiplier</Label>
              <Input type="number" step="0.1" value={rateForm.urgentMultiplier} onChange={(e) => setRateForm({ ...rateForm, urgentMultiplier: Number(e.target.value) })} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setEditingRate(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleRateSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Detail Dialog */}
      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-2xl">
          {selectedVendor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl">
                    {selectedVendor.companyName.charAt(0)}
                  </div>
                  <div>
                    <DialogTitle className="font-display text-xl">
                      {selectedVendor.companyName}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedVendor.status} size="sm" />
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

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
                      <p className="text-sm font-medium text-foreground">{selectedVendor.phoneNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Person</p>
                    <p className="text-sm font-medium text-foreground">{selectedVendor.contactPersonName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Address</p>
                    <p className="text-sm font-medium text-foreground">{selectedVendor.businessAddress}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">GST Number</p>
                    <p className="text-sm font-mono font-medium text-foreground">{selectedVendor.gstNumber}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Registration Number</p>
                    <p className="text-sm font-mono font-medium text-foreground">{selectedVendor.registrationNumber}</p>
                  </div>
                </div>

                {selectedVendor.websiteUrl && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a
                        href={selectedVendor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {selectedVendor.websiteUrl}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Registration Date</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(selectedVendor.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {selectedVendor.status === 'pending' && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={() => handleStatusUpdate(selectedVendor.id, 'approved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Vendor
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleStatusUpdate(selectedVendor.id, 'rejected')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
