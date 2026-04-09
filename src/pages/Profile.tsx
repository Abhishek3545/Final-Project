import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShoppingBag, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getStoredDummyUser, isDummyAuthMode } from "@/lib/dummyAuth";

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | { email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isDummyAuthMode()) {
          const dummy = getStoredDummyUser();
          if (dummy) {
            setUser({ email: dummy.email });
            return;
          }
        }
        navigate("/auth");
        return;
      }
      setUser(user);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-center">{user?.email}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => navigate("/account-settings")}>Edit Profile</Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/account-settings")}>Change Password</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/orders")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">My Orders</h3>
                    <p className="text-muted-foreground">View your order history</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/wishlist")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Wishlist</h3>
                    <p className="text-muted-foreground">View your saved items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
