"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyTemplate,
  listTemplates,
  type GoalTemplate,
} from "@/lib/api/templates";
import { getMe, updateProfile, updateTargets } from "@/lib/api/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getMe,
  });

  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const [targetsForm, setTargetsForm] = useState<Record<string, string>>({});

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const targetsMutation = useMutation({
    mutationFn: updateTargets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      toast.success("Targets updated");
    },
    onError: () => toast.error("Failed to update targets"),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: listTemplates,
  });

  const applyMutation = useMutation({
    mutationFn: applyTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      toast.success(data.message);
    },
    onError: () => toast.error("Failed to apply template. Complete your profile first."),
  });

  if (isLoading || !user) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, string | number> = {};
    for (const [key, val] of Object.entries(profileForm)) {
      if (val === "") continue;
      if (["age", "height_cm", "weight_kg"].includes(key)) {
        data[key] = Number(val);
      } else {
        data[key] = val;
      }
    }
    if (Object.keys(data).length > 0) {
      profileMutation.mutate(data);
    }
  }

  function handleTargetsSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, number> = {};
    for (const [key, val] of Object.entries(targetsForm)) {
      if (val === "") continue;
      data[key] = Number(val);
    }
    if (Object.keys(data).length > 0) {
      targetsMutation.mutate(data);
    }
  }

  const p = user.profile;
  const t = user.targets;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Profile</h2>

      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
          <CardDescription>
            This information helps calculate your daily targets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                defaultValue={p.display_name}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, display_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                defaultValue={p.age ?? ""}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, age: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                defaultValue={p.height_cm ?? ""}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, height_cm: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                defaultValue={p.weight_kg ?? ""}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, weight_kg: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                defaultValue={p.gender ?? ""}
                onValueChange={(v) =>
                  setProfileForm((f) => ({ ...f, gender: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select
                defaultValue={p.activity_level}
                onValueChange={(v) =>
                  setProfileForm((f) => ({ ...f, activity_level: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Lightly Active</SelectItem>
                  <SelectItem value="moderate">Moderately Active</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Goal Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Templates
            </CardTitle>
            <CardDescription>
              Apply a pre-built plan to auto-set your macro targets based on your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((tmpl: GoalTemplate) => (
                <div
                  key={tmpl.id}
                  className="flex flex-col justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{tmpl.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tmpl.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => applyMutation.mutate(tmpl.id)}
                    disabled={applyMutation.isPending}
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daily Targets</CardTitle>
          <CardDescription>Set your macro and calorie goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTargetsSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input
                id="calories"
                type="number"
                defaultValue={t.calories}
                onChange={(e) =>
                  setTargetsForm((f) => ({ ...f, calories: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                defaultValue={t.protein_g}
                onChange={(e) =>
                  setTargetsForm((f) => ({ ...f, protein_g: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                defaultValue={t.carbs_g}
                onChange={(e) =>
                  setTargetsForm((f) => ({ ...f, carbs_g: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                defaultValue={t.fat_g}
                onChange={(e) =>
                  setTargetsForm((f) => ({ ...f, fat_g: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                defaultValue={t.fiber_g}
                onChange={(e) =>
                  setTargetsForm((f) => ({ ...f, fiber_g: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={targetsMutation.isPending}>
                {targetsMutation.isPending ? "Saving..." : "Save Targets"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
