import { useState, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getFinancialOverview,
  listPendingPayouts,
  markPayoutsAsPaid,
  updateMaturationPolicy,
  Vendor,
  listVendors,
  getVendorFinancialSummary,
  updateVendorMaturationPolicy,
  getBillingTransactions,
  reconcileOrder
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
  ShieldCheck,
  PieChart as PieIcon,
  Filter,
  CreditCard,
  Banknote,
  AlertTriangle,
  Calendar,
  History,
  Search,
  ExternalLink,
  ChevronRight,
  User,
  Download
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import PayoutStatusBadge from '@/components/PayoutStatusBadge';

const AdminFinancialsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVendorId, setSelectedVendorId] = useState<string>('global');
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Queries
  const {
    data: overviewData,
    isLoading: overviewLoading,
    refetch: refetchOverview
  } = useQuery({
    queryKey: ['adminFinancialOverview'],
    queryFn: getFinancialOverview,
    refetchInterval: 30000,
  });

  const {
    data: pendingPayoutsData,
    isLoading: pendingLoading,
    refetch: refetchPending
  } = useQuery({
    queryKey: ['adminPendingPayouts'],
    queryFn: listPendingPayouts
  });

  const {
    data: vendorsData
  } = useQuery({
    queryKey: ['adminVendors'],
    queryFn: () => listVendors('APPROVED')
  });

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['adminTransactions', selectedVendorId],
    queryFn: () => getBillingTransactions(selectedVendorId),
    refetchInterval: 30000,
  });

  const {
    data: vendorOverviewData,
    isLoading: vendorOverviewLoading
  } = useQuery({
    queryKey: ['adminVendorFinancials', selectedVendorId],
    queryFn: () => getVendorFinancialSummary(selectedVendorId),
    enabled: selectedVendorId !== 'global'
  });

  // Mutations
  const processPayoutsMutation = useMutation({
    mutationFn: markPayoutsAsPaid,
    onSuccess: (result) => {
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({
          title: 'Records Updated',
          description: `Successfully marked ${selectedPayouts.length} records as PAID manually.`
        });
        setSelectedPayouts([]);
        queryClient.invalidateQueries({ queryKey: ['adminFinancialOverview'] });
        queryClient.invalidateQueries({ queryKey: ['adminPendingPayouts'] });
      }
    }
  });

  const vendorPolicyMutation = useMutation({
    mutationFn: (days: number) => updateVendorMaturationPolicy(selectedVendorId, days),
    onSuccess: (result) => {
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({
          title: 'Vendor Policy Updated',
          description: 'Custom maturation window set for this vendor.'
        });
        queryClient.invalidateQueries({ queryKey: ['adminVendorFinancials', selectedVendorId] });
      }
    }
  });

  const reconcileMutation = useMutation({
    mutationFn: reconcileOrder,
    onSuccess: (result: any) => {
      if (result.error) {
        toast({ title: 'Sync Failed', description: result.error, variant: 'destructive' });
      } else {
        toast({
          title: 'Success',
          description: result.data?.message || 'Order reconciled successfully.'
        });
        queryClient.invalidateQueries({ queryKey: ['adminFinancialOverview'] });
        queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['adminPendingPayouts'] });
      }
    }
  });

  const overview = overviewData?.data;
  const pendingPayouts = pendingPayoutsData?.data || [];
  const vendors = vendorsData?.data || [];
  const transactions = transactionsData?.data || [];

  const chartData = useMemo(() => {
    if (!overview) return [];
    const upcoming = overview.UPCOMING?.amount ?? (overview as any).unbilled_balance ?? 0;
    const due = overview.DUE?.amount ?? (overview as any).billable_balance ?? 0;
    const paid = overview.PAID?.amount ?? (overview as any).paid_total ?? 0;

    return [
      { name: 'Unbilled', value: upcoming, color: '#f59e0b' },
      { name: 'Billable', value: due, color: '#10b981' },
      { name: 'Paid', value: paid, color: '#3b82f6' },
    ];
  }, [overview]);

  const filteredPayouts = useMemo(() => {
    let list = pendingPayouts;
    if (selectedVendorId !== 'global') {
      list = list.filter(p => p.vendor_id === selectedVendorId);
    }
    if (searchTerm) {
      list = list.filter(p =>
        p.call_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [pendingPayouts, selectedVendorId, searchTerm]);

  const togglePayout = (id: string) => {
    setSelectedPayouts(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedPayouts.length === filteredPayouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(filteredPayouts.map(p => p._id));
    }
  };

  const getVendorName = (id: string) => {
    if (id === 'global') return 'All Vendors';
    const v = vendors.find(v => v._id === id);
    return v?.company_name || 'Unknown Vendor';
  };

  const handleRefresh = () => {
    refetchOverview();
    refetchPending();
    refetchTransactions();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header with Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-6 rounded-3xl border border-border/50 backdrop-blur-xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            Financial Ledger <CreditCard className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Platform-Wide Billing & Receivables Management</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="w-[200px] pl-10 rounded-xl bg-background/50 border-border/50 font-bold text-xs uppercase tracking-tighter h-11 ring-0 focus:ring-1 focus:ring-primary/20">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl">
                <SelectItem value="global" className="font-bold text-xs">All Vendors (Global)</SelectItem>
                {vendors.map(v => (
                  <SelectItem key={v._id} value={v._id} className="font-bold text-xs">{v.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl border-border/50 hover:bg-primary/5 text-primary"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden group border-none shadow-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-xl border border-amber-500/20">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Clock className="h-16 w-16 text-amber-500" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <Clock className="h-3 w-3" /> Unbilled Receivables
              </CardDescription>
              <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-amber-700">
                {overviewLoading ? <Skeleton className="h-9 w-28 bg-amber-500/10" /> : `₹${overview?.platform?.unbilled_total?.toLocaleString() || '0'}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-800/60 uppercase">
                Awaiting Maturation
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group border-none shadow-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl border border-emerald-500/20 ring-1 ring-emerald-500/30">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Wallet className="h-16 w-16 text-emerald-500" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-600 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <Wallet className="h-3 w-3" /> Billable Dues
              </CardDescription>
              <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-emerald-700">
              {overviewLoading ? <Skeleton className="h-9 w-28 bg-emerald-500/10" /> : `₹${overview?.platform?.billable_total?.toLocaleString() || '0'}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase">Ready for Payment</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group border-none shadow-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-xl border border-blue-500/20">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <CheckCircle className="h-16 w-16 text-blue-500" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-600 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <CheckCircle className="h-3 w-3" /> Total Paid
              </CardDescription>
              <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-blue-700">
                {overviewLoading ? <Skeleton className="h-9 w-28 bg-blue-500/10" /> : `₹${overview?.platform?.paid_total?.toLocaleString() || '0'}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-800/60 uppercase tracking-tighter">
                Settled Lifetime
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Distribution */}
        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden ring-1 ring-border/50">
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Dues Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[140px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                <Settings2 className="h-3 w-3" /> Policy Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Maturation Cycle (Days)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    defaultValue={selectedVendorId === 'global' ? overview?.config?.global_maturation_days : vendorOverviewData?.data?.maturation_days}
                    className="h-10 rounded-xl bg-background/50 font-black text-sm border-border/40"
                    placeholder="7"
                    id="maturation-input"
                  />
                  <Button
                    className="h-10 px-3 rounded-xl bg-primary text-white font-black"
                    onClick={() => {
                      const val = (document.getElementById('maturation-input') as HTMLInputElement).value;
                      if (selectedVendorId === 'global') {
                        updateMaturationPolicy(parseInt(val)).then(() => refetchOverview());
                      } else {
                        vendorPolicyMutation.mutate(parseInt(val));
                      }
                    }}
                  >
                    Set
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground px-1 leading-tight mt-1 ">
                  {selectedVendorId === 'global' ? 'Global policy for all new jobs.' : `Custom policy for ${getVendorName(selectedVendorId)}.`}
                </p>
              </div>

              {selectedPayouts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 border-t border-border/40 space-y-3"
                >
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <p className="text-[9px] font-black uppercase text-primary mb-1">Manual Reconciliation</p>
                    <p className="text-sm font-black tracking-tighter text-foreground">{selectedPayouts.length} Selected</p>
                  </div>
                  <Button
                    onClick={() => processPayoutsMutation.mutate(selectedPayouts)}
                    disabled={processPayoutsMutation.isPending}
                    className="w-full h-11 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20"
                  >
                    {processPayoutsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as Paid'}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50 hover:bg-emerald-500/5 hover:text-emerald-600 transition-all hover:border-emerald-500/30 group">
              Export Global Ledger <Download className="h-4 w-4 opacity-40 group-hover:opacity-100" />
            </Button>
            <Button variant="outline" className="w-full justify-between h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50 hover:bg-blue-500/5 hover:text-blue-600 transition-all hover:border-blue-500/30 group">
              Sync Razorpay <RefreshCw className="h-4 w-4 opacity-40 group-hover:opacity-100" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50 p-1 rounded-2xl ring-1 ring-border/50">
                <TabsTrigger value="overview" className="rounded-xl px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md">
                  <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                  Receivables Log
                </TabsTrigger>
                <TabsTrigger value="transactions" className="rounded-xl px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md">
                  <History className="h-3.5 w-3.5 mr-2" />
                  Transaction Audit
                </TabsTrigger>
              </TabsList>

              <div className="relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search Job ID or Vendor..."
                  className="h-10 pl-9 rounded-xl bg-card border-border/50 text-xs font-bold ring-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="overview" className="mt-0 outline-none">
              <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-12 py-4">
                          <Checkbox checked={selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0} onCheckedChange={toggleAll} />
                        </TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Vendor & Job</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Amount</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Creation Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLoading ? (
                        [...Array(6)].map((_, i) => (
                          <TableRow key={i} className="h-16">
                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredPayouts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                              <div className="p-4 bg-muted/30 rounded-full">
                                <Search className="h-8 w-8 opacity-20" />
                              </div>
                              <p className="font-black text-sm uppercase tracking-widest">No receivables found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayouts.map((payout, idx) => (
                          <motion.tr
                            key={payout._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group hover:bg-primary/5 transition-colors border-border/40"
                          >
                            <TableCell>
                              <Checkbox checked={selectedPayouts.includes(payout._id)} onCheckedChange={() => togglePayout(payout._id)} />
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-sm flex items-center gap-1.5 group-hover:text-primary transition-colors">
                                  <User className="h-3 w-3 opacity-40" /> {payout.vendor_name}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Job: #{payout?.call_id?.slice(-8) || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-black text-foreground text-lg tabular-nums tracking-tighter">₹{payout.amount.toLocaleString()}</span>
                            </TableCell>
                            <TableCell>
                              <PayoutStatusBadge status={payout.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(payout.created_at), 'dd MMM yyyy')}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="mt-0 outline-none">
              <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Transaction ID</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Vendor</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Amount</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Time</TableHead>
                        <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsLoading ? (
                        [...Array(6)].map((_, i) => (
                          <TableRow key={i} className="h-16">
                            <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                              <div className="p-4 bg-muted/30 rounded-full">
                                <History className="h-8 w-8 opacity-20" />
                              </div>
                              <p className="font-black text-sm uppercase tracking-widest">No transaction audit trail</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx, idx) => (
                          <motion.tr
                            key={tx._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group hover:bg-primary/5 transition-colors border-border/40"
                          >
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="font-black text-foreground text-xs uppercase tracking-tighter ">
                                  {tx.razorpay_order_id ? `#${tx.razorpay_order_id.slice(-12)}` : `Attempt #${tx._id?.slice(-8) || 'Unknown'}`}
                                </span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{(tx.payout_ids || []).length} Jobs included</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-xs flex items-center gap-1.5"><User className="h-3 w-3 opacity-40" /> {tx.vendor_name}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-black text-foreground text-md tabular-nums tracking-tighter">₹{tx.amount?.toLocaleString() || '0'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className={cn(
                                  "text-[9px] font-black py-0 px-2 w-fit",
                                  tx.status === 'SUCCESS' ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" :
                                    tx.status === 'FAILED' ? "border-red-500/30 text-red-600 bg-red-500/5" :
                                      "border-blue-500/30 text-blue-600 bg-blue-500/5"
                                )}>
                                  {tx.status}
                                </Badge>
                                {tx.failure_reason && (
                                  <p className="text-[8px] font-bold text-red-500 uppercase tracking-tighter max-w-[120px] truncate">{tx.failure_reason}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                  <Clock className="h-3 w-3 text-primary" />
                                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium pl-5">
                                  {format(new Date(tx.created_at), 'dd MMM, HH:mm')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {tx.status !== 'SUCCESS' && tx.order_id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={reconcileMutation.isPending}
                                    className="h-8 rounded-lg border-primary/30 text-primary hover:bg-primary/5 flex items-center gap-1.5"
                                    onClick={() => reconcileMutation.mutate(tx.order_id)}
                                  >
                                    {reconcileMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                    <span className="text-[10px] font-black uppercase">Sync</span>
                                  </Button>
                                )}
                                {tx.receipt_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-lg text-primary hover:bg-primary/10 flex items-center gap-1.5"
                                    onClick={() => window.open(tx.receipt_url, '_blank')}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-black uppercase">Receipt</span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancialsTab;
