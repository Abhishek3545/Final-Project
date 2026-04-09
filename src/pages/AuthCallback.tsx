import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const finalizeAuth = async () => {
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.has("code");

      try {
        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          toast({
            title: "Login successful",
            description: "You are now signed in.",
          });
          navigate("/");
          return;
        }

        navigate("/auth");
      } catch (error: any) {
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    finalizeAuth();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Completing sign-in, please wait...
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
