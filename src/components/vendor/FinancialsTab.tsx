import { useState } from 'react';
import { 
  ShieldCheck, 
  History, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Sub-components
import { OverviewCards, OperationalStats } from './financials/StatsCards';
import { LedgerTable } from './financials/LedgerTable';
import { AuditTrail } from './financials/AuditTrail';
import { ActionSidebar } from './financials/ActionSidebar';
import { useFinancials } from './financials/useFinancials';

export function FinancialsTab() {
  const [activeTab, setActiveTab] = useState('ledger');
  const {
    summary,
    history,
    transactions,
    loading,
    refreshing,
    syncCooldown,
    handleSync,
    handlePayAll,
    paymentMutation,
    cancelMutation
  } = useFinancials();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Financial Overview Cards */}
      <OverviewCards summary={summary} />

      {/* Operational Stats Row */}
      <OperationalStats summary={summary} />

      {/* Main Billing Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Ledger and Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="ledger" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50 p-1 rounded-xl ring-1 ring-border/50">
                <TabsTrigger value="ledger" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                  Service Ledger
                </TabsTrigger>
                <TabsTrigger value="transactions" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <History className="h-3.5 w-3.5 mr-2" />
                  Audit Trail
                </TabsTrigger>
              </TabsList>

              <Button
                onClick={handleSync}
                variant="outline"
                size="sm"
                className="rounded-full hover:bg-primary/5 text-primary border-primary/20 transition-all duration-300"
                disabled={refreshing || syncCooldown > 0}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {syncCooldown > 0 ? `Wait ${syncCooldown}s` : 'Sync'}
              </Button>
            </div>

            <TabsContent value="ledger" className="mt-0 space-y-4 outline-none">
              <LedgerTable history={history} loading={loading} />
            </TabsContent>

            <TabsContent value="transactions" className="mt-0 space-y-4 outline-none">
              <AuditTrail 
                transactions={transactions} 
                onCancel={(id) => cancelMutation.mutate(id)}
                isCancelling={cancelMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Action Sidebar */}
        <ActionSidebar 
          summary={summary} 
          onPay={handlePayAll} 
          isPaying={paymentMutation.isPending} 
        />
      </div>
    </div>
  );
}
