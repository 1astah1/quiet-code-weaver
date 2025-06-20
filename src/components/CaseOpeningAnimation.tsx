
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Sparkles, Coins, ShoppingBag } from "lucide-react";
import { generateUUID } from "@/utils/uuid";

interface CaseOpeningAnimationProps {
  caseItem: any;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseOpeningAnimation = ({ caseItem, onClose, currentUser, onCoinsUpdate }: CaseOpeningAnimationProps) => {
  const [isOpening, setIsOpening] = useState(false);
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'complete'>('opening');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer grade':
      case 'consumer': 
        return 'from-gray-600 to-gray-700';
      case 'industrial grade':
      case 'industrial': 
        return 'from-blue-600 to-blue-700';
      case 'mil-spec': 
        return 'from-purple-600 to-purple-700';
      case 'restricted': 
        return 'from-pink-600 to-pink-700';
      case 'classified': 
        return 'from-red-600 to-red-700';
      case 'covert': 
        return 'from-orange-600 to-orange-700';
      case 'contraband': 
        return 'from-yellow-600 to-yellow-700';
      case 'special':
      case '★ special items': 
        return 'from-yellow-500 to-orange-500';
      default: 
        return 'from-gray-600 to-gray-700';
    }
  };

  const openCase = async () => {
    if (isOpening) return;
    
    setIsOpening(true);
    setAnimationPhase('opening');

    try {
      console.log('Starting case opening for:', caseItem?.name);

      if (!currentUser?.id) {
        throw new Error('Пользователь не найден');
      }

      const { data: caseSkins, error: caseSkinsError } = await supabase
        .from('case_skins')
        .select(`
          probability,
          custom_probability,
          never_drop,
          skins (*)
        `)
        .eq('case_id', caseItem.id)
        .eq('never_drop', false);

      if (caseSkinsError) {
        console.error('Error fetching case skins:', caseSkinsError);
        throw new Error('Не удалось загрузить содержимое кейса');
      }

      if (!caseSkins || caseSkins.length === 0) {
        throw new Error('В кейсе нет доступных предметов');
      }

      console.log('Case skins loaded:', caseSkins.length);

      const totalProbability = caseSkins.reduce((sum, item) => {
        return sum + (item.custom_probability || item.probability || 0.01);
      }, 0);
      
      let random = Math.random() * totalProbability;
      let selectedSkin = caseSkins[0];

      for (const skin of caseSkins) {
        const probability = skin.custom_probability || skin.probability || 0.01;
        random -= probability;
        if (random <= 0) {
          selectedSkin = skin;
          break;
        }
      }

      if (!selectedSkin?.skins) {
        throw new Error('Не удалось выбрать скин');
      }

      console.log('Selected skin:', selectedSkin.skins.name);

      setTimeout(() => {
        setAnimationPhase('revealing');
      }, 2000);
      
      setTimeout(() => {
        setWonSkin(selectedSkin.skins);
        setAnimationPhase('complete');
        setIsComplete(true);
        setIsOpening(false);

        toast({
          title: "🎉 Поздравляем!",
          description: `Вы выиграли ${selectedSkin.skins.name}!`,
        });
      }, 4000);

    } catch (error) {
      console.error('Case opening error:', error);
      setIsOpening(false);
      setAnimationPhase('opening');
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  };

  const addToInventory = async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('Adding to inventory:', wonSkin.name);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, coins')
        .eq('id', currentUser.id)
        .single();

      if (userError) {
        console.error('User check error:', userError);
        throw new Error('Пользователь не найден');
      }

      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          id: generateUUID(),
          user_id: currentUser.id,
          skin_id: wonSkin.id,
          obtained_at: new Date().toISOString(),
          is_sold: false
        });

      if (inventoryError) {
        console.error('Inventory error:', inventoryError);
        throw new Error('Не удалось добавить в инвентарь');
      }

      try {
        await supabase
          .from('recent_wins')
          .insert({
            id: generateUUID(),
            user_id: currentUser.id,
            skin_id: wonSkin.id,
            case_id: caseItem.id,
            won_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Recent win error (non-critical):', error);
      }

      if (!caseItem.is_free) {
        const newCoins = userData.coins - caseItem.price;
        if (newCoins < 0) {
          throw new Error('Недостаточно монет');
        }

        const { error: coinsError } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', currentUser.id);

        if (coinsError) {
          console.error('Coins update error:', coinsError);
          throw new Error('Не удалось списать монеты');
        }
        
        onCoinsUpdate(newCoins);
      }

      toast({
        title: "Скин добавлен в инвентарь!",
        description: `${wonSkin.name} теперь в ваших выигрышах`,
      });

      onClose();
    } catch (error) {
      console.error('Add to inventory error:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось добавить скин в инвентарь",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sellDirectly = async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('Selling directly:', wonSkin.name);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, coins')
        .eq('id', currentUser.id)
        .single();

      if (userError) {
        console.error('User check error:', userError);
        throw new Error('Пользователь не найден');
      }

      const sellPrice = wonSkin.price || 0;
      let newCoins = userData.coins + sellPrice;
      
      if (!caseItem.is_free) {
        newCoins -= caseItem.price;
        if (newCoins < 0) {
          throw new Error('Недостаточно монет для покупки кейса');
        }
      }

      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (coinsError) {
        console.error('Coins update error:', coinsError);
        throw new Error('Не удалось обновить баланс');
      }

      try {
        await supabase
          .from('recent_wins')
          .insert({
            id: generateUUID(),
            user_id: currentUser.id,
            skin_id: wonSkin.id,
            case_id: caseItem.id,
            won_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Recent win error (non-critical):', error);
      }

      onCoinsUpdate(newCoins);

      toast({
        title: "Скин продан!",
        description: `Получено ${sellPrice} монет за ${wonSkin.name}`,
      });

      onClose();
    } catch (error) {
      console.error('Sell directly error:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось продать скин",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!caseItem || !currentUser) {
      console.error('Missing required props');
      return;
    }
    
    openCase();
  }, [caseItem?.id, currentUser?.id]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          >
            <Sparkles className="w-4 h-4 text-orange-400/40" />
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-3xl p-8 w-full max-w-4xl mx-4 text-center relative overflow-hidden border border-orange-500/30">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-8 h-8" />
        </button>

        {animationPhase === 'opening' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white mb-6">Открытие кейса...</h2>
            
            <div className="relative">
              <div className="animate-bounce w-32 h-32 mx-auto mb-8">
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-6xl shadow-2xl shadow-orange-500/50">
                  📦
                </div>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-4 border-transparent border-t-orange-500 border-r-orange-500 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        )}

        {animationPhase === 'revealing' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white mb-6">Определяем выигрыш...</h2>
            
            <div className="relative">
              <div className="w-40 h-40 mx-auto">
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-6xl shadow-2xl shadow-orange-500/50 animate-ping">
                  ✨
                </div>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-transparent border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin"></div>
              </div>
            </div>
            
            <p className="text-yellow-300 text-2xl font-semibold animate-pulse">Почти готово!</p>
          </div>
        )}

        {isComplete && wonSkin && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-5xl font-bold text-white mb-4">🎉 Поздравляем! 🎉</h2>
              <p className="text-yellow-400 text-2xl font-semibold">Вы выиграли:</p>
            </div>
            
            <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity)} rounded-3xl p-8 transform animate-scale-in border-4 border-white/30 relative overflow-hidden`}>
              <div className="bg-black/30 rounded-2xl h-48 mb-6 flex items-center justify-center relative overflow-hidden">
                {wonSkin.image_url ? (
                  <img 
                    src={wonSkin.image_url} 
                    alt={wonSkin.name}
                    className="max-w-full max-h-full object-contain animate-fade-in"
                    onError={(e) => {
                      console.log('Image failed to load:', wonSkin.image_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-8xl animate-bounce">🎯</span>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse"></div>
              </div>
              
              <h3 className="text-white font-bold text-3xl mb-3">{wonSkin.name || 'Неизвестный скин'}</h3>
              <p className="text-white/90 text-xl mb-2">{wonSkin.weapon_type || 'Оружие'}</p>
              <p className="text-white/70 text-lg uppercase tracking-wider mb-4">{wonSkin.rarity || 'Common'}</p>
              
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-2xl">{wonSkin.price || 0} монет</span>
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={addToInventory}
                disabled={isProcessing}
                className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isProcessing ? "Добавляем..." : "Забрать в инвентарь"}</span>
              </button>
              
              <button
                onClick={sellDirectly}
                disabled={isProcessing}
                className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none"
              >
                <Coins className="w-5 h-5" />
                <span>{isProcessing ? "Продаем..." : `Продать за ${wonSkin.price || 0}`}</span>
              </button>
            </div>
            
            <p className="text-gray-400 text-sm">Выберите действие с выигранным предметом</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
