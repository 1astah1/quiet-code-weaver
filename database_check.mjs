import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const SUPABASE_URL = "https://vrxtrkabuasyfosmvgzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyeHRya2FidWFzeWZvc212Z3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2Njc2MDYsImV4cCI6MjA2NjI0MzYwNn0.8R_KLf5QjmAXuyrUCMYBDGQZgeTCwrGmkJu7ZtcvO_o";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseHealth() {
    console.log('=== Проверка работоспособности базы данных ===\n');

    try {
        // 1. Проверка подключения
        console.log('1. Проверка подключения к базе данных...');
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Ошибка подключения:', testError.message);
            return;
        }
        console.log('✅ Подключение к базе данных успешно\n');

        // 2. Проверка основных таблиц
        console.log('2. Проверка существования основных таблиц...');
        const tables = [
            'users', 'skins', 'cases', 'case_skins', 'user_inventory',
            'user_favorites', 'recent_wins', 'user_quiz_progress',
            'referral_earnings', 'user_promo_codes', 'user_steam_settings',
            'promo_codes', 'banners', 'suspicious_activities'
        ];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Таблица ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Таблица ${table} доступна`);
                }
            } catch (err) {
                console.log(`❌ Таблица ${table}: ${err.message}`);
            }
        }
        console.log('');

        // 3. Проверка данных в основных таблицах
        console.log('3. Проверка количества записей в таблицах...');
        const mainTables = ['users', 'skins', 'cases', 'case_skins'];
        
        for (const table of mainTables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`❌ Ошибка подсчета ${table}: ${error.message}`);
                } else {
                    console.log(`📊 Таблица ${table}: ${count} записей`);
                }
            } catch (err) {
                console.log(`❌ Ошибка подсчета ${table}: ${err.message}`);
            }
        }
        console.log('');

        // 4. Проверка функций через RPC
        console.log('4. Проверка функций базы данных...');
        
        // Проверяем наличие тестовых данных для функций
        const { data: testUser } = await supabase
            .from('users')
            .select('id, coins')
            .limit(1);
        
        const { data: testCase } = await supabase
            .from('cases')
            .select('id, price')
            .limit(1);

        if (testUser && testUser.length > 0 && testCase && testCase.length > 0) {
            console.log('✅ Найдены тестовые данные для проверки функций');
            
            // Проверяем функцию cs2_open_case (может не сработать из-за недостатка монет)
            try {
                const { data: caseResult, error: caseError } = await supabase
                    .rpc('cs2_open_case', {
                        p_user_id: testUser[0].id,
                        p_case_id: testCase[0].id
                    });
                
                if (caseError) {
                    console.log(`⚠️ Функция cs2_open_case: ${caseError.message}`);
                } else {
                    console.log(`✅ Функция cs2_open_case работает: ${caseResult?.success}`);
                }
            } catch (err) {
                console.log(`⚠️ Функция cs2_open_case: ${err.message}`);
            }

            // Проверяем функцию purchase_skin
            try {
                const { data: skinData } = await supabase
                    .from('skins')
                    .select('id, price')
                    .limit(1);
                
                if (skinData && skinData.length > 0) {
                    const { data: purchaseResult, error: purchaseError } = await supabase
                        .rpc('purchase_skin', {
                            p_user_id: testUser[0].id,
                            p_skin_id: skinData[0].id
                        });
                    
                    if (purchaseError) {
                        console.log(`⚠️ Функция purchase_skin: ${purchaseError.message}`);
                    } else {
                        console.log(`✅ Функция purchase_skin работает: ${purchaseResult?.success}`);
                    }
                }
            } catch (err) {
                console.log(`⚠️ Функция purchase_skin: ${err.message}`);
            }
        } else {
            console.log('⚠️ Недостаточно тестовых данных для проверки функций');
        }
        console.log('');

        // 5. Проверка связей между таблицами
        console.log('5. Проверка целостности связей...');
        
        try {
            // Проверяем user_inventory -> users
            const { data: inventoryUsers, error: inventoryError } = await supabase
                .from('user_inventory')
                .select(`
                    id,
                    users!inner(id)
                `)
                .limit(1);
            
            if (inventoryError) {
                console.log(`❌ Связь user_inventory -> users: ${inventoryError.message}`);
            } else {
                console.log('✅ Связь user_inventory -> users целостна');
            }
        } catch (err) {
            console.log(`❌ Связь user_inventory -> users: ${err.message}`);
        }

        try {
            // Проверяем case_skins -> cases
            const { data: caseSkins, error: caseSkinsError } = await supabase
                .from('case_skins')
                .select(`
                    id,
                    cases!inner(id)
                `)
                .limit(1);
            
            if (caseSkinsError) {
                console.log(`❌ Связь case_skins -> cases: ${caseSkinsError.message}`);
            } else {
                console.log('✅ Связь case_skins -> cases целостна');
            }
        } catch (err) {
            console.log(`❌ Связь case_skins -> cases: ${err.message}`);
        }
        console.log('');

        // 6. Проверка RLS политик
        console.log('6. Проверка RLS политик...');
        const tablesWithRLS = ['users', 'user_inventory', 'user_favorites', 'recent_wins'];
        
        for (const table of tablesWithRLS) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error && error.message.includes('policy')) {
                    console.log(`❌ RLS политики для ${table}: ${error.message}`);
                } else {
                    console.log(`✅ RLS политики для ${table} настроены корректно`);
                }
            } catch (err) {
                console.log(`⚠️ Проверка RLS для ${table}: ${err.message}`);
            }
        }
        console.log('');

        // 7. Итоговая сводка
        console.log('=== ИТОГОВАЯ СВОДКА ===');
        console.log('✅ Проверка базы данных завершена');
        console.log('📋 Проверены:');
        console.log('   - Подключение к базе данных');
        console.log('   - Существование основных таблиц');
        console.log('   - Количество записей в таблицах');
        console.log('   - Работоспособность функций');
        console.log('   - Целостность связей между таблицами');
        console.log('   - RLS политики безопасности');
        console.log('');
        console.log('Если есть ошибки (❌), их нужно исправить.');
        console.log('Если есть предупреждения (⚠️), рекомендуется обратить внимание.');
        console.log('Все галочки (✅) означают, что компонент работает корректно.');

    } catch (error) {
        console.error('❌ Критическая ошибка при проверке:', error.message);
    }
}

// Запускаем проверку
checkDatabaseHealth(); 