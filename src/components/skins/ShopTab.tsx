import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";
import { purchaseLimiter } from "@/utils/rateLimiter";
import ShopFilters from "./ShopFilters";
import ShopSkinCard from "./ShopSkinCard";
import ShopEmptyState from "./ShopEmptyState";
import ShopPagination from "./ShopPagination";
import PurchaseSuccessModal from "./PurchaseSuccessModal";

interface ShopTabProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
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

const ITEMS_PER_PAGE = 24;

const ShopTab = ({ currentUser, onCoinsUpdate, onTabChange }: ShopTabProps) => {
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 999999 });
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [purchaseSuccessModal, setPurchaseSuccessModal] = useState<{
    isOpen: boolean;
    item: Skin | null;
  }>({ isOpen: false, item: null });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: skins, isLoading } = useQuery({
    queryKey: ['shop-skins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) {
        console.error('Error loading skins:', error);
        throw error;
      }
      return data as Skin[];
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async (skin: Skin) => {
      try {
        if (!purchaseLimiter.isAllowed(currentUser.id)) {
          throw new Error('Слишком много покупок. Подождите немного.');
        }

        console.log('💰 [SHOP] Starting purchase:', { 
          skinName: skin.name, 
          skinPrice: skin.price, 
          userCoins: currentUser.coins, 
          userId: currentUser.id 
        });

        if (!isValidUUID(currentUser.id)) {
          throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
        }

        if (currentUser.coins < skin.price) {
          throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${currentUser.coins}`);
        }

        // Используем RPC функцию для безопасной покупки
        const { data, error } = await supabase.rpc('safe_purchase_skin', {
          p_user_id: currentUser.id,
          p_skin_id: skin.id,
          p_skin_price: skin.price
        });

        if (error) {
          console.error('❌ [SHOP] RPC purchase error:', error);
          throw new Error(error.message || 'Не удалось совершить покупку');
        }

        if (!data || !data.success) {
          throw new Error(data?.error || 'Покупка не удалась');
        }

        console.log('✅ [SHOP] Purchase successful:', {
          newBalance: data.new_balance,
          inventoryId: data.inventory_id
        });

        return { 
          newCoins: data.new_balance, 
          purchasedSkin: skin,
          inventoryId: data.inventory_id
        };
      } catch (error) {
        console.error('💥 [SHOP] Purchase error:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log('🎉 [SHOP] Purchase completed, updating UI...');
      
      // Обновляем баланс пользователя
      onCoinsUpdate(data.newCoins);
      
      // Инвалидируем кэш инвентаря
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      await queryClient.refetchQueries({ queryKey: ['user-inventory', currentUser.id] });
      
      console.log('✅ [SHOP] Inventory cache invalidated');
      
      setPurchaseSuccessModal({
        isOpen: true,
        item: data.purchasedSkin
      });
      
      toast({
        title: "Покупка успешна!",
        description: `${data.purchasedSkin.name} добавлен в инвентарь`,
      });
    },
    onError: (error: any) => {
      console.error('🚨 [SHOP] Purchase mutation error:', error);
      toast({
        title: "Ошибка покупки",
        description: error.message || "Не удалось совершить покупку",
        variant: "destructive",
      });
    }
  });

  // Фильтрация и сортировка скинов
  const filteredAndSortedSkins = skins?.filter(skin => {
    const rarityMatch = selectedRarity === "all" || skin.rarity === selectedRarity;
    const weaponMatch = selectedWeapon === "all" || skin.weapon_type === selectedWeapon;
    const priceMatch = skin.price >= priceRange.min && skin.price <= priceRange.max;
    return rarityMatch && weaponMatch && priceMatch;
  }).sort((a, b) => {
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

  const handlePurchase = (skin: Skin) => {
    console.log('🛒 [SHOP] Handle purchase clicked for:', skin.name);
    
    const remaining = purchaseLimiter.getRemainingRequests(currentUser.id);
    if (remaining === 0) {
      toast({
        title: "Слишком много покупок",
        description: "Подождите немного перед следующей покупкой",
        variant: "destructive",
      });
      return;
    }
    
    if (purchaseMutation.isPending) {
      console.log('⏳ [SHOP] Purchase already in progress, ignoring click');
      return;
    }
    
    purchaseMutation.mutate(skin);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-gray-800/50 rounded-lg h-16 sm:h-20 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const rarities = [...new Set(skins?.map(skin => skin.rarity) || [])];
  const weaponTypes = [...new Set(skins?.map(skin => skin.weapon_type) || [])];

  return (
    <div className="space-y-4 sm:space-y-6">
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

      <div className="flex justify-between items-center text-xs sm:text-sm text-slate-400 px-1">
        <span>
          Показано {currentSkins.length} из {filteredAndSortedSkins.length} скинов
        </span>
        {totalPages > 1 && (
          <span>
            Страница {currentPage} из {totalPages}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
        {currentSkins.map((skin) => (
          <ShopSkinCard
            key={skin.id}
            skin={skin}
            canAfford={currentUser.coins >= skin.price}
            onPurchase={handlePurchase}
            isPurchasing={purchaseMutation.isPending}
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
        purchasedItem={purchaseSuccessModal.item}
        onViewInventory={handleViewInventory}
      />
    </div>
  );
};

export default ShopTab;
