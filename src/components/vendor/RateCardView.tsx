import { RateCard } from '@/contexts/VendorContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  Wrench, 
  AlertTriangle, 
  Phone, 
  Server, 
  Monitor,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RateCardViewProps {
  rateCards: RateCard[];
}

const serviceIcons: Record<string, React.ElementType> = {
  'pm activity': Wrench,
  'breakfix': AlertTriangle,
  'on call': Phone,
  'server call': Server,
  'desktop installation': Monitor,
};

const RateCardView = ({ rateCards }: RateCardViewProps) => {
  const sortedCards = [...rateCards].sort((a, b) => 
    a.support_type.localeCompare(b.support_type)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-primary" />
          Rate Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Service Type</TableHead>
                <TableHead className="font-semibold">Scope</TableHead>
                <TableHead className="font-semibold text-right">Base Price</TableHead>
                <TableHead className="font-semibold text-right">Per Asset</TableHead>
                <TableHead className="font-semibold text-right">Urgent (×)</TableHead>
                <TableHead className="font-semibold text-center">SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCards.map((card) => {
                const Icon = serviceIcons[card.support_type.toLowerCase()] || Wrench;
                const isCustom = !!card.vendor_id;
                
                return (
                  <TableRow 
                    key={card._id || card.support_type}
                    className={cn(
                      isCustom && "bg-primary/[0.03] border-l-2 border-l-primary"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium capitalize">{card.support_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isCustom ? (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
                          <Sparkles className="h-3 w-3" />
                          Custom
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Standard</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">₹{card.base_price}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">₹{card.per_asset_price}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">{card.sla_multipliers?.urgent || 1.5}×</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {card.sla_minutes}m
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          * Prices shown reflect the Best Available Rate for your account.
        </p>
      </CardContent>
    </Card>
  );
};

export default RateCardView;
