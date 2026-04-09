import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ShoppingBag } from "lucide-react";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
};

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product:products (
            id,
            name,
            price
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems(data as any || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter your shipping address",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const total = cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: address,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: trackingError } = await supabase
        .from("order_tracking_events")
        .insert({
          order_id: order.id,
          status: "confirmed",
          latitude: 28.6139,
          longitude: 77.209,
          notes: "Order confirmed and sent to fulfillment center.",
        });

      if (trackingError) {
        console.warn("Tracking event seed failed", trackingError.message);
      }

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearError) throw clearError;

      toast({
        title: "Order placed!",
        description: "Your order has been successfully placed.",
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate("/products")}>Browse Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Shipping Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full shipping address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold">
                        ${(Number(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
