import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";

type CheckStatus = "ok" | "warn" | "fail" | "info";

type HealthCheckResult = {
  key: string;
  name: string;
  status: CheckStatus;
  message: string;
  durationMs: number;
};

const statusMeta: Record<CheckStatus, { label: string; className: string }> = {
  ok: { label: "Healthy", className: "bg-green-100 text-green-800 border-green-200" },
  warn: { label: "Warning", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  fail: { label: "Fail", className: "bg-red-100 text-red-800 border-red-200" },
  info: { label: "Info", className: "bg-blue-100 text-blue-800 border-blue-200" },
};

const SystemHealth = () => {
  const [checks, setChecks] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  const summary = useMemo(() => {
    const ok = checks.filter((c) => c.status === "ok").length;
    const warn = checks.filter((c) => c.status === "warn").length;
    const fail = checks.filter((c) => c.status === "fail").length;
    const info = checks.filter((c) => c.status === "info").length;

    // Readiness score: warnings reduce confidence slightly, failures significantly.
    const rawScore = checks.reduce((score, check) => {
      if (check.status === "ok") return score + 1;
      if (check.status === "info") return score + 0.8;
      if (check.status === "warn") return score + 0.4;
      return score;
    }, 0);

    const readinessScore = checks.length > 0 ? Math.round((rawScore / checks.length) * 100) : 0;

    return { ok, warn, fail, info, total: checks.length, readinessScore };
  }, [checks]);

  const recommendations = useMemo(() => {
    const messages: string[] = [];

    const hasEnvFail = checks.some((c) => c.key === "env" && c.status === "fail");
    const authWarn = checks.some((c) => c.key === "auth" && c.status === "warn");
    const cartIssue = checks.some((c) => c.key === "cart" && (c.status === "warn" || c.status === "fail"));
    const wishlistIssue = checks.some((c) => c.key === "wishlist" && (c.status === "warn" || c.status === "fail"));
    const productsFail = checks.some((c) => c.key === "products" && c.status === "fail");

    if (hasEnvFail) {
      messages.push("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment file.");
    }
    if (productsFail) {
      messages.push("Run all Supabase migrations to ensure required tables exist and policies are active.");
    }
    if (authWarn) {
      messages.push("Sign in first to validate protected backend checks like cart, wishlist, and order tracking.");
    }
    if (cartIssue || wishlistIssue) {
      messages.push("If cart/wishlist checks fail after login, verify RLS policies and user_id constraints in Supabase.");
    }

    if (messages.length === 0) {
      messages.push("System health is strong. Keep migrations in sync and run checks after major feature updates.");
    }

    return messages;
  }, [checks]);

  useEffect(() => {
    runHealthChecks();
  }, []);

  const runCheck = async (
    key: string,
    name: string,
    fn: () => Promise<{ status: CheckStatus; message: string }>
  ): Promise<HealthCheckResult> => {
    const start = performance.now();
    try {
      const result = await fn();
      return {
        key,
        name,
        status: result.status,
        message: result.message,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (error: any) {
      return {
        key,
        name,
        status: "fail",
        message: error?.message || "Unexpected check failure",
        durationMs: Math.round(performance.now() - start),
      };
    }
  };

  const runHealthChecks = async () => {
    setLoading(true);

    const envCheck = await runCheck("env", "Supabase Env", async () => {
      const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
      const hasKey = Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

      if (hasUrl && hasKey) {
        return { status: "ok", message: "Supabase URL and publishable key are set." };
      }

      return {
        status: "fail",
        message: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.",
      };
    });

    const networkCheck = await runCheck("network", "Network Reachability", async () => {
      if (!navigator.onLine) {
        return { status: "fail", message: "Browser is offline. Connect to internet and retry." };
      }
      return { status: "ok", message: "Browser reports online connectivity." };
    });

    const authResult = await runCheck("auth", "Auth Session", async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        return { status: "fail", message: error.message };
      }

      if (session?.user) {
        return { status: "ok", message: `Signed in as ${session.user.email || session.user.id}` };
      }

      return {
        status: "info",
        message: "No active session. Protected checks (cart/wishlist/tracking) are skipped.",
      };
    });

    const latencyCheck = await runCheck("latency", "Supabase Latency", async () => {
      const start = performance.now();
      const { error } = await supabase.from("categories").select("id").limit(1);
      const elapsed = Math.round(performance.now() - start);

      if (error) {
        return { status: "warn", message: `Latency check limited by backend error: ${error.message}` };
      }

      if (elapsed < 450) return { status: "ok", message: `Healthy response time (${elapsed}ms).` };
      if (elapsed < 900) return { status: "warn", message: `Moderate response time (${elapsed}ms).` };
      return { status: "warn", message: `High response time (${elapsed}ms).` };
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const tableChecks = await Promise.all([
      runCheck("products", "Products Table", async () => {
        const { error } = await supabase.from("products").select("id", { count: "exact", head: true });
        if (error) return { status: "fail", message: error.message };
        return { status: "ok", message: "Products table reachable." };
      }),
      runCheck("travel", "Travel Packages Table", async () => {
        const { error } = await supabase.from("travel_packages").select("id", { count: "exact", head: true });
        if (error) return { status: "fail", message: error.message };
        return { status: "ok", message: "Travel packages table reachable." };
      }),
      runCheck("tickets", "Ticket Offers Table", async () => {
        const { error } = await supabase.from("ticket_offers").select("id", { count: "exact", head: true });
        if (error) return { status: "fail", message: error.message };
        return { status: "ok", message: "Ticket offers table reachable." };
      }),
      runCheck("cart", "Cart Backend", async () => {
        if (!user) {
          return {
            status: "info",
            message: "Sign in required to verify cart table with user policies.",
          };
        }
        const { error } = await supabase.from("cart_items").select("id").eq("user_id", user.id).limit(1);
        if (error) return { status: "fail", message: error.message };
        return { status: "ok", message: "Cart backend reachable with current policies." };
      }),
      runCheck("wishlist", "Wishlist Backend", async () => {
        if (!user) {
          return {
            status: "info",
            message: "Sign in required to verify wishlist table with user policies.",
          };
        }
        const { error } = await supabase.from("wishlist_items").select("id").eq("user_id", user.id).limit(1);
        if (error) return { status: "fail", message: error.message };
        return { status: "ok", message: "Wishlist backend reachable with current policies." };
      }),
      runCheck("tracking", "Order Tracking Backend", async () => {
        if (!user) {
          return {
            status: "info",
            message: "Sign in required to verify tracking table with user policies.",
          };
        }
        const { error } = await supabase
          .from("orders")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (error) return { status: "fail", message: error.message };
        return { status: "ok", message: "Orders backend reachable." };
      }),
    ]);

    setChecks([envCheck, networkCheck, authResult, latencyCheck, ...tableChecks]);
    setLoading(false);
  };

  const overallStatus: CheckStatus = summary.fail > 0 ? "fail" : summary.warn > 0 ? "warn" : "ok";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <BackButton fallbackPath="/" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Backend Health Dashboard</h1>
            <p className="text-muted-foreground mt-1">Live checks for Supabase auth, tables, and backend readiness.</p>
          </div>
          <Button onClick={runHealthChecks} disabled={loading} className="gap-2 w-full md:w-auto">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Checking..." : "Run Checks"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {overallStatus === "ok" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              {overallStatus === "warn" && <TriangleAlert className="w-5 h-5 text-yellow-600" />}
              {overallStatus === "fail" && <ShieldAlert className="w-5 h-5 text-red-600" />}
              Overall Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge className={statusMeta[overallStatus].className}>{statusMeta[overallStatus].label}</Badge>
            <span className="text-sm text-muted-foreground">{summary.ok} healthy</span>
            <span className="text-sm text-muted-foreground">{summary.warn} warnings</span>
            <span className="text-sm text-muted-foreground">{summary.fail} failures</span>
            <span className="text-sm text-muted-foreground">{summary.info} info</span>
            <span className="text-sm text-muted-foreground">{summary.total} total checks</span>
            <span className="text-sm font-medium">Readiness Score: {summary.readinessScore}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((item) => (
              <p key={item} className="text-sm text-muted-foreground">• {item}</p>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checks.map((check) => (
            <Card key={check.key}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold">{check.name}</h2>
                  <Badge className={statusMeta[check.status].className}>{statusMeta[check.status].label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{check.message}</p>
                <p className="text-xs text-muted-foreground">{check.durationMs}ms</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
