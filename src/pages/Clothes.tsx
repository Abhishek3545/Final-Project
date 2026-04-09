import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Shirt, ShoppingCart, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { addProductToCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const nowIso = new Date().toISOString();

const CLOTH_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900",
  "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=900",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900",
  "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=900",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900",
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900",
  "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=900",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900",
  "https://images.unsplash.com/photo-1467043153537-a4fba2cd39ef?w=900",
  "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=900",
  "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=900",
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900",
];

const DUMMY_CLOTHES: Product[] = Array.from({ length: 15 }).map((_, idx) => {
  const i = idx + 1;
  return {
    id: `dummy-clothing-${i}`,
    name: `Clothing Collection ${i}`,
    description: `Premium clothing piece #${i} for daily comfort and style.`,
    price: 24.99 + i * 2.25,
    original_price: 29.99 + i * 2.4,
    stock: 35 + i,
    category_id: "cat-clothing",
    image_url: CLOTH_IMAGE_POOL[idx % CLOTH_IMAGE_POOL.length],
    images: null,
    is_bestseller: i % 3 === 0,
    is_featured: i % 4 === 0,
    rating: 3.9 + (i % 9) * 0.1,
    reviews_count: 30 + i * 5,
    created_at: nowIso,
    updated_at: nowIso,
  };
});

const Clothes = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalCountLabel = useMemo(() => `${items.length} items`, [items.length]);

  useEffect(() => {
    fetchClothes();
  }, []);

  const fetchClothes = async () => {
    setLoading(true);
    try {
      const { data: clothingCategory, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "clothing")
        .maybeSingle();

      if (categoryError) throw categoryError;

      if (!clothingCategory?.id) {
        setItems(DUMMY_CLOTHES);
        return;
      }

      const { data: clothingProducts, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", clothingCategory.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (productError) throw productError;

      setItems(clothingProducts && clothingProducts.length > 0 ? clothingProducts : DUMMY_CLOTHES);
    } catch {
      setItems(DUMMY_CLOTHES);
      toast({
        title: "Using demo clothes",
        description: "Backend data unavailable, showing 15 dummy clothing items.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      await addProductToCart(product.id, 1);

      toast({
        title: "Added to cart",
        description: "Clothing item added to cart.",
      });
    } catch (error: any) {
      toast({
        title: "Cart failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addToWishlist = async (productId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("wishlist_items").insert({
        user_id: user.id,
        product_id: productId,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already in wishlist",
            description: "This clothing item is already saved.",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Saved",
        description: "Added to wishlist.",
      });
    } catch (error: any) {
      toast({
        title: "Wishlist failed",
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

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground mb-2">
              <Shirt className="w-4 h-4" />
              Dedicated Clothing Collection
            </div>
            <h1 className="text-4xl font-bold">Clothes</h1>
            <p className="text-muted-foreground mt-1">Top picks from your 15-item apparel catalog.</p>
          </div>
          <div className="text-sm text-muted-foreground">{totalCountLabel}</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.image_url || CLOTH_IMAGE_POOL[Math.abs(product.id.length) % CLOTH_IMAGE_POOL.length]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <CardContent className="p-4 space-y-2">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.rating || 0}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({product.reviews_count || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">${Number(product.price).toFixed(2)}</span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through">${Number(product.original_price).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {product.is_featured && <Badge>Featured</Badge>}
                    {product.is_bestseller && <Badge variant="secondary">Bestseller</Badge>}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex gap-2">
                    <Button className="flex-1 gap-2" onClick={() => addToCart(product)}>
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => addToWishlist(product.id)}
                      aria-label="Add to wishlist"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clothes;
