import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedPurchase } from "@/hooks/useUnifiedShop";
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
  image_url: string | null;
}

interface Case {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  [key: string]: any;
}

const ITEMS_PER_PAGE = 24;

const ShopTab = ({ currentUser, onCoinsUpdate, onTabChange }: ShopTabProps) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'cases'>('skins');
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 999999 });
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [purchaseSuccessModal, setPurchaseSuccessModal] = useState<{
    isOpen: boolean;
    item: Skin | null;
  }>({ isOpen: false, item: null });
  
  const { purchaseMutation, isPurchasing } = useUnifiedPurchase(currentUser, onCoinsUpdate);

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
      
      // Простая валидация данных скинов
      const validatedSkins = (data || []).filter(skin => {
        return (
          skin.id &&
          skin.name && 
          typeof skin.name === 'string' &&
          skin.name.length > 0 &&
          typeof skin.price === 'number' &&
          skin.price >= 0
        );
      }).map(skin => ({
        ...skin,
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

  // Фильтрация и сортировка
  const filteredAndSortedSkins = skins?.filter(skin => {
    if (!skin || !skin.id) return false;
    
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

  // Получаем уникальные значения для фильтров
  const rarities = [...new Set(skins?.map(s => s.rarity).filter(Boolean) || [])];
  const weaponTypes = [...new Set(skins?.map(s => s.weapon_type).filter(Boolean) || [])];

  const handlePurchase = async (skin: Skin) => {
    console.log('🛒 [SHOP] Handle purchase clicked for:', skin.name);
    
    try {
      if (isPurchasing) {
        console.log('⏳ [SHOP] Purchase already in progress, ignoring click');
        return;
      }
      
      const result = await purchaseMutation.mutateAsync(skin);
      
      // Показываем модальное окно успеха
      setPurchaseSuccessModal({
        isOpen: true,
        item: result.skin
      });
      
    } catch (error) {
      console.error('💥 [SHOP] Purchase handling error:', error);
    }
  };

  const handleOpenCase = (caseItem: any, isFree: boolean) => {
    console.log('Opening case:', caseItem.name, 'isFree:', isFree);
    // TODO: Implement case opening logic, e.g., show AdModal or navigate
    if (onTabChange) {
      // For now, let's just log it. A proper implementation would likely involve
      // setting state to show a modal or changing the route.
      alert(`Opening ${caseItem.name}`);
    }
  };

  const handleInventoryUpdate = () => {
    refetch(); // Просто перезагружаем скины в магазине, можно сделать более сложно
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
    setSelectedRarity(rarity);
    setCurrentPage(1);
  };

  const handleWeaponChange = (weapon: string) => {
    setSelectedWeapon(weapon);
    setCurrentPage(1);
  };

  if (isSkinsLoading || isCasesLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 relative">
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white text-center w-full">
          Магазин
        </h1>
      </div>
      {/* ВРЕМЕННО: Диагностика количества скинов и кейсов */}
      <div className="text-xs text-slate-400 mb-4 text-center">
        Скинов: {skins?.length ?? 0} | Кейсов: {cases?.length ?? 0}
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'skins' && (
        <>
          {/* Фильтры и скины */}
          <ShopFilters
            selectedRarity={selectedRarity}
            selectedWeapon={selectedWeapon}
            rarities={rarities}
            weaponTypes={weaponTypes}
            onRarityChange={handleRarityChange}
            onWeaponChange={handleWeaponChange}
            onPriceRangeChange={handlePriceRangeChange}
            onSortChange={handleSortChange}
          />
          {isSkinsLoading ? (
             <div className="flex justify-center items-center h-96">
               <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
             </div>
          ) : currentSkins.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {currentSkins.map((skin) => (
                <ShopSkinCard
                  key={skin.id}
                  skin={skin}
                  onBuy={(skin) => { void handlePurchase(skin); }}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                />
              ))}
            </div>
          ) : (
            <ShopEmptyState />
          )}
          <ShopPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
      {activeTab === 'cases' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {isCasesLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : cases && cases.length > 0 ? (
            (cases as Case[]).map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                currentUser={currentUser}
                onOpen={handleOpenCase}
                onCoinsUpdate={onCoinsUpdate}
              />
            ))
          ) : (
            <ShopEmptyState />
          )}
        </div>
      )}
      <PurchaseSuccessModal
        isOpen={purchaseSuccessModal.isOpen}
        onClose={() => setPurchaseSuccessModal({ isOpen: false, item: null })}
        reward={purchaseSuccessModal.item ? {
          ...purchaseSuccessModal.item,
          image_url: purchaseSuccessModal.item.image_url || undefined,
          type: 'skin' as const,
        } : { id: '', name: '', price: 0, type: 'skin' as const }}
        newBalance={currentUser.coins}
        onInventoryUpdate={handleInventoryUpdate}
      />
    </div>
  );
};

export default ShopTab;
