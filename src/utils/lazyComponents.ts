
import { lazy } from 'react';

// Ленивая загрузка основных экранов
export const LazyMainScreen = lazy(() => import('@/components/screens/MainScreen'));
export const LazySkinsScreen = lazy(() => import('@/components/screens/SkinsScreen'));
export const LazyQuizScreen = lazy(() => import('@/components/screens/QuizScreen'));
export const LazyTasksScreen = lazy(() => import('@/components/screens/TasksScreen'));
export const LazyInventoryScreen = lazy(() => import('@/components/inventory/InventoryScreen'));
export const LazySettingsScreen = lazy(() => import('@/components/settings/SettingsScreen'));
export const LazyAdminPanel = lazy(() => import('@/components/AdminPanel'));

// Ленивая загрузка модальных окон
export const LazyCaseOpeningAnimation = lazy(() => import('@/components/CaseOpeningAnimation'));
export const LazyReferralModal = lazy(() => import('@/components/ReferralModal'));

// Ленивая загрузка панели безопасности
export const LazySecurityDashboard = lazy(() => import('@/components/security/SecurityDashboard'));
