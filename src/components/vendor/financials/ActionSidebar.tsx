import { 
  Banknote, 
  TrendingUp, 
  CreditCard, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActionSidebarProps {
  summary: any;
  onPay: () => void;
  isPaying: boolean;
}

export function ActionSidebar({ summary, onPay, isPaying }: ActionSidebarProps) {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-primary via-primary/90 to-emerald-600 text-primary-foreground overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
          <Banknote className="h-32 w-32" />
        </div>
        <CardHeader className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-4 w-4" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] font-black uppercase">Platform Settlement</Badge>
          </div>
          <CardTitle className="text-2xl font-black  tracking-tighter uppercase">Settle Service Dues</CardTitle>
          <CardDescription className="text-primary-foreground/80 font-medium">Pay outstanding dues to maintain platform standing and release worker funds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Payable Amount</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tighter tabular-nums">₹{summary?.billable_balance?.toLocaleString() || '0'}</span>
              <span className="text-xs font-bold opacity-60 uppercase tracking-widest">INR</span>
            </div>
          </div>

          <Button
            onClick={onPay}
            className="w-full h-14 bg-white text-primary hover:bg-emerald-50 font-black text-lg uppercase tracking-tighter shadow-2xl group border-none"
            disabled={isPaying || !summary?.billable_balance}
          >
            {isPaying ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay Dues Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter opacity-70">
              <ShieldCheck className="h-3 w-3" /> Encrypted via Razorpay SSL
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter opacity-70">
              <RefreshCw className="h-3 w-3" /> Smart Reversion Enabled
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-card overflow-hidden ring-1 ring-border/50">
        <CardHeader className="bg-muted/30 border-b border-border/40">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Dues Continuity Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
            <div className="mt-1 p-1 bg-primary/10 rounded-full">
              <Clock className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">Continuous Billing</p>
              <p className="text-[10px] text-muted-foreground font-medium">Processing items remain in your dues until settled. You can retry failed payments anytime.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
            <div className="mt-1 p-1 bg-emerald-500/10 rounded-full">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">Auto-Audit</p>
              <p className="text-[10px] text-muted-foreground font-medium">Every payment attempt is logged for transparency and dispute resolution.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
