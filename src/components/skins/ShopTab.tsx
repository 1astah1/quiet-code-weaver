
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";
import ShopFilters from "./ShopFilters";
import ShopSkinCard from "./ShopSkinCard";
import ShopEmptyState from "./ShopEmptyState";

interface ShopTabProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

interface Skin {
  id: string;
  name: string;
  weapon_type: string;
  rarity: string;
  price: number;
  image_url: string | null;
}

const ShopTab = ({ currentUser, onCoinsUpdate }: ShopTabProps) => {
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("all");
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
        console.log('Starting purchase:', { skin: skin.name, price: skin.price, userCoins: currentUser.coins, userId: currentUser.id });

        // Проверяем валидность UUID
        if (!isValidUUID(currentUser.id)) {
          throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
        }

        // Проверяем баланс
        if (currentUser.coins < skin.price) {
          throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${currentUser.coins}`);
        }

        // Проверяем существование пользователя или создаем его
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, coins')
          .eq('id', currentUser.id)
          .single();

        let userCoins = currentUser.coins;
        
        if (userCheckError && userCheckError.code === 'PGRST116') {
          // Пользователь не существует, создаем его
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

        // Проверяем актуальный баланс
        if (userCoins < skin.price) {
          throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${userCoins}`);
        }

        // Списываем монеты
        const newCoins = userCoins - skin.price;
        const { error: coinsError } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', currentUser.id);

        if (coinsError) {
          console.error('Error updating coins:', coinsError);
          throw new Error('Не удалось списать монеты');
        }

        // Добавляем в инвентарь
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
          // Откатываем транзакцию с монетами
          await supabase
            .from('users')
            .update({ coins: userCoins })
            .eq('id', currentUser.id);
          throw new Error('Не удалось добавить в инвентарь');
        }

        console.log('Purchase successful, new coins:', newCoins);
        return { newCoins };
      } catch (error) {
        console.error('Purchase error:', error);
        throw error;
      }
    },
    onSuccess: (data, skin) => {
      onCoinsUpdate(data.newCoins);
      queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      toast({
        title: "Покупка успешна!",
        description: `${skin.name} добавлен в инвентарь`,
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

  const filteredSkins = skins?.filter(skin => {
    const rarityMatch = selectedRarity === "all" || skin.rarity === selectedRarity;
    const weaponMatch = selectedWeapon === "all" || skin.weapon_type === selectedWeapon;
    return rarityMatch && weaponMatch;
  }) || [];

  const handlePurchase = (skin: Skin) => {
    console.log('Handle purchase clicked for:', skin.name);
    if (purchaseMutation.isPending) {
      console.log('Purchase already in progress, ignoring click');
      return;
    }
    purchaseMutation.mutate(skin);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-800/50 rounded-lg h-32 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const rarities = [...new Set(skins?.map(skin => skin.rarity) || [])];
  const weaponTypes = [...new Set(skins?.map(skin => skin.weapon_type) || [])];

  return (
    <div className="space-y-6">
      <ShopFilters
        selectedRarity={selectedRarity}
        selectedWeapon={selectedWeapon}
        rarities={rarities}
        weaponTypes={weaponTypes}
        onRarityChange={setSelectedRarity}
        onWeaponChange={setSelectedWeapon}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkins.map((skin) => (
          <ShopSkinCard
            key={skin.id}
            skin={skin}
            canAfford={currentUser.coins >= skin.price}
            onPurchase={handlePurchase}
            isPurchasing={purchaseMutation.isPending}
          />
        ))}
      </div>

      {filteredSkins.length === 0 && <ShopEmptyState />}
    </div>
  );
};

export default ShopTab;
