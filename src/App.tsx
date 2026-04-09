import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Clothes = lazy(() => import("./pages/Clothes"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Food = lazy(() => import("./pages/Food"));
const News = lazy(() => import("./pages/News"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Travel = lazy(() => import("./pages/Travel"));
const Tickets = lazy(() => import("./pages/Tickets"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background">
    <div className="container py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/clothes" element={<Clothes />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/food" element={<Food />} />
            <Route path="/news" element={<News />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/travel" element={<Travel />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
