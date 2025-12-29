import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-sm transition-all duration-300",
                index < currentStep
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : index === currentStep
                  ? "border-2 border-primary text-primary bg-accent"
                  : "border-2 border-muted text-muted-foreground bg-muted"
              )}
            >
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                "text-xs mt-2 font-medium transition-colors duration-300 hidden sm:block",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {labels[index]}
            </span>
          </div>
          {index < totalSteps - 1 && (
            <div
              className={cn(
                "w-8 sm:w-16 h-0.5 mx-2 transition-colors duration-300",
                index < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
