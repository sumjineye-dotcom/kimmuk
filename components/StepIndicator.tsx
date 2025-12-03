import { ScriptState } from '../types';

interface StepIndicatorProps {
  currentStep: ScriptState['step'];
}

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const steps = [
    { id: 'INPUT', label: '1. 대본 입력' },
    { id: 'TOPIC_SELECTION', label: '2. 주제 선택' },
    { id: 'SCRIPT_VIEW', label: '3. 대본 완성' },
  ];

  return (
    <div className="flex items-center justify-center w-full mb-12">
      <div className="flex items-center gap-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = steps.findIndex(s => s.id === currentStep) > index;
          
          return (
            <div key={step.id} className="flex items-center">
              <div 
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full border 
                  ${isActive 
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                    : isPast 
                      ? 'border-green-500 bg-green-500/10 text-green-400' 
                      : 'border-gray-800 text-gray-400'}
                `}
              >
                <span className={`font-bold ${isActive || isPast ? '' : 'opacity-50'}`}>
                    {isPast ? '✓' : index + 1}
                </span>
                <span className="font-medium text-sm whitespace-nowrap">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-[2px] mx-2 ${isPast ? 'bg-green-500' : 'bg-gray-800'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};