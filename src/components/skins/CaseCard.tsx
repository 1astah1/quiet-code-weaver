import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Ticket, Play } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";

const CaseCard = ({ caseItem, currentUser, onOpen, onCoinsUpdate }: any) => {
  const canAfford = currentUser.coins >= caseItem.price;

  const handleOpenClick = () => {
    if (caseItem.is_free) {
      onOpen(caseItem, true);
    } else if (canAfford) {
      onOpen(caseItem, false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-slate-700/50 group transition-all hover:scale-105 hover:border-orange-500/50">
      <div className="aspect-square bg-gray-700/30 p-2 sm:p-4 flex items-center justify-center">
        <LazyImage
          src={caseItem.image_url ?? ''}
          alt={caseItem.name}
          className="w-full h-full object-contain max-h-[120px] group-hover:scale-110 transition-transform"
          timeout={2000}
          fallback={<div className="w-full h-full bg-gray-600/50 rounded-md" />}
        />
      </div>
      <div className="p-2">
        <h3 className="text-white text-sm font-medium truncate">{caseItem.name}</h3>
        {caseItem.is_free ? (
          <Button
            onClick={handleOpenClick}
            size="sm"
            className="w-full mt-2 text-xs h-auto py-1 px-3 bg-green-600 hover:bg-green-700"
          >
            <Play className="w-3 h-3 mr-1" />
            Смотреть и открыть
          </Button>
        ) : (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-4 h-4" />
              <span className="font-bold text-sm">{caseItem.price}</span>
            </div>
            <Button
              onClick={handleOpenClick}
              size="sm"
              disabled={!canAfford}
              className="text-xs h-auto py-1 px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600"
            >
              Открыть
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseCard;
