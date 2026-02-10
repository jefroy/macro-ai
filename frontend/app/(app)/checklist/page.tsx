"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addChecklistItem,
  deleteChecklistItem,
  getChecklist,
  getChecklistStreak,
  toggleChecklistItem,
  type ChecklistItem,
} from "@/lib/api/checklist";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Flame, Plus, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ChecklistPage() {
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["checklist", "today"],
    queryFn: () => getChecklist(),
    refetchInterval: 30_000,
  });

  const { data: streak } = useQuery({
    queryKey: ["checklist-streak"],
    queryFn: getChecklistStreak,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      queryClient.invalidateQueries({ queryKey: ["checklist-streak"] });
    },
    onError: (err: Error) => toast.error(err.message || "Cannot toggle auto-check items"),
  });

  const addMutation = useMutation({
    mutationFn: (title: string) => addChecklistItem(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      setNewItem("");
      toast.success("Item added");
    },
    onError: () => toast.error("Failed to add item"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      toast.success("Item removed");
    },
    onError: (err: Error) => toast.error(err.message || "Cannot delete this item"),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    addMutation.mutate(newItem.trim());
  }

  const checked = items.filter((i) => i.checked).length;
  const total = items.length;
  const completion = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Daily Checklist</h2>
        <div className="flex items-center gap-3">
          {streak && streak.streak > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak.streak} day streak
            </Badge>
          )}
          <Badge variant={completion >= 80 ? "default" : "secondary"}>
            {checked}/{total} · {completion}%
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            completion >= 80 ? "bg-emerald-500" : completion >= 50 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${completion}%` }}
        />
      </div>

      {/* Checklist items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Today&apos;s Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item: ChecklistItem) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                item.checked ? "bg-emerald-500/5 border-emerald-500/20" : ""
              }`}
            >
              <button
                className="flex items-center gap-3 text-sm"
                onClick={() => {
                  if (item.type === "custom") toggleMutation.mutate(item.id);
                }}
                disabled={item.type === "auto"}
              >
                {item.checked ? (
                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                  {item.title}
                </span>
                {item.type === "auto" && (
                  <span className="text-xs text-muted-foreground">(auto)</span>
                )}
              </button>
              {item.type === "custom" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Loading checklist...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add custom item */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Add Custom Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="e.g. Take creatine, Drink 2L water..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <Button type="submit" disabled={addMutation.isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
