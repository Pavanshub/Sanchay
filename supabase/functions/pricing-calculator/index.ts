import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PricingRequest {
  inventory_id: string;
  total_quantity: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { inventory_id, total_quantity }: PricingRequest = await req.json();

    // Get inventory item and bulk tiers
    const { data: inventory, error: inventoryError } = await supabaseClient
      .from('inventory')
      .select(`
        *,
        bulk_tiers (*)
      `)
      .eq('id', inventory_id)
      .single();

    if (inventoryError) throw inventoryError;

    // Calculate optimal price based on bulk tiers
    let bestPrice = inventory.base_price;
    
    if (inventory.bulk_tiers && inventory.bulk_tiers.length > 0) {
      // Sort tiers by minimum quantity descending
      const sortedTiers = inventory.bulk_tiers
        .filter(tier => total_quantity >= tier.min_quantity)
        .sort((a, b) => b.min_quantity - a.min_quantity);
      
      if (sortedTiers.length > 0) {
        bestPrice = sortedTiers[0].price_per_unit;
      }
    }

    // Calculate savings
    const originalTotal = inventory.base_price * total_quantity;
    const discountedTotal = bestPrice * total_quantity;
    const savings = originalTotal - discountedTotal;
    const savingsPercentage = ((savings / originalTotal) * 100).toFixed(1);

    const response = {
      inventory_id,
      total_quantity,
      base_price: inventory.base_price,
      discounted_price: bestPrice,
      total_amount: discountedTotal,
      savings_amount: savings,
      savings_percentage: parseFloat(savingsPercentage),
      applicable_tier: inventory.bulk_tiers?.find(tier => 
        total_quantity >= tier.min_quantity && tier.price_per_unit === bestPrice
      ),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});