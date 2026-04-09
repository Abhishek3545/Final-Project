import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import BackButton from "@/components/BackButton";

type Order = Tables<"orders">;
type ServiceBooking = Tables<"service_bookings">;

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const [{ data: ordersData, error: ordersError }, { data: bookingsData, error: bookingsError }] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("service_bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (ordersError) throw ordersError;
      if (bookingsError) throw bookingsError;

      setOrders(ordersData || []);
      setBookings(bookingsData || []);
    } catch (error: any) {
      toast({
        title: "Unable to load orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <BackButton fallbackPath="/profile" />
        <h1 className="text-4xl font-bold">My Orders & Bookings</h1>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="h-20 rounded-lg bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Product Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-muted-foreground">No product orders yet.</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        <p className="text-sm">Status: <span className="font-medium capitalize">{order.status}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${Number(order.total_amount).toFixed(2)}</p>
                        <Button variant="outline" onClick={() => navigate(`/track-order?orderId=${order.id}`)}>
                          Track
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Travel & Ticket Bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground">No service bookings yet.</p>
                ) : (
                  bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{booking.booking_type === "travel" ? "Travel" : "Ticket"} booking</p>
                        <p className="text-sm text-muted-foreground">{new Date(booking.created_at).toLocaleString()}</p>
                        <p className="text-sm">Status: <span className="font-medium capitalize">{booking.status}</span></p>
                      </div>
                      <p className="font-bold text-lg">${Number(booking.total_amount).toFixed(2)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
