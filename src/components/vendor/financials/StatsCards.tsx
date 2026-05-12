import { 
  IndianRupee, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  History, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface StatsCardsProps {
  summary: any;
}

export function OverviewCards({ summary }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="relative overflow-hidden group border-none shadow-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-xl border border-amber-500/20">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Clock className="h-16 w-16 text-amber-500" />
        </div>
        <CardHeader className="pb-2">
          <CardDescription className="text-amber-600 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <Clock className="h-3 w-3" /> Unbilled Dues
          </CardDescription>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-amber-700">
            ₹{summary?.unbilled_balance?.toLocaleString() || '0'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-800/60 uppercase">In Maturation Window</span>
            <ArrowRight className="h-2 w-2 text-amber-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden group border-none shadow-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl border border-emerald-500/20 ring-1 ring-emerald-500/30">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Wallet className="h-16 w-16 text-emerald-500" />
        </div>
        <CardHeader className="pb-2">
          <CardDescription className="text-emerald-600 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <Wallet className="h-3 w-3" /> Total Billable Dues
          </CardDescription>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-emerald-700">
            ₹{summary?.billable_balance?.toLocaleString() || '0'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-800/60 uppercase">Outstanding Debt</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden group border-none shadow-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-xl border border-blue-500/20">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <CheckCircle2 className="h-16 w-16 text-blue-500" />
        </div>
        <CardHeader className="pb-2">
          <CardDescription className="text-blue-600 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <CheckCircle2 className="h-3 w-3" /> Lifetime Paid
          </CardDescription>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-blue-700">
            ₹{summary?.paid_total?.toLocaleString() || '0'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-800/60 uppercase tracking-tighter">
            Settled Transactions
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OperationalStats({ summary }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-card/50 border-border/40 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Projects</p>
            <p className="text-lg font-black text-foreground">{summary?.project_count || 0}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 border-border/40 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Projects</p>
            <p className="text-lg font-black text-foreground">{summary?.active_project_count || 0}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/40 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
            <History className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Calls</p>
            <p className="text-lg font-black text-foreground">{summary?.call_count || 0}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/40 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Billing Cycle</p>
            <p className="text-lg font-black text-foreground">{summary?.maturation_days || 7} Days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
