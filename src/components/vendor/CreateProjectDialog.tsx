import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVendor, SupportType } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';
import { FolderPlus } from 'lucide-react';

const supportTypes: SupportType[] = [
  'pm activity',
  'breakfix',
  'on call',
];

const supportTypeLabels: Record<SupportType, string> = {
  'pm activity': 'PM Activity',
  'breakfix': 'Breakfix',
  'on call': 'On Call Support',
};

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  supportType: z.enum(['pm activity', 'breakfix', 'on call'] as const, { required_error: 'Please select a support type' }),
  status: z.enum(['active', 'on-hold']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProjectDialog = ({ open, onOpenChange }: CreateProjectDialogProps) => {
  const { currentVendor, addProject } = useVendor();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    if (!currentVendor) return;

    setIsSubmitting(true);
    try {
      addProject({
        vendorId: currentVendor.id,
        name: data.name,
        supportType: data.supportType,
        status: data.status,
      });

      toast({
        title: 'Project Created',
        description: `Project "${data.name}" has been created successfully.`,
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to manage your delivery calls
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Mumbai Metro Deliveries"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportType">Support Type *</Label>
            <Select
              onValueChange={(value: SupportType) => setValue('supportType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select support type" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {supportTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {supportTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supportType && (
              <p className="text-sm text-destructive">{errors.supportType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              defaultValue="active"
              onValueChange={(value: 'active' | 'on-hold') => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
