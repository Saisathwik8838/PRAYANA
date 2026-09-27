import React from 'react';
import { ItineraryResult, AppError } from '../types/result';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { ItineraryView } from './ItineraryView';

interface ResultViewProps {
  isLoading: boolean;
  error: AppError | null;
  itinerary: ItineraryResult | null;
  onRetry: () => void;
  onEditTrip?: () => void;
  onRegenerate?: () => void;
  onUpdateItinerary: (updated: ItineraryResult) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  isLoading,
  error,
  itinerary,
  onRetry,
  onEditTrip,
  onRegenerate,
  onUpdateItinerary,
}) => {
  // 1. Loading State (Slide 03)
  if (isLoading) {
    return <LoadingState />;
  }

  // 2. Error State (Slide 08)
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        onEditTrip={onEditTrip}
      />
    );
  }

  // 3. Structured Itinerary Result (Slide 02, 06, 07)
  if (itinerary) {
    return (
      <ItineraryView
        itinerary={itinerary}
        onUpdateItinerary={onUpdateItinerary}
        onEditTrip={onEditTrip}
        onRegenerate={onRegenerate}
      />
    );
  }

  return null;
};
