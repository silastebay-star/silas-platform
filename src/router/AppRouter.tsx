import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/core/context/AuthContext';
import { ThemeProvider } from '@/core/context/ThemeContext';

// Layout components
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Page components
import HomePage from '@/pages/HomePage';
import MapPage from '@/pages/MapPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Module routes (lazy loaded)
import { PinsRoutes } from '@/modules/pins';
import { SocialRoutes } from '@/modules/social';
import { FundRoutes } from '@/modules/fund';
import { EconomyRoutes } from '@/modules/economy';
import { EnvironmentRoutes } from '@/modules/environment';
import { EventsRoutes } from '@/modules/events';
import { AuthRoutes } from '@/modules/auth';
import { AIRoutes } from '@/modules/ai';

// Protected route wrapper
import ProtectedRoute from './ProtectedRoute';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="map" element={<MapPage />} />
              
              {/* Module routes */}
              <Route path="pins/*" element={<PinsRoutes />} />
              <Route path="social/*" element={<SocialRoutes />} />
              
              {/* Protected module routes */}
              <Route path="fund/*" element={
                <ProtectedRoute>
                  <FundRoutes />
                </ProtectedRoute>
              } />
              
              <Route path="economy/*" element={<EconomyRoutes />} />
              <Route path="environment/*" element={<EnvironmentRoutes />} />
              <Route path="events/*" element={<EventsRoutes />} />
              <Route path="ai/*" element={<AIRoutes />} />
            </Route>

            {/* Auth routes with different layout */}
            <Route path="/auth/*" element={<AuthLayout />}>
              <Route path="*" element={<AuthRoutes />} />
            </Route>

            {/* Redirects and 404 */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
