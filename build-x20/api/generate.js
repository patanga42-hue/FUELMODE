const recipeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'description', 'art', 'ingredients', 'steps', 'macros', 'time'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    art: { type: 'string' },
    ingredients: { type: 'array', items: { type: 'string' } },
    steps: { type: 'array', items: { type: 'string' } },
    macros: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
    time: { type: 'string' }
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

  if (!process.env.OPENAI_API_KEY) {
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
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Fuel Mode, an athlete-focused recipe generator. Never claim to diagnose, treat, or prevent a medical condition.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'fuel_mode_recipe',
            strict: true,
            schema: recipeSchema
          }
        }
      })
    });

    const data = await openAIResponse.json();
    if (!openAIResponse.ok) {
      console.error('OpenAI request failed:', data);
      return response.status(502).json({ error: 'The recipe generator is temporarily unavailable.' });
    }

    const output = data.choices?.[0]?.message?.content;
    if (!output) return response.status(502).json({ error: 'The recipe generator returned an empty response.' });

    return response.status(200).json({ ...JSON.parse(output), aiGenerated: true });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return response.status(502).json({ error: 'The recipe generator could not create a recipe right now.' });
  }
}
