
import React from 'react';
import { Brain, Heart, Star } from 'lucide-react';

interface QuizScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const QuizScreen = ({ currentUser, onCoinsUpdate }: QuizScreenProps) => {
  return (
    <div className="min-h-screen pb-16 px-4 pt-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Викторина</h1>
          <p className="text-gray-400">Отвечайте на вопросы и зарабатывайте монеты!</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-white font-medium">Жизни: 2/2</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-white font-medium">Стрик: 0</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-300 mb-4">Викторина скоро будет доступна!</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-0"></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">0 / 10 вопросов</p>
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 text-center">
          <h3 className="text-white font-semibold mb-2">Как играть?</h3>
          <ul className="text-gray-300 text-sm space-y-2 text-left">
            <li>• Отвечайте на вопросы правильно</li>
            <li>• За каждый правильный ответ получайте монеты</li>
            <li>• Неправильный ответ отнимает жизнь</li>
            <li>• Жизни восстанавливаются со временем</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;
