import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between w-full mb-12 relative">
      {labels.map((label, index) => (
        <div key={index} className="flex-1 flex flex-col items-center relative">
          
          {/* Connector Line - Only renders BEFORE steps 2, 3, and 4 */}
          {index !== 0 && (
            <div
              className={cn(
                "absolute top-5 right-[50%] left-[-50%] h-[2px] -z-10 transition-colors duration-300",
                index <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}

          {/* Circle */}
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-sm transition-all duration-300 bg-background z-10",
              index < currentStep
                ? "bg-primary text-primary-foreground shadow-sm"
                : index === currentStep
                ? "border-2 border-primary text-primary"
                : "border-2 border-muted text-muted-foreground"
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

          {/* Label */}
          <span
            className={cn(
              "absolute top-12 text-xs font-medium transition-colors duration-300 whitespace-nowrap",
              index <= currentStep ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;