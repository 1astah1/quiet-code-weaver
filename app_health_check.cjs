const fs = require('fs');
const path = require('path');

console.log('🔍 Начинаю полную проверку работоспособности приложения...\n');

// Список найденных проблем
const issues = [];
const fixes = [];

// Проверка структуры проекта
function checkProjectStructure() {
  console.log('📁 Проверка структуры проекта...');
  
  const requiredDirs = [
    'src',
    'src/components',
    'src/hooks',
    'src/utils',
    'src/types',
    'src/locales',
    'src/integrations',
    'src/pages',
    'public',
    'supabase'
  ];
  
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tailwind.config.ts',
    'src/main.tsx',
    'src/App.tsx',
    'src/integrations/supabase/client.ts',
    'index.html'
  ];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      issues.push(`❌ Отсутствует директория: ${dir}`);
      fixes.push(`mkdir -p ${dir}`);
    }
  }
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует файл: ${file}`);
    }
  }
  
  console.log('✅ Структура проекта проверена\n');
}

// Проверка зависимостей
function checkDependencies() {
  console.log('📦 Проверка зависимостей...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length > 0) {
      issues.push(`❌ Отсутствуют зависимости: ${missingDeps.join(', ')}`);
      fixes.push(`npm install ${missingDeps.join(' ')}`);
    }
    
    console.log('✅ Зависимости проверены\n');
  } catch (error) {
    issues.push('❌ Ошибка чтения package.json');
  }
}

// Проверка конфигурации TypeScript
function checkTypeScriptConfig() {
  console.log('⚙️ Проверка конфигурации TypeScript...');
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    if (!tsconfig.compilerOptions?.baseUrl) {
      issues.push('❌ Отсутствует baseUrl в tsconfig.json');
      fixes.push('Добавить "baseUrl": "." в compilerOptions');
    }
    
    if (!tsconfig.compilerOptions?.paths) {
      issues.push('❌ Отсутствуют paths в tsconfig.json');
      fixes.push('Добавить настройки paths для алиасов');
    }
    
    console.log('✅ Конфигурация TypeScript проверена\n');
  } catch (error) {
    issues.push('❌ Ошибка чтения tsconfig.json');
  }
}

// Проверка конфигурации Vite
function checkViteConfig() {
  console.log('⚡ Проверка конфигурации Vite...');
  
  try {
    const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    
    if (!viteConfig.includes('@/')) {
      issues.push('❌ Отсутствуют алиасы в vite.config.ts');
      fixes.push('Добавить resolve.alias для @/');
    }
    
    if (!viteConfig.includes('react')) {
      issues.push('❌ Отсутствует плагин React в vite.config.ts');
      fixes.push('Добавить @vitejs/plugin-react');
    }
    
    console.log('✅ Конфигурация Vite проверена\n');
  } catch (error) {
    issues.push('❌ Ошибка чтения vite.config.ts');
  }
}

// Проверка компонентов
function checkComponents() {
  console.log('🧩 Проверка компонентов...');
  
  const componentFiles = [
    'src/components/MainApp.tsx',
    'src/components/Header.tsx',
    'src/components/BottomNavigation.tsx',
    'src/components/Sidebar.tsx',
    'src/components/screens/MainScreen.tsx',
    'src/components/screens/SkinsScreen.tsx',
    'src/components/screens/TasksScreen.tsx',
    'src/components/inventory/InventoryScreen.tsx',
    'src/components/settings/SettingsScreen.tsx',
    'src/components/quiz/QuizScreen.tsx',
    'src/components/auth/AuthScreen.tsx',
    'src/components/AdminPanel.tsx'
  ];
  
  for (const file of componentFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует компонент: ${file}`);
    }
  }
  
  console.log('✅ Компоненты проверены\n');
}

// Проверка хуков
function checkHooks() {
  console.log('🎣 Проверка хуков...');
  
  const hookFiles = [
    'src/hooks/useSecureAuth.ts',
    'src/hooks/useSecureShop.ts',
    'src/hooks/useSecureInventory.ts',
    'src/hooks/useCS2CaseOpening.ts',
    'src/hooks/useQuiz.ts',
    'src/hooks/useEnhancedSecurity.ts',
    'src/hooks/useSecureTaskProgress.ts',
    'src/hooks/useSecureValidation.ts',
    'src/hooks/useSecureAction.ts',
    'src/hooks/useSecureRateLimit.ts',
    'src/hooks/useFreeCaseTimers.ts',
    'src/hooks/useWithdrawSkin.ts'
  ];
  
  for (const file of hookFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует хук: ${file}`);
    }
  }
  
  console.log('✅ Хуки проверены\n');
}

// Проверка утилит
function checkUtils() {
  console.log('🔧 Проверка утилит...');
  
  const utilFiles = [
    'src/utils/security.ts',
    'src/utils/securityEnhanced.ts',
    'src/utils/securityValidation.ts',
    'src/utils/bannerUpload.ts',
    'src/utils/clearCache.ts',
    'src/utils/rarityColors.ts',
    'src/utils/rateLimiter.ts',
    'src/utils/sessionUtils.ts',
    'src/utils/uuid.ts',
    'src/utils/supabaseTypes.ts'
  ];
  
  for (const file of utilFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует утилита: ${file}`);
    }
  }
  
  console.log('✅ Утилиты проверены\n');
}

// Проверка типов
function checkTypes() {
  console.log('📝 Проверка типов...');
  
  const typeFiles = [
    'src/types/admin.ts',
    'src/types/rpc.ts',
    'src/types/safeCaseOpening.ts',
    'src/types/taskProgress.ts'
  ];
  
  for (const file of typeFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует файл типов: ${file}`);
    }
  }
  
  console.log('✅ Типы проверены\n');
}

// Проверка локализации
function checkLocalization() {
  console.log('🌍 Проверка локализации...');
  
  const localeFiles = [
    'src/locales/index.ts',
    'src/locales/ru.ts',
    'src/locales/en.ts',
    'src/locales/pl.ts',
    'src/locales/pt.ts',
    'src/locales/fr.ts',
    'src/locales/de.ts',
    'src/locales/es.ts'
  ];
  
  for (const file of localeFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует файл локализации: ${file}`);
    }
  }
  
  console.log('✅ Локализация проверена\n');
}

// Проверка Supabase
function checkSupabase() {
  console.log('🗄️ Проверка Supabase...');
  
  const supabaseFiles = [
    'supabase/config.toml',
    'supabase/functions/withdraw-skin/index.ts'
  ];
  
  for (const file of supabaseFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует файл Supabase: ${file}`);
    }
  }
  
  // Проверка миграций
  const migrationsDir = 'supabase/migrations';
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    if (migrations.length === 0) {
      issues.push('❌ Отсутствуют миграции базы данных');
    }
  } else {
    issues.push('❌ Отсутствует директория миграций');
  }
  
  console.log('✅ Supabase проверен\n');
}

// Проверка UI компонентов
function checkUIComponents() {
  console.log('🎨 Проверка UI компонентов...');
  
  const uiComponents = [
    'src/components/ui/button.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/ui/input.tsx',
    'src/components/ui/toast.tsx',
    'src/components/ui/toaster.tsx',
    'src/components/ui/alert.tsx',
    'src/components/ui/badge.tsx',
    'src/components/ui/card.tsx',
    'src/components/ui/progress.tsx',
    'src/components/ui/select.tsx',
    'src/components/ui/tabs.tsx',
    'src/components/ui/accordion.tsx',
    'src/components/ui/avatar.tsx',
    'src/components/ui/calendar.tsx',
    'src/components/ui/carousel.tsx',
    'src/components/ui/checkbox.tsx',
    'src/components/ui/collapsible.tsx',
    'src/components/ui/command.tsx',
    'src/components/ui/context-menu.tsx',
    'src/components/ui/drawer.tsx',
    'src/components/ui/dropdown-menu.tsx',
    'src/components/ui/form.tsx',
    'src/components/ui/hover-card.tsx',
    'src/components/ui/input-otp.tsx',
    'src/components/ui/label.tsx',
    'src/components/ui/menubar.tsx',
    'src/components/ui/navigation-menu.tsx',
    'src/components/ui/pagination.tsx',
    'src/components/ui/popover.tsx',
    'src/components/ui/radio-group.tsx',
    'src/components/ui/resizable.tsx',
    'src/components/ui/scroll-area.tsx',
    'src/components/ui/separator.tsx',
    'src/components/ui/sheet.tsx',
    'src/components/ui/sidebar.tsx',
    'src/components/ui/skeleton.tsx',
    'src/components/ui/slider.tsx',
    'src/components/ui/switch.tsx',
    'src/components/ui/table.tsx',
    'src/components/ui/textarea.tsx',
    'src/components/ui/toggle.tsx',
    'src/components/ui/toggle-group.tsx',
    'src/components/ui/tooltip.tsx',
    'src/components/ui/use-translation.ts'
  ];
  
  for (const file of uiComponents) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует UI компонент: ${file}`);
    }
  }
  
  console.log('✅ UI компоненты проверены\n');
}

// Проверка анимаций
function checkAnimations() {
  console.log('🎬 Проверка анимаций...');
  
  const animationFiles = [
    'src/components/animations/CaseOpeningPhase.tsx',
    'src/components/animations/CaseRevealingPhase.tsx',
    'src/components/animations/CaseCompletePhase.tsx'
  ];
  
  for (const file of animationFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует файл анимации: ${file}`);
    }
  }
  
  console.log('✅ Анимации проверены\n');
}

// Проверка безопасности
function checkSecurity() {
  console.log('🔒 Проверка безопасности...');
  
  const securityFiles = [
    'src/components/security/SecurityMonitor.tsx',
    'src/components/security/SecurityAlert.tsx',
    'src/components/security/SecurityStatus.tsx',
    'src/components/security/AdminStatusIndicator.tsx'
  ];
  
  for (const file of securityFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует компонент безопасности: ${file}`);
    }
  }
  
  console.log('✅ Безопасность проверена\n');
}

// Проверка админки
function checkAdmin() {
  console.log('👑 Проверка админки...');
  
  const adminFiles = [
    'src/components/admin/AdminTable.tsx',
    'src/components/admin/AdminTableSelector.tsx',
    'src/components/admin/AddItemForm.tsx',
    'src/components/admin/UserManagement.tsx',
    'src/components/admin/CaseManagement.tsx',
    'src/components/admin/SkinRaritySelector.tsx',
    'src/components/admin/PromoCodeManagement.tsx',
    'src/components/admin/BannerManagement.tsx',
    'src/components/admin/UserBalanceModal.tsx',
    'src/components/admin/UserDuplicatesCleaner.tsx',
    'src/components/admin/SuspiciousActivityManagement.tsx',
    'src/components/admin/DatabaseImageCleanup.tsx',
    'src/components/admin/CaseJSONImporter.tsx',
    'src/components/admin/CaseSkinManagement.tsx'
  ];
  
  for (const file of adminFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует компонент админки: ${file}`);
    }
  }
  
  console.log('✅ Админка проверена\n');
}

// Проверка кейсов и скинов
function checkCasesAndSkins() {
  console.log('🎁 Проверка кейсов и скинов...');
  
  const caseSkinFiles = [
    'src/components/skins/CasesTab.tsx',
    'src/components/skins/ShopTab.tsx',
    'src/components/skins/ShopSkinCard.tsx',
    'src/components/skins/ShopFilters.tsx',
    'src/components/skins/ShopPagination.tsx',
    'src/components/skins/ShopEmptyState.tsx',
    'src/components/skins/CaseCard.tsx',
    'src/components/skins/CasePreviewModal.tsx',
    'src/components/skins/PurchaseSuccessModal.tsx',
    'src/components/CS2CaseOpening.tsx',
    'src/components/CS2CaseResult.tsx',
    'src/components/CS2CaseRoulette.tsx'
  ];
  
  for (const file of caseSkinFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует компонент кейсов/скинов: ${file}`);
    }
  }
  
  console.log('✅ Кейсы и скины проверены\n');
}

// Проверка модальных окон
function checkModals() {
  console.log('🪟 Проверка модальных окон...');
  
  const modalFiles = [
    'src/components/ads/AdModal.tsx',
    'src/components/inventory/WithdrawSkinModal.tsx',
    'src/components/settings/FAQModal.tsx',
    'src/components/settings/ImprovedSteamConnectionModal.tsx',
    'src/components/settings/LanguageSelector.tsx',
    'src/components/settings/PremiumModal.tsx',
    'src/components/settings/PrivacyPolicyModal.tsx',
    'src/components/settings/PromoCodeModal.tsx',
    'src/components/settings/SteamConnectionModal.tsx',
    'src/components/settings/TermsOfServiceModal.tsx',
    'src/components/quiz/QuizRestoreModal.tsx',
    'src/components/ReferralModal.tsx'
  ];
  
  for (const file of modalFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует модальное окно: ${file}`);
    }
  }
  
  console.log('✅ Модальные окна проверены\n');
}

// Проверка изображений
function checkImages() {
  console.log('🖼️ Проверка изображений...');
  
  const imageFiles = [
    'src/components/ui/InstantImage.tsx',
    'src/components/ui/LazyImage.tsx',
    'src/components/ui/OptimizedImage.tsx'
  ];
  
  for (const file of imageFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует компонент изображения: ${file}`);
    }
  }
  
  console.log('✅ Изображения проверены\n');
}

// Проверка других компонентов
function checkOtherComponents() {
  console.log('📱 Проверка других компонентов...');
  
  const otherFiles = [
    'src/components/LoadingScreen.tsx',
    'src/components/WebViewOptimizer.tsx',
    'src/components/BannerCarousel.tsx',
    'src/components/DailyRewardsCalendar.tsx',
    'src/components/RecentWins.tsx',
    'src/components/referral/ReferralHandler.tsx',
    'src/pages/NotFound.tsx'
  ];
  
  for (const file of otherFiles) {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Отсутствует компонент: ${file}`);
    }
  }
  
  console.log('✅ Другие компоненты проверены\n');
}

// Основная функция проверки
function runHealthCheck() {
  checkProjectStructure();
  checkDependencies();
  checkTypeScriptConfig();
  checkViteConfig();
  checkComponents();
  checkHooks();
  checkUtils();
  checkTypes();
  checkLocalization();
  checkSupabase();
  checkUIComponents();
  checkAnimations();
  checkSecurity();
  checkAdmin();
  checkCasesAndSkins();
  checkModals();
  checkImages();
  checkOtherComponents();
  
  // Вывод результатов
  console.log('📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ:');
  console.log('='.repeat(50));
  
  if (issues.length === 0) {
    console.log('✅ Все проверки пройдены успешно! Приложение готово к работе.');
  } else {
    console.log(`❌ Найдено проблем: ${issues.length}`);
    console.log('\nСписок проблем:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    if (fixes.length > 0) {
      console.log('\nРекомендуемые исправления:');
      fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🔍 Проверка завершена!');
}

// Запуск проверки
runHealthCheck(); 