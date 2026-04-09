import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Star, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Category = Tables<"categories">;
type SortOption = "newest" | "price-asc" | "price-desc" | "rating-desc";

const nowIso = new Date().toISOString();

const PRODUCT_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900",
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=900",
  "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=900",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900",
  "https://images.unsplash.com/photo-1585386959984-a41552231658?w=900",
  "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=900",
  "https://images.unsplash.com/photo-1586201375761-83865001e31b?w=900",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900",
  "https://images.unsplash.com/photo-1616627561839-074385245ff6?w=900",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900",
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=900",
  "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=900",
];

const DUMMY_CATEGORIES: Category[] = [
  { id: "cat-grocery", name: "Grocery", slug: "grocery", description: "Daily essentials", image_url: null, created_at: nowIso },
  { id: "cat-clothing", name: "Clothing", slug: "clothing", description: "Style and apparel", image_url: null, created_at: nowIso },
  { id: "cat-electronics", name: "Electronics", slug: "electronics", description: "Gadgets and devices", image_url: null, created_at: nowIso },
  { id: "cat-home", name: "Home & Garden", slug: "home-garden", description: "Home care and decor", image_url: null, created_at: nowIso },
];

const DUMMY_PRODUCTS: Product[] = Array.from({ length: 15 }).map((_, idx) => {
  const i = idx + 1;
  return {
    id: `dummy-clothing-${i}`,
    name: `Clothing Collection ${i}`,
    description: `Comfort-focused premium clothing item number ${i}.`,
    price: 19.99 + i * 3,
    original_price: 24.99 + i * 3,
    stock: 20 + i,
    category_id: "cat-clothing",
    image_url: PRODUCT_IMAGE_POOL[idx % PRODUCT_IMAGE_POOL.length],
    images: null,
    is_bestseller: i % 3 === 0,
    is_featured: i % 4 === 0,
    rating: 3.8 + (i % 10) * 0.1,
    reviews_count: 15 + i * 4,
    created_at: nowIso,
    updated_at: nowIso,
  };
});

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams, selectedCategory, sortBy, maxPrice, inStockOnly]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data && data.length > 0 ? data : DUMMY_CATEGORIES);
    } catch (error: any) {
      setCategories(DUMMY_CATEGORIES);
    }
  };

  const applyFallbackProducts = () => {
    let fallback = [...DUMMY_PRODUCTS];
    const search = searchParams.get("search")?.trim().toLowerCase();

    if (search) {
      fallback = fallback.filter((product) => product.name.toLowerCase().includes(search));
    }

    if (selectedCategory !== "all") {
      fallback = fallback.filter((product) => product.category_id === selectedCategory);
    }

    if (inStockOnly) {
      fallback = fallback.filter((product) => product.stock > 0);
    }

    if (maxPrice && Number(maxPrice) > 0) {
      fallback = fallback.filter((product) => Number(product.price) <= Number(maxPrice));
    }

    if (sortBy === "price-asc") {
      fallback.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      fallback.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "rating-desc") {
      fallback.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else {
      fallback.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setProducts(fallback);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select("*");
      
      const search = searchParams.get("search");
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      if (inStockOnly) {
        query = query.gt("stock", 0);
      }

      if (maxPrice && Number(maxPrice) > 0) {
        query = query.lte("price", Number(maxPrice));
      }

      if (sortBy === "price-asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price-desc") {
        query = query.order("price", { ascending: false });
      } else if (sortBy === "rating-desc") {
        query = query.order("rating", { ascending: false, nullsFirst: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        applyFallbackProducts();
      }
    } catch (error: any) {
      applyFallbackProducts();
      toast({
        title: "Using demo catalog",
        description: "Showing fallback products because backend data is unavailable.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
      });
      return;
    }

    try {
      const { data: existingItem, error: existingError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
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
          product_id: product.id,
          quantity: 1,
        });
        if (insertError) throw insertError;
      }

      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
    } catch (error: any) {
      toast({
        title: "Error",
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
      toast({
        title: "Sign in required",
        description: "Please sign in to save wishlist items",
      });
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
            title: "Already saved",
            description: "This product is already in your wishlist.",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Saved to wishlist",
        description: "You can view it later from your wishlist page.",
      });
    } catch (error: any) {
      toast({
        title: "Wishlist error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold">All Products</h1>
          <div className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"} found
          </div>
        </div>

        <div className="rounded-xl border p-4 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating-desc">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-price">Max Price</Label>
            <Input
              id="max-price"
              type="number"
              min={0}
              placeholder="No limit"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Availability</Label>
            <Button
              type="button"
              variant={inStockOnly ? "default" : "outline"}
              className="w-full"
              onClick={() => setInStockOnly((prev) => !prev)}
            >
              {inStockOnly ? "In-stock only" : "Show all stock"}
            </Button>
          </div>
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
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.image_url || PRODUCT_IMAGE_POOL[Math.abs(product.id.length) % PRODUCT_IMAGE_POOL.length]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <CardContent className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.rating || 0}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews_count || 0})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold">${product.price}</span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.original_price}
                      </span>
                    )}
                  </div>
                  {product.is_featured && <Badge>Featured</Badge>}
                  {product.is_bestseller && <Badge variant="secondary">Bestseller</Badge>}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => addToCart(product)}
                    >
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

export default Products;
