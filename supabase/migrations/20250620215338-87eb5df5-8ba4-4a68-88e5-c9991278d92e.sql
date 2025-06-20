
-- Создаем таблицу для запросов на вывод скинов
CREATE TABLE IF NOT EXISTS skin_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES user_inventory(id) ON DELETE CASCADE,
  steam_trade_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  steam_trade_offer_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(inventory_item_id) -- Один предмет может быть запрошен только один раз
);

-- Включаем RLS
ALTER TABLE skin_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "Users can view their own withdrawal requests" 
ON skin_withdrawal_requests FOR SELECT 
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create their own withdrawal requests" 
ON skin_withdrawal_requests FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own withdrawal requests" 
ON skin_withdrawal_requests FOR UPDATE 
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON skin_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON skin_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON skin_withdrawal_requests(created_at);
