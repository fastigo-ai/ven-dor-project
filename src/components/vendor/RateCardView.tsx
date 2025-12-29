import { RateCard } from '@/contexts/VendorContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  Truck, 
  Zap, 
  Clock, 
  Package, 
  AlertTriangle 
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
  'Standard Delivery': Truck,
  'Express Delivery': Zap,
  'Same Day Delivery': Clock,
  'Bulk Shipment': Package,
  'Fragile Items': AlertTriangle,
};

const RateCardView = ({ rateCards }: RateCardViewProps) => {
  const activeCards = rateCards.filter((card) => card.isActive);

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
                <TableHead className="font-semibold text-right">Base Rate</TableHead>
                <TableHead className="font-semibold text-right">Per KM</TableHead>
                <TableHead className="font-semibold text-right">Urgent (×)</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeCards.map((card) => {
                const Icon = serviceIcons[card.serviceType] || Truck;
                return (
                  <TableRow key={card.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{card.serviceType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">₹{card.baseRate}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">₹{card.perKmRate}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">{card.urgentMultiplier}×</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className="bg-success/10 text-success border-success/30"
                      >
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          * Rates are subject to change. Contact Door2Fy for custom pricing.
        </p>
      </CardContent>
    </Card>
  );
};

export default RateCardView;
