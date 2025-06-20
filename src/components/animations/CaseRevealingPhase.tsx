
const CaseRevealingPhase = () => {
  return (
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
  );
};

export default CaseRevealingPhase;
