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
    console.log(`Fetching product data for SKU: ${sku}`);
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${sku}.json`);
    const data: OpenFoodFactsResponse = await response.json();
    
    if (data.status === 1 && data.product) {
      const name = data.product.product_name || 'Produto Desconhecido';
      const image_url = data.product.image_front_small_url || data.product.image_url || null;
      console.log(`Found product: ${name}, image: ${image_url ? 'yes' : 'no'}`);
      return { name, image_url };
    } else {
      console.log(`Product not found in Open Food Facts: ${sku}`);
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
      console.error('Missing csvData or lojaId');
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
        console.log(`\n--- Processing product ${i + 1}/${csvData.length}: SKU ${row.sku} ---`);

        // Fetch product data from Open Food Facts
        const { name, image_url } = await fetchProductFromOpenFoodFacts(row.sku);
        console.log(`Enriched data - Name: ${name}, Image: ${image_url}`);
        
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
        let isNewProduct = false;

        if (existingProduct) {
          console.log(`Product exists with ID: ${existingProduct.id}, updating...`);
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
            results.errors.push(`SKU ${row.sku}: Erro ao atualizar - ${updateError.message}`);
            continue;
          }

          productId = updatedProduct.id;
          console.log(`✓ Updated product ${row.sku}`);
        } else {
          console.log(`Product does not exist, creating new...`);
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
            results.errors.push(`SKU ${row.sku}: Erro ao criar - ${insertError.message}`);
            continue;
          }

          productId = newProduct.id;
          isNewProduct = true;
          results.created++;
          console.log(`✓ Created new product ${row.sku} with ID: ${productId}`);
        }

        // Upsert produtos_lojas (product-store relationship)
        console.log(`Upserting produtos_lojas for product ${productId} and loja ${lojaId}...`);
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
          results.errors.push(`SKU ${row.sku}: Erro ao associar com loja - ${upsertError.message}`);
          continue;
        }

        if (!isNewProduct) {
          results.updated++;
        }

        console.log(`✓ Successfully processed product ${row.sku}`);

      } catch (error) {
        console.error(`Unexpected error processing product ${row.sku}:`, error);
        results.errors.push(`SKU ${row.sku}: Erro inesperado - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`\n=== Import completed ===`);
    console.log(`Created: ${results.created}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Errors: ${results.errors.length}`);
    if (results.errors.length > 0) {
      console.log('Errors:', results.errors);
    }

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
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
