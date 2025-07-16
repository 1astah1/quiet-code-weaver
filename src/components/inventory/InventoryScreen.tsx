import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/components/ui/use-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc, DollarSign, Package, Gift, Crown, Zap, Star, Flame } from "lucide-react";
import { useUnifiedSale, useUnifiedInventory } from '@/hooks/useUnifiedShop';
import { Loader2, Coins, Download, ExternalLink } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import WithdrawSkinModal from "./WithdrawSkinModal";

interface InventoryScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    steam_trade_url?: string;
  };
  onCoinsUpdate: (newCoins: number) => void;
  setInventoryRefetch?: (refetchFn: () => Promise<any>) => void;
}

const InventoryScreen = ({ currentUser, onCoinsUpdate, setInventoryRefetch }: InventoryScreenProps) => {
  const queryClient = useQueryClient();
  const { data: inventory, isLoading, error, refetch } = useUnifiedInventory(currentUser.id);
  const { sellMutation, isSelling } = useUnifiedSale(currentUser, onCoinsUpdate);
  const { toast } = useToast();
  
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Covert': 'border-orange-500 bg-orange-500/10',
      'Classified': 'border-red-500 bg-red-500/10',
      'Restricted': 'border-purple-500 bg-purple-500/10',
      'Mil-Spec': 'border-blue-500 bg-blue-500/10',
      'Industrial Grade': 'border-blue-400 bg-blue-400/10',
      'Consumer Grade': 'border-gray-500 bg-gray-500/10',
    };
    return colors[rarity as keyof typeof colors] || 'border-gray-500 bg-gray-500/10';
  };

  const handleSellSkin = async (inventoryId: string) => {
    try {
      if (!inventory) return;
      
      const item = inventory.find((i: any) => i.id === inventoryId);
      if (!item || item.is_sold) {
        toast({
          title: "Ошибка",
          description: "Этот скин уже продан или не найден.",
          variant: "destructive",
        });
        return;
      }
      
      if (isSelling) {
        console.log('Sell already in progress');
        return;
      }
      
      await sellMutation.mutateAsync(inventoryId);
      
    } catch (error) {
      console.error('Error selling skin:', error);
    }
  };

  const handleWithdrawSkin = (item: any) => {
    setSelectedItem(item);
    setWithdrawModalOpen(true);
  };


  // При монтировании сохраняем refetch
  useEffect(() => {
    if (setInventoryRefetch) setInventoryRefetch(refetch);
  }, [setInventoryRefetch, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Загрузка инвентаря...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 text-base sm:text-lg">Ошибка загрузки инвентаря</p>
            <p className="text-slate-500 text-xs sm:text-sm">Попробуйте перезагрузить страницу</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">Мои выигрыши</h1>
        <p className="text-slate-400 text-xs sm:text-sm md:text-base">Управляйте своими скинами</p>
      </div>

      {!inventory || inventory.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 text-sm sm:text-base md:text-lg">Ваш инвентарь пуст</p>
          <p className="text-slate-500 text-xs sm:text-sm">Откройте кейсы, чтобы получить скины</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
          {inventory.filter((item) => !!item.skins && !item.is_sold).map((item) => {
            console.log('Rendering inventory item:', item.id, 'skin data:', item.skins);
            return (
              <div
                key={item.id}
                className={`bg-slate-800/50 rounded-lg border ${getRarityColor(item.skins!.rarity || '')} p-2 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                {/* Rarity Badge */}
                <div className="bg-black/60 px-1 py-0.5 rounded text-[10px] sm:text-xs text-white mb-1.5 text-center truncate">
                  {(item.skins!.rarity || '').split(' ')[0]}
                </div>

                {/* Skin Image */}
                <div className="bg-black/30 rounded-lg aspect-square mb-1.5 flex items-center justify-center overflow-hidden">
                  {item.skins!.image_url ? (
                    <OptimizedImage
                      src={item.skins!.image_url}
                      alt={item.skins!.name || 'Скин'}
                      className="w-full h-full object-contain"
                      fallback={
                        <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white/50" />
                        </div>
                      }
                      onError={() => console.log('Failed to load inventory skin image:', item.skins!.image_url, 'for skin:', item.skins!.name)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white/50" />
                    </div>
                  )}
                </div>

                {/* Skin Info */}
                <div className="space-y-1">
                  <div>
                    <h3 className="text-white font-semibold text-[10px] sm:text-xs leading-tight truncate" title={item.skins!.name || ''}>
                      {item.skins!.name || ''}
                    </h3>
                    <p className="text-white/70 text-[9px] sm:text-[10px] truncate">{item.skins!.weapon_type || ''}</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-0.5 sm:space-x-1">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] sm:text-xs font-bold">₽</span>
                      </div>
                      <span className="text-orange-400 font-bold text-[10px] sm:text-xs">{item.skins!.price ?? ''}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1">
                    <button
                      onClick={() => handleSellSkin(item.id)}
                      disabled={isSelling}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-1 py-1 sm:py-1.5 rounded text-[9px] sm:text-xs font-medium transition-all flex items-center justify-center space-x-0.5 sm:space-x-1"
                    >
                      {isSelling ? (
                        <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                      ) : (
                        <>
                          <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden xs:inline">Продать</span>
                          <span className="xs:hidden">₽</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleWithdrawSkin(item)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-1 py-1 sm:py-1.5 rounded text-[9px] sm:text-xs font-medium transition-all flex items-center justify-center space-x-0.5 sm:space-x-1"
                    >
                      <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden xs:inline">Вывести</span>
                      <span className="xs:hidden">↓</span>
                    </button>
                    
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-1 py-1 sm:py-1.5 rounded text-[9px] sm:text-xs font-medium transition-all flex items-center justify-center space-x-0.5 sm:space-x-1">
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden xs:inline">Steam</span>
                      <span className="xs:hidden">↗</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно для вывода скина */}
      {selectedItem && selectedItem.skins && (
        <WithdrawSkinModal
          isOpen={withdrawModalOpen}
          onClose={() => {
            setWithdrawModalOpen(false);
            setSelectedItem(null);
          }}
          inventoryItemId={selectedItem.id}
          skinName={selectedItem.skins.name}
          skinImage={selectedItem.skins.image_url}
          currentTradeUrl={currentUser.steam_trade_url}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default InventoryScreen;
