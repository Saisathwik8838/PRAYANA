import React, { useState } from 'react';
import { AppError } from '../types/result';

interface ErrorStateProps {
  error: AppError;
  onRetry: () => void;
  onEditTrip?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onEditTrip }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Mapping failure modes to the exact 5 visual cards in Slide 08
  const getCardDetails = () => {
    switch (error.type) {
      case 'SHORT_INPUT':
        return {
          icon: '!',
          title: 'Tell us a little more about your trip.',
          subtitle: error.message !== 'Tell us a little more about your trip.' ? error.message : undefined,
          actionLabel: 'Edit trip',
          actionHandler: onEditTrip || onRetry,
        };
      case 'NETWORK_ERROR':
        return {
          icon: '↻',
          title: "Couldn't connect.",
          subtitle: error.message && error.message !== "Couldn't connect." ? error.message : undefined,
          actionLabel: 'Retry',
          actionHandler: onRetry,
        };
      case 'SLOW_RESPONSE':
        return {
          icon: '✕',
          title: "Couldn't build your trip.",
          subtitle: "The planning service didn't respond in time.",
          actionLabel: 'Try again',
          actionHandler: onRetry,
        };
      case 'MALFORMED_JSON':
      case 'WRONG_SHAPE':
        return {
          icon: '?',
          title: "The itinerary couldn't be understood.",
          subtitle: error.message || 'The data returned was not in the expected format.',
          actionLabel: 'Try again',
          actionHandler: onRetry,
        };
      case 'EMPTY_RESPONSE':
        return {
          icon: '—',
          title: 'No itinerary was generated.',
          subtitle: error.message && error.message !== 'No itinerary was generated.' ? error.message : undefined,
          actionLabel: 'Try again',
          actionHandler: onRetry,
        };
      case 'MISSING_API_KEY':
      default:
        return {
          icon: '✕',
          title: "Couldn't build your trip.",
          subtitle: error.message || "The planning service didn't respond.",
          actionLabel: 'Try again',
          actionHandler: onRetry,
        };
    }
  };

  const card = getCardDetails();

  return (
    <div className="error-view-container" role="alert">
      <div className="error-card">
        {/* Soft Circular Icon Badge (Slide 08) */}
        <div className="error-icon-circle">
          <span>{card.icon}</span>
        </div>

        {/* Primary Error Message */}
        <h3 className="error-title-text">{card.title}</h3>

        {/* Subtitle if applicable */}
        {card.subtitle && (
          <p className="error-subtitle-text">{card.subtitle}</p>
        )}

        {/* Action Button (Slide 08) */}
        {card.actionLabel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={card.actionHandler}
            id="error-action-button"
            style={{ minWidth: '110px' }}
          >
            {card.actionLabel}
          </button>
        )}

        {/* Evaluator Technical Details Dropdown */}
        {error.details && (
          <div style={{ marginTop: '0.5rem', width: '100%', textAlign: 'center' }}>
            <button
              type="button"
              className="error-details-toggle"
              onClick={() => setShowTechnicalDetails((v) => !v)}
            >
              {showTechnicalDetails ? 'Hide technical logs' : 'View error details for evaluators'}
            </button>
            {showTechnicalDetails && (
              <pre className="error-technical-box" style={{ marginTop: '0.65rem' }}>
                {error.details}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
