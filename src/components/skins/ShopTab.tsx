import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";
import { purchaseLimiter } from "@/utils/rateLimiter";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { connectionOptimizer } from "@/utils/connectionOptimizer";
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

  // Используем оптимизированный запрос
  const { data: skins, isLoading } = useOptimizedQuery({
    queryKey: ['shop-skins'],
    queryFn: async () => {
      return connectionOptimizer.optimizedFetch(async () => {
        const { data, error } = await supabase
          .from('skins')
          .select('*')
          .order('price', { ascending: true });
        
        if (error) {
          console.error('Error loading skins:', error);
          throw error;
        }
        return data as Skin[];
      });
    },
    staleTime: 10 * 60 * 1000, // Увеличиваем время кэша для скинов
  });

  const purchaseMutation = useMutation({
    mutationFn: async (skin: Skin) => {
      return connectionOptimizer.optimizedFetch(async () => {
        try {
          if (!purchaseLimiter.isAllowed(currentUser.id)) {
            throw new Error('Слишком много покупок. Подождите немного.');
          }

          console.log('Starting purchase:', { skin: skin.name, price: skin.price, userCoins: currentUser.coins, userId: currentUser.id });

          if (!isValidUUID(currentUser.id)) {
            throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
          }

          if (currentUser.coins < skin.price) {
            throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${currentUser.coins}`);
          }

          const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('id, coins')
            .eq('id', currentUser.id)
            .single();

          let userCoins = currentUser.coins;
          
          if (userCheckError && userCheckError.code === 'PGRST116') {
            console.log('Creating new user:', currentUser.id);
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: currentUser.id,
                username: currentUser.username,
                coins: currentUser.coins
              });

            if (createError) {
              console.error('Error creating user:', createError);
              throw new Error('Не удалось создать пользователя');
            }
          } else if (userCheckError) {
            console.error('Error checking user:', userCheckError);
            throw new Error('Ошибка проверки пользователя');
          } else {
            userCoins = existingUser.coins;
          }

          if (userCoins < skin.price) {
            throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${userCoins}`);
          }

          const newCoins = userCoins - skin.price;
          const { error: coinsError } = await supabase
            .from('users')
            .update({ coins: newCoins })
            .eq('id', currentUser.id);

          if (coinsError) {
            console.error('Error updating coins:', coinsError);
            throw new Error('Не удалось списать монеты');
          }

          const { error: inventoryError } = await supabase
            .from('user_inventory')
            .insert({
              id: generateUUID(),
              user_id: currentUser.id,
              skin_id: skin.id,
              obtained_at: new Date().toISOString(),
              is_sold: false
            });

          if (inventoryError) {
            console.error('Error adding to inventory:', inventoryError);
            await supabase
              .from('users')
              .update({ coins: userCoins })
              .eq('id', currentUser.id);
            throw new Error('Не удалось добавить в инвентарь');
          }

          console.log('Purchase successful, new coins:', newCoins);
          return { newCoins, purchasedSkin: skin };
        } catch (error) {
          console.error('Purchase error:', error);
          throw error;
        }
      });
    },
    onSuccess: async (data) => {
      onCoinsUpdate(data.newCoins);
      
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      await queryClient.refetchQueries({ queryKey: ['user-inventory', currentUser.id] });
      
      console.log('Purchase completed, inventory cache invalidated');
      
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
      console.error('Purchase mutation error:', error);
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
    console.log('Handle purchase clicked for:', skin.name);
    
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
      console.log('Purchase already in progress, ignoring click');
      return;
    }
    purchaseMutation.mutate(skin);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении сортировки
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Прокручиваем страницу вверх при смене страницы
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewInventory = () => {
    if (onTabChange) {
      onTabChange('inventory');
    }
  };

  // Сбрасываем страницу при изменении фильтров
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

      {/* Информация о результатах */}
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

      {/* Улучшенная сетка для скинов - более компактная */}
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

      {/* Пагинация */}
      <ShopPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Purchase Success Modal */}
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
