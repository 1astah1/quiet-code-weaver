
import { Filter } from "lucide-react";

interface ShopFiltersProps {
  selectedRarity: string;
  selectedWeapon: string;
  rarities: string[];
  weaponTypes: string[];
  onRarityChange: (rarity: string) => void;
  onWeaponChange: (weapon: string) => void;
}

const ShopFilters = ({
  selectedRarity,
  selectedWeapon,
  rarities,
  weaponTypes,
  onRarityChange,
  onWeaponChange,
}: ShopFiltersProps) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-5 h-5 text-orange-400" />
        <h3 className="text-white font-semibold">Фильтры</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-400 text-sm mb-2">Редкость</label>
          <select
            value={selectedRarity}
            onChange={(e) => onRarityChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Все</option>
            {rarities.map(rarity => (
              <option key={rarity} value={rarity}>{rarity}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-slate-400 text-sm mb-2">Тип оружия</label>
          <select
            value={selectedWeapon}
            onChange={(e) => onWeaponChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Все</option>
            {weaponTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ShopFilters;
