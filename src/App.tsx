import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AmbientBackground } from './components/common/AmbientBackground';
import { ConfigErrorModal } from './components/common/ConfigErrorModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { EventDiscovery } from './pages/EventDiscovery';
import { EventDetail } from './pages/EventDetail';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BookingPage } from './pages/BookingPage';
import { BookingSuccess } from './pages/BookingSuccess';
import { UserDashboard } from './pages/UserDashboard';
import { MyBookings } from './pages/MyBookings';
import { ProfilePage } from './pages/ProfilePage';

import { AdminDashboard } from './pages/AdminDashboard';
import { AdminEvents } from './pages/AdminEvents';
import { AdminCreateEditEvent } from './pages/AdminCreateEditEvent';
import { AdminBookings } from './pages/AdminBookings';
import { AdminUsers } from './pages/AdminUsers';
import { AdminNotifications } from './pages/AdminNotifications';
import { AdminAnalyticsReports } from './pages/AdminAnalyticsReports';
import { AdminSystem } from './pages/AdminSystem';
import { AdminManagement } from './pages/AdminManagement';

import { IntroProvider, useIntro } from './context/IntroContext';
import { CinematicIntro } from './components/intro/CinematicIntro';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isIntroActive, closeIntro } = useIntro();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/login/admin';

  // Dynamic document title manager
  React.useEffect(() => {
    const path = location.pathname;
    let title = 'NEXORA — Next-Generation Live Event Experiences';
    if (path === '/') title = 'NEXORA — Next-Generation Live Event Experiences';
    else if (path === '/login') title = 'Sign In | NEXORA';
    else if (path === '/register') title = 'Create Account | NEXORA';
    else if (path === '/login/admin') title = 'Admin Gateway | NEXORA Command Center';
    else if (path === '/events' || path === '/app') title = 'Explore Events | NEXORA';
    else if (path.startsWith('/events/') || path.startsWith('/event/')) title = 'Event Experience | NEXORA';
    else if (path.startsWith('/booking/')) title = 'Reserve Passes | NEXORA';
    else if (path.startsWith('/booking-success/')) title = 'Reservation Confirmed | NEXORA';
    else if (path === '/dashboard') title = 'My Dashboard | NEXORA';
    else if (path === '/my-bookings') title = 'My Passes & Bookings | NEXORA';
    else if (path === '/profile') title = 'Profile Settings | NEXORA';
    else if (path.startsWith('/admin')) title = 'Mission Control | NEXORA Admin';

    document.title = title;
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 selection:bg-brand-purple selection:text-white transition-colors duration-300 relative">
      {/* 1. Global Cinematic Intro Overlay (Hides header/footer while active) */}
      {isIntroActive && <CinematicIntro onComplete={closeIntro} />}

      {/* 2. Reusable Subtle Multi-Layer Atmospheric Depth */}
      <AmbientBackground variant={isAdminRoute ? 'admin' : location.pathname === '/' ? 'showcase' : 'platform'} />

      <ConfigErrorModal />

      {/* 3. Conditionally render Consumer Navbar outside Admin Command Center & Intro */}
      {!isAdminRoute && !isIntroActive && <Navbar />}

      <main className="flex-1 relative z-10">
        <Routes>
          {/* Public Experience Routes (No Authentication Required) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<EventDiscovery />} />
          <Route path="/events" element={<EventDiscovery />} />
          <Route path="/app" element={<EventDiscovery />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login/admin" element={<AdminLoginPage />} />

          {/* Protected Application Routes (Authentication Gate) */}
          <Route
            path="/booking/:eventId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-success/:bookingId"
            element={
              <ProtectedRoute>
                <BookingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passes"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Hidden Admin Command Center Routes (Protected by requireAdmin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Navigate to="/admin/overview" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/overview"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute requireAdmin>
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCreateEditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCreateEditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requireAdmin>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/management"
            element={
              <ProtectedRoute requireAdmin>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute requireAdmin>
                <Navigate to="/admin/management" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute requireAdmin>
                <AdminNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAnalyticsReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system"
            element={
              <ProtectedRoute requireAdmin>
                <AdminSystem />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminRoute && !isIntroActive && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <IntroProvider>
                <AppContent />
              </IntroProvider>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
