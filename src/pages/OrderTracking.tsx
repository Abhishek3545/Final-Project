import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Navigation, RefreshCw, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";
import BackButton from "@/components/BackButton";
import { isDummyAuthMode } from "@/lib/dummyAuth";

type Order = Tables<"orders">;
type TrackingEvent = Tables<"order_tracking_events">;

const statusOrder = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"];

const DUMMY_ORDER: Order = {
  id: "dummy-order-001",
  user_id: "00000000-0000-4000-8000-000000000001",
  shipping_address: "Demo address, Retail Realm City",
  status: "out_for_delivery",
  total_amount: 149.99,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DUMMY_TRACKING_EVENTS: TrackingEvent[] = Array.from({ length: 12 }).map((_, idx) => {
  const i = idx + 1;
  const status = i <= 2 ? "pending" : i <= 5 ? "confirmed" : i <= 8 ? "packed" : i <= 11 ? "out_for_delivery" : "delivered";
  return {
    id: `dummy-track-${i}`,
    order_id: "dummy-order-001",
    status,
    latitude: 28.61 + i * 0.001,
    longitude: 77.20 + i * 0.001,
    notes: `Demo tracking checkpoint ${i}`,
    created_at: new Date(Date.now() - (12 - i) * 20 * 60 * 1000).toISOString(),
  };
});

const getDemoTrackingData = (idToTrack?: string) => {
  const demoOrderId = idToTrack?.trim() || DUMMY_ORDER.id;
  return {
    order: {
      ...DUMMY_ORDER,
      id: demoOrderId,
      updated_at: new Date().toISOString(),
    },
    events: DUMMY_TRACKING_EVENTS.map((event) => ({
      ...event,
      order_id: demoOrderId,
    })),
  };
};

const formatElapsedTime = (elapsedMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  return `${hours}h ${minutes}m ${seconds}s`;
};

const OrderTracking = () => {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const latestEvent = events[0] ?? null;
  const liveMapUrl = useMemo(() => {
    if (!latestEvent?.latitude || !latestEvent?.longitude) return null;
    const lat = latestEvent.latitude;
    const lng = latestEvent.longitude;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  }, [latestEvent]);

  const deliveredEvent = useMemo(
    () => events.find((event) => event.status === "delivered") ?? null,
    [events],
  );

  const deliveredAt = useMemo(() => {
    if (deliveredEvent) return new Date(deliveredEvent.created_at);
    if (order?.status === "delivered") return new Date(order.updated_at);
    return null;
  }, [deliveredEvent, order]);

  const isOrderDelivered = order?.status === "delivered";
  const elapsedSinceDelivered = deliveredAt ? formatElapsedTime(currentTime - deliveredAt.getTime()) : null;

  useEffect(() => {
    initializeTracking();
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const intervalId = window.setInterval(() => {
      fetchTracking(orderId, true);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [orderId]);

  useEffect(() => {
    if (!order?.id) {
      setRating(0);
      return;
    }

    const savedRating = window.localStorage.getItem(`order-rating-${order.id}`);
    setRating(savedRating ? Number(savedRating) : 0);
  }, [order?.id]);

  const handleRating = (nextRating: number) => {
    if (!order?.id || !isOrderDelivered) return;
    setRating(nextRating);
    window.localStorage.setItem(`order-rating-${order.id}`, String(nextRating));
    toast({
      title: "Rating submitted",
      description: `You rated this order ${nextRating} out of 5.`,
    });
  };

  const initializeTracking = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isDummyAuthMode()) {
          setOrderId(DUMMY_ORDER.id);
          setOrder(DUMMY_ORDER);
          setEvents(DUMMY_TRACKING_EVENTS);
          return;
        }

        const requestedOrderId = searchParams.get("orderId") || "";
        if (requestedOrderId) {
          setOrderId(requestedOrderId);
          await fetchTracking(requestedOrderId, true);
          return;
        }

        const demoTracking = getDemoTrackingData();
        setOrderId(demoTracking.order.id);
        setOrder(demoTracking.order);
        setEvents(demoTracking.events);
        return;
      }

      const { data: latestOrder, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!latestOrder) {
        if (isDummyAuthMode()) {
          setOrderId(DUMMY_ORDER.id);
          setOrder(DUMMY_ORDER);
          setEvents(DUMMY_TRACKING_EVENTS);
          return;
        }
        setLoading(false);
        return;
      }

      const requestedOrderId = searchParams.get("orderId") || latestOrder.id;
      setOrderId(requestedOrderId);
      await fetchTracking(requestedOrderId, true);
    } catch (error: any) {
      toast({
        title: "Tracking unavailable",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async (idToTrack: string, silent = false) => {
    if (!idToTrack) return;
    if (!silent) setRefreshing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isDummyAuthMode()) {
          setOrder(DUMMY_ORDER);
          setEvents(DUMMY_TRACKING_EVENTS);
          return;
        }

        const demoTracking = getDemoTrackingData(idToTrack);
        setOrder(demoTracking.order);
        setEvents(demoTracking.events);
        return;
      }

      const { data: foundOrder, error: orderError } = user
        ? await supabase
            .from("orders")
            .select("*")
            .eq("id", idToTrack)
            .eq("user_id", user.id)
            .maybeSingle()
        : await supabase
            .from("orders")
            .select("*")
            .eq("id", idToTrack)
            .maybeSingle();

      if (orderError) throw orderError;

      if (!foundOrder) {
        if (isDummyAuthMode()) {
          setOrder(DUMMY_ORDER);
          setEvents(DUMMY_TRACKING_EVENTS);
          return;
        }
        toast({
          title: "Order not found",
          description: "Check the order ID and try again.",
        });
        setOrder(null);
        setEvents([]);
        return;
      }

      setOrder(foundOrder);

      const { data: trackingEvents, error: trackingError } = await supabase
        .from("order_tracking_events")
        .select("*")
        .eq("order_id", idToTrack)
        .order("created_at", { ascending: false });

      if (trackingError) throw trackingError;
      setEvents(trackingEvents || []);
    } catch (error: any) {
      toast({
        title: "Tracking fetch failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <BackButton fallbackPath="/orders" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-4xl font-bold">GPS Order Tracking</h1>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={refreshing || !orderId}
            onClick={() => fetchTracking(orderId)}
          >
            <RefreshCw className="w-4 h-4" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Track by Order ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="orderId">Order ID</Label>
            <div className="flex gap-2">
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Paste your order UUID"
              />
              <Button type="button" onClick={() => fetchTracking(orderId)}>
                Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="h-24 bg-muted animate-pulse rounded-lg" />
            </CardContent>
          </Card>
        ) : !order ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground">
              No order selected yet. Place an order first, or enter an order ID.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tracking Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-muted-foreground">No tracking events available yet.</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{event.status.replaceAll("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                      )}
                      {event.latitude && event.longitude && (
                        <p className="text-xs text-muted-foreground mt-2">
                          GPS: {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Delivery State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {statusOrder.map((status) => {
                    const currentIndex = statusOrder.indexOf(order.status);
                    const stepIndex = statusOrder.indexOf(status);
                    const active = stepIndex <= currentIndex;

                    return (
                      <div key={status} className="flex items-center gap-2 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
                        <span className={active ? "font-medium" : "text-muted-foreground"}>
                          {status.replaceAll("_", " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Latest GPS</span>
                  </div>
                  {latestEvent?.latitude && latestEvent?.longitude ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {latestEvent.latitude.toFixed(5)}, {latestEvent.longitude.toFixed(5)}
                      </p>
                      {liveMapUrl && (
                        <a href={liveMapUrl} target="_blank" rel="noreferrer" className="inline-flex">
                          <Button type="button" variant="outline" className="gap-2">
                            <Navigation className="w-4 h-4" />
                            Open Live Map
                          </Button>
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">GPS not published yet.</p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Order Completion Timer</p>
                    {isOrderDelivered && elapsedSinceDelivered ? (
                      <p className="text-sm text-muted-foreground">
                        Delivered {elapsedSinceDelivered} ago
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Timer starts once the order is delivered.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Rate This Delivery</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRating(star)}
                          disabled={!isOrderDelivered}
                          className="p-1 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Rate ${star} out of 5`}
                        >
                          <Star
                            className={`w-5 h-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isOrderDelivered
                        ? rating > 0
                          ? `Current rating: ${rating}/5`
                          : "Tap a star to rate your delivered order."
                        : "Rating is enabled after delivery is completed."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
