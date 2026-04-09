import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, ShoppingBag } from "lucide-react";
import { isDummyAuthMode, setStoredDummyUser } from "@/lib/dummyAuth";

const DUMMY_AUTH_MODE = isDummyAuthMode();

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const normalizePhoneNumber = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("+")) return trimmed;
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length === 10) return `+91${digitsOnly}`;
    return `+${digitsOnly}`;
  };

  const logDemoEvent = async (method: string, identifier: string | null, status: string) => {
    try {
      await supabase.from("auth_demo_events").insert({
        method,
        identifier,
        status,
      });
    } catch {
      // Demo logging is best-effort and should never block login.
    }
  };

  const signInWithDemoBackend = async (method: "google" | "email" | "phone", identifier?: string) => {
    const safeIdentifier = identifier?.trim() || method;
    setStoredDummyUser(method, safeIdentifier);

    try {
      let demoEmail = "";

      if (method === "google") {
        demoEmail = "google.demo@retailrealmx.local";
      } else if (method === "phone") {
        const digits = safeIdentifier.replace(/\D/g, "").slice(-10) || "0000000000";
        demoEmail = `phone.${digits}@retailrealmx.local`;
      } else {
        const lowered = safeIdentifier.toLowerCase();
        demoEmail = lowered.includes("@") ? lowered : `email.${Date.now()}@retailrealmx.local`;
      }

      const demoPassword = "Demo@123456";

      const signInAttempt = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInAttempt.error) {
        const signUpAttempt = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName || "Demo User",
            },
          },
        });

        if (!signUpAttempt.error) {
          await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });
        }
      }
    } catch {
      // Local dummy session fallback already set, so ignore backend failures.
    }

    await logDemoEvent(method, safeIdentifier, "success");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (DUMMY_AUTH_MODE) {
        await signInWithDemoBackend("email", email);
        toast({
          title: "Demo sign up successful",
          description: "Signed in using backend dummy mode.",
        });
        navigate("/");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Check your email for verification if confirmation is enabled.",
      });
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (DUMMY_AUTH_MODE) {
        await signInWithDemoBackend("email", email);
        toast({
          title: "Demo sign in successful",
          description: "Signed in using backend dummy mode.",
        });
        navigate("/");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/");
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (DUMMY_AUTH_MODE) {
        await signInWithDemoBackend("google", "google-demo");
        toast({
          title: "Google demo login successful",
          description: "Signed in using backend dummy mode.",
        });
        navigate("/");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!normalizedPhone.startsWith("+") || normalizedPhone.length < 8) {
        throw new Error("Enter a valid phone number in international format.");
      }

      if (DUMMY_AUTH_MODE) {
        setPhoneOtpSent(true);
        setPhone(normalizedPhone);
        toast({
          title: "Demo OTP sent",
          description: "Use 123456 to verify in dummy mode.",
        });
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (error) throw error;

      setPhoneOtpSent(true);
      setPhone(normalizedPhone);
      toast({
        title: "Code sent",
        description: "Please enter the OTP sent to your phone number.",
      });
    } catch (error: any) {
      toast({
        title: "Unable to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (DUMMY_AUTH_MODE) {
        if (otp.trim() !== "123456") {
          throw new Error("Use OTP 123456 in dummy mode.");
        }

        await signInWithDemoBackend("phone", phone);
        toast({
          title: "Phone demo login successful",
          description: "Signed in using backend dummy mode.",
        });
        navigate("/");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        phone: normalizePhoneNumber(phone),
        token: otp.trim(),
        type: "sms",
      });

      if (error) throw error;

      toast({
        title: "Phone login successful",
        description: "You're now signed in.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "OTP verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneFlow = () => {
    setPhoneOtpSent(false);
    setOtp("");
  };

  const handleSendEmailMagicLink = async () => {
    setLoading(true);
    try {
      const emailValue = email.trim();
      if (!emailValue) {
        throw new Error("Enter your email address first.");
      }

      if (DUMMY_AUTH_MODE) {
        await signInWithDemoBackend("email", emailValue);
        toast({
          title: "Demo email login successful",
          description: "Signed in using backend dummy mode.",
        });
        navigate("/");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: emailValue,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast({
        title: "Magic link sent",
        description: "Check your email and click the sign-in link.",
      });
    } catch (error: any) {
      toast({
        title: "Email login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-2">
            <ShoppingBag className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>
            Login with Google, email, or phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="gap-1">
                <Mail className="w-4 h-4" /> Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-1">
                <Phone className="w-4 h-4" /> Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                      onClick={handleSendEmailMagicLink}
                    >
                      Continue with Email Link
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="phone">
              {!phoneOtpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91XXXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Use international format, for example: +919876543210
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending code..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify and Sign In"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={resetPhoneFlow}>
                    Change Number
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            {DUMMY_AUTH_MODE
              ? "Dummy backend mode is ON. Google, email and phone login are simulated and saved in backend events."
              : "For phone and Google login, enable those providers in your Supabase Auth settings."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
