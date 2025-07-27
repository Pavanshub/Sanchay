import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategorizationRequest {
  product_name: string;
  description?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, description }: CategorizationRequest = await req.json();
    
    const openRouterApiKey = Deno.env.get('VITE_OPENROUTER_API_KEY');
    
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not found');
    }

    // Call OpenRouter Gemini API for categorization
    const prompt = `Categorize this food product into one of these categories: Vegetables, Spices, Grains & Pulses, Oil & Ghee, Dairy, Meat & Fish, Packaging.

Product: ${product_name}
Description: ${description || 'No description'}

Respond with only the category name and suggested bulk price tiers in JSON format:
{
  "category": "category_name",
  "bulk_tiers": [
    {"min_quantity": 10, "discount_percentage": 5},
    {"min_quantity": 25, "discount_percentage": 12},
    {"min_quantity": 50, "discount_percentage": 20}
  ],
  "reasoning": "brief explanation"
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sanchay.app',
        'X-Title': 'Sanchay Group Buying Platform',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const categorization = JSON.parse(content);

    return new Response(JSON.stringify(categorization), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Categorization error:', error);
    
    // Fallback categorization
    const fallbackResponse = {
      category: 'Vegetables',
      bulk_tiers: [
        {"min_quantity": 10, "discount_percentage": 5},
        {"min_quantity": 25, "discount_percentage": 12},
        {"min_quantity": 50, "discount_percentage": 20}
      ],
      reasoning: 'Fallback categorization due to AI service error',
      error: error.message
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});