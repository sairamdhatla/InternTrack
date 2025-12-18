import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { getValidNextStatuses, isTerminalStatus, ApplicationStatus } from '../utils/statusStateMachine';

interface StatusTransitionButtonsProps {
  currentStatus: string;
  onTransition: (newStatus: ApplicationStatus) => Promise<void>;
  disabled?: boolean;
}

const statusButtonColors: Record<string, string> = {
  'OA': 'bg-yellow-500 hover:bg-yellow-600 text-white',
  'Interview': 'bg-purple-500 hover:bg-purple-600 text-white',
  'Offer': 'bg-green-500 hover:bg-green-600 text-white',
  'Accepted': 'bg-emerald-600 hover:bg-emerald-700 text-white',
  'Rejected': 'bg-red-500 hover:bg-red-600 text-white',
};

export function StatusTransitionButtons({ currentStatus, onTransition, disabled }: StatusTransitionButtonsProps) {
  const validNextStatuses = getValidNextStatuses(currentStatus);
  
  if (isTerminalStatus(currentStatus)) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Final status
      </span>
    );
  }

  if (validNextStatuses.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      {validNextStatuses.map((status) => (
        <Button
          key={status}
          size="sm"
          variant="default"
          className={`h-6 px-2 text-xs ${statusButtonColors[status] || ''}`}
          onClick={() => onTransition(status)}
          disabled={disabled}
        >
          {status}
        </Button>
      ))}
    </div>
  );
}
