
import React from 'react';
import { Gamepad, ArrowLeft, Wrench, Sparkles, Clock } from 'lucide-react';

interface User {
  id: string;
  username: string;
  coins: number;
}

interface WatermelonGameScreenProps {
  currentUser: User;
  onCoinsUpdate: (newCoins: number) => void;
  onBack: () => void;
}

const WatermelonGameScreen: React.FC<WatermelonGameScreenProps> = ({ 
  currentUser, 
  onCoinsUpdate,
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </button>
        
        <div className="flex items-center space-x-2 bg-black/20 rounded-full px-4 py-2">
          <span className="text-yellow-400 font-bold">{currentUser.coins}</span>
          <span className="text-white/80">монет</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto text-center">
        {/* Game Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-2xl">
            <Gamepad className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Арбуз Игра
        </h1>
        
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Wrench className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-semibold text-orange-400">
            В разработке
          </h2>
          <Wrench className="w-6 h-6 text-orange-400" />
        </div>

        {/* Description */}
        <div className="max-w-2xl mx-auto mb-12">
          <p className="text-xl text-white/90 mb-6 leading-relaxed">
            Мы работаем над захватывающей игрой, которая позволит вам зарабатывать монеты, 
            соединяя арбузы и создавая невероятные комбинации!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍉</span>
              </div>
              <h3 className="font-bold text-white mb-2">Соединяй арбузы</h3>
              <p className="text-white/70 text-sm">
                Бросай фрукты и создавай большие арбузы
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-bold text-white mb-2">Зарабатывай монеты</h3>
              <p className="text-white/70 text-sm">
                Получай награды за каждое соединение
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-bold text-white mb-2">Достигай рекордов</h3>
              <p className="text-white/70 text-sm">
                Соревнуйся с другими игроками
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-3xl p-8 border border-orange-500/30 mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Clock className="w-8 h-8 text-orange-400" />
            <h3 className="text-2xl font-bold text-white">Скоро будет готово!</h3>
          </div>
          
          <p className="text-white/80 text-lg mb-6">
            Наша команда разработчиков усердно работает над созданием самой увлекательной 
            арбузной игры. Следите за обновлениями!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/10 rounded-full px-4 py-2 border border-white/20">
              <span className="text-white/90 text-sm">🎮 Игровая механика</span>
            </div>
            <div className="bg-white/10 rounded-full px-4 py-2 border border-white/20">
              <span className="text-white/90 text-sm">🎨 Красивая графика</span>
            </div>
            <div className="bg-white/10 rounded-full px-4 py-2 border border-white/20">
              <span className="text-white/90 text-sm">🏅 Система достижений</span>
            </div>
            <div className="bg-white/10 rounded-full px-4 py-2 border border-white/20">
              <span className="text-white/90 text-sm">💎 Редкие награды</span>
            </div>
          </div>
        </div>

        {/* Progress Animation */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-white/60 text-sm mb-2">
            <span>Прогресс разработки</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 h-full rounded-full transition-all duration-1000 ease-out" 
                 style={{ width: '75%' }}>
              <div className="w-full h-full bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-10 left-10 opacity-20 animate-bounce">
        <span className="text-6xl">🍉</span>
      </div>
      <div className="fixed top-20 right-20 opacity-20 animate-bounce delay-300">
        <span className="text-4xl">🍊</span>
      </div>
      <div className="fixed bottom-20 left-20 opacity-20 animate-bounce delay-700">
        <span className="text-5xl">🥝</span>
      </div>
      <div className="fixed bottom-10 right-10 opacity-20 animate-bounce delay-1000">
        <span className="text-3xl">🍓</span>
      </div>
    </div>
  );
};

export default WatermelonGameScreen;
