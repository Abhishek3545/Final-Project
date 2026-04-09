import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, ArrowLeft, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { addProductToCart } from "@/lib/cart";

type Product = Tables<"products">;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data);
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

  const addToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
      });
      navigate("/auth");
      return;
    }

    if (!product) return;

    try {
      await addProductToCart(product.id, quantity);

      toast({
        title: "Added to cart",
        description: `${quantity} ${quantity === 1 ? 'item' : 'items'} added to your cart`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addToWishlist = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add wishlist items",
      });
      navigate("/auth");
      return;
    }

    if (!product) return;

    try {
      const { error } = await supabase.from("wishlist_items").insert({
        user_id: user.id,
        product_id: product.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already in wishlist",
            description: "This product is already saved.",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Saved to wishlist",
        description: "Product added to your wishlist.",
      });
    } catch (error: any) {
      toast({
        title: "Wishlist failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-8" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => navigate("/products")}>Browse Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2 w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <img
              src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
              alt={product.name}
              className="w-full rounded-lg"
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{product.rating || 0}</span>
                </div>
                <span className="text-muted-foreground">
                  {product.reviews_count || 0} reviews
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                {product.is_featured && <Badge>Featured</Badge>}
                {product.is_bestseller && <Badge variant="secondary">Bestseller</Badge>}
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-bold">${product.price}</span>
                {product.original_price && (
                  <span className="text-2xl text-muted-foreground line-through">
                    ${product.original_price}
                  </span>
                )}
              </div>
              {product.original_price && (
                <p className="text-green-600 font-semibold">
                  Save ${(Number(product.original_price) - Number(product.price)).toFixed(2)}
                </p>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            <div>
              <p className="font-semibold mb-2">
                Stock: <span className="text-muted-foreground">{product.stock} available</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={addToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={addToWishlist}
                >
                  <Heart className="w-5 h-5" />
                  Add to Wishlist
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
