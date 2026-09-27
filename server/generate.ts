import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

// POST /api/generate
app.post('/api/generate', async (req: Request, res: Response): Promise<void> => {
  const { userInput, simulate } = req.body;

  // Optional simulation query/body for explicitly verifying all 6 required failure modes & offline testing
  if (simulate === 'valid_mock') {
    const mockData = {
      title: "Japan Adventure",
      summary: "Tokyo → Kyoto → Osaka · 7 days · 3 cities",
      days: [
        {
          day: 1,
          title: "Historic Tokyo & Cultural Landmarks",
          city: "Tokyo",
          stops: [
            {
              id: "stop-101",
              time: "09:00",
              name: "Senso-ji Temple",
              description: "Explore Tokyo's oldest temple and surrounding streets.",
              category: "Cultural",
              duration: "1h 30m",
              location: "Asakusa, Tokyo"
            },
            {
              id: "stop-102",
              time: "12:00",
              name: "Lunch in Asakusa",
              description: "Traditional handmade soba and tempura at a century-old neighborhood establishment.",
              category: "Food",
              duration: "1h",
              location: "Asakusa, Tokyo"
            },
            {
              id: "stop-103",
              time: "15:00",
              name: "Shibuya Crossing",
              description: "Experience the world's most energetic pedestrian intersection and scenic rooftop vistas.",
              category: "Sightseeing",
              duration: "1h",
              location: "Shibuya, Tokyo"
            }
          ]
        },
        {
          day: 2,
          title: "Modern Tokyo & Vibrant Culture",
          city: "Tokyo",
          stops: [
            {
              id: "stop-201",
              time: "10:00",
              name: "Meiji Jingu Shrine",
              description: "Peaceful forest walk leading to Tokyo's premier sacred Shinto shrine.",
              category: "Cultural",
              duration: "1h 30m",
              location: "Harajuku, Tokyo"
            },
            {
              id: "stop-202",
              time: "13:00",
              name: "Harajuku Street Food & Crepes",
              description: "Vibrant boutiques, street art, and warm artisanal sweets.",
              category: "Food",
              duration: "1h",
              location: "Takeshita Street, Tokyo"
            },
            {
              id: "stop-203",
              time: "16:00",
              name: "Shinjuku Gyoen National Garden",
              description: "Spacious blend of traditional Japanese, French, and English landscaped gardens.",
              category: "Nature",
              duration: "1h 30m",
              location: "Shinjuku, Tokyo"
            }
          ]
        },
        {
          day: 3,
          title: "Ancient Temples & Bamboo Paths",
          city: "Kyoto",
          stops: [
            {
              id: "stop-301",
              time: "08:30",
              name: "Fushimi Inari Shrine",
              description: "Hike through thousands of vermilion torii gates winding up sacred Mount Inari.",
              category: "Cultural",
              duration: "2h",
              location: "Fushimi, Kyoto"
            },
            {
              id: "stop-302",
              time: "12:30",
              name: "Nishiki Market Culinary Tour",
              description: "Known as Kyoto's Kitchen, offering skewers, pickled vegetables, and matcha desserts.",
              category: "Food",
              duration: "1h 30m",
              location: "Nakagyo, Kyoto"
            },
            {
              id: "stop-303",
              time: "15:30",
              name: "Gion Historic Geisha District",
              description: "Preserved wooden machiya houses, traditional teahouses, and willow-lined canals.",
              category: "Sightseeing",
              duration: "1h 30m",
              location: "Gion, Kyoto"
            }
          ]
        },
        {
          day: 4,
          title: "Zen Gardens & Golden Pavilion",
          city: "Kyoto",
          stops: [
            {
              id: "stop-401",
              time: "09:30",
              name: "Kinkaku-ji (Golden Pavilion)",
              description: "Gleaming Zen temple covered in gold leaf overlooking the Mirror Pond.",
              category: "Cultural",
              duration: "1h 15m",
              location: "Kita, Kyoto"
            },
            {
              id: "stop-402",
              time: "13:00",
              name: "Arashiyama Bamboo Grove",
              description: "Towering green bamboo stalks creating natural ambient acoustic rustling.",
              category: "Nature",
              duration: "1h 30m",
              location: "Arashiyama, Kyoto"
            }
          ]
        },
        {
          day: 5,
          title: "Castle Grounds & Street Dining",
          city: "Osaka",
          stops: [
            {
              id: "stop-501",
              time: "10:30",
              name: "Osaka Castle & Park",
              description: "Historic 16th-century fortress surrounded by stone ramparts and moats.",
              category: "Cultural",
              duration: "2h",
              location: "Chuo, Osaka"
            },
            {
              id: "stop-502",
              time: "14:00",
              name: "Dotonbori Street Food Feast",
              description: "Famous neon-lit canal district packed with freshly made takoyaki and okonomiyaki.",
              category: "Food",
              duration: "2h",
              location: "Namba, Osaka"
            }
          ]
        }
      ]
    };
    res.json({ raw: JSON.stringify(mockData) });
    return;
  }
  if (simulate === 'malformed') {
    res.json({ raw: '{"days": [{"day": 1, "title": "Tokyo", "stops": [MALFORMED_JSON_SYNTAX' });
    return;
  }
  if (simulate === 'wrong_shape') {
    res.json({ raw: JSON.stringify({ destinations: ["Tokyo", "Kyoto"], note: "Missing days and stops" }) });
    return;
  }
  if (simulate === 'empty') {
    res.json({ raw: '' });
    return;
  }
  if (simulate === 'slow') {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    // Continue or return
  }
  if (simulate === 'error') {
    res.status(500).json({ error: 'Simulated server/API failure' });
    return;
  }

  // Validate user input
  if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
    res.status(400).json({
      error: 'Empty trip description. Please describe where and how you want to travel.',
      type: 'SHORT_INPUT',
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured. Please add your Gemini API key to .env file.',
      type: 'MISSING_API_KEY',
    });
    return;
  }

  // Required exact prompt pattern
  const prompt = `Return ONLY valid JSON matching this shape, no prose or markdown code blocks:
{
  "title": string,
  "summary": string,
  "days": [
    {
      "day": number,
      "title": string,
      "city": string,
      "stops": [
        {
          "id": string,
          "time": string,
          "name": string,
          "description": string,
          "category": string,
          "duration": string,
          "location": string
        }
      ]
    }
  ]
}
Trip description: ${userInput}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText && responseText.trim().length > 0) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} error:`, err?.message || err);
      }
    }

    if (!responseText || responseText.trim().length === 0) {
      if (lastError) throw lastError;
      res.status(502).json({
        error: 'Received empty response from Gemini API.',
        type: 'EMPTY_RESPONSE',
      });
      return;
    }

    // Return the raw text from Gemini so client-side defensive parsing & validation handle it
    res.json({ raw: responseText });
  } catch (error: any) {
    console.error('Error generating itinerary from Gemini:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate itinerary from Gemini API.',
      type: 'NETWORK_ERROR',
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Backend Proxy] Server listening on http://localhost:${PORT}`);
});
