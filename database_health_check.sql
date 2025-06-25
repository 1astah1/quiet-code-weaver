-- Database Health Check Script
-- Проверка работоспособности всей базы данных

-- 1. Проверка существования основных таблиц
DO $$
DECLARE
    table_name text;
    missing_tables text[] := ARRAY[]::text[];
    required_tables text[] := ARRAY[
        'users', 'skins', 'cases', 'case_skins', 'user_inventory', 
        'user_favorites', 'recent_wins', 'user_quiz_progress',
        'referral_earnings', 'user_promo_codes', 'user_steam_settings',
        'promo_codes', 'banners', 'suspicious_activity'
    ];
BEGIN
    RAISE NOTICE '=== Проверка существования таблиц ===';
    
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
            RAISE NOTICE '❌ Таблица % не найдена', table_name;
        ELSE
            RAISE NOTICE '✅ Таблица % существует', table_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'ВНИМАНИЕ: Отсутствуют таблицы: %', array_to_string(missing_tables, ', ');
    END IF;
END $$;

-- 2. Проверка существования функций
DO $$
DECLARE
    func_name text;
    missing_functions text[] := ARRAY[]::text[];
    required_functions text[] := ARRAY[
        'cs2_open_case', 'purchase_skin', 'final_sell_item',
        'handle_new_user'
    ];
BEGIN
    RAISE NOTICE '=== Проверка существования функций ===';
    
    FOREACH func_name IN ARRAY required_functions
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = func_name) THEN
            missing_functions := array_append(missing_functions, func_name);
            RAISE NOTICE '❌ Функция % не найдена', func_name;
        ELSE
            RAISE NOTICE '✅ Функция % существует', func_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE NOTICE 'ВНИМАНИЕ: Отсутствуют функции: %', array_to_string(missing_functions, ', ');
    END IF;
END $$;

-- 3. Проверка триггеров
DO $$
DECLARE
    trigger_name text;
    missing_triggers text[] := ARRAY[]::text[];
    required_triggers text[] := ARRAY[
        'on_auth_user_created'
    ];
BEGIN
    RAISE NOTICE '=== Проверка существования триггеров ===';
    
    FOREACH trigger_name IN ARRAY required_triggers
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = trigger_name) THEN
            missing_triggers := array_append(missing_triggers, trigger_name);
            RAISE NOTICE '❌ Триггер % не найден', trigger_name;
        ELSE
            RAISE NOTICE '✅ Триггер % существует', trigger_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_triggers, 1) > 0 THEN
        RAISE NOTICE 'ВНИМАНИЕ: Отсутствуют триггеры: %', array_to_string(missing_triggers, ', ');
    END IF;
END $$;

-- 4. Проверка RLS политик
DO $$
DECLARE
    table_name text;
    policy_count integer;
    tables_with_policies text[] := ARRAY[
        'users', 'user_inventory', 'user_favorites', 'recent_wins',
        'user_quiz_progress', 'referral_earnings', 'user_promo_codes',
        'user_steam_settings'
    ];
BEGIN
    RAISE NOTICE '=== Проверка RLS политик ===';
    
    FOREACH table_name IN ARRAY tables_with_policies
    LOOP
        SELECT COUNT(*) INTO policy_count 
        FROM pg_policies 
        WHERE tablename = table_name;
        
        IF policy_count = 0 THEN
            RAISE NOTICE '❌ Таблица % не имеет RLS политик', table_name;
        ELSE
            RAISE NOTICE '✅ Таблица % имеет % политик', table_name, policy_count;
        END IF;
    END LOOP;
END $$;

-- 5. Проверка индексов
DO $$
DECLARE
    index_name text;
    missing_indexes text[] := ARRAY[]::text[];
    required_indexes text[] := ARRAY[
        'idx_users_auth_id'
    ];
BEGIN
    RAISE NOTICE '=== Проверка индексов ===';
    
    FOREACH index_name IN ARRAY required_indexes
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name) THEN
            missing_indexes := array_append(missing_indexes, index_name);
            RAISE NOTICE '❌ Индекс % не найден', index_name;
        ELSE
            RAISE NOTICE '✅ Индекс % существует', index_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE NOTICE 'ВНИМАНИЕ: Отсутствуют индексы: %', array_to_string(missing_indexes, ', ');
    END IF;
END $$;

-- 6. Проверка данных в таблицах
DO $$
DECLARE
    table_name text;
    row_count bigint;
    tables_to_check text[] := ARRAY[
        'users', 'skins', 'cases', 'case_skins'
    ];
BEGIN
    RAISE NOTICE '=== Проверка данных в таблицах ===';
    
    FOREACH table_name IN ARRAY tables_to_check
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
        RAISE NOTICE '📊 Таблица % содержит % записей', table_name, row_count;
    END LOOP;
END $$;

-- 7. Тест функции cs2_open_case (если есть тестовые данные)
DO $$
DECLARE
    test_user_id uuid;
    test_case_id uuid;
    result jsonb;
BEGIN
    RAISE NOTICE '=== Тест функции cs2_open_case ===';
    
    -- Проверяем наличие тестовых данных
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_case_id FROM cases LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_case_id IS NOT NULL THEN
        BEGIN
            -- Пытаемся выполнить функцию (может не сработать из-за недостатка монет)
            SELECT cs2_open_case(test_user_id, test_case_id) INTO result;
            RAISE NOTICE '✅ Функция cs2_open_case выполнилась: %', result->>'success';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Функция cs2_open_case вызвала ошибку: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ Недостаточно данных для тестирования cs2_open_case';
    END IF;
END $$;

-- 8. Проверка связей между таблицами
DO $$
DECLARE
    broken_links integer;
BEGIN
    RAISE NOTICE '=== Проверка целостности связей ===';
    
    -- Проверка user_inventory -> users
    SELECT COUNT(*) INTO broken_links 
    FROM user_inventory ui 
    LEFT JOIN users u ON ui.user_id = u.id 
    WHERE u.id IS NULL;
    
    IF broken_links > 0 THEN
        RAISE NOTICE '❌ Найдено % записей в user_inventory с несуществующими user_id', broken_links;
    ELSE
        RAISE NOTICE '✅ Связь user_inventory -> users целостна';
    END IF;
    
    -- Проверка user_inventory -> skins
    SELECT COUNT(*) INTO broken_links 
    FROM user_inventory ui 
    LEFT JOIN skins s ON ui.skin_id = s.id 
    WHERE s.id IS NULL;
    
    IF broken_links > 0 THEN
        RAISE NOTICE '❌ Найдено % записей в user_inventory с несуществующими skin_id', broken_links;
    ELSE
        RAISE NOTICE '✅ Связь user_inventory -> skins целостна';
    END IF;
    
    -- Проверка case_skins -> cases
    SELECT COUNT(*) INTO broken_links 
    FROM case_skins cs 
    LEFT JOIN cases c ON cs.case_id = c.id 
    WHERE c.id IS NULL;
    
    IF broken_links > 0 THEN
        RAISE NOTICE '❌ Найдено % записей в case_skins с несуществующими case_id', broken_links;
    ELSE
        RAISE NOTICE '✅ Связь case_skins -> cases целостна';
    END IF;
    
    -- Проверка case_skins -> skins
    SELECT COUNT(*) INTO broken_links 
    FROM case_skins cs 
    LEFT JOIN skins s ON cs.skin_id = s.id 
    WHERE s.id IS NULL;
    
    IF broken_links > 0 THEN
        RAISE NOTICE '❌ Найдено % записей в case_skins с несуществующими skin_id', broken_links;
    ELSE
        RAISE NOTICE '✅ Связь case_skins -> skins целостна';
    END IF;
END $$;

-- 9. Проверка производительности
DO $$
DECLARE
    slow_queries integer;
BEGIN
    RAISE NOTICE '=== Проверка производительности ===';
    
    -- Проверяем наличие медленных запросов (если есть статистика)
    SELECT COUNT(*) INTO slow_queries 
    FROM pg_stat_statements 
    WHERE mean_exec_time > 1000; -- больше 1 секунды
    
    IF slow_queries > 0 THEN
        RAISE NOTICE '⚠️ Найдено % потенциально медленных запросов', slow_queries;
    ELSE
        RAISE NOTICE '✅ Медленных запросов не обнаружено';
    END IF;
END $$;

-- 10. Итоговая сводка
DO $$
BEGIN
    RAISE NOTICE '=== ИТОГОВАЯ СВОДКА ===';
    RAISE NOTICE 'Проверка завершена. Проверьте результаты выше.';
    RAISE NOTICE 'Если есть ошибки (❌), их нужно исправить.';
    RAISE NOTICE 'Если есть предупреждения (⚠️), рекомендуется обратить внимание.';
    RAISE NOTICE 'Все галочки (✅) означают, что компонент работает корректно.';
END $$; 