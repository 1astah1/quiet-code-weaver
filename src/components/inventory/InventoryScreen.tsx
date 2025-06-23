
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins, Package, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useSkinSale } from "@/hooks/useSkinSale";
import { useSellAllSkins } from "@/hooks/useSellAllSkins";
import InventoryItem from "./InventoryItem";

interface InventoryScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const InventoryScreen = ({ currentUser, onCoinsUpdate }: InventoryScreenProps) => {
  const [filter, setFilter] = useState<"all" | "available" | "sold">("all");
  const { toast } = useToast();
  
  const { data: inventoryItems = [], isLoading, error } = useInventoryData(currentUser.id);
  const skinSaleMutation = useSkinSale();
  const sellAllMutation = useSellAllSkins();

  const handleSellSkin = (inventoryId: string, price: number) => {
    skinSaleMutation.mutate({
      inventoryId,
      userId: currentUser.id,
      price
    }, {
      onSuccess: (data) => {
        onCoinsUpdate(currentUser.coins + data.price);
      }
    });
  };

  const handleSellAll = () => {
    const availableItems = inventoryItems.filter(item => !item.is_sold);
    
    if (availableItems.length === 0) {
      toast({
        title: "Нет предметов для продажи",
        description: "В вашем инвентаре нет предметов, которые можно продать",
        variant: "destructive",
      });
      return;
    }

    sellAllMutation.mutate(
      { userId: currentUser.id },
      {
        onSuccess: (totalEarned) => {
          // totalEarned is now the number returned from the mutation's onSuccess
          onCoinsUpdate(currentUser.coins + totalEarned);
        }
      }
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Ошибка загрузки</h3>
          <p className="text-slate-400">Не удалось загрузить инвентарь</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Загрузка инвентаря...</p>
        </div>
      </div>
    );
  }

  const filteredItems = inventoryItems.filter(item => {
    if (filter === "available") return !item.is_sold;
    if (filter === "sold") return item.is_sold;
    return true;
  });

  const availableItems = inventoryItems.filter(item => !item.is_sold);
  const totalValue = availableItems.reduce((sum, item) => sum + (item.skins?.price || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header с статистикой */}
      <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Мой инвентарь</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {availableItems.length} предметов на {totalValue} монет
              </p>
            </div>
          </div>
          
          {availableItems.length > 0 && (
            <Button
              onClick={handleSellAll}
              disabled={sellAllMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 text-sm sm:text-base px-3 sm:px-4 py-2"
            >
              <Coins className="h-4 w-4 mr-2" />
              {sellAllMutation.isPending ? "Продажа..." : "Продать всё"}
            </Button>
          )}
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "Все", count: inventoryItems.length },
          { key: "available", label: "Доступные", count: availableItems.length },
          { key: "sold", label: "Проданные", count: inventoryItems.length - availableItems.length }
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key as typeof filter)}
            className={`whitespace-nowrap ${
              filter === key
                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                : "bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border-slate-600"
            }`}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {/* Инвентарь */}
      {filteredItems.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="text-center">
            <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
              {filter === "all" ? "Инвентарь пуст" : 
               filter === "available" ? "Нет доступных предметов" : 
               "Нет проданных предметов"}
            </h3>
            <p className="text-slate-400 text-sm sm:text-base">
              {filter === "all" ? "Откройте кейсы, чтобы получить скины!" :
               filter === "available" ? "Все предметы уже проданы" :
               "Вы ещё ничего не продавали"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <InventoryItem
              key={item.id}
              item={item}
              onSell={handleSellSkin}
              isLoading={skinSaleMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryScreen;
