import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchBillingSummary,
  fetchBillingHistory,
  fetchBillingTransactions,
  initiatePayment,
  cancelTransaction,
  syncBillingStatus
} from '@/services/billingApi';

export function useFinancials() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncCooldown, setSyncCooldown] = useState(0);

  // Cooldown Timer Effect
  useEffect(() => {
    let timer: any;
    if (syncCooldown > 0) {
      timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [syncCooldown]);

  // Queries
  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isRefetching: summaryRefetching
  } = useQuery({
    queryKey: ['billingSummary'],
    queryFn: fetchBillingSummary,
    refetchInterval: 30000,
  });

  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
    isRefetching: historyRefetching
  } = useQuery({
    queryKey: ['billingHistory'],
    queryFn: () => fetchBillingHistory(),
    refetchInterval: 30000,
  });

  const {
    data: transactionData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['billingTransactions'],
    queryFn: () => fetchBillingTransactions(),
    refetchInterval: 60000,
  });

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const paymentMutation = useMutation({
    mutationFn: (ids: string[]) => initiatePayment(ids),
    onSuccess: async (result) => {
      if (result.error) {
        toast({ title: 'Payment Error', description: result.error, variant: 'destructive' });
        return;
      }
      if (!result.data) return;

      const { order, key_id } = result.data;
      const res = await loadRazorpay();

      if (!res) {
        toast({ title: 'Error', description: 'Razorpay SDK failed to load.', variant: 'destructive' });
        return;
      }

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Door2fy Platform',
        description: 'Settlement of Service Dues',
        order_id: order.id,
        handler: function (response: any) {
          toast({
            title: 'Payment Successful',
            description: 'Transaction ID: ' + response.razorpay_payment_id + '. Your ledger is being updated.'
          });
          queryClient.invalidateQueries({ queryKey: ['billingSummary'] });
          queryClient.invalidateQueries({ queryKey: ['billingHistory'] });
          queryClient.invalidateQueries({ queryKey: ['billingTransactions'] });
        },
        modal: {
          ondismiss: function () {
            queryClient.invalidateQueries({ queryKey: ['billingTransactions'] });
          }
        },
        theme: { color: '#10b981' },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelTransaction,
    onSuccess: (result) => {
      if (result.error) {
        toast({ title: 'Cancellation Failed', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Payment Cancelled', description: 'Your dues have been unlocked.' });
        queryClient.invalidateQueries({ queryKey: ['billingSummary'] });
        queryClient.invalidateQueries({ queryKey: ['billingHistory'] });
        queryClient.invalidateQueries({ queryKey: ['billingTransactions'] });
      }
    }
  });

  const handleSync = async () => {
    const result = await syncBillingStatus();
    if (result.error) {
      toast({ title: 'Sync Warning', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Sync Complete', description: result.message || 'Ledger updated.' });
    }
    refetchSummary();
    refetchHistory();
    refetchTransactions();
    setSyncCooldown(10);
  };

  const handlePayAll = () => {
    const history = historyData?.data || [];
    const billableIds = history
      .filter((item: any) =>
        item.status === 'DUE' ||
        item.status === 'PROCESSING' ||
        (item.status === 'UPCOMING' && new Date(item.eligible_at) <= new Date())
      )
      .map((item: any) => item._id);

    if (billableIds.length === 0) {
      toast({ title: 'No Billable Dues', description: 'Nothing to pay at this time.' });
      return;
    }
    paymentMutation.mutate(billableIds);
  };

  return {
    summary: summaryData?.data,
    history: historyData?.data || [],
    transactions: transactionData?.data || [],
    loading: summaryLoading || historyLoading,
    refreshing: summaryRefetching || historyRefetching,
    syncCooldown,
    handleSync,
    handlePayAll,
    paymentMutation,
    cancelMutation
  };
}
