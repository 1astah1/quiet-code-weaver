
import React from 'react';

export interface RarityInfo {
  name: string;
  color: string;
  bgGradient: string;
  textColor: string;
  description: string;
  probability: number;
}

export const CS2_RARITIES: Record<string, RarityInfo> = {
  'Consumer': {
    name: 'Consumer Grade',
    color: '#B0C3D9',
    bgGradient: 'from-gray-600 to-gray-700',
    textColor: 'text-gray-300',
    description: 'Самые обычные, часто выпадают',
    probability: 0.80
  },
  'Industrial': {
    name: 'Industrial Grade', 
    color: '#5E98D9',
    bgGradient: 'from-blue-600 to-blue-700',
    textColor: 'text-blue-300',
    description: 'Чуть лучше, но всё ещё распространены',
    probability: 0.16
  },
  'Mil-Spec': {
    name: 'Mil-Spec',
    color: '#4B69FF',
    bgGradient: 'from-purple-600 to-purple-700',
    textColor: 'text-purple-300',
    description: 'Средняя редкость, хорошие скины',
    probability: 0.032
  },
  'Restricted': {
    name: 'Restricted',
    color: '#8847FF',
    bgGradient: 'from-pink-600 to-pink-700',
    textColor: 'text-pink-300',
    description: 'Редкие, ценятся выше',
    probability: 0.0064
  },
  'Classified': {
    name: 'Classified',
    color: '#D32CE6',
    bgGradient: 'from-red-600 to-red-700',
    textColor: 'text-red-300',
    description: 'Очень редкие, дорогие',
    probability: 0.00128
  },
  'Covert': {
    name: 'Covert',
    color: '#EB4B4B',
    bgGradient: 'from-orange-600 to-orange-700',
    textColor: 'text-orange-300',
    description: 'Эксклюзивные, самые крутые скины',
    probability: 0.000256
  },
  'Contraband': {
    name: 'Contraband',
    color: '#E4AE39',
    bgGradient: 'from-yellow-600 to-yellow-700',
    textColor: 'text-yellow-300',
    description: 'Уникальные, больше не дропаются',
    probability: 0.0000001
  },
  'Special': {
    name: '★ Special Items',
    color: '#FFD700',
    bgGradient: 'from-yellow-500 to-orange-500',
    textColor: 'text-yellow-200',
    description: 'Ножи, перчатки, редкие агенты',
    probability: 0.0025
  }
};

interface SkinRaritySelectorProps {
  value: string;
  onChange: (rarity: string) => void;
  showProbability?: boolean;
}

const SkinRaritySelector: React.FC<SkinRaritySelectorProps> = ({ 
  value, 
  onChange, 
  showProbability = false 
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-gray-300 text-sm font-medium">
        Редкость скина (CS2 система):
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(CS2_RARITIES).map(([key, rarity]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`
              relative p-3 rounded-lg border-2 transition-all duration-200
              ${value === key 
                ? 'border-white shadow-lg transform scale-105' 
                : 'border-gray-600 hover:border-gray-400'
              }
              bg-gradient-to-br ${rarity.bgGradient}
            `}
          >
            <div className="text-center">
              <div className={`font-bold text-sm ${rarity.textColor} mb-1`}>
                {rarity.name}
              </div>
              
              <div className="text-xs text-gray-300 mb-2">
                {rarity.description}
              </div>
              
              {showProbability && (
                <div className="text-xs text-gray-400">
                  Шанс: {(rarity.probability * 100).toFixed(3)}%
                </div>
              )}
            </div>
            
            {/* Цветная полоска как в CS2 */}
            <div 
              className="absolute top-1 left-1 right-1 h-1 rounded"
              style={{ backgroundColor: rarity.color }}
            />
          </button>
        ))}
      </div>
      
      {value && (
        <div className="mt-3 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: CS2_RARITIES[value]?.color || '#666' }}
            />
            <div>
              <span className="text-white font-medium">
                {CS2_RARITIES[value]?.name}
              </span>
              <span className="text-gray-400 ml-2 text-sm">
                — {CS2_RARITIES[value]?.description}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinRaritySelector;
