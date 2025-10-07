// SILAS Core Library - Main Exports
// Central barrel export for all shared components, hooks, and utilities

// Components
export { Button } from './components/Button';
export { Modal } from './components/Modal';
export { Card } from './components/Card';
export { Input } from './components/Input';
export { Sidebar } from './components/Sidebar';
export { TopNav } from './components/TopNav';
export { LoadingSpinner } from './components/LoadingSpinner';
export { ErrorBoundary } from './components/ErrorBoundary';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useSupabase } from './hooks/useSupabase';
export { useTheme } from './hooks/useTheme';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useDebounce } from './hooks/useDebounce';

// Context
export { ThemeProvider, useThemeContext } from './context/ThemeContext';
export { AuthProvider, useAuthContext } from './context/AuthContext';

// Services
export { supabase } from './lib/supabase';
export { api } from './lib/api';

// Types
export type * from './types/common';
export type * from './types/auth';
export type * from './types/database';

// Utils
export { cn } from './utils/cn';
export { formatDate } from './utils/date';
export { formatCurrency } from './utils/currency';
export { validateEmail } from './utils/validation';

// Constants
export { SILAS_BRANDING } from './constants/branding';
export { API_ENDPOINTS } from './constants/api';
