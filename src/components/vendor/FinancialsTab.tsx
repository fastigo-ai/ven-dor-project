import { useEffect, useState } from 'react';
import { 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  RefreshCcw,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fetchPayoutSummary, fetchPayoutHistory, PayoutSummary, PayoutRecord } from '@/services/payoutApi';
import { useVendor } from '@/contexts/VendorContext';

export function FinancialsTab() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [history, setHistory] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { backendProjects } = useVendor();

  const loadData = async () => {
    setLoading(true);
    const [summaryRes, historyRes] = await Promise.all([
      fetchPayoutSummary(),
      fetchPayoutHistory()
    ]);
    if (summaryRes.data) setSummary(summaryRes.data);
    if (historyRes.data) setHistory(historyRes.data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return <Badge className="bg-success/10 text-success border-success/20">Paid</Badge>;
      case 'MATURE':
      case 'DUE':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Ready</Badge>;
      case 'UPCOMING':
        return <Badge variant="outline" className="text-muted-foreground">Upcoming</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground">Monitor your earnings and maturation cycles.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-lg group hover:translate-y-[-4px] transition-all duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary/70 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Mature Balance
            </CardDescription>
            <CardTitle className="text-3xl font-black text-primary">
              ₹{summary?.mature_balance.toLocaleString() ?? '0'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Cleared and ready for settlement.</p>
            <div className="mt-4 flex items-center text-[10px] text-primary/60 font-medium uppercase tracking-wider">
              Settlement in Progress <ArrowUpRight className="h-2 w-2 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 shadow-lg group hover:translate-y-[-4px] transition-all duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-600/70 font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" /> Upcoming Balance
            </CardDescription>
            <CardTitle className="text-3xl font-black text-orange-600">
              ₹{summary?.upcoming_balance.toLocaleString() ?? '0'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Subject to 7-day maturation rule.</p>
            <div className="mt-4 flex items-center text-[10px] text-orange-600/60 font-medium uppercase tracking-wider">
              Maturing <ArrowUpRight className="h-2 w-2 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20 shadow-lg group hover:translate-y-[-4px] transition-all duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-success/70 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Total Paid
            </CardDescription>
            <CardTitle className="text-3xl font-black text-success">
              ₹{summary?.paid_total.toLocaleString() ?? '0'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Lifetime earnings successfully settled.</p>
            <div className="mt-4 flex items-center text-[10px] text-success/60 font-medium uppercase tracking-wider">
              Settled <ArrowUpRight className="h-2 w-2 ml-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-border/40 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Ledger</CardTitle>
              <CardDescription>Detailed history of job payouts.</CardDescription>
            </div>
            <IndianRupee className="h-5 w-5 text-muted-foreground/50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="font-bold">Transaction ID</TableHead>
                  <TableHead className="font-bold">Project</TableHead>
                  <TableHead className="font-bold">Job Reference</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="font-bold">Maturation Date</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                      {loading ? 'Fetching history...' : 'No transaction records found yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item._id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {item._id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {backendProjects.find(p => p.id === item.project_id)?.projectName || 'Global'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.call_id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        ₹{item.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.eligible_at), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.display_status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-2 p-4 rounded-lg bg-accent/30 border border-accent/50">
        <AlertCircle className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Maturation Rule:</span> Payments for completed jobs mature after 7 days of validation. Once mature, funds are automatically queued for the next settlement cycle.
        </p>
      </div>
    </div>
  );
}
