
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WithdrawRequest {
  inventoryItemId: string;
  steamTradeUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { inventoryItemId, steamTradeUrl }: WithdrawRequest = await req.json()

    console.log('Processing withdrawal request:', { inventoryItemId, steamTradeUrl })

    // Получаем пользователя из базы данных
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, steam_trade_url')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userData) {
      return new Response('User not found', { status: 404, headers: corsHeaders })
    }

    // Проверяем существование предмета в инвентаре пользователя
    const { data: inventoryItem, error: inventoryError } = await supabaseClient
      .from('user_inventory')
      .select(`
        *,
        skins (*)
      `)
      .eq('id', inventoryItemId)
      .eq('user_id', userData.id)
      .eq('is_sold', false)
      .single()

    if (inventoryError || !inventoryItem) {
      return new Response('Item not found in inventory', { status: 404, headers: corsHeaders })
    }

    // Проверяем, не было ли уже запроса на вывод этого предмета
    const { data: existingRequest } = await supabaseClient
      .from('skin_withdrawal_requests')
      .select('id')
      .eq('inventory_item_id', inventoryItemId)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return new Response('Withdrawal request already exists', { status: 400, headers: corsHeaders })
    }

    // Обновляем Steam Trade URL пользователя, если он изменился
    if (userData.steam_trade_url !== steamTradeUrl) {
      await supabaseClient
        .from('users')
        .update({ steam_trade_url: steamTradeUrl })
        .eq('id', userData.id)
    }

    // Создаем запрос на вывод
    const { data: withdrawalRequest, error: requestError } = await supabaseClient
      .from('skin_withdrawal_requests')
      .insert({
        user_id: userData.id,
        inventory_item_id: inventoryItemId,
        steam_trade_url: steamTradeUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating withdrawal request:', requestError)
      return new Response('Failed to create withdrawal request', { status: 500, headers: corsHeaders })
    }

    // Здесь должна быть интеграция с Steam API для создания трейд-оффера
    // Пока что помечаем запрос как обрабатываемый
    await supabaseClient
      .from('skin_withdrawal_requests')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalRequest.id)

    // Симуляция создания трейд-оффера (в реальности здесь будет Steam Web API)
    const mockTradeOfferId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Обновляем запрос с ID трейд-оффера
    await supabaseClient
      .from('skin_withdrawal_requests')
      .update({ 
        steam_trade_offer_id: mockTradeOfferId,
        status: 'completed', // В реальности будет 'processing' до подтверждения
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalRequest.id)

    console.log('Withdrawal request processed successfully:', withdrawalRequest.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestId: withdrawalRequest.id,
        tradeOfferId: mockTradeOfferId,
        message: 'Запрос на вывод создан. Проверьте Steam для подтверждения трейда.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in withdraw-skin function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
