import { useState } from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import MainScreen from './screens/MainScreen';
import SkinsScreen from './screens/SkinsScreen';
import InventoryScreen from './inventory/InventoryScreen';
import QuizScreen from './screens/QuizScreen';
import SettingsScreen from './settings/SettingsScreen';
import TasksScreen from './screens/TasksScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'skins' | 'inventory' | 'quiz' | 'settings' | 'tasks' | 'leaderboard'>('main');
  const [isCaseOpening, setIsCaseOpening] = useState(false);
  const [wonSkin, setWonSkin] = useState(null);

  const handleScreenChange = (screen: 'main' | 'skins' | 'inventory' | 'quiz' | 'settings' | 'tasks' | 'leaderboard') => {
    setCurrentScreen(screen);
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
        return <MainScreen />;
      case 'skins':
        return <SkinsScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'quiz':
        return <QuizScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      default:
        return <MainScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
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
