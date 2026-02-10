"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getChecklist,
  getChecklistStreak,
  type ChecklistItem,
} from "@/lib/api/checklist";
import {
  getDailyInsights,
  getDailyTotals,
  getFoodLog,
  getNutrientAlerts,
  type DailyInsight,
  type FoodLogEntry,
  type NutrientAlert,
} from "@/lib/api/food";
import { getMe } from "@/lib/api/user";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Flame,
  Info,
  Lightbulb,
  Square,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getMe,
  });

  const { data: totals, isLoading: totalsLoading } = useQuery({
    queryKey: ["daily-totals", "today"],
    queryFn: () => getDailyTotals(),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["food-log", "today"],
    queryFn: () => getFoodLog(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["nutrient-alerts", "today"],
    queryFn: () => getNutrientAlerts(),
    refetchInterval: 60_000,
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["daily-insights", "today"],
    queryFn: () => getDailyInsights(),
    refetchInterval: 60_000,
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ["checklist", "today"],
    queryFn: () => getChecklist(),
    refetchInterval: 30_000,
  });

  const { data: streak } = useQuery({
    queryKey: ["checklist-streak"],
    queryFn: getChecklistStreak,
  });

  const t = user?.targets;
  const c = totals;

  const macros = [
    {
      label: "Calories",
      current: c?.calories ?? 0,
      target: t?.calories ?? 0,
      unit: "",
      color: "bg-violet-500",
    },
    {
      label: "Protein",
      current: c?.protein_g ?? 0,
      target: t?.protein_g ?? 0,
      unit: "g",
      color: "bg-blue-500",
    },
    {
      label: "Carbs",
      current: c?.carbs_g ?? 0,
      target: t?.carbs_g ?? 0,
      unit: "g",
      color: "bg-amber-500",
    },
    {
      label: "Fat",
      current: c?.fat_g ?? 0,
      target: t?.fat_g ?? 0,
      unit: "g",
      color: "bg-red-500",
    },
  ];

  // Secondary nutrients (no user-set target, display if non-zero)
  const secondaryNutrients = [
    { label: "Fiber", value: c?.fiber_g ?? 0, target: 25, unit: "g" },
    { label: "Sugar", value: c?.sugar_g ?? 0, target: 50, unit: "g" },
    { label: "Sodium", value: c?.sodium_mg ?? 0, target: 2300, unit: "mg" },
    { label: "Sat. Fat", value: c?.saturated_fat_g ?? 0, target: 20, unit: "g" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(userLoading || totalsLoading) ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))
        ) : macros.map((m) => {
          const pct = m.target > 0 ? Math.min((m.current / m.target) * 100, 100) : 0;
          return (
            <Card key={m.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {m.current.toFixed(0)}
                  {m.unit} / {m.target}
                  {m.unit}
                </p>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${m.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })
        }
      </div>

      {/* Secondary Nutrients */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Micronutrients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
            {secondaryNutrients.map((n) => {
              const pct = n.target > 0 ? Math.min((n.value / n.target) * 100, 100) : 0;
              const isOver = n.value > n.target;
              return (
                <div key={n.label}>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{n.label}</span>
                    <span className={isOver ? "text-amber-500 font-medium" : ""}>
                      {n.value.toFixed(0)}/{n.target}{n.unit}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Nutrient Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert: NutrientAlert) => (
              <div
                key={alert.nutrient}
                className={`flex items-start gap-3 rounded-md border px-3 py-2 text-sm ${
                  alert.severity === "warning"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-blue-500/30 bg-blue-500/5"
                }`}
              >
                {alert.severity === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                )}
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Daily Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4" />
              Daily Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight: DailyInsight, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm"
              >
                {insight.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : insight.type === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                )}
                <span>{insight.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Checklist Widget */}
      {checklistItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Daily Checklist
                {streak && streak.streak > 0 && (
                  <span className="flex items-center gap-1 text-xs text-orange-500">
                    <Flame className="h-3 w-3" />
                    {streak.streak}d
                  </span>
                )}
              </span>
              <Link
                href="/checklist"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 h-1.5 rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  checklistItems.filter((i: ChecklistItem) => i.checked).length /
                    checklistItems.length >=
                  0.8
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
                style={{
                  width: `${Math.round(
                    (checklistItems.filter((i: ChecklistItem) => i.checked).length /
                      checklistItems.length) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="space-y-1.5">
              {checklistItems.slice(0, 4).map((item: ChecklistItem) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {item.checked ? (
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      item.checked ? "line-through text-muted-foreground" : ""
                    }
                  >
                    {item.title}
                  </span>
                </div>
              ))}
              {checklistItems.length > 4 && (
                <Link
                  href="/checklist"
                  className="block text-xs text-muted-foreground hover:text-foreground"
                >
                  +{checklistItems.length - 4} more
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground">
              No meals logged yet. Start by adding food to your log.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry: FoodLogEntry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{entry.food_name}</span>
                    <span className="ml-2 text-muted-foreground capitalize">
                      ({entry.meal})
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {entry.calories.toFixed(0)} kcal
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
