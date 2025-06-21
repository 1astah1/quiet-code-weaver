
import { lazy } from 'react';

// Убираем ленивую загрузку для основных экранов для быстрой работы
// Оставляем только для редко используемых компонентов
export const LazyAdminPanel = lazy(() => import('@/components/AdminPanel'));
export const LazyCaseOpeningAnimation = lazy(() => import('@/components/CaseOpeningAnimation'));
export const LazyReferralModal = lazy(() => import('@/components/ReferralModal'));
export const LazySecurityDashboard = lazy(() => import('@/components/security/SecurityDashboard'));
