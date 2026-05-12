import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, RefreshCw, XCircle, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PayoutStatus = 'UPCOMING' | 'DUE' | 'PROCESSING' | 'PAID' | 'FAILED';

interface PayoutStatusBadgeProps {
  status: string;
  failureReason?: string;
  className?: string;
  maturationDays?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; iconColor: string }> = {
  UPCOMING: { 
    label: 'Unbilled', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', 
    icon: Clock,
    iconColor: 'text-amber-500'
  },
  DUE: { 
    label: 'Billable', 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', 
    icon: CheckCircle2,
    iconColor: 'text-emerald-500'
  },
  PROCESSING: { 
    label: 'Payment Pending', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse', 
    icon: RefreshCw, 
    iconColor: 'text-blue-500'
  },
  PAID: { 
    label: 'Paid', 
    color: 'bg-green-500/10 text-green-600 border-green-500/20', 
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  },
  FAILED: { 
    label: 'Payment Failed', 
    color: 'bg-red-500/10 text-red-600 border-red-500/20', 
    icon: XCircle,
    iconColor: 'text-red-500'
  },
};

const PayoutStatusBadge = ({ status, failureReason, className, maturationDays }: PayoutStatusBadgeProps) => {
  const upperStatus = status.toUpperCase();
  const config = STATUS_CONFIG[upperStatus] || { 
    label: status, 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', 
    icon: AlertCircle,
    iconColor: 'text-gray-500'
  };

  const Icon = config.icon;

  const BadgeContent = (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap",
      config.color,
      className
    )}>
      <Icon className={cn("w-3.5 h-3.5", config.iconColor)} />
      {config.label}
      {upperStatus === 'UPCOMING' && maturationDays && (
        <span className="opacity-60 text-[9px] font-black ml-1">({maturationDays}D)</span>
      )}
    </div>
  );

  if (upperStatus === 'FAILED' && failureReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {BadgeContent}
          </TooltipTrigger>
          <TooltipContent className="bg-destructive text-destructive-foreground">
            <p>{failureReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return BadgeContent;
};

export default PayoutStatusBadge;
