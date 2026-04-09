import { useEffect, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type BudgetValues = {
  monthlyIncome: string;
  fixedExpenses: string;
  variableExpenses: string;
  savingsGoal: string;
};

const defaultValues: BudgetValues = {
  monthlyIncome: "",
  fixedExpenses: "",
  variableExpenses: "",
  savingsGoal: "",
};

const parseValue = (value: string) => Number(value || 0);

const BudgetCalculatorDialog = () => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<BudgetValues>(defaultValues);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    loadBudgetProfile();
  }, [open]);

  const loadBudgetProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("budget_profiles")
        .select("monthly_income,fixed_expenses,variable_expenses,savings_goal")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      setValues({
        monthlyIncome: String(data.monthly_income ?? ""),
        fixedExpenses: String(data.fixed_expenses ?? ""),
        variableExpenses: String(data.variable_expenses ?? ""),
        savingsGoal: String(data.savings_goal ?? ""),
      });
    } catch (error: any) {
      toast({
        title: "Budget load failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculations = useMemo(() => {
    const income = parseValue(values.monthlyIncome);
    const fixed = parseValue(values.fixedExpenses);
    const variable = parseValue(values.variableExpenses);
    const goal = parseValue(values.savingsGoal);

    const totalExpenses = fixed + variable;
    const remaining = income - totalExpenses;
    const dailyBudget = remaining > 0 ? remaining / 30 : 0;
    const monthsToGoal = goal > 0 && remaining > 0 ? goal / remaining : null;

    return { income, totalExpenses, remaining, dailyBudget, monthsToGoal };
  }, [values]);

  const updateValue = (key: keyof BudgetValues, next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }));
  };

  const saveBudget = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Sign in required",
          description: "Sign in to save your budget profile.",
        });
        return;
      }

      const { error } = await supabase.from("budget_profiles").upsert(
        {
          user_id: user.id,
          monthly_income: calculations.income,
          fixed_expenses: parseValue(values.fixedExpenses),
          variable_expenses: parseValue(values.variableExpenses),
          savings_goal: parseValue(values.savingsGoal),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast({
        title: "Budget saved",
        description: "Your budget profile is now stored in the backend.",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Budget save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 hidden md:flex">
          <Calculator className="w-4 h-4" />
          Budget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Budget Calculator</DialogTitle>
          <DialogDescription>
            Plan monthly spending and optionally save your profile to Supabase.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyIncome">Monthly Income</Label>
            <Input
              id="monthlyIncome"
              type="number"
              min={0}
              value={values.monthlyIncome}
              onChange={(e) => updateValue("monthlyIncome", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fixedExpenses">Fixed Expenses</Label>
            <Input
              id="fixedExpenses"
              type="number"
              min={0}
              value={values.fixedExpenses}
              onChange={(e) => updateValue("fixedExpenses", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variableExpenses">Variable Expenses</Label>
            <Input
              id="variableExpenses"
              type="number"
              min={0}
              value={values.variableExpenses}
              onChange={(e) => updateValue("variableExpenses", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="savingsGoal">Savings Goal</Label>
            <Input
              id="savingsGoal"
              type="number"
              min={0}
              value={values.savingsGoal}
              onChange={(e) => updateValue("savingsGoal", e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-muted/30 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total expenses</span>
            <span className="font-semibold">${calculations.totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly remaining</span>
            <span className={calculations.remaining >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
              ${calculations.remaining.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Recommended daily budget</span>
            <span className="font-semibold">${calculations.dailyBudget.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Months to goal</span>
            <span className="font-semibold">
              {calculations.monthsToGoal ? calculations.monthsToGoal.toFixed(1) : "-"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={saveBudget} disabled={saving}>
            {saving ? "Saving..." : "Save to Backend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetCalculatorDialog;
