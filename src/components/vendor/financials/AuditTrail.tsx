import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  History, 
  ChevronRight, 
  AlertCircle, 
  Download 
} from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuditTrailProps {
  transactions: any[];
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

export function AuditTrail({ transactions, onCancel, isCancelling }: AuditTrailProps) {
  return (
    <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
      <div className="p-4 border-b border-border/50 bg-muted/20">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Payment Attempts</h3>
      </div>
      <div className="divide-y divide-border/40">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto opacity-20 mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">No transaction history</p>
          </div>
        ) : (
          transactions.map((tx, idx) => (
            <motion.div
              key={tx._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-xl border",
                  tx.status === 'SUCCESS' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                    tx.status === 'FAILED' ? "bg-red-500/10 border-red-500/20 text-red-600" :
                      "bg-blue-500/10 border-blue-500/20 text-blue-600"
                )}>
                  {tx.status === 'SUCCESS' ? <CheckCircle2 className="h-5 w-5" /> :
                    tx.status === 'FAILED' ? <AlertTriangle className="h-5 w-5" /> :
                      <RefreshCw className="h-5 w-5 animate-spin-slow" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black tracking-tighter">
                      {tx.razorpay_order_id ? `Order #${tx.razorpay_order_id.slice(-8)}` : `Attempt #${tx._id?.slice(-6) || 'N/A'}`}
                    </p>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black py-0 px-1.5",
                      tx.status === 'SUCCESS' ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" :
                        tx.status === 'FAILED' ? "border-red-500/30 text-red-600 bg-red-500/5" :
                          "border-blue-500/30 text-blue-600 bg-blue-500/5"
                    )}>
                      {tx.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                    {tx.created_at ? format(new Date(tx.created_at), 'MMM dd, HH:mm') : 'Recently'} • {(tx.payout_ids || []).length} Jobs
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  {tx.status === 'CREATED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isCancelling}
                      className="h-7 px-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-1 border border-red-100"
                      onClick={() => onCancel(tx._id)}
                    >
                      {isCancelling ? <RefreshCw className="h-3 w-3 animate-spin" /> : <AlertCircle className="h-3 w-3" />}
                      <span className="text-[9px] font-black uppercase">Cancel & Retry</span>
                    </Button>
                  )}
                  <p className="text-sm font-black tracking-tighter">₹{tx.amount?.toLocaleString() || '0'}</p>
                </div>
                {tx.receipt_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 rounded-lg border-primary/20 text-primary hover:bg-primary/5 flex items-center gap-1"
                    onClick={() => window.open(tx.receipt_url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase">Receipt</span>
                  </Button>
                )}
                {tx.failure_reason && (
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter max-w-[150px] truncate">
                    {tx.failure_reason}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
      {transactions.length > 0 && (
        <div className="p-3 bg-muted/10 border-t border-border/50 text-center">
          <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
            View Full Audit Trail <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
}
