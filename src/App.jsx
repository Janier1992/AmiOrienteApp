
import React, { Suspense, useEffect, useMemo, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import BottomNavBar from '@/components/BottomNavBar';
import SiteHeader from '@/components/SiteHeader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { lazyWithPrefetch, prefetchRoutes } from '@/lib/route-utils';
import { useRouteTransitionTimer } from '@/lib/performance-monitoring';
import PageSkeleton from '@/components/shared/PageSkeleton';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

// Optimized Lazy Loading with Prefetch Capabilities
const HomePage = lazyWithPrefetch('home', () => import('@/pages/HomePage'));
const ProductsPage = lazyWithPrefetch('products', () => import('@/pages/ProductsPage'));
const StoresPage = lazyWithPrefetch('stores', () => import('@/pages/StoresPage'));
const TourismPage = lazyWithPrefetch('tourism', () => import('@/pages/TourismPage'));

// Auth Pages
const StoreLogin = lazyWithPrefetch('auth-store', () => import('@/pages/StoreLogin'));
const StoreRegister = lazyWithPrefetch('auth-store-reg', () => import('@/pages/StoreRegister'));
const CustomerLogin = lazyWithPrefetch('auth-customer', () => import('@/pages/CustomerLogin'));
const CustomerRegister = lazyWithPrefetch('auth-customer-reg', () => import('@/pages/CustomerRegister'));
const DeliveryLogin = lazyWithPrefetch('auth-delivery', () => import('@/pages/DeliveryLogin'));
const DeliveryRegister = lazyWithPrefetch('auth-delivery-reg', () => import('@/pages/DeliveryRegister'));

// Dashboards (Heavy modules)
const StoreDashboard = lazyWithPrefetch('dash-store', () => import('@/pages/StoreDashboard/index.jsx'));
const FarmerDashboard = lazyWithPrefetch('dash-farmer', () => import('@/pages/StoreDashboard/FarmerDashboard.jsx'));
const CustomerDashboard = lazyWithPrefetch('dash-customer', () => import('@/pages/CustomerDashboard'));
const DeliveryDashboard = lazyWithPrefetch('dash-delivery', () => import('@/pages/DeliveryDashboard'));

// Secondary Pages
const HelpCenter = lazyWithPrefetch('help', () => import('@/pages/HelpCenter'));
const ContactPage = lazyWithPrefetch('contact', () => import('@/pages/ContactPage'));
const AuthConfirmation = lazyWithPrefetch('auth-confirm', () => import('@/pages/AuthConfirmation'));
const CheckoutPage = lazyWithPrefetch('checkout', () => import('@/pages/CheckoutPage'));
const OrderConfirmationPage = lazyWithPrefetch('order-confirm', () => import('@/pages/OrderConfirmationPage'));
const TermsPage = lazyWithPrefetch('terms', () => import('@/pages/TermsPage'));
const PrivacyPolicyPage = lazyWithPrefetch('privacy', () => import('@/pages/PrivacyPolicyPage'));
const MoreServicesPage = lazyWithPrefetch('more', () => import('@/pages/MoreServicesPage'));
const PricingPage = lazyWithPrefetch('pricing', () => import('@/pages/PricingPage'));
const ServiceSelectionPage = lazyWithPrefetch('service-select', () => import('@/pages/ServiceSelectionPage'));
const ForgotPasswordPage = lazyWithPrefetch('forgot-pass', () => import('@/pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazyWithPrefetch('update-pass', () => import('@/pages/UpdatePasswordPage'));

// Scroll Handling Component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Performance monitoring hook
  useRouteTransitionTimer();

  // Intelligent Prefetching Logic - Memoized to prevent re-creation
  useEffect(() => {
    // Critical routes: Preload immediately on mount for instant access
    const mainNavRoutes = ['home', 'products', 'stores', 'tourism'];
    prefetchRoutes(mainNavRoutes, 'high');

    // Role-based prefetching
    if (user) {
      const role = user.user_metadata?.role;
      if (role === 'tienda') prefetchRoutes(['dash-store'], 'low');
      if (role === 'cliente') prefetchRoutes(['dash-customer'], 'low');
      if (role === 'domiciliario') prefetchRoutes(['dash-delivery'], 'low');
    } else {
      // Guest prefetching
      prefetchRoutes(['auth-customer', 'auth-store'], 'low');
    }
  }, [user]);

  // Memoize path checking arrays
  const authRoutes = useMemo(() => [
    '/tienda/login', '/tienda/registro',
    '/cliente/login', '/cliente/registro',
    '/domiciliario/login', '/domiciliario/registro',
    '/servicios/registro',
    '/recuperar-contrasena', '/actualizar-contrasena'
  ], []);

  const dashboardRoutes = useMemo(() => [
    '/tienda/dashboard',
    '/cliente/dashboard',
    '/domiciliario/dashboard'
  ], []);

  // Efficient conditional rendering checks
  const hideHeader = useMemo(() =>
    dashboardRoutes.some(path => location.pathname.startsWith(path)) ||
    authRoutes.some(path => location.pathname.startsWith(path)) ||
    location.pathname === '/checkout',
    [location.pathname, dashboardRoutes, authRoutes]);

  const isStoreUser = user?.user_metadata?.role === 'tienda';

  const showBottomNav = useMemo(() => {
    const navPaths = ['/', '/productos', '/servicios', '/turismo'];
    if (isStoreUser) navPaths.push('/mas');
    return navPaths.includes(location.pathname);
  }, [location.pathname, isStoreUser]);

  // Dynamic Background Logic
  const bgClass = useMemo(() => {
    const isHomePage = location.pathname === '/';
    const isAuthPage = authRoutes.some(path => location.pathname.startsWith(path));
    return (isHomePage || isAuthPage)
      ? 'bg-black/30'
      : 'bg-white/90 dark:bg-slate-950/90';
  }, [location.pathname, authRoutes]);

  if (authLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-300 ease-in-out", bgClass)}>
      {!hideHeader && <SiteHeader />}

      <main className={`flex-grow ${showBottomNav ? 'pb-20 md:pb-0' : ''}`}>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/servicios" element={<StoresPage />} />
            <Route path="/turismo" element={<TourismPage />} />

            {/* Protected / Conditional Routes */}
            {isStoreUser && <Route path="/mas" element={<MoreServicesPage />} />}
            {isStoreUser && <Route path="/precios" element={<PricingPage />} />}

            {/* Auth Routes */}
            <Route path="/tienda/login" element={<StoreLogin />} />
            <Route path="/tienda/registro" element={<StoreRegister />} />
            <Route path="/cliente/login" element={<CustomerLogin />} />
            <Route path="/cliente/registro" element={<CustomerRegister />} />
            <Route path="/domiciliario/login" element={<DeliveryLogin />} />
            <Route path="/domiciliario/registro" element={<DeliveryRegister />} />
            <Route path="/servicios/registro" element={<ServiceSelectionPage />} />
            <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
            <Route path="/actualizar-contrasena" element={<UpdatePasswordPage />} />
            <Route path="/auth/confirm" element={<AuthConfirmation />} />

            {/* Dashboards */}
            <Route path="/tienda/dashboard/*" element={<StoreDashboard />} />
            <Route path="/tienda/modo-campesino" element={<FarmerDashboard />} />
            <Route path="/cliente/dashboard/*" element={<CustomerDashboard />} />
            <Route path="/domiciliario/dashboard/*" element={<DeliveryDashboard />} />

            {/* Utility Pages */}
            <Route path="/centro-de-ayuda" element={<HelpCenter />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmacion-pedido" element={<OrderConfirmationPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/privacidad" element={<PrivacyPolicyPage />} />
          </Routes>
        </Suspense>
      </main>

      {showBottomNav && <BottomNavBar />}
      <PWAInstallPrompt />
      <Toaster />
    </div>
  );
};

const App = () => (
  <Router>
    <ScrollToTop />
    <AppContent />
  </Router>
);

export default App;
