# PRAYANA — AI Trip Planner

PRAYANA is a clean and calm travel planner built with React. You describe the kind of trip you want in a simple prompt (up to 280 characters), and it builds a day-by-day itinerary that you can interact with, edit, and reorder.

---

## What It Does

- **Natural language prompt**: Type what kind of trip you want, or click one of the suggested prompts to get started.
- **Structured day-by-day plan**: Breaks down your trip into organized days and stops with times, categories, and durations.
- **Interactive stops**: Click any stop to expand it and view details like descriptions and location notes.
- **Drag-and-drop reordering**: Easily move stops up or down to adjust your schedule.
- **Add & edit stops**: Add new places or edit existing ones directly from the interface.
- **Graceful error handling**: If the AI returns invalid JSON, empty responses, or the connection drops, the app shows clear, helpful error screens with retry options instead of crashing.

---

## Project Structure

The project follows the assigned structure:

```
flam-frontend-assignment/
├── src/
│   ├── components/
│   │   ├── PromptInput.tsx        # Text input card with 280-char limit and suggestions
│   │   ├── ResultView.tsx         # Decides whether to show loading, error, or itinerary
│   │   ├── ItineraryView.tsx      # Main itinerary workspace (day tabs, stops, drag & drop)
│   │   ├── FlashcardDeck.tsx      # Re-exports ItineraryView for template compatibility
│   │   ├── ErrorState.tsx         # Friendly error and retry screens
│   │   └── LoadingState.tsx       # Step-by-step progress checklist during generation
│   ├── lib/
│   │   ├── api.ts                 # Sends requests to our backend proxy
│   │   └── validateResult.ts      # Checks that the data matches the expected format
│   ├── types/
│   │   └── result.ts              # TypeScript definitions for stops, days, and itineraries
│   ├── App.tsx                    # Main app container and request handler
│   ├── index.css                  # Colors, fonts (Fraunces & Inter), and layouts
│   └── main.tsx                   # React entry point
├── server/
│   └── generate.ts                # Express proxy that securely calls Gemini with your API key
├── .env.example                   # Example environment variables
├── README.md                      # Project guide
└── package.json
```

---

## Testing Without an API Key

If you want to test the app without setting up a Gemini API key or want to test specific failure cases, there is a **Simulation Mode** dropdown right below the prompt box:

- **Valid Sample Itinerary (Offline Demo)**: Loads a full 5-day Japan trip right away.
- **Simulate Malformed JSON**: Tests how the app handles broken JSON from an AI.
- **Simulate Wrong Shape**: Tests how the app handles missing fields or bad schema.
- **Simulate Empty Response**: Tests how the app handles a blank response.
- **Simulate Slow Response**: Tests the loading screen with an artificial delay.
- **Simulate Server Error**: Tests the retry screen when a network/500 error occurs.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your environment
`.env`:
```bash
cp .env
```

Open `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

*(Note: If you don't have a key, you can still test everything using the simulation dropdown mentioned above).*

### 3. Start the project
```bash
npm run dev
```

This starts both the Express server (port `3001`) and the Vite React frontend (port `5173`). Open `http://localhost:5173` in your browser.

### 4. Build for production
```bash
npm run build
```
