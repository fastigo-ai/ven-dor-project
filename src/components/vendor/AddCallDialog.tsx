import { useState } from 'react';
import { useVendor } from '@/contexts/VendorContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface AddCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const AddCallDialog = ({ open, onOpenChange, projectId }: AddCallDialogProps) => {
  const { addSingleCall } = useVendor();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [orderAmount, setOrderAmount] = useState('');

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setPincode('');
    setOrderAmount('');
  };

  const handleSave = () => {
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

    if (!pincode.trim()) {
      toast({
        title: 'Error',
        description: 'Pincode is required.',
        variant: 'destructive',
      });
      return;
    }

    const amount = Number(orderAmount) || 0;

    addSingleCall({
      projectId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      pincode: pincode.trim(),
      orderAmount: amount,
    });

    toast({
      title: 'Call Added',
      description: `Call record for "${customerName}" has been added.`,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Call Record</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Customer Phone *</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Textarea
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter customer address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter pincode"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderAmount">Order Amount (₹)</Label>
              <Input
                id="orderAmount"
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Call</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCallDialog;
