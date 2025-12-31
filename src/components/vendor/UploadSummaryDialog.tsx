import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useVendor, RateCard } from '@/contexts/VendorContext';
import {
  CheckCircle,
  XCircle,
  MapPin,
  IndianRupee,
  FileText,
  Truck,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';

interface LocationData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pincode: string;
  orderAmount: number;
}

interface UploadSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadedData: LocationData[];
  projectName: string;
  supportType: string;
  problemDescription: string;
  onNext: () => void;
}

// Mock serviceable pincodes (in production, this would come from backend)
const serviceablePincodes = [
  '400050', '400051', '400052', '400053', '400054', '400055', '400056', '400057', '400058', '400059',
  '400060', '400061', '400062', '400063', '400064', '400065', '400066', '400067', '400068', '400069',
  '400070', '400071', '400072', '400073', '400074', '400075', '400076', '400077', '400078', '400079',
  '400080', '400081', '400082', '400083', '400084', '400085', '400086', '400087', '400088', '400089',
  '560001', '560002', '560003', '560004', '560005', '560008', '560010', '560011', '560017', '560018',
  '560025', '560029', '560030', '560034', '560038', '560041', '560043', '560047', '560048', '560050',
  '110001', '110002', '110003', '110005', '110006', '110007', '110008', '110009', '110010', '110011',
];

const nonServiceableReasons: Record<string, string> = {
  'remote': 'Remote location - No engineer coverage available',
  'restricted': 'Restricted zone - Special permits required',
  'discontinued': 'Service discontinued in this area',
  'capacity': 'Area at full capacity - No slots available',
};

const getServiceabilityStatus = (pincode: string): { serviceable: boolean; reason?: string } => {
  if (serviceablePincodes.includes(pincode)) {
    return { serviceable: true };
  }
  
  // Assign random reasons for non-serviceable locations
  const reasons = Object.keys(nonServiceableReasons);
  const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
  return { serviceable: false, reason: nonServiceableReasons[randomReason] };
};

const UploadSummaryDialog = ({
  open,
  onOpenChange,
  uploadedData,
  projectName,
  supportType,
  problemDescription,
  onNext,
}: UploadSummaryDialogProps) => {
  const { rateCards } = useVendor();
  
  // Separate serviceable and non-serviceable locations
  const locationAnalysis = uploadedData.map((location) => ({
    ...location,
    ...getServiceabilityStatus(location.pincode),
  }));

  const serviceableLocations = locationAnalysis.filter((loc) => loc.serviceable);
  const nonServiceableLocations = locationAnalysis.filter((loc) => !loc.serviceable);

  // Get applicable rate card based on support type
  const getApplicableRate = (): RateCard | undefined => {
    const rateMapping: Record<string, string> = {
      'Breakfix': 'Standard Delivery',
      'PM Activity': 'Bulk Shipment',
      'On Call Support': 'Express Delivery',
      'Server Call': 'Same Day Delivery',
      'Desktop Installation': 'Fragile Items',
    };
    const serviceType = rateMapping[supportType] || 'Standard Delivery';
    return rateCards.find((card) => card.serviceType === serviceType && card.isActive);
  };

  const applicableRate = getApplicableRate();

  // Calculate totals
  const calculateLocationCost = (location: LocationData): number => {
    if (!applicableRate) return location.orderAmount;
    const baseCost = applicableRate.baseRate;
    const estimatedKm = 10; // Mock distance calculation
    const kmCost = applicableRate.perKmRate * estimatedKm;
    return baseCost + kmCost + location.orderAmount;
  };

  const totalServiceableValue = serviceableLocations.reduce(
    (sum, loc) => sum + calculateLocationCost(loc),
    0
  );

  const handleNext = () => {
    onNext();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Upload Summary</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Review your uploaded data before proceeding
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Project & SOW Details */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Project & SOW Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Project Name</p>
                    <p className="font-medium">{projectName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Support Type</p>
                    <Badge variant="outline" className="mt-1">{supportType}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Problem Description</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 mt-1">{problemDescription}</p>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{uploadedData.length}</p>
                  <p className="text-xs text-muted-foreground">Total Locations</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{serviceableLocations.length}</p>
                  <p className="text-xs text-muted-foreground">Serviceable</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="pt-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <p className="text-2xl font-bold text-destructive">{nonServiceableLocations.length}</p>
                  <p className="text-xs text-muted-foreground">Not Serviceable</p>
                </CardContent>
              </Card>
            </div>

            {/* Rate Card Information */}
            {applicableRate && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    Applicable Rate Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="font-medium">{applicableRate.serviceType}</span>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Base Rate</p>
                        <p className="font-mono font-semibold">₹{applicableRate.baseRate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Per KM Rate</p>
                        <p className="font-mono font-semibold">₹{applicableRate.perKmRate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Urgent Multiplier</p>
                        <p className="font-mono font-semibold">{applicableRate.urgentMultiplier}×</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Serviceable Locations */}
            {serviceableLocations.length > 0 && (
              <Card className="border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Serviceable Locations ({serviceableLocations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {serviceableLocations.map((location, index) => (
                      <div
                        key={index}
                        className="bg-green-500/5 border border-green-500/20 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{location.customerName}</p>
                            <p className="text-xs text-muted-foreground">{location.customerPhone}</p>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                            {location.pincode}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{location.customerAddress}</p>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Estimated Cost:</span>
                          <span className="font-mono font-semibold text-green-600">
                            ₹{calculateLocationCost(location).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Non-Serviceable Locations */}
            {nonServiceableLocations.length > 0 && (
              <Card className="border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Non-Serviceable Locations ({nonServiceableLocations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {nonServiceableLocations.map((location, index) => (
                      <div
                        key={index}
                        className="bg-destructive/5 border border-destructive/20 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{location.customerName}</p>
                            <p className="text-xs text-muted-foreground">{location.customerPhone}</p>
                          </div>
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/30">
                            {location.pincode}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{location.customerAddress}</p>
                        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
                          <XCircle className="h-3 w-3" />
                          <span>{location.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Value Summary */}
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Serviceable Locations</p>
                    <p className="text-lg font-semibold">{serviceableLocations.length} location(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Estimated Value</p>
                    <p className="text-3xl font-bold text-primary">
                      ₹{totalServiceableValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Back to Edit
          </Button>
          <Button className="flex-1" onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadSummaryDialog;