import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShoppingBag, Utensils, TrendingUp, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";

const Home = () => {
  const categories = [
    { name: "Grocery", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400", path: "/products?search=grocery" },
    { name: "Clothing", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400", path: "/clothes" },
    { name: "Travel Packages", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400", path: "/travel" },
    { name: "Event Tickets", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400", path: "/tickets" },
    { name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400", path: "/products?search=electronics" },
    { name: "Home & Garden", image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400", path: "/products?search=home" },
    { name: "Food & Recipes", image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400", path: "/food" },
    { name: "Daily Deals", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400", path: "/products" },
  ];

  const features = [
    { icon: ShoppingBag, title: "Wide Selection", description: "Millions of products across categories" },
    { icon: TrendingUp, title: "Best Deals", description: "Daily deals and exclusive offers" },
    { icon: Utensils, title: "Food & Recipes", description: "Discover delicious recipes and food news" },
    { icon: Shield, title: "Secure Shopping", description: "100% secure payment and data protection" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[640px] overflow-hidden bg-[#0B132B]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.35),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.28),transparent_40%),radial-gradient(circle_at_60%_75%,rgba(56,189,248,0.32),transparent_45%)]" />
        <img 
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
        />
        <div className="relative container h-full flex flex-col justify-center items-start text-white">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm mb-6 backdrop-blur">
            Full-Stack Marketplace Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Buy Groceries, Clothes,<br />Travel, Tickets and More
          </h1>
          <p className="text-lg md:text-2xl mb-10 max-w-3xl text-white/90">
            One destination for daily shopping and lifestyle bookings. Discover category-first shopping with secure checkout, live order tracking, and service bookings in one account.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/products">
              <Button size="lg" variant="secondary" className="gap-2 bg-amber-300 text-slate-900 hover:bg-amber-200">
                Start Shopping <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/travel">
              <Button size="lg" variant="outline" className="gap-2 bg-white/10 border-white/30 hover:bg-white/20">
                Explore Travel
              </Button>
            </Link>
            <Link to="/tickets">
              <Button size="lg" variant="outline" className="gap-2 bg-white/10 border-white/30 hover:bg-white/20">
                Book Tickets
              </Button>
            </Link>
            <Link to="/food">
              <Button size="lg" variant="outline" className="gap-2 bg-white/10 border-white/30 hover:bg-white/20">
                Recipes <Utensils className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.name} to={category.path}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <img 
                  src={category.image}
                  alt={category.name}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <h2 className="text-3xl font-bold mb-8">Marketplace Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-2xl font-semibold">Travel Booking</h3>
              <p className="text-muted-foreground">Book holiday packages with secure checkout and track all bookings in your account.</p>
              <Link to="/travel">
                <Button>Explore Travel</Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-2xl font-semibold">Tickets & Events</h3>
              <p className="text-muted-foreground">Purchase event, sports, and concert tickets with instant booking confirmations.</p>
              <Link to="/tickets">
                <Button>Explore Tickets</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Shop With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Shopping?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Join millions of satisfied customers and discover amazing deals today
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary">
                Browse All Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
