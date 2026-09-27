import React, { useState } from 'react';
import { Sparkles, Beaker, X } from 'lucide-react';
import { GenerateOptions } from '../lib/api';

interface PromptInputProps {
  onSubmit: (userInput: string, options?: GenerateOptions) => void;
  isLoading: boolean;
  initialValue?: string;
  onClearTrip?: () => void;
}

const SUGGESTIONS = [
  '5 days in Kerala for food and backwaters',
  'Weekend in Jaipur on a budget',
  '7 days through Himachal with friends',
];

const MAX_CHAR_COUNT = 280;

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isLoading,
  initialValue = '',
}) => {
  const [input, setInput] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [simulationMode, setSimulationMode] = useState<GenerateOptions['simulate'] | ''>('');

  const charCount = input.length;
  const isInputValid = input.trim().length > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isInputValid || isLoading) return;

    onSubmit(input.trim(), {
      simulate: simulationMode ? (simulationMode as GenerateOptions['simulate']) : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggestion = (text: string) => {
    setInput(text);
    onSubmit(text, {
      simulate: simulationMode ? (simulationMode as GenerateOptions['simulate']) : undefined,
    });
  };

  return (
    <div className="prompt-container">
      {/* Hero Headline (Slide 04, 05) */}
      <section className="hero-section">
        <h1 className="hero-title">
          Plan less.
          <br />
          Experience more.
        </h1>
        <p className="hero-subtitle">
          Describe your trip. We'll structure the rest.
        </p>
      </section>

      {/* Main Input Card (Slide 04, 05) */}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div className={`prompt-card ${isFocused ? 'focused' : ''}`}>
          <textarea
            id="trip-prompt-input"
            className="prompt-textarea"
            rows={3}
            maxLength={MAX_CHAR_COUNT}
            placeholder="Tell us about your trip, destination, duration, interests, travel style..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label="Trip description"
          />

          <div className="prompt-card-divider" />

          <div className="prompt-footer">
            <span className={`char-counter ${charCount >= MAX_CHAR_COUNT ? 'limit' : ''}`}>
              {charCount} / {MAX_CHAR_COUNT}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {input.length > 0 && !isLoading && (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setInput('')}
                  title="Clear input"
                  aria-label="Clear input"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="submit"
                id="create-itinerary-button"
                className={`btn-create-itinerary ${isInputValid && !isLoading ? 'active' : 'disabled'}`}
                disabled={!isInputValid || isLoading}
              >
                <Sparkles size={15} />
                <span>Create itinerary</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Suggestions Pills (Slide 04, 05) */}
      <div className="prompt-chips-wrapper">
        <div className="prompt-chips-row">
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              className="prompt-chip"
              onClick={() => handleSelectSuggestion(suggestion)}
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Evaluator Simulation Drawer for verifying all 6 failure modes */}
      <div className="evaluator-drawer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Beaker size={14} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600 }}>Test Simulation Mode:</span>
        </div>
        <select
          id="simulation-mode-select"
          className="evaluator-select"
          value={simulationMode}
          onChange={(e) => setSimulationMode(e.target.value as any)}
          disabled={isLoading}
          aria-label="Simulation test mode"
        >
          <option value="">Standard (Live Gemini API)</option>
          <option value="valid_mock">Simulate: Valid Sample Itinerary (Offline Demo)</option>
          <option value="malformed">Simulate: Malformed JSON</option>
          <option value="wrong_shape">Simulate: Wrong Shape</option>
          <option value="empty">Simulate: Empty Response</option>
          <option value="slow">Simulate: Slow Response (6s)</option>
          <option value="error">Simulate: Network / API Error (500)</option>
        </select>
      </div>
    </div>
  );
};
