import { GoogleGenAI, Type } from '@google/genai';

function getServerGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GeminiHandlerResult {
  status: number;
  body: Record<string, unknown>;
}

export async function processBriefRequest(rawBody: unknown): Promise<GeminiHandlerResult> {
  const ai = getServerGeminiClient();
  if (!ai) {
    return { status: 200, body: { mode: 'offline', reason: 'no_api_key' } };
  }

  const { snapshot, targetLang } = (rawBody ?? {}) as {
    snapshot?: unknown;
    targetLang?: string;
  };

  if (!snapshot) {
    return { status: 400, body: { error: 'Missing telemetry snapshot' } };
  }

  const langLabel = targetLang === 'Urdu' ? 'Urdu' : 'English';
  const systemInstruction = `You are EarthPulse, a disciplined aerospace telemetry translator.
STRICT GROUNDING RULES:
1. Cite ONLY numbers, dates, and sources explicitly present in the provided JSON telemetry snapshot.
2. Never invent statistics, probabilities, or state future weather with absolute certainty.
3. Provide zero medical or legal diagnoses.
4. Respond strictly in ${langLabel}.
5. Whenever overallStatus is "warning" or "critical", explicitly instruct the user to follow official local emergency authorities.
6. No emojis.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a plain-language local situation brief for this telemetry snapshot:\n${JSON.stringify(
        snapshot
      )}`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: 'Max 12 words plain-language headline',
            },
            summary: {
              type: Type.STRING,
              description: 'Max 60 words grounded strictly in the telemetry snapshot',
            },
            topActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 short actionable imperatives tailored to the persona',
            },
            dataGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Any missing, fallback, or lagged data sources noted in snapshot',
            },
          },
          required: ['headline', 'summary', 'topActions', 'dataGaps'],
        },
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      return { status: 200, body: { mode: 'offline', reason: 'empty_response' } };
    }

    const parsed = JSON.parse(text) as {
      headline: string;
      summary: string;
      topActions: string[];
      dataGaps: string[];
    };

    return {
      status: 200,
      body: {
        mode: 'gemini',
        brief: {
          headline: parsed.headline,
          summary: parsed.summary,
          topActions: Array.isArray(parsed.topActions) ? parsed.topActions.slice(0, 3) : [],
          dataGaps: Array.isArray(parsed.dataGaps) ? parsed.dataGaps : [],
        },
      },
    };
  } catch {
    return { status: 200, body: { mode: 'offline', reason: 'gemini_unavailable' } };
  }
}

export async function processChatRequest(rawBody: unknown): Promise<GeminiHandlerResult> {
  const ai = getServerGeminiClient();
  if (!ai) {
    return { status: 200, body: { mode: 'offline', reason: 'no_api_key' } };
  }

  const { question, snapshot, targetLang } = (rawBody ?? {}) as {
    question?: string;
    snapshot?: unknown;
    targetLang?: string;
  };

  if (!question || !snapshot) {
    return { status: 400, body: { error: 'Missing question or telemetry snapshot' } };
  }

  const langLabel = targetLang === 'Urdu' ? 'Urdu' : 'English';
  const systemInstruction = `You are EarthPulse Q&A, strictly scoped to the active local NASA and partner environmental telemetry snapshot.
RULES:
1. Answer ONLY using facts and numbers present in the JSON telemetry snapshot. If a figure is absent, state clearly that it is not in the current telemetry.
2. If the user asks about unrelated topics (coding, politics, celebrity trivia, medical prescriptions, general non-environmental queries), politely decline and redirect back to local wildfire, flood, soil moisture, weather, or air quality telemetry.
3. Never invent numbers or give medical/legal diagnoses.
4. Keep answers concise (under 110 words) in ${langLabel}, with no emojis.
5. If status is warning or critical, remind the user to follow official local authorities.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `TELEMETRY SNAPSHOT:\n${JSON.stringify(snapshot)}\n\nUSER QUESTION: ${question}`,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      return { status: 200, body: { mode: 'offline', reason: 'empty_response' } };
    }

    return { status: 200, body: { mode: 'gemini', answer: text } };
  } catch {
    return { status: 200, body: { mode: 'offline', reason: 'gemini_unavailable' } };
  }
}
