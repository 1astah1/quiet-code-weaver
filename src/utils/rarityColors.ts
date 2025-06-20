
export const getRarityColor = (rarity: string) => {
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
