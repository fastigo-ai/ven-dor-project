import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, Wallet } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import PayoutStatusBadge from '@/components/PayoutStatusBadge';

interface LedgerTableProps {
  history: any[];
  loading: boolean;
}

const getMaturationProgress = (eligibleAt: string, createdAt: string) => {
  if (!eligibleAt || !createdAt) return 100;
  try {
    const total = differenceInDays(new Date(eligibleAt), new Date(createdAt));
    const passed = differenceInDays(new Date(), new Date(createdAt));
    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, (passed / total) * 100));
  } catch (e) {
    return 100;
  }
};

export function LedgerTable({ history, loading }: LedgerTableProps) {
  return (
    <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md overflow-hidden ring-1 ring-border/50">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Job Details</TableHead>
              <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Project</TableHead>
              <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Amount</TableHead>
              <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Status</TableHead>
              <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-4">Matures On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && history.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell colSpan={5} className="h-16 bg-muted/20"></TableCell>
                </TableRow>
              ))
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <div className="p-6 bg-muted/20 rounded-full ring-1 ring-border">
                      <Wallet className="h-12 w-12 opacity-20" />
                    </div>
                    <p className="font-black text-foreground/40 text-lg tracking-tighter uppercase ">No Active Dues</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              history.map((record, idx) => (
                <motion.tr
                  key={record._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-primary/5 transition-colors border-border/40"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm  group-hover:text-primary transition-colors">Job #{record.call_id?.slice(-8) || 'Unknown'}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">ID: {record._id?.slice(-6) || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <ShieldCheck className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-tighter truncate max-w-[120px]">{record.project_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-foreground text-md tabular-nums">₹{record.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <PayoutStatusBadge
                        status={record.status}
                        failureReason={record.last_failure_reason}
                        maturationDays={record.maturation_days}
                      />
                      {record.status === 'UPCOMING' && (
                        <div className="w-20 space-y-1">
                          <Progress value={getMaturationProgress(record.eligible_at, record.created_at)} className="h-1 bg-amber-500/10" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {record.eligible_at ? format(new Date(record.eligible_at), 'dd MMM') : 'Pending'}
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
