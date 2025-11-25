import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductRow {
  sku: string;
  price: number;
  unit: string;
  quantity: number;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    image_front_small_url?: string;
    image_url?: string;
  };
}

async function fetchProductFromOpenFoodFacts(sku: string): Promise<{ name: string; image_url: string | null }> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${sku}.json`);
    const data: OpenFoodFactsResponse = await response.json();
    
    if (data.status === 1 && data.product) {
      const name = data.product.product_name || 'Produto Desconhecido';
      const image_url = data.product.image_front_small_url || data.product.image_url || null;
      return { name, image_url };
    }
  } catch (error) {
    console.error(`Error fetching product ${sku} from Open Food Facts:`, error);
  }
  
  return { name: 'Produto Desconhecido', image_url: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csvData, lojaId } = await req.json();
    
    if (!csvData || !lojaId) {
      return new Response(
        JSON.stringify({ error: 'CSV data and lojaId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting import for loja ${lojaId} with ${csvData.length} products`);

    const results = {
      updated: 0,
      created: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row: ProductRow = csvData[i];
      
      try {
        console.log(`Processing product ${i + 1}/${csvData.length}: SKU ${row.sku}`);

        // Fetch product data from Open Food Facts
        const { name, image_url } = await fetchProductFromOpenFoodFacts(row.sku);
        
        // Check if product exists in produtos table
        const { data: existingProduct, error: fetchError } = await supabase
          .from('produtos')
          .select('id')
          .eq('sku', row.sku)
          .maybeSingle();

        if (fetchError) {
          console.error(`Error fetching product ${row.sku}:`, fetchError);
          results.errors.push(`SKU ${row.sku}: ${fetchError.message}`);
          continue;
        }

        let productId: string;

        if (existingProduct) {
          // Update existing product
          const { data: updatedProduct, error: updateError } = await supabase
            .from('produtos')
            .update({
              nome: name,
              imagem_url: image_url,
              unit: row.unit,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProduct.id)
            .select('id')
            .single();

          if (updateError) {
            console.error(`Error updating product ${row.sku}:`, updateError);
            results.errors.push(`SKU ${row.sku}: ${updateError.message}`);
            continue;
          }

          productId = updatedProduct.id;
          console.log(`Updated product ${row.sku} (ID: ${productId})`);
        } else {
          // Create new product
          const { data: newProduct, error: insertError } = await supabase
            .from('produtos')
            .insert({
              sku: row.sku,
              nome: name,
              imagem_url: image_url,
              unit: row.unit,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`Error creating product ${row.sku}:`, insertError);
            results.errors.push(`SKU ${row.sku}: ${insertError.message}`);
            continue;
          }

          productId = newProduct.id;
          results.created++;
          console.log(`Created new product ${row.sku} (ID: ${productId})`);
        }

        // Upsert produtos_lojas (product-store relationship)
        const { error: upsertError } = await supabase
          .from('produtos_lojas')
          .upsert({
            produto_id: productId,
            loja_id: lojaId,
            preco_atual: row.price,
            quantity: row.quantity,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'produto_id,loja_id',
          });

        if (upsertError) {
          console.error(`Error upserting produtos_lojas for ${row.sku}:`, upsertError);
          results.errors.push(`SKU ${row.sku}: ${upsertError.message}`);
          continue;
        }

        if (existingProduct) {
          results.updated++;
        }

        console.log(`Successfully processed product ${row.sku}`);

      } catch (error) {
        console.error(`Unexpected error processing product ${row.sku}:`, error);
        results.errors.push(`SKU ${row.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Import completed. Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`);

    return new Response(
      JSON.stringify(results),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in import-products-csv function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
