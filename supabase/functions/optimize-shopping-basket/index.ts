import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Taxa de serviço da empresa (R$)
const SERVICE_FEE = 15.00;

// Raio de busca em km
const SEARCH_RADIUS_KM = 10;

interface ShoppingItem {
  product_name: string;
  quantity: number;
  unit_type: string;
}

interface StorePrice {
  store_id: string;
  store_name: string;
  product_name: string;
  price: number;
  distance_km: number;
  latitude: number;
  longitude: number;
}

interface OptimizationResult {
  scenarioA: {
    store_name: string;
    store_id: string;
    total_cost: number;
    items_found: number;
    items_missing: number;
    distance_km: number;
    latitude: number;
    longitude: number;
  };
  scenarioB: {
    total_cost: number;
    stores: Array<{
      store_id: string;
      store_name: string;
      items: Array<{
        product_name: string;
        quantity: number;
        price: number;
        subtotal: number;
      }>;
      store_total: number;
      distance_km: number;
      latitude: number;
      longitude: number;
    }>;
    items_missing: number;
  };
  scenarioC: {
    total_cost: number;
    service_fee: number;
    net_savings: number;
  };
  shopping_list: ShoppingItem[];
}

// Calcular distância usando fórmula de Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, lat_user, lon_user } = await req.json();

    console.log('Optimizing basket for user:', user_id, 'at location:', lat_user, lon_user);

    if (!user_id || lat_user === undefined || lon_user === undefined) {
      throw new Error('Missing required parameters: user_id, lat_user, lon_user');
    }

    // 1. Buscar lista ativa do usuário
    const { data: shoppingList, error: listError } = await supabase
      .from('user_shopping_lists')
      .select('product_name, quantity, unit_type')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (listError) {
      console.error('Error fetching shopping list:', listError);
      throw listError;
    }

    if (!shoppingList || shoppingList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Lista de compras vazia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Shopping list items:', shoppingList.length);

    // 2. Buscar todas as lojas ativas com coordenadas
    const { data: stores, error: storesError } = await supabase
      .from('lojas')
      .select('id, nome, latitude, longitude')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      throw storesError;
    }

    console.log('Active stores found:', stores?.length || 0);

    // Filtrar lojas dentro do raio de busca e calcular distâncias
    const nearbyStores = stores
      ?.map(store => ({
        ...store,
        distance_km: calculateDistance(lat_user, lon_user, store.latitude!, store.longitude!)
      }))
      .filter(store => store.distance_km <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distance_km - b.distance_km) || [];

    console.log('Nearby stores within', SEARCH_RADIUS_KM, 'km:', nearbyStores.length);

    if (nearbyStores.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma loja encontrada próxima à sua localização' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar preços de produtos nas lojas próximas
    const storeIds = nearbyStores.map(s => s.id);
    const productNames = shoppingList.map(item => item.product_name.toLowerCase());

    const { data: productsData, error: productsError } = await supabase
      .from('produtos_lojas')
      .select(`
        loja_id,
        preco_atual,
        produtos!inner(nome)
      `)
      .in('loja_id', storeIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    console.log('Product prices found:', productsData?.length || 0);

    // Mapear preços por loja e produto
    const storePrices: Map<string, StorePrice[]> = new Map();

    productsData?.forEach((item: any) => {
      const productName = item.produtos.nome.toLowerCase();
      const matchedItem = shoppingList.find(
        listItem => listItem.product_name.toLowerCase() === productName
      );

      if (matchedItem) {
        const store = nearbyStores.find(s => s.id === item.loja_id);
        if (store) {
          const storeKey = item.loja_id;
          if (!storePrices.has(storeKey)) {
            storePrices.set(storeKey, []);
          }
          storePrices.get(storeKey)!.push({
            store_id: item.loja_id,
            store_name: store.nome,
            product_name: matchedItem.product_name,
            price: parseFloat(item.preco_atual),
            distance_km: store.distance_km,
            latitude: store.latitude!,
            longitude: store.longitude!
          });
        }
      }
    });

    // CENÁRIO A: Loja mais próxima
    const closestStore = nearbyStores[0];
    const closestStorePrices = storePrices.get(closestStore.id) || [];
    
    let scenarioA_cost = 0;
    let scenarioA_found = 0;

    shoppingList.forEach(item => {
      const price = closestStorePrices.find(
        p => p.product_name.toLowerCase() === item.product_name.toLowerCase()
      );
      if (price) {
        scenarioA_cost += price.price * item.quantity;
        scenarioA_found++;
      }
    });

    const scenarioA = {
      store_name: closestStore.nome,
      store_id: closestStore.id,
      total_cost: scenarioA_cost,
      items_found: scenarioA_found,
      items_missing: shoppingList.length - scenarioA_found,
      distance_km: closestStore.distance_km,
      latitude: closestStore.latitude!,
      longitude: closestStore.longitude!
    };

    console.log('Scenario A (closest store):', scenarioA);

    // CENÁRIO B: Otimização multi-loja (menor preço)
    const optimizedBasket: Map<string, Array<{
      product_name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>> = new Map();

    let scenarioB_cost = 0;
    let scenarioB_found = 0;

    shoppingList.forEach(item => {
      let bestPrice: StorePrice | null = null;
      let bestCost = Infinity;

      // Encontrar melhor preço entre todas as lojas
      for (const [_, prices] of storePrices.entries()) {
        const priceInfo = prices.find(
          p => p.product_name.toLowerCase() === item.product_name.toLowerCase()
        );
        if (priceInfo) {
          const cost = priceInfo.price * item.quantity;
          if (cost < bestCost) {
            bestCost = cost;
            bestPrice = priceInfo;
          }
        }
      }

      if (bestPrice !== null) {
        const storeKey = bestPrice.store_id;
        if (!optimizedBasket.has(storeKey)) {
          optimizedBasket.set(storeKey, []);
        }
        optimizedBasket.get(storeKey)!.push({
          product_name: item.product_name,
          quantity: item.quantity,
          price: bestPrice.price,
          subtotal: bestCost
        });
        scenarioB_cost += bestCost;
        scenarioB_found++;
      }
    });

    const scenarioB_stores = Array.from(optimizedBasket.entries()).map(([storeId, items]) => {
      const store = nearbyStores.find(s => s.id === storeId)!;
      return {
        store_id: storeId,
        store_name: store.nome,
        items: items,
        store_total: items.reduce((sum, item) => sum + item.subtotal, 0),
        distance_km: store.distance_km,
        latitude: store.latitude!,
        longitude: store.longitude!
      };
    }).sort((a, b) => b.store_total - a.store_total);

    const scenarioB = {
      total_cost: scenarioB_cost,
      stores: scenarioB_stores,
      items_missing: shoppingList.length - scenarioB_found
    };

    console.log('Scenario B (optimized):', { total_cost: scenarioB_cost, stores: scenarioB_stores.length });

    // CENÁRIO C: Proposta de serviço (B + taxa)
    const scenarioC_total = scenarioB_cost + SERVICE_FEE;
    const net_savings = scenarioA_cost - scenarioC_total;

    const scenarioC = {
      total_cost: scenarioC_total,
      service_fee: SERVICE_FEE,
      net_savings: net_savings
    };

    console.log('Scenario C (with service):', scenarioC);

    const result: OptimizationResult = {
      scenarioA,
      scenarioB,
      scenarioC,
      shopping_list: shoppingList
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in optimize-shopping-basket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
