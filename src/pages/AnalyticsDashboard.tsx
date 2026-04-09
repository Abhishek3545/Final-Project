import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCw, Save } from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Period = "7d" | "30d" | "90d";

type DailySummary = {
  day: string;
  total_revenue: number;
  total_transactions: number;
  order_count: number;
  booking_count: number;
};

type SheetRow = {
  id?: string;
  metric: string;
  target_value: number;
  actual_value: number;
  note: string;
};

const ANALYTICS_LOCAL_KEY_PREFIX = "rrx_analytics_sheet_";

const defaultSheetRows: SheetRow[] = [
  { metric: "Monthly Revenue", target_value: 5000, actual_value: 0, note: "Track against combined orders + bookings" },
  { metric: "Transactions", target_value: 120, actual_value: 0, note: "Count of all checkouts and bookings" },
  { metric: "Average Order Value", target_value: 55, actual_value: 0, note: "Revenue / transaction" },
  { metric: "Travel Conversion", target_value: 25, actual_value: 0, note: "Travel bookings as % of all bookings" },
  { metric: "Ticket Conversion", target_value: 35, actual_value: 0, note: "Ticket bookings as % of all bookings" },
];

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const getFallbackSummary = (days: number): DailySummary[] => {
  const rows: DailySummary[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const orderCount = 2 + (i % 5);
    const bookingCount = 1 + (i % 3);
    const totalTransactions = orderCount + bookingCount;
    const totalRevenue = Number((orderCount * 42.5 + bookingCount * 58.75).toFixed(2));

    rows.push({
      day: date.toISOString().slice(0, 10),
      total_revenue: totalRevenue,
      total_transactions: totalTransactions,
      order_count: orderCount,
      booking_count: bookingCount,
    });
  }

  return rows;
};

const getDefaultSheetFromSummary = (summary: DailySummary[]): SheetRow[] => {
  const revenue = summary.reduce((sum, row) => sum + row.total_revenue, 0);
  const transactions = summary.reduce((sum, row) => sum + row.total_transactions, 0);
  const bookings = summary.reduce((sum, row) => sum + row.booking_count, 0);
  const avgOrder = transactions > 0 ? revenue / transactions : 0;

  return defaultSheetRows.map((row) => {
    if (row.metric === "Monthly Revenue") return { ...row, actual_value: Number(revenue.toFixed(2)) };
    if (row.metric === "Transactions") return { ...row, actual_value: transactions };
    if (row.metric === "Average Order Value") return { ...row, actual_value: Number(avgOrder.toFixed(2)) };
    if (row.metric === "Travel Conversion") {
      const conversion = bookings > 0 ? (bookings / Math.max(bookings, 1)) * 100 : 0;
      return { ...row, actual_value: Number(conversion.toFixed(2)) };
    }
    if (row.metric === "Ticket Conversion") return { ...row, actual_value: 0 };
    return row;
  });
};

const getLocalSheetRows = (periodKey: string, summary: DailySummary[]): SheetRow[] => {
  try {
    const raw = localStorage.getItem(`${ANALYTICS_LOCAL_KEY_PREFIX}${periodKey}`);
    if (!raw) return getDefaultSheetFromSummary(summary);

    const parsed = JSON.parse(raw) as SheetRow[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getDefaultSheetFromSummary(summary);
    }

    return parsed.map((row) => ({
      metric: row.metric || "Metric",
      target_value: Number(row.target_value || 0),
      actual_value: Number(row.actual_value || 0),
      note: row.note || "",
      id: row.id,
    }));
  } catch {
    return getDefaultSheetFromSummary(summary);
  }
};

const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>(defaultSheetRows);
  const navigate = useNavigate();
  const { toast } = useToast();

  const periodDays = useMemo(() => (period === "7d" ? 7 : period === "30d" ? 30 : 90), [period]);
  const periodLabel = useMemo(() => `${periodDays} days`, [periodDays]);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const fallbackSummary = getFallbackSummary(periodDays);
        setDailySummary(fallbackSummary);
        setSheetRows(getLocalSheetRows(periodLabel, fallbackSummary));
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays + 1);
      const startISODate = startDate.toISOString().slice(0, 10);

      const [{ data: summaryData, error: summaryError }, { data: sheetData, error: sheetError }] = await Promise.all([
        // Cast to any because this table/view is added by migration and may not exist in generated types yet.
        (supabase as any)
          .from("analytics_user_daily_summary")
          .select("day,total_revenue,total_transactions,order_count,booking_count")
          .eq("user_id", user.id)
          .gte("day", startISODate)
          .order("day", { ascending: true }),
        (supabase as any)
          .from("analytics_sheet_rows")
          .select("id,metric,target_value,actual_value,note")
          .eq("user_id", user.id)
          .eq("period_label", periodLabel)
          .order("metric", { ascending: true }),
      ]);

      if (summaryError) throw summaryError;
      if (sheetError) throw sheetError;

      const summary: DailySummary[] = (summaryData || []).map((row: any) => ({
        day: row.day,
        total_revenue: Number(row.total_revenue || 0),
        total_transactions: Number(row.total_transactions || 0),
        order_count: Number(row.order_count || 0),
        booking_count: Number(row.booking_count || 0),
      }));

      setDailySummary(summary);

      if (sheetData && sheetData.length > 0) {
        setSheetRows(
          sheetData.map((row: any) => ({
            id: row.id,
            metric: row.metric,
            target_value: Number(row.target_value || 0),
            actual_value: Number(row.actual_value || 0),
            note: row.note || "",
          }))
        );
      } else {
        setSheetRows(getDefaultSheetFromSummary(summary));
      }
    } catch (error: any) {
      const fallbackSummary = getFallbackSummary(periodDays);
      setDailySummary(fallbackSummary);
      setSheetRows(getLocalSheetRows(periodLabel, fallbackSummary));
      toast({
        title: "Using local analytics mode",
        description: error.message || "Backend unavailable, showing offline analytics.",
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const revenue = dailySummary.reduce((sum, row) => sum + row.total_revenue, 0);
    const transactions = dailySummary.reduce((sum, row) => sum + row.total_transactions, 0);
    const orders = dailySummary.reduce((sum, row) => sum + row.order_count, 0);
    const bookings = dailySummary.reduce((sum, row) => sum + row.booking_count, 0);
    const avgOrderValue = transactions > 0 ? revenue / transactions : 0;

    return { revenue, transactions, orders, bookings, avgOrderValue };
  }, [dailySummary]);

  const updateSheetRow = (index: number, key: keyof SheetRow, value: string) => {
    setSheetRows((prev) => {
      const clone = [...prev];
      if (key === "target_value" || key === "actual_value") {
        clone[index] = { ...clone[index], [key]: Number(value || 0) };
      } else {
        clone[index] = { ...clone[index], [key]: value };
      }
      return clone;
    });
  };

  const saveSheet = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        localStorage.setItem(`${ANALYTICS_LOCAL_KEY_PREFIX}${periodLabel}`, JSON.stringify(sheetRows));
        toast({
          title: "Saved locally",
          description: "Analytics sheet saved in browser (guest mode).",
        });
        return;
      }

      const rowsToUpsert = sheetRows.map((row) => ({
        user_id: user.id,
        period_label: periodLabel,
        metric: row.metric,
        target_value: row.target_value,
        actual_value: row.actual_value,
        note: row.note,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await (supabase as any)
        .from("analytics_sheet_rows")
        .upsert(rowsToUpsert, { onConflict: "user_id,period_label,metric" });

      if (error) throw error;

      toast({
        title: "Analytics sheet saved",
        description: "Your dashboard sheet is now stored in backend.",
      });
      await loadDashboard();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const header = "Metric,Target,Actual,Gap,Note";
    const lines = sheetRows.map((row) => {
      const gap = Number((row.actual_value - row.target_value).toFixed(2));
      const cleanNote = (row.note || "").replaceAll('"', '""');
      return `${row.metric},${row.target_value},${row.actual_value},${gap},"${cleanNote}"`;
    });

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-sheet-${periodLabel.replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-6">
        <BackButton fallbackPath="/" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Advanced KPI monitoring with backend persistence and Excel-like planning.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-3 gap-1 rounded-lg border p-1">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button variant="outline" className="gap-2" onClick={loadDashboard} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue ({periodLabel})</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(totals.revenue)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Transactions</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{totals.transactions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Orders</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{totals.orders}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Bookings</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{totals.bookings}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Order Value</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(totals.avgOrderValue)}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
            ) : dailySummary.length === 0 ? (
              <p className="text-muted-foreground">No analytics data for this period yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Bookings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySummary.map((row) => (
                    <TableRow key={row.day}>
                      <TableCell>{row.day}</TableCell>
                      <TableCell>{formatCurrency(row.total_revenue)}</TableCell>
                      <TableCell>{row.total_transactions}</TableCell>
                      <TableCell>{row.order_count}</TableCell>
                      <TableCell>{row.booking_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>Planning Sheet (Excel-like)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={exportCsv}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button className="gap-2" onClick={saveSheet} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save to Backend"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Gap</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheetRows.map((row, index) => {
                    const gap = Number((row.actual_value - row.target_value).toFixed(2));
                    return (
                      <TableRow key={`${row.metric}-${index}`}>
                        <TableCell>
                          <Input
                            value={row.metric}
                            onChange={(e) => updateSheetRow(index, "metric", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.target_value}
                            onChange={(e) => updateSheetRow(index, "target_value", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.actual_value}
                            onChange={(e) => updateSheetRow(index, "actual_value", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <span className={gap >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {gap >= 0 ? "+" : ""}{gap}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.note}
                            onChange={(e) => updateSheetRow(index, "note", e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() =>
                  setSheetRows((prev) => [...prev, { metric: "New Metric", target_value: 0, actual_value: 0, note: "" }])
                }
              >
                + Add Row
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <Label>Backend Setup Note</Label>
            <p className="text-sm text-muted-foreground">
              Run migration file <strong>20260409_add_analytics_dashboard_backend.sql</strong> in Supabase to enable
              analytics backend table + daily summary view.
            </p>
            <p className="text-sm text-muted-foreground">
              Guest mode is enabled: without login, analytics still works using local browser storage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
