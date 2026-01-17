import { useState, useEffect } from 'react';
import { ProjectData, SupportType, useVendor } from '@/contexts/VendorContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | null;
}

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

const EditProjectDialog = ({ open, onOpenChange, project }: EditProjectDialogProps) => {
  const { updateProject } = useVendor();
  const [projectName, setProjectName] = useState('');
  const [supportType, setSupportType] = useState<SupportType>('breakfix');

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setSupportType(project.supportType);
    }
  }, [project]);

  const handleSave = () => {
    if (!project) return;

    if (!projectName.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required.',
        variant: 'destructive',
      });
      return;
    }

    updateProject(project.id, {
      name: projectName.trim(),
      supportType,
    });

    toast({
      title: 'Project Updated',
      description: `"${projectName}" has been updated successfully.`,
    });

    onOpenChange(false);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportType">Support Type</Label>
            <Select value={supportType} onValueChange={(val) => setSupportType(val as SupportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select support type" />
              </SelectTrigger>
              <SelectContent>
                {supportTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {supportTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
