import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'archived';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const statusClasses = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    active: 'bg-green-100 text-green-700 border-green-200',
    archived: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const statusLabels = {
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    archived: 'Archived',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        sizeClasses[size],
        statusClasses[status]
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status === 'pending' && "bg-warning animate-pulse-soft",
          status === 'approved' && "bg-success",
          status === 'rejected' && "bg-destructive",
          status === 'active' && "bg-green-600",
          status === 'archived' && "bg-gray-400"
        )}
      />
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
