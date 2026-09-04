const recipeSchema = {
  type: 'OBJECT',
  required: ['name', 'description', 'art', 'ingredients', 'steps', 'macros', 'time'],
  properties: {
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    art: { type: 'STRING' },
    ingredients: { type: 'ARRAY', items: { type: 'STRING' } },
    steps: { type: 'ARRAY', items: { type: 'STRING' } },
    macros: { type: 'ARRAY', items: { type: 'STRING' } },
    time: { type: 'STRING' }
  }
};

function clean(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return response.status(500).json({ error: 'Recipe generation is not configured yet.' });
  }

  const body = request.body || {};
  const goal = clean(body.goal, 'maintenance');
  const diet = clean(body.diet, 'any');
  const meal = clean(body.meal, 'lunch');
  const cuisine = clean(body.cuisine, 'any');
  const pantry = Array.isArray(body.pantry) ? body.pantry.filter(item => typeof item === 'string').slice(0, 20) : [];

  const prompt = `Create one practical recipe for an athlete.
Fuel goal: ${goal}
Dietary preference: ${diet}
Meal type: ${meal}
Cuisine inspiration: ${cuisine}
Pantry ingredients to prioritize: ${pantry.length ? pantry.join(', ') : 'none'}

Use the pantry ingredients when provided. Respect the dietary preference completely. Favor realistic portions, useful protein and carbohydrates for training, and ordinary grocery-store ingredients. Include concise instructions and estimated macros for one serving. Macros are estimates, not medical advice. Return only the requested JSON object.`;

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are Fuel Mode, an athlete-focused recipe generator. Never claim to diagnose, treat, or prevent a medical condition.' }]
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: recipeSchema,
          temperature: 0.9
        }
      })
    });

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error('Gemini request failed:', data);
      return response.status(502).json({ error: 'The recipe generator is temporarily unavailable.' });
    }

    const output = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    if (!output) return response.status(502).json({ error: 'The recipe generator returned an empty response.' });

    return response.status(200).json({ ...JSON.parse(output), aiGenerated: true });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return response.status(502).json({ error: 'The recipe generator could not create a recipe right now.' });
  }
}
