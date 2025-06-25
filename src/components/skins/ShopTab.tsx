import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSecureShop } from "@/hooks/useSecureShop";
import { enhancedValidation, SecurityMonitor } from "@/utils/securityEnhanced";
import ShopFilters from "./ShopFilters";
import ShopSkinCard from "./ShopSkinCard";
import ShopEmptyState from "./ShopEmptyState";
import ShopPagination from "./ShopPagination";
import PurchaseSuccessModal from "./PurchaseSuccessModal";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import CaseCard from './CaseCard';

interface ShopTabProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    is_admin?: boolean;
  };
  onCoinsUpdate: (newCoins: number) => void;
  onTabChange?: (tab: string) => void;
}

interface Skin {
  id: string;
  name: string;
  weapon_type: string;
  rarity: string;
  price: number;
  image_url: string;
}

const ITEMS_PER_PAGE = 24;

const ShopTab = ({ currentUser, onCoinsUpdate, onTabChange }: ShopTabProps) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'gifts'>('shop');
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 999999 });
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [purchaseSuccessModal, setPurchaseSuccessModal] = useState<{
    isOpen: boolean;
    item: Skin | null;
  }>({ isOpen: false, item: null });
  
  const { purchaseMutation, isPurchasing, isAdmin } = useSecureShop(currentUser);

  // Скины
  const { data: skins, isLoading: isSkinsLoading, refetch } = useQuery({
    queryKey: ['shop-skins'],
    queryFn: async () => {
      console.log('🔄 [SHOP] Loading skins...');
      
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) {
        console.error('❌ [SHOP] Error loading skins:', error);
        throw error;
      }
      
      // Валидация и санитизация данных скинов
      const validatedSkins = (data || []).filter(skin => {
        return (
          enhancedValidation.uuid(skin.id) &&
          skin.name && 
          typeof skin.name === 'string' &&
          skin.name.length > 0 &&
          enhancedValidation.skinPrice(skin.price) &&
          enhancedValidation.checkSqlInjection(skin.name)
        );
      }).map(skin => ({
        ...skin,
        name: enhancedValidation.sanitizeString(skin.name),
        weapon_type: enhancedValidation.sanitizeString(skin.weapon_type || ''),
        rarity: enhancedValidation.sanitizeString(skin.rarity || ''),
        price: Math.max(0, Math.min(1000000, Math.floor(skin.price)))
      }));
      
      console.log('✅ [SHOP] Loaded and validated skins:', validatedSkins.length);
      return validatedSkins as Skin[];
    },
    staleTime: 0, // Всегда считать данные устаревшими
    gcTime: 0, // Не кэшировать данные
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      console.log(`🔄 [SHOP] Retry attempt ${failureCount}:`, error);
      return failureCount < 2;
    }
  });

  // Кейсы
  const { data: cases, isLoading: isCasesLoading } = useQuery({
    queryKey: ['shop-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Автоматически обновлять данные при изменении
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 [SHOP] Auto-refetching skins...');
      refetch();
    }, 30000); // Обновление каждые 30 секунд

    return () => clearInterval(interval);
  }, [refetch]);

  // ИСПРАВЛЕНО: Безопасная фильтрация и сортировка
  const filteredAndSortedSkins = skins?.filter(skin => {
    // Дополнительная валидация на фронтенде
    if (!skin || !enhancedValidation.uuid(skin.id)) return false;
    
    const rarityMatch = selectedRarity === "all" || skin.rarity === selectedRarity;
    const weaponMatch = selectedWeapon === "all" || skin.weapon_type === selectedWeapon;
    const priceMatch = skin.price >= priceRange.min && skin.price <= priceRange.max;
    
    return rarityMatch && weaponMatch && priceMatch;
  })?.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'rarity-desc':
        const rarityOrder = ['Contraband', 'Covert', 'Classified', 'Restricted', 'Mil-Spec', 'Industrial Grade', 'Consumer Grade'];
        return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
      case 'rarity-asc':
        const rarityOrderAsc = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Contraband'];
        return rarityOrderAsc.indexOf(a.rarity) - rarityOrderAsc.indexOf(b.rarity);
      default:
        return 0;
    }
  }) || [];

  // Пагинация
  const totalPages = Math.ceil(filteredAndSortedSkins.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSkins = filteredAndSortedSkins.slice(startIndex, endIndex);

  const handlePurchase = async (skin: Skin) => {
    console.log('🛒 [SHOP] Handle purchase clicked for:', skin.name);
    
    try {
      // Дополнительные проверки безопасности
      if (!enhancedValidation.uuid(skin.id)) {
        throw new Error('Некорректный ID скина');
      }
      
      if (isPurchasing) {
        console.log('⏳ [SHOP] Purchase already in progress, ignoring click');
        return;
      }
      
      // Проверяем rate limiting на клиенте
      if (!SecurityMonitor.checkClientRateLimit(currentUser.id, 'purchase_click', 5)) {
        throw new Error('Слишком много попыток покупки. Подождите немного.');
      }
      
      const result = await purchaseMutation.mutateAsync(skin);
      
      // Обновляем баланс пользователя
      onCoinsUpdate(result.newCoins);
      
      // Показываем модальное окно успеха
      setPurchaseSuccessModal({
        isOpen: true,
        item: result.purchasedSkin
      });
      
    } catch (error) {
      console.error('💥 [SHOP] Purchase handling error:', error);
      
      // Логируем подозрительную активность при ошибках
      await SecurityMonitor.logSuspiciousActivity(
        currentUser.id, 
        'purchase_click_error', 
        { error: error instanceof Error ? error.message : 'Unknown error', skinId: skin.id },
        'low'
      );
    }
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    // Валидация диапазона цен
    const validMin = Math.max(0, Math.min(999999, Math.floor(min)));
    const validMax = Math.max(validMin, Math.min(999999, Math.floor(max)));
    
    setPriceRange({ min: validMin, max: validMax });
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    // Валидация типа сортировки
    const allowedSorts = ['price-asc', 'price-desc', 'name-asc', 'name-desc', 'rarity-desc', 'rarity-asc'];
    if (allowedSorts.includes(sort)) {
      setSortBy(sort);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(totalPages, Math.floor(page)));
    setCurrentPage(validPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewInventory = () => {
    if (onTabChange) {
      onTabChange('inventory');
    }
  };

  const handleRarityChange = (rarity: string) => {
    // Санитизация выбора редкости
    const sanitizedRarity = enhancedValidation.sanitizeString(rarity);
    setSelectedRarity(sanitizedRarity);
    setCurrentPage(1);
  };

  const handleWeaponChange = (weapon: string) => {
    // Санитизация выбора оружия
    const sanitizedWeapon = enhancedValidation.sanitizeString(weapon);
    setSelectedWeapon(sanitizedWeapon);
    setCurrentPage(1);
  };

  if (isSkinsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-gray-800/50 rounded-lg h-16 sm:h-20 animate-pulse"></div>
        ))}
      </div>
    );
  }

  // Получаем уникальные значения для фильтров
  const rarities = Array.from(new Set((skins || []).map(s => s.rarity).filter(Boolean)));
  const weaponTypes = Array.from(new Set((skins || []).map(s => s.weapon_type).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Табы */}
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-4 py-2 rounded-t-lg font-bold ${activeTab === 'shop' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          onClick={() => setActiveTab('shop')}
        >
          Магазин
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-bold ${activeTab === 'gifts' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          onClick={() => setActiveTab('gifts')}
        >
          Подарки
        </button>
      </div>
      {/* ВРЕМЕННО: Диагностика количества скинов и кейсов */}
      <div className="text-xs text-slate-400 mb-2">
        Скинов: {skins?.length ?? 0} | Кейсов: {cases?.length ?? 0}
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'shop' && (
        <>
          {/* Фильтры и скины */}
          <ShopFilters
            selectedRarity={selectedRarity}
            selectedWeapon={selectedWeapon}
            rarities={rarities}
            weaponTypes={weaponTypes}
            onRarityChange={setSelectedRarity}
            onWeaponChange={setSelectedWeapon}
            onPriceRangeChange={handlePriceRangeChange}
            onSortChange={handleSortChange}
          />
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
            {currentSkins.map((skin) => (
              <ShopSkinCard
                key={skin.id}
                skin={{
                  id: skin.id,
                  name: skin.name,
                  rarity: skin.rarity,
                  price: skin.price,
                  image_url: skin.image_url ?? '',
                  weapon_type: skin.weapon_type ?? ''
                }}
                onBuy={handlePurchase}
                isFavorite={false}
                onToggleFavorite={() => {}}
              />
            ))}
          </div>
          {filteredAndSortedSkins.length === 0 && <ShopEmptyState />}
          <ShopPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
          <PurchaseSuccessModal
            isOpen={purchaseSuccessModal.isOpen}
            onClose={() => setPurchaseSuccessModal({ isOpen: false, item: null })}
            reward={purchaseSuccessModal.item ? {
              id: purchaseSuccessModal.item.id,
              name: purchaseSuccessModal.item.name,
              rarity: purchaseSuccessModal.item.rarity,
              price: purchaseSuccessModal.item.price,
              image_url: purchaseSuccessModal.item.image_url,
              type: 'skin' as const,
              weapon_type: purchaseSuccessModal.item.weapon_type
            } : {
              id: '',
              name: '',
              price: 0,
              type: 'skin' as const
            }}
            newBalance={currentUser.coins}
            onInventoryUpdate={() => {}}
          />
        </>
      )}
      {activeTab === 'gifts' && (
        <>
          {/* Кейсы */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
            {cases && cases.length > 0 ? cases.map((caseItem: any) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                currentUser={currentUser}
                onOpen={() => {}}
                onCoinsUpdate={onCoinsUpdate}
              />
            )) : (
              <ShopEmptyState />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ShopTab;
