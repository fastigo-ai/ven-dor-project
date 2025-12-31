import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVendor, CallData } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';
import { FileSpreadsheet } from 'lucide-react';

interface SingleCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SingleCallDialog = ({ open, onOpenChange }: SingleCallDialogProps) => {
  const { currentVendor, projects, addCalls } = useVendor();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vendorProjects = projects.filter((p) => p.vendorId === currentVendor?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      toast({
        title: 'Error',
        description: 'Please select a project.',
        variant: 'destructive',
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: 'Error',
        description: 'Customer name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!customerPhone.trim()) {
      toast({
        title: 'Error',
        description: 'Customer phone is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!pincode.trim() || !/^\d{6}$/.test(pincode)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit pincode.',
        variant: 'destructive',
      });
      return;
    }

    if (!orderAmount || isNaN(Number(orderAmount)) || Number(orderAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid order amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const callToAdd: Omit<CallData, 'id' | 'createdAt' | 'status'> = {
        projectId: selectedProject,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        pincode: pincode.trim(),
        orderAmount: Number(orderAmount),
      };

      addCalls([callToAdd]);

      toast({
        title: 'Call Added',
        description: 'Single call has been added to the project successfully.',
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add call. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedProject('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setPincode('');
    setOrderAmount('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Single Call Upload</DialogTitle>
              <DialogDescription>
                Add a single call entry manually
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Select Project *</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {vendorProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vendorProjects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No projects found. Create a project first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone *</Label>
              <Input
                id="customerPhone"
                placeholder="Enter phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Textarea
              id="customerAddress"
              placeholder="Enter full address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                placeholder="6-digit pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderAmount">Order Amount (₹) *</Label>
              <Input
                id="orderAmount"
                type="number"
                placeholder="Enter amount"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!selectedProject || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Call'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SingleCallDialog;
