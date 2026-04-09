import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

type WishlistItem = {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
};

const Wishlist = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, product:products(id,name,price,image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Wishlist failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("wishlist_items").delete().eq("id", itemId);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error: any) {
      toast({
        title: "Remove failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: existingItem, error: existingError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingItem) {
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        });

        if (insertError) throw insertError;
      }

      toast({
        title: "Added to cart",
        description: "Wishlist product was moved to cart.",
      });
    } catch (error: any) {
      toast({
        title: "Add to cart failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <BackButton fallbackPath="/profile" />
        <h1 className="text-3xl md:text-4xl font-bold">Wishlist</h1>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="h-20 rounded-lg bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-muted-foreground">Your wishlist is empty.</p>
              <Link to="/products">
                <Button className="w-full sm:w-auto">Explore Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 space-y-3">
                  <img
                    src={item.product.image_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"}
                    alt={item.product.name}
                    className="w-full h-40 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-muted-foreground">${Number(item.product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="w-full sm:flex-1" onClick={() => addToCart(item.product.id)}>
                      Add to Cart
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => removeItem(item.id)}>
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
