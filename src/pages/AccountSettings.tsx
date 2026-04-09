import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

const AccountSettings = () => {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (data?.full_name) {
        setFullName(data.full_name);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || "",
        full_name: fullName,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setPassword("");
      toast({
        title: "Password updated",
        description: "Your password was changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <BackButton fallbackPath="/profile" />
        <h1 className="text-4xl font-bold">Account Settings</h1>

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
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={saveProfile}>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={changePassword}>
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a new password"
                    />
                  </div>
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
