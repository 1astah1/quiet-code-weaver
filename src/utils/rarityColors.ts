const rarityColorMap: Record<string, string> = {
  'consumer grade': '#b0c3d9',
  'industrial grade': '#5e98d9',
  'mil-spec': '#4b69ff',
  'restricted': '#8847ff',
  'classified': '#d32ce6',
  'covert': '#eb4b4b',
  'contraband': '#e4ae39',
};

const shortRarityMap: Record<string, string> = {
  'consumer': 'consumer grade',
  'industrial': 'industrial grade',
};

export const getRarityColor = (rarity: string): string => {
  const lowerRarity = rarity.toLowerCase();
  const fullRarity = shortRarityMap[lowerRarity] || lowerRarity;
  return rarityColorMap[fullRarity] || '#b0c3d9';
};

export const getRarityShade = (rarity: string): string => {
  const color = getRarityColor(rarity);
  // Возвращаем цвет с низкой прозрачностью для фона
  return `${color}33`; // 33 в hex это 20% прозрачности
};
