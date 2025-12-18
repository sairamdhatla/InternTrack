// Valid application statuses in order
export const APPLICATION_STATUSES = ['Applied', 'OA', 'Interview', 'Offer', 'Accepted', 'Rejected'] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

// Define valid transitions: key is current status, value is array of valid next statuses
const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  'Applied': ['OA'],
  'OA': ['Interview'],
  'Interview': ['Offer'],
  'Offer': ['Accepted', 'Rejected'],
  'Accepted': [], // Terminal state
  'Rejected': [], // Terminal state
};

export function isValidStatus(status: string): status is ApplicationStatus {
  return APPLICATION_STATUSES.includes(status as ApplicationStatus);
}

export function getValidNextStatuses(currentStatus: string): ApplicationStatus[] {
  if (!isValidStatus(currentStatus)) {
    return [];
  }
  return VALID_TRANSITIONS[currentStatus];
}

export function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  if (!isValidStatus(currentStatus) || !isValidStatus(newStatus)) {
    return false;
  }
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

export function getTransitionError(currentStatus: string, newStatus: string): string | null {
  if (!isValidStatus(currentStatus)) {
    return `Invalid current status: ${currentStatus}`;
  }
  if (!isValidStatus(newStatus)) {
    return `Invalid target status: ${newStatus}`;
  }
  if (currentStatus === newStatus) {
    return 'Status is already set to this value';
  }
  
  const validNext = VALID_TRANSITIONS[currentStatus];
  
  if (validNext.length === 0) {
    return `Cannot change status from "${currentStatus}" - this is a final state`;
  }
  
  if (!validNext.includes(newStatus)) {
    return `Cannot transition from "${currentStatus}" to "${newStatus}". Valid next status: ${validNext.join(' or ')}`;
  }
  
  return null;
}

export function isTerminalStatus(status: string): boolean {
  if (!isValidStatus(status)) return false;
  return VALID_TRANSITIONS[status].length === 0;
}
