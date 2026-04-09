import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import BackButton from "@/components/BackButton";

type TicketOffer = Tables<"ticket_offers">;
type QuickTicketDeal = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  price: number;
  image: string;
};

const nowIso = new Date().toISOString();

const TICKET_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900",
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900",
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=900",
  "https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=900",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900",
  "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=900",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&sat=-20",
];

const DUMMY_TICKET_OFFERS: TicketOffer[] = Array.from({ length: 15 }).map((_, idx) => {
  const i = idx + 1;
  return {
    id: `00000000-0000-4000-8000-${String(300000000000 + i)}`,
    title: ["Live Event", "Bus Special", "Movie Premiere", "Sports Night"][i % 4] + ` ${i}`,
    category: ["Concert", "Bus", "Movie", "Sports"][i % 4],
    venue: ["Mumbai Arena", "Delhi Stadium", "Bengaluru Hall", "Pune Center"][i % 4],
    event_date: new Date(Date.now() + i * 86400000 * 2).toISOString(),
    price: 499 + i * 125,
    image_url: TICKET_IMAGE_POOL[idx % TICKET_IMAGE_POOL.length],
    description: `Premium ticket offer #${i} with quick digital check-in.`,
    is_active: true,
    created_at: nowIso,
  };
});

const BUS_TICKET_DEALS: QuickTicketDeal[] = [
  {
    id: "00000000-0000-4000-8000-400000000001",
    title: "Delhi to Jaipur",
    subtitle: "AC Sleeper | Express Lane",
    time: "Today, 8:30 PM",
    price: 18,
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900",
  },
  {
    id: "00000000-0000-4000-8000-400000000002",
    title: "Bangalore to Mysore",
    subtitle: "Volvo Multi-Axle",
    time: "Tomorrow, 6:45 AM",
    price: 14,
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=900",
  },
  {
    id: "00000000-0000-4000-8000-400000000003",
    title: "Mumbai to Pune",
    subtitle: "Premium Seater",
    time: "Today, 7:10 PM",
    price: 12,
    image: "https://images.unsplash.com/photo-1556122071-e404eaedb77f?w=900",
  },
  {
    id: "00000000-0000-4000-8000-400000000004",
    title: "Chennai to Coimbatore",
    subtitle: "Night Coach",
    time: "Tonight, 10:15 PM",
    price: 20,
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900",
  },
];

const MOVIE_TICKET_DEALS: QuickTicketDeal[] = [
  {
    id: "00000000-0000-4000-8000-500000000001",
    title: "Galaxy Wars: Dawn",
    subtitle: "IMAX 3D | PVR Phoenix",
    time: "7:40 PM",
    price: 9,
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900",
  },
  {
    id: "00000000-0000-4000-8000-500000000002",
    title: "City of Shadows",
    subtitle: "Dolby Atmos | INOX Central",
    time: "9:20 PM",
    price: 8,
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=900",
  },
  {
    id: "00000000-0000-4000-8000-500000000003",
    title: "Laugh Factory 2",
    subtitle: "Recliner Seats | Cinepolis",
    time: "5:10 PM",
    price: 7,
    image: "https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=900",
  },
  {
    id: "00000000-0000-4000-8000-500000000004",
    title: "Retro Nights Special",
    subtitle: "Classic Marathon | PVR",
    time: "11:45 PM",
    price: 6,
    image: "https://images.unsplash.com/photo-1604975701397-6365ccbd028a?w=900",
  },
];

const Tickets = () => {
  const [offers, setOffers] = useState<TicketOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ticket_offers")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setOffers(data && data.length > 0 ? data : DUMMY_TICKET_OFFERS);
    } catch (error: any) {
      setOffers(DUMMY_TICKET_OFFERS);
      toast({
        title: "Using demo ticket data",
        description: "Showing fallback ticket offers.",
      });
    } finally {
      setLoading(false);
    }
  };

  const bookTicket = async (offer: TicketOffer) => {
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
        booking_type: "ticket",
        item_id: offer.id,
        quantity: 1,
        total_amount: offer.price,
        status: "confirmed",
      });

      if (error) throw error;

      toast({
        title: "Ticket booked",
        description: "Your ticket booking is confirmed.",
      });
      navigate("/orders");
    } catch (error: any) {
      toast({
        title: "Ticket booking failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const bookQuickTicket = async (deal: QuickTicketDeal, kind: "bus" | "movie") => {
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
        booking_type: "ticket",
        item_id: deal.id,
        quantity: 1,
        total_amount: deal.price,
        status: "confirmed",
      });

      if (error) throw error;

      toast({
        title: `${kind === "bus" ? "Bus" : "Movie"} ticket booked`,
        description: `${deal.title} is now confirmed.`,
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
          <Ticket className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Tickets Marketplace</h1>
        </div>
        <p className="text-muted-foreground">Concerts, sports, expos, and more in one place.</p>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Bus Tickets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUS_TICKET_DEALS.map((deal) => (
              <Card key={deal.id} className="overflow-hidden">
                <img src={deal.image} alt={deal.title} className="w-full h-36 object-cover" />
                <CardContent className="p-4 space-y-1">
                  <Badge variant="secondary">Bus</Badge>
                  <h3 className="font-semibold">{deal.title}</h3>
                  <p className="text-sm text-muted-foreground">{deal.subtitle}</p>
                  <p className="text-sm text-muted-foreground">{deal.time}</p>
                  <p className="font-bold">${deal.price.toFixed(2)}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full" onClick={() => bookQuickTicket(deal, "bus")}>Book Bus Ticket</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Movie Tickets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOVIE_TICKET_DEALS.map((deal) => (
              <Card key={deal.id} className="overflow-hidden">
                <img src={deal.image} alt={deal.title} className="w-full h-36 object-cover" />
                <CardContent className="p-4 space-y-1">
                  <Badge>Movie</Badge>
                  <h3 className="font-semibold">{deal.title}</h3>
                  <p className="text-sm text-muted-foreground">{deal.subtitle}</p>
                  <p className="text-sm text-muted-foreground">{deal.time}</p>
                  <p className="font-bold">${deal.price.toFixed(2)}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full" onClick={() => bookQuickTicket(deal, "movie")}>Book Movie Ticket</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <h2 className="text-2xl font-semibold">Live Events & Offers</h2>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden">
                <img
                  src={offer.image_url || TICKET_IMAGE_POOL[Math.abs(offer.id.length) % TICKET_IMAGE_POOL.length]}
                  alt={offer.title}
                  className="w-full h-44 object-cover"
                />
                <CardContent className="p-4 space-y-2">
                  <Badge>{offer.category}</Badge>
                  <h3 className="font-semibold text-lg">{offer.title}</h3>
                  <p className="text-sm text-muted-foreground">{offer.venue}</p>
                  <p className="text-sm text-muted-foreground">{new Date(offer.event_date).toLocaleString()}</p>
                  {offer.description && <p className="text-sm line-clamp-2">{offer.description}</p>}
                  <p className="text-2xl font-bold">${Number(offer.price).toFixed(2)}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full" onClick={() => bookTicket(offer)}>
                    Book Ticket
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

export default Tickets;
