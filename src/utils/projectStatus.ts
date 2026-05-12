import { BackendProjectData } from '@/types/vendor';

export interface ProjectStepInfo {
  step: number;
  label: string;
  description: string;
  nextAction: string;
  color: string;
}

export const getDraftProjectStep = (project?: BackendProjectData | null): ProjectStepInfo => {
  if (!project) {
    return {
      step: 1,
      label: 'Setup Initialized',
      description: 'Preparing your project structure...',
      nextAction: 'Wait...',
      color: 'bg-muted text-muted-foreground border-muted'
    };
  }
  const totalCalls = project.totalCalls || 0;
  const totalCost = project.totalCost || 0;

  // Step 1 is always completed if the project exists in the backend
  
  if (totalCalls === 0) {
    return {
      step: 2,
      label: 'Upload Calls',
      description: 'Project details saved. Please upload your branch/asset list.',
      nextAction: 'Upload CSV',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    };
  }

  if (totalCost === 0) {
    return {
      step: 3,
      label: 'Address Validation',
      description: 'Files uploaded. We are verifying serviceability for your locations.',
      nextAction: 'Verify Addresses',
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    };
  }

  return {
    step: 4,
    label: 'Review & Activate',
    description: 'Validation complete. Review the cost summary and activate your project.',
    nextAction: 'Final Review',
    color: 'bg-green-500/10 text-green-600 border-green-500/20'
  };
};
