import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, User, Menu, Home, Utensils, Newspaper, Package, MapPinned, Plane, Ticket, Heart, Activity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import BudgetCalculatorDialog from "@/components/BudgetCalculatorDialog";
import ThemeToggle from "@/components/ThemeToggle";
import { clearStoredDummyUser, getStoredDummyUser, isDummyAuthMode } from "@/lib/dummyAuth";

const Navbar = () => {
  const [user, setUser] = useState<SupabaseUser | { email: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const navItems = [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/products", label: "Products", icon: Package },
    { to: "/products?search=grocery", label: "Grocery", icon: Package },
    { to: "/clothes", label: "Clothes", icon: Package },
    { to: "/travel", label: "Travel", icon: Plane },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/food", label: "Food", icon: Utensils },
    { to: "/news", label: "News", icon: Newspaper },
    { to: "/track-order", label: "Track", icon: MapPinned },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/system-health", label: "Health", icon: Activity },
  ];

  useEffect(() => {
    const resolveUser = (sessionUser: SupabaseUser | null) => {
      if (sessionUser) {
        setUser(sessionUser);
        return;
      }

      if (isDummyAuthMode()) {
        const dummyUser = getStoredDummyUser();
        setUser(dummyUser ? { email: dummyUser.email } : null);
        return;
      }

      setUser(null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    clearStoredDummyUser();
    await supabase.auth.signOut();
    setUser(null);
    setMobileMenuOpen(false);
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileMenuOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleProtectedNavigate = (path: "/wishlist" | "/cart") => {
    if (!user) {
      setMobileMenuOpen(false);
      toast({
        title: "Sign in required",
        description: "Please sign in to access this section.",
      });
      navigate("/auth");
      return;
    }

    setMobileMenuOpen(false);
    navigate(path);
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => mobile && setMobileMenuOpen(false)}
          >
            {({ isActive }) => (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size={mobile ? "default" : "sm"}
                className={mobile ? "w-full justify-start gap-2" : "h-8 px-2.5 gap-1.5 text-xs lg:text-sm"}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            )}
          </NavLink>
        );
      })}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        <div className="flex items-center gap-2 lg:gap-4 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base sm:text-lg xl:text-xl">ShopHub</span>
          </Link>
          
          <div className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar">
            <NavLinks />
          </div>
        </div>

        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-sm xl:max-w-md mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeToggle />
          <BudgetCalculatorDialog />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Wishlist"
            className="h-9 w-9"
            onClick={() => handleProtectedNavigate("/wishlist")}
          >
            <Heart className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="h-9 w-9"
            onClick={() => handleProtectedNavigate("/cart")}
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Profile">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden lg:flex">
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden h-9 w-9" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm">
              <div className="flex flex-col gap-4 mt-8">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="sm">Go</Button>
                </form>
                <div className="flex flex-col gap-2">
                  <NavLinks mobile />
                </div>
                {user ? (
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}

                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm text-muted-foreground">Quick Access</p>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleProtectedNavigate("/wishlist")}
                  >
                    <Heart className="w-4 h-4" />
                    Wishlist
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleProtectedNavigate("/cart")}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Cart
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
