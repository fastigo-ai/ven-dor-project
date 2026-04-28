import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getFinancialOverview,
  listPendingPayouts,
  markPayoutsAsPaid,
  updateMaturationPolicy,
  FinancialOverview,
  AdminPayoutRecord,
  Vendor,
  listVendors,
} from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
import {
  IndianRupee,
  Clock,
  CheckCircle,
  Settings2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const AdminFinancialsTab = () => {
  const { toast } = useToast();
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<AdminPayoutRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [editingPolicy, setEditingPolicy] = useState(false);
  const [newMaturationDays, setNewMaturationDays] = useState(7);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovResult, pendingResult, vendorsResult] = await Promise.all([
        getFinancialOverview(),
        listPendingPayouts(),
        listVendors('APPROVED')
      ]);

      if (ovResult.data) setOverview(ovResult.data);
      if (pendingResult.data) setPendingPayouts(pendingResult.data);
      if (vendorsResult.data) setVendors(vendorsResult.data);

      if (ovResult.data?.config) {
        setNewMaturationDays(ovResult.data.config.maturation_days);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch financial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePolicy = async () => {
    setActionLoading(true);
    const result = await updateMaturationPolicy(newMaturationDays);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Policy Updated', description: result.data?.message });
      setEditingPolicy(false);
      fetchData();
    }
    setActionLoading(false);
  };

  const handleProcessPayouts = async () => {
    if (selectedPayouts.length === 0) return;

    setActionLoading(true);
    const result = await markPayoutsAsPaid(selectedPayouts);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({
        title: 'Payouts Processed',
        description: `Successfully marked ${selectedPayouts.length} payouts as PAID.`
      });
      setSelectedPayouts([]);
      fetchData();
    }
    setActionLoading(false);
  };

  const toggleSelectPayout = (id: string) => {
    setSelectedPayouts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPayouts.length === pendingPayouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(pendingPayouts.map(p => p._id));
    }
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v._id === vendorId)?.company_name || 'Unknown Vendor';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading platform financials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-glow bg-card overflow-hidden">
          <div className="h-1 bg-warning" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Upcoming Liability</p>
                <h3 className="text-3xl font-bold text-foreground">₹{overview?.UPCOMING.amount.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">{overview?.UPCOMING.count} pending jobs maturing</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-2xl">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-glow bg-card overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Mature Balance (DUE)</p>
                <h3 className="text-3xl font-bold text-primary">₹{overview?.DUE.amount.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">{overview?.DUE.count} records ready for processing</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-glow bg-card overflow-hidden">
          <div className="h-1 bg-success" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Paid Out</p>
                <h3 className="text-3xl font-bold text-success">₹{overview?.PAID.amount.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">Overall platform disbursements</p>
              </div>
              <div className="p-3 bg-success/10 rounded-2xl">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settlement Center */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Settlement Center
                <Badge variant="outline" className="text-primary border-primary/20">
                  {pendingPayouts.length} Ready
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground">Approve and process payments for matured jobs.</p>
            </div>

            <div className="flex items-center gap-3">
              {selectedPayouts.length > 0 && (
                <Button
                  onClick={handleProcessPayouts}
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary/90 shadow-glow animate-in slide-in-from-right"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Mark {selectedPayouts.length} as Paid
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={fetchData} className="rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedPayouts.length === pendingPayouts.length && pendingPayouts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matured At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <Wallet className="h-10 w-10 opacity-20" />
                        <p>No matured payouts found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingPayouts.map((payout) => (
                    <TableRow key={payout._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedPayouts.includes(payout._id)}
                          onCheckedChange={() => toggleSelectPayout(payout._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{getVendorName(payout.vendor_id)}</span>
                          <span className="text-xs text-muted-foreground font-mono">Job ID: {payout.call_id.slice(-8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">₹{payout.amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                          MATURE
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(payout.eligible_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Global Policy Settings */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-card bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Maturation Policy
              </CardTitle>
              <CardDescription>Adjust platform-wide settings.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Hold Period (Days)</label>
                <div className="flex items-center gap-3">
                  {editingPolicy ? (
                    <>
                      <Input
                        type="number"
                        value={newMaturationDays}
                        onChange={(e) => setNewMaturationDays(parseInt(e.target.value))}
                        className="w-20"
                      />
                      <Button size="sm" onClick={handleUpdatePolicy} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditingPolicy(false);
                        setNewMaturationDays(overview?.config.maturation_days || 7);
                      }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-primary">{overview?.config.maturation_days} <span className="text-sm text-muted-foreground font-normal">Days</span></div>
                      <Button size="icon" variant="ghost" onClick={() => setEditingPolicy(true)} className="ml-auto">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Pincode verification to payment eligibility window.</p>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <span>Changes apply to all new job completions.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auto-Settlement</span>
                  <Badge variant="outline" className="text-[10px] h-4">DISABLED</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dispute Rate</span>
                  <span className="font-medium">0.0%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancialsTab;
