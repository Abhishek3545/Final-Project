import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import BackButton from "@/components/BackButton";

type TravelPackage = Tables<"travel_packages">;
type DestinationPlan = {
  id: string;
  title: string;
  region: string;
  duration: string;
  budgetLabel: string;
  image: string;
};

const nowIso = new Date().toISOString();

const TRAVEL_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900",
  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=900",
  "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=900",
  "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=900",
  "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=900",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",
  "https://images.unsplash.com/photo-1521292270410-a8c4d716d518?w=900",
];

const DUMMY_TRAVEL_PACKAGES: TravelPackage[] = Array.from({ length: 15 }).map((_, idx) => {
  const i = idx + 1;
  return {
    id: `00000000-0000-4000-8000-${String(200000000000 + i)}`,
    title: `Travel Escape ${i}`,
    location: ["Goa", "Manali", "Kerala", "Dubai"][i % 4],
    duration_days: 2 + (i % 6),
    price: 11999 + i * 999,
    image_url: TRAVEL_IMAGE_POOL[idx % TRAVEL_IMAGE_POOL.length],
    description: `Complete holiday package #${i} with stay, transit and local experiences.`,
    is_active: true,
    created_at: nowIso,
  };
});

const DESTINATION_PLANS: DestinationPlan[] = [
  {
    id: "dest-goa-4n",
    title: "Goa Beach Loop",
    region: "India",
    duration: "4 Nights / 5 Days",
    budgetLabel: "$399 onwards",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900",
  },
  {
    id: "dest-manali-5n",
    title: "Manali Snow Trail",
    region: "Himachal",
    duration: "5 Nights / 6 Days",
    budgetLabel: "$449 onwards",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=900",
  },
  {
    id: "dest-kerala-6n",
    title: "Kerala Backwater Plan",
    region: "South India",
    duration: "6 Nights / 7 Days",
    budgetLabel: "$499 onwards",
    image: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=900",
  },
  {
    id: "dest-dubai-4n",
    title: "Dubai Explorer",
    region: "UAE",
    duration: "4 Nights / 5 Days",
    budgetLabel: "$699 onwards",
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900",
  },
  {
    id: "dest-bali-5n",
    title: "Bali Island Escape",
    region: "Indonesia",
    duration: "5 Nights / 6 Days",
    budgetLabel: "$649 onwards",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900",
  },
  {
    id: "dest-thailand-5n",
    title: "Thailand City + Beach",
    region: "Thailand",
    duration: "5 Nights / 6 Days",
    budgetLabel: "$579 onwards",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=900",
  },
];

const Travel = () => {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("travel_packages")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPackages(data && data.length > 0 ? data : DUMMY_TRAVEL_PACKAGES);
    } catch (error: any) {
      setPackages(DUMMY_TRAVEL_PACKAGES);
      toast({
        title: "Using demo travel data",
        description: "Showing fallback travel packages.",
      });
    } finally {
      setLoading(false);
    }
  };

  const bookTravel = async (pkg: TravelPackage) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("service_bookings").insert({
        user_id: user.id,
        booking_type: "travel",
        item_id: pkg.id,
        quantity: 1,
        total_amount: pkg.price,
        status: "confirmed",
      });

      if (error) throw error;

      toast({
        title: "Travel booked",
        description: "Your travel package was booked successfully.",
      });
      navigate("/orders");
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <BackButton fallbackPath="/" />
        <div className="flex items-center gap-3">
          <Plane className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Travel Marketplace</h1>
        </div>
        <p className="text-muted-foreground">Book holiday packages directly from your shopping account.</p>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Explore Destination Plans</h2>
            <Badge variant="secondary">Popular Picks</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DESTINATION_PLANS.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <img src={plan.image} alt={plan.title} className="w-full h-40 object-cover" />
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground">{plan.region}</p>
                  <p className="text-sm">{plan.duration}</p>
                  <p className="font-semibold">{plan.budgetLabel}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <h2 className="text-2xl font-semibold">Travel Packages</h2>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden">
                <img
                  src={pkg.image_url || TRAVEL_IMAGE_POOL[Math.abs(pkg.id.length) % TRAVEL_IMAGE_POOL.length]}
                  alt={pkg.title}
                  className="w-full h-44 object-cover"
                />
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{pkg.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {pkg.location}
                  </p>
                  <p className="text-sm text-muted-foreground">{pkg.duration_days} days</p>
                  {pkg.description && <p className="text-sm line-clamp-2">{pkg.description}</p>}
                  <p className="text-2xl font-bold">${Number(pkg.price).toFixed(2)}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full" onClick={() => bookTravel(pkg)}>
                    Book Package
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Travel;
