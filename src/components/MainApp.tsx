
import { useState } from 'react';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import MainScreen from './screens/MainScreen';
import SkinsScreen from './screens/SkinsScreen';
import InventoryScreen from './inventory/InventoryScreen';
import QuizScreen from './screens/QuizScreen';
import SettingsScreen from './settings/SettingsScreen';
import TasksScreen from './screens/TasksScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';

export type Screen = 'main' | 'skins' | 'inventory' | 'quiz' | 'settings' | 'tasks' | 'leaderboard';

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [isCaseOpening, setIsCaseOpening] = useState(false);
  const [wonSkin, setWonSkin] = useState(null);

  // Моковые данные пользователя
  const currentUser = {
    id: 'test-user-1',
    username: 'TestUser',
    coins: 1000,
    isPremium: false,
    isAdmin: false,
    avatar_url: '',
    language_code: 'ru',
    quiz_lives: 3,
    quiz_streak: 0
  };

  const handleScreenChange = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleCoinsUpdate = (newCoins: number) => {
    console.log('Coins updated:', newCoins);
  };

  const handleOpenCase = () => {
    setIsCaseOpening(true);
  };

  const handleCaseOpeningComplete = () => {
    setIsCaseOpening(false);
    setWonSkin(null);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'main':
        return (
          <MainScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
            onScreenChange={handleScreenChange}
          />
        );
      case 'skins':
        return (
          <SkinsScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'quiz':
        return (
          <QuizScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
            onBack={() => setCurrentScreen('main')}
            onLivesUpdate={() => {}}
            onStreakUpdate={() => {}}
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'tasks':
        return (
          <TasksScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'leaderboard':
        return <LeaderboardScreen />;
      default:
        return (
          <MainScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
            onScreenChange={handleScreenChange}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header 
        currentUser={currentUser}
        onMenuClick={() => {}}
      />
      
      <main className="flex-1 overflow-auto">
        {renderCurrentScreen()}
      </main>
      
      <BottomNavigation 
        currentScreen={currentScreen} 
        onScreenChange={setCurrentScreen} 
      />
    </div>
  );
};

export default MainApp;
