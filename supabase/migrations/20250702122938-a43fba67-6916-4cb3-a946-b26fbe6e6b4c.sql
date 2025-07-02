-- Fix RLS policies for admin access
CREATE OR REPLACE FUNCTION is_admin_user_enhanced()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE auth_id = auth.uid() LIMIT 1),
    (SELECT EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.users u ON ur.user_id = u.id  
      WHERE u.auth_id = auth.uid() 
      AND ur.role = 'admin'
    )),
    false
  );
$$;

-- Create RPC function for safe admin queries
CREATE OR REPLACE FUNCTION admin_query_table(
  p_table_name text,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  query_sql text;
BEGIN
  -- Check admin permissions
  IF NOT is_admin_user_enhanced() THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;
  
  -- Validate table name (prevent SQL injection)
  IF p_table_name NOT IN (
    'users', 'cases', 'skins', 'banners', 'tasks', 
    'quiz_questions', 'promo_codes', 'coin_rewards', 
    'daily_rewards', 'faq_items', 'suspicious_activities'
  ) THEN
    RETURN jsonb_build_object('error', 'Invalid table');
  END IF;
  
  -- Build safe query
  query_sql := format(
    'SELECT jsonb_agg(to_jsonb(t.*)) FROM (SELECT * FROM %I ORDER BY created_at DESC NULLS LAST LIMIT %s OFFSET %s) t',
    p_table_name, p_limit, p_offset
  );
  
  EXECUTE query_sql INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Create bulk operations function
CREATE OR REPLACE FUNCTION admin_bulk_operation(
  p_table_name text,
  p_operation text,
  p_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  affected_count int := 0;
BEGIN
  -- Check admin permissions
  IF NOT is_admin_user_enhanced() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  -- Validate inputs
  IF p_table_name NOT IN (
    'cases', 'skins', 'banners', 'tasks', 
    'quiz_questions', 'promo_codes', 'coin_rewards', 
    'daily_rewards', 'faq_items'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid table');
  END IF;
  
  -- Execute operation based on type
  CASE p_operation
    WHEN 'bulk_delete' THEN
      EXECUTE format('DELETE FROM %I WHERE id = ANY($1)', p_table_name) 
      USING (SELECT array_agg(value::text) FROM jsonb_array_elements_text(p_data->'ids'));
      GET DIAGNOSTICS affected_count = ROW_COUNT;
      
    WHEN 'bulk_update' THEN
      -- For bulk updates, we'll need more specific implementation
      RETURN jsonb_build_object('success', false, 'error', 'Bulk update not implemented yet');
      
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid operation');
  END CASE;
  
  RETURN jsonb_build_object(
    'success', true, 
    'affected_count', affected_count
  );
END;
$$;

-- Update quiz question structure to be more consistent
UPDATE quiz_questions 
SET answers = CASE 
  WHEN answers IS NULL OR answers = 'null'::jsonb 
  THEN '["Option 1", "Option 2", "Option 3", "Option 4"]'::jsonb
  ELSE answers
END,
correct_answer = CASE 
  WHEN correct_answer IS NULL OR correct_answer = '' 
  THEN 'Option 1'
  ELSE correct_answer  
END,
is_active = COALESCE(is_active, true)
WHERE answers IS NULL OR correct_answer IS NULL OR correct_answer = '';

-- Add is_active column to quiz_questions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;