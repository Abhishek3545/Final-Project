import { supabase } from "@/integrations/supabase/client";

type CartLite = {
  id: string;
  quantity: number;
};

const getRequiredUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Please log in to manage your cart.");

  return user.id;
};

export const addProductToCart = async (productId: string, quantity = 1) => {
  if (!productId) throw new Error("Product is required.");
  if (quantity < 1) throw new Error("Quantity must be at least 1.");

  const userId = await getRequiredUserId();

  const { data: existingItem, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle<CartLite>();

  if (existingError) throw existingError;

  if (existingItem) {
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: productId,
    quantity,
  });

  if (insertError) throw insertError;
};

export const setCartItemQuantity = async (cartItemId: string, quantity: number) => {
  if (!cartItemId) throw new Error("Cart item is required.");
  if (quantity < 1) throw new Error("Quantity must be at least 1.");

  await getRequiredUserId();

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);

  if (error) throw error;
};

export const removeCartItem = async (cartItemId: string) => {
  if (!cartItemId) throw new Error("Cart item is required.");

  await getRequiredUserId();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) throw error;
};

export const clearCart = async () => {
  const userId = await getRequiredUserId();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
};
