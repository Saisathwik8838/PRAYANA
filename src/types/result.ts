export interface Stop {
  id: string;
  time: string;
  name: string;
  description: string;
  category: string;
  duration?: string;
  location?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  city?: string;
  stops: Stop[];
}

export interface ItineraryResult {
  title?: string;
  summary?: string;
  days: DayPlan[];
}

export type FailureReason =
  | 'SHORT_INPUT'
  | 'MALFORMED_JSON'
  | 'WRONG_SHAPE'
  | 'EMPTY_RESPONSE'
  | 'SLOW_RESPONSE'
  | 'NETWORK_ERROR'
  | 'MISSING_API_KEY';

export interface AppError {
  type: FailureReason;
  message: string;
  details?: string;
}
