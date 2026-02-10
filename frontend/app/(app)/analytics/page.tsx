"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRangeTotals } from "@/lib/api/analytics";
import { getChecklistStreak } from "@/lib/api/checklist";
import type { DailyTotals } from "@/lib/api/food";
import { exportFoodLog, getWeeklyReport, type WeeklyReport } from "@/lib/api/reports";
import {
  deleteWeightEntry,
  getWeightTrend,
  logWeight,
  type WeightTrend,
} from "@/lib/api/weight";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Flame,
  Info,
  Scale,
  TrendingDown,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const MACRO_COLORS = {
  protein: "#3b82f6",
  carbs: "#f59e0b",
  fat: "#ef4444",
  calories: "#8b5cf6",
};

const MICRO_LIMITS: Record<string, { label: string; limit: number; unit: string; direction: "under" | "over" }> = {
  fiber_g: { label: "Fiber", limit: 25, unit: "g", direction: "under" },
  sugar_g: { label: "Sugar", limit: 50, unit: "g", direction: "over" },
  sodium_mg: { label: "Sodium", limit: 2300, unit: "mg", direction: "over" },
  saturated_fat_g: { label: "Sat Fat", limit: 20, unit: "g", direction: "over" },
};

function getHeatmapColor(value: number, limit: number, direction: "under" | "over"): string {
  if (direction === "over") {
    const ratio = value / limit;
    if (ratio <= 0.6) return "bg-emerald-500/20";
    if (ratio <= 0.8) return "bg-emerald-500/40";
    if (ratio <= 1.0) return "bg-amber-500/40";
    return "bg-red-500/50";
  } else {
    // "under" — higher is better (fiber)
    const ratio = value / limit;
    if (ratio >= 1.0) return "bg-emerald-500/40";
    if (ratio >= 0.6) return "bg-amber-500/40";
    if (ratio > 0) return "bg-red-500/30";
    return "bg-muted";
  }
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [rangeDays, setRangeDays] = useState("14");
  const [weightInput, setWeightInput] = useState("");

  const days = parseInt(rangeDays);
  const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");

  const { data: rangeTotals = [] } = useQuery({
    queryKey: ["range-totals", startDate, endDate],
    queryFn: () => getRangeTotals(startDate, endDate),
  });

  const { data: weightTrend } = useQuery({
    queryKey: ["weight-trend", days],
    queryFn: () => getWeightTrend(days),
  });

  const { data: weeklyReport } = useQuery({
    queryKey: ["weekly-report"],
    queryFn: () => getWeeklyReport(),
  });

  const { data: streak } = useQuery({
    queryKey: ["checklist-streak"],
    queryFn: getChecklistStreak,
  });

  const logWeightMutation = useMutation({
    mutationFn: logWeight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-trend"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-report"] });
      setWeightInput("");
      toast.success("Weight logged");
    },
    onError: () => toast.error("Failed to log weight"),
  });

  const deleteWeightMutation = useMutation({
    mutationFn: deleteWeightEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-trend"] });
      toast.success("Entry removed");
    },
  });

  function handleLogWeight(e: React.FormEvent) {
    e.preventDefault();
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    logWeightMutation.mutate({ weight_kg: kg });
  }

  // Chart data: format dates for display
  const chartData = rangeTotals.map((d: DailyTotals) => ({
    date: format(new Date(d.date), "MMM d"),
    calories: Math.round(d.calories),
    protein: Math.round(d.protein_g),
    carbs: Math.round(d.carbs_g),
    fat: Math.round(d.fat_g),
  }));

  // Latest day macro breakdown for pie chart
  const latest = rangeTotals[rangeTotals.length - 1];
  const pieData = latest
    ? [
        { name: "Protein", value: Math.round(latest.protein_g), color: MACRO_COLORS.protein },
        { name: "Carbs", value: Math.round(latest.carbs_g), color: MACRO_COLORS.carbs },
        { name: "Fat", value: Math.round(latest.fat_g), color: MACRO_COLORS.fat },
      ]
    : [];

  // Weight chart data
  const weightChartData = (weightTrend?.entries || []).map((e) => ({
    date: format(new Date(e.date), "MMM d"),
    weight: e.weight_kg,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <Select value={rangeDays} onValueChange={setRangeDays}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Report Highlights */}
      {weeklyReport && weeklyReport.highlights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="mb-3 flex flex-wrap gap-3 text-sm">
              <span className="text-muted-foreground">
                {weeklyReport.days_logged}/7 days logged
              </span>
              {streak && streak.streak > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {streak.streak} day streak
                </Badge>
              )}
              {weeklyReport.weight_change != null && (
                <span className="text-muted-foreground">
                  Weight: {weeklyReport.weight_change > 0 ? "+" : ""}
                  {weeklyReport.weight_change} kg
                </span>
              )}
              {Object.entries(weeklyReport.vs_targets).map(([key, v]) => (
                <Badge
                  key={key}
                  variant={v.status === "on_track" ? "default" : "secondary"}
                >
                  {key.replace("_g", "").replace("_", " ")}: {v.percent}%
                </Badge>
              ))}
            </div>
            {weeklyReport.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                {h.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : h.type === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                )}
                <span>{h.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Calorie Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Calorie Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No data yet. Log some food to see trends.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke={MACRO_COLORS.calories}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Macro Bar Chart + Pie */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Daily Macros</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="protein" fill={MACRO_COLORS.protein} name="Protein (g)" />
                  <Bar dataKey="carbs" fill={MACRO_COLORS.carbs} name="Carbs (g)" />
                  <Bar dataKey="fat" fill={MACRO_COLORS.fat} name="Fat (g)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macro Split (Latest Day)</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}g`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Micronutrient Heatmap */}
      {rangeTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Micronutrient Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop: Table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-background px-2 py-1 text-left font-medium">
                      Nutrient
                    </th>
                    {rangeTotals.map((d: DailyTotals) => (
                      <th key={d.date} className="px-1 py-1 text-center font-normal text-muted-foreground">
                        {format(new Date(d.date), "M/d")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MICRO_LIMITS).map(([key, cfg]) => (
                    <tr key={key}>
                      <td className="sticky left-0 bg-background px-2 py-1 font-medium">
                        {cfg.label}
                        <span className="ml-1 text-muted-foreground">
                          ({cfg.direction === "over" ? `<${cfg.limit}` : `>${cfg.limit}`}{cfg.unit})
                        </span>
                      </td>
                      {rangeTotals.map((d: DailyTotals) => {
                        const value = d[key as keyof DailyTotals] as number;
                        return (
                          <td key={d.date} className="px-1 py-1 text-center">
                            <div
                              className={`mx-auto flex h-7 w-10 items-center justify-center rounded ${getHeatmapColor(value, cfg.limit, cfg.direction)}`}
                              title={`${cfg.label}: ${value.toFixed(0)}${cfg.unit}`}
                            >
                              {value > 0 ? value.toFixed(0) : "-"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Stacked card view */}
            <div className="md:hidden space-y-3">
              {rangeTotals.slice(-7).map((d: DailyTotals) => (
                <div key={d.date} className="rounded-md border p-3">
                  <p className="mb-2 text-sm font-medium">
                    {format(new Date(d.date), "MMM d")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(MICRO_LIMITS).map(([key, cfg]) => {
                      const value = d[key as keyof DailyTotals] as number;
                      return (
                        <div
                          key={key}
                          className={`rounded px-2 py-1 text-xs ${getHeatmapColor(value, cfg.limit, cfg.direction)}`}
                        >
                          {cfg.label}: {value > 0 ? value.toFixed(0) : "-"}{cfg.unit}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-emerald-500/40" /> Good
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-amber-500/40" /> Caution
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-red-500/50" /> Over limit
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Tracking
            {weightTrend?.rolling_avg_7d && (
              <Badge variant="secondary">
                7d avg: {weightTrend.rolling_avg_7d} kg
              </Badge>
            )}
            {weightTrend?.change_30d != null && (
              <Badge variant={weightTrend.change_30d <= 0 ? "default" : "secondary"}>
                {weightTrend.change_30d > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {weightTrend.change_30d > 0 ? "+" : ""}
                {weightTrend.change_30d} kg
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Log Weight Form */}
          <form onSubmit={handleLogWeight} className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Today&apos;s Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="75.0"
                className="w-32"
              />
            </div>
            <Button type="submit" disabled={logWeightMutation.isPending}>
              {logWeightMutation.isPending ? "Logging..." : "Log"}
            </Button>
          </form>

          {/* Weight Chart */}
          {weightChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  className="text-xs"
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Weight (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Recent Entries */}
          {weightTrend && weightTrend.entries.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Recent Entries</p>
              {[...weightTrend.entries].reverse().slice(0, 7).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                >
                  <span>
                    {format(new Date(e.date), "MMM d, yyyy")} —{" "}
                    <span className="font-medium">{e.weight_kg} kg</span>
                    {e.note && (
                      <span className="ml-2 text-muted-foreground">
                        ({e.note})
                      </span>
                    )}
                  </span>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                    title="Delete weight entry?"
                    description={`Remove ${e.weight_kg} kg entry from ${format(new Date(e.date), "MMM d, yyyy")}?`}
                    onConfirm={() => deleteWeightMutation.mutate(e.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export your food log as CSV for the selected date range.
          </p>
          <Button
            variant="outline"
            onClick={() => exportFoodLog(startDate, endDate)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV ({rangeDays} days)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
