
import { useState } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShopFiltersProps {
  selectedRarity: string;
  selectedWeapon: string;
  rarities: string[];
  weaponTypes: string[];
  onRarityChange: (rarity: string) => void;
  onWeaponChange: (weapon: string) => void;
  onPriceRangeChange?: (min: number, max: number) => void;
  onSortChange?: (sort: string) => void;
}

const ShopFilters = ({
  selectedRarity,
  selectedWeapon,
  rarities,
  weaponTypes,
  onRarityChange,
  onWeaponChange,
  onPriceRangeChange,
  onSortChange
}: ShopFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sortBy, setSortBy] = useState('price-asc');

  const sortOptions = [
    { value: 'price-asc', label: 'Цена: по возрастанию' },
    { value: 'price-desc', label: 'Цена: по убыванию' },
    { value: 'name-asc', label: 'Название: А-Я' },
    { value: 'name-desc', label: 'Название: Я-А' },
    { value: 'rarity-desc', label: 'Редкость: высокая' },
    { value: 'rarity-asc', label: 'Редкость: низкая' }
  ];

  const handlePriceRangeApply = () => {
    const min = priceMin ? parseInt(priceMin) : 0;
    const max = priceMax ? parseInt(priceMax) : 999999;
    onPriceRangeChange?.(min, max);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  };

  const clearFilters = () => {
    onRarityChange('all');
    onWeaponChange('all');
    setPriceMin('');
    setPriceMax('');
    setSortBy('price-asc');
    onPriceRangeChange?.(0, 999999);
    onSortChange?.('price-asc');
  };

  const activeFiltersCount = [
    selectedRarity !== 'all',
    selectedWeapon !== 'all',
    priceMin !== '',
    priceMax !== '',
    sortBy !== 'price-asc'
  ].filter(Boolean).length;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
      {/* Basic Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Rarity Filter */}
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Редкость
          </label>
          <select
            value={selectedRarity}
            onChange={(e) => onRarityChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Все редкости</option>
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        {/* Weapon Type Filter */}
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Тип оружия
          </label>
          <select
            value={selectedWeapon}
            onChange={(e) => onWeaponChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Все типы</option>
            {weaponTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Expand Button */}
        <div className="flex items-end">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-slate-600 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Диапазон цен
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Мин"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Макс"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <Button
                onClick={handlePriceRangeApply}
                size="sm"
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600"
              >
                Применить
              </Button>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Сортировка
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
              >
                <X className="w-4 h-4 mr-2" />
                Очистить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopFilters;
