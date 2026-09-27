import { useState, useRef } from 'react';
import { PromptInput } from './components/PromptInput';
import { ResultView } from './components/ResultView';
import { callApi, parseResult, GenerateOptions } from './lib/api';
import { validateItineraryResult } from './lib/validateResult';
import { ItineraryResult, AppError } from './types/result';

export function App() {
  const [itinerary, setItinerary] = useState<ItineraryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);

  // Stale-response guard pattern (prevents slow or out-of-order requests from overwriting newer ones)
  const requestId = useRef(0);

  // Keep track of the last submitted request to support one-click retries
  const lastRequestRef = useRef<{ input: string; options?: GenerateOptions } | null>(null);

  /**
   * Main generation handler.
   */
  async function generate(input: string, options?: GenerateOptions) {
    const id = ++requestId.current;
    lastRequestRef.current = { input, options };
    setCurrentPrompt(input);
    setIsEditingPrompt(false);

    // Validation: very short inputs trigger Slide 08 Warning state
    if (input.trim().length < 4) {
      setError({
        type: 'SHORT_INPUT',
        message: 'Tell us a little more about your trip.',
        details: 'Prompt was too short to create a structured itinerary.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Call backend proxy (the ONLY place backend is contacted)
      const raw = await callApi(input, options);

      // Stale-response guard: discard if superseded
      if (id !== requestId.current) {
        return;
      }

      // 2. Empty response check (Slide 08)
      if (!raw || raw.trim().length === 0) {
        setError({
          type: 'EMPTY_RESPONSE',
          message: 'No itinerary was generated.',
          details: 'The backend or model returned a zero-length text payload.',
        });
        setIsLoading(false);
        return;
      }

      // 3. Defensive parsing pattern (Slide 08: The itinerary couldn't be understood)
      const parsed = parseResult(raw);
      if (!parsed) {
        setError({
          type: 'MALFORMED_JSON',
          message: "The itinerary couldn't be understood.",
          details: `The model generated invalid JSON. Raw snippet: "${raw.slice(0, 180)}..."`,
        });
        setIsLoading(false);
        return;
      }

      // 4. Structural validation pattern (Slide 08)
      const validation = validateItineraryResult(parsed);
      if (!validation.isValid) {
        setError({
          type: 'WRONG_SHAPE',
          message: "The itinerary couldn't be understood.",
          details: validation.reason,
        });
        setIsLoading(false);
        return;
      }

      // 5. Successful valid structure
      setItinerary(parsed);
    } catch (err: any) {
      if (id !== requestId.current) return;

      const message: string = err?.message || "Couldn't connect.";
      const isMissingKey =
        message.toLowerCase().includes('gemini_api_key') ||
        message.toLowerCase().includes('api key');

      setError({
        type: isMissingKey ? 'MISSING_API_KEY' : 'NETWORK_ERROR',
        message: isMissingKey ? 'API key required.' : "Couldn't connect.",
        details: err?.stack || message,
      });
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
      }
    }
  }

  const handleRetry = () => {
    if (lastRequestRef.current) {
      generate(lastRequestRef.current.input, lastRequestRef.current.options);
    }
  };

  const handleNewTrip = () => {
    setItinerary(null);
    setError(null);
    setCurrentPrompt('');
    setIsEditingPrompt(false);
  };

  const handleEditTrip = () => {
    setIsEditingPrompt(true);
    setError(null);
  };

  const handleRegenerate = () => {
    if (currentPrompt) {
      generate(currentPrompt);
    }
  };

  // Determine whether to display prompt screen or result view
  const showPromptScreen = (!itinerary && !isLoading && !error) || isEditingPrompt;

  return (
    <div className="app-shell">
      {/* Top Navigation Bar (Slide 02, 04, 05) */}
      <nav className="navbar" aria-label="Main Navigation">
        <button
          type="button"
          className="brand-link"
          onClick={handleNewTrip}
          title="PRAYANA — Home"
        >
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L19 21L12 17L5 21L12 2Z"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="brand-name">PRAYANA</span>
        </button>

        <div className="nav-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNewTrip}
            id="nav-new-trip-button"
          >
            New trip
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {showPromptScreen ? (
          <PromptInput
            key={currentPrompt}
            initialValue={currentPrompt}
            onSubmit={(text, options) => generate(text, options)}
            isLoading={isLoading}
          />
        ) : (
          <ResultView
            isLoading={isLoading}
            error={error}
            itinerary={itinerary}
            onRetry={handleRetry}
            onEditTrip={handleEditTrip}
            onRegenerate={handleRegenerate}
            onUpdateItinerary={setItinerary}
          />
        )}
      </main>

      {/* Storyboard Journey Footer (Slide 10 & Slide 11) */}
      <footer className="storyboard-bar">
        <p className="storyboard-tagline">
          PRAYANA generates.
          <br />
          You decide.
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
          Your calm, spacious travel workspace
        </p>
      </footer>
    </div>
  );
}

export default App;
