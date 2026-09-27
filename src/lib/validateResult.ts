import { ItineraryResult, Stop, DayPlan } from '../types/result';

export interface ValidationOutcome {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates that an individual stop matches the exact required schema:
 * { id: string, time: string, name: string, description: string, category: string }
 */
export function isValidStop(stop: unknown): stop is Stop {
  if (!stop || typeof stop !== 'object') return false;
  const s = stop as Record<string, unknown>;

  return (
    typeof s.id === 'string' &&
    typeof s.time === 'string' &&
    typeof s.name === 'string' &&
    s.name.trim().length > 0 &&
    typeof s.description === 'string' &&
    typeof s.category === 'string'
  );
}

/**
 * Validates that a day plan matches the exact required schema:
 * { day: number, title: string, stops: Stop[] }
 */
export function isValidDayPlan(dayPlan: unknown): dayPlan is DayPlan {
  if (!dayPlan || typeof dayPlan !== 'object') return false;
  const d = dayPlan as Record<string, unknown>;

  if (typeof d.day !== 'number' || isNaN(d.day)) return false;
  if (typeof d.title !== 'string' || d.title.trim().length === 0) return false;
  if (!Array.isArray(d.stops) || d.stops.length === 0) return false;

  return d.stops.every(isValidStop);
}

/**
 * Structural validation for ItineraryResult.
 * Kept strictly separate from parsing so shape-checking is isolated and verifiable.
 */
export function validateItineraryResult(data: unknown): ValidationOutcome {
  if (!data || typeof data !== 'object') {
    return { isValid: false, reason: 'Parsed payload is not an object.' };
  }

  const result = data as Record<string, unknown>;

  if (!('days' in result)) {
    return { isValid: false, reason: "Missing top-level 'days' property." };
  }

  if (!Array.isArray(result.days)) {
    return { isValid: false, reason: "'days' property must be an array." };
  }

  if (result.days.length === 0) {
    return { isValid: false, reason: "The 'days' array is empty." };
  }

  for (let i = 0; i < result.days.length; i++) {
    const day = result.days[i];
    if (!isValidDayPlan(day)) {
      return {
        isValid: false,
        reason: `Day at index ${i} is missing required fields (day: number, title: string, stops: Stop[]).`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Boolean type-guard for ItineraryResult.
 */
export function isValidItinerary(data: unknown): data is ItineraryResult {
  return validateItineraryResult(data).isValid;
}
