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
  calculateTDEE,
  completeOnboarding,
  type Targets,
} from "@/lib/api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Step = "profile" | "goals" | "review";

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("profile");

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");

  // Goals
  const [goal, setGoal] = useState("maintain");
  const [tdee, setTdee] = useState<number | null>(null);
  const [suggestedTargets, setSuggestedTargets] = useState<Targets | null>(null);

  // Editable targets (initialized from suggestion)
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");

  const onboardingMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      router.push("/dashboard");
    },
    onError: () => toast.error("Failed to save. Please try again."),
  });

  async function handleGoalsNext() {
    if (!age || !heightCm || !weightKg || !gender) {
      toast.error("Please complete your profile first.");
      setStep("profile");
      return;
    }

    try {
      const result = await calculateTDEE({
        weight_kg: Number(weightKg),
        height_cm: Number(heightCm),
        age: Number(age),
        gender,
        activity_level: activityLevel,
        goal,
      });
      setTdee(result.tdee);
      setSuggestedTargets(result.suggested_targets);

      const t = result.suggested_targets;
      setCalories(String(t.calories));
      setProteinG(String(t.protein_g));
      setCarbsG(String(t.carbs_g));
      setFatG(String(t.fat_g));

      setStep("review");
    } catch {
      toast.error("Failed to calculate targets.");
    }
  }

  function handleSubmit() {
    onboardingMutation.mutate({
      display_name: displayName,
      age: Number(age),
      height_cm: Number(heightCm),
      weight_kg: Number(weightKg),
      gender,
      activity_level: activityLevel,
      goal,
      calories: Number(calories),
      protein_g: Number(proteinG),
      carbs_g: Number(carbsG),
      fat_g: Number(fatG),
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold">Welcome to MacroAI</h2>
        <p className="text-muted-foreground">
          Let&apos;s set up your profile and nutrition targets.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {(["profile", "goals", "review"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              (["profile", "goals", "review"] as Step[]).indexOf(step) >= i
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Profile */}
      {step === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Info</CardTitle>
            <CardDescription>
              We use this to calculate your daily calorie and macro targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (desk job, little exercise)</SelectItem>
                  <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                  <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                  <SelectItem value="very_active">Very Active (athlete / physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => setStep("goals")}
              disabled={!age || !heightCm || !weightKg || !gender}
            >
              Next
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Goal */}
      {step === "goals" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Goal</CardTitle>
            <CardDescription>
              We&apos;ll calculate your targets based on your profile and goal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cut">Cut (lose fat, -500 kcal)</SelectItem>
                  <SelectItem value="maintain">Maintain weight</SelectItem>
                  <SelectItem value="bulk">Bulk (build muscle, +300 kcal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("profile")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleGoalsNext}>
                Calculate Targets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && suggestedTargets && (
        <Card>
          <CardHeader>
            <CardTitle>Your Targets</CardTitle>
            <CardDescription>
              TDEE: {tdee} kcal/day. Adjust these if you&apos;d like.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cal">Calories (kcal)</Label>
                <Input
                  id="cal"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prot">Protein (g)</Label>
                <Input
                  id="prot"
                  type="number"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carb">Carbs (g)</Label>
                <Input
                  id="carb"
                  type="number"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={fatG}
                  onChange={(e) => setFatG(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("goals")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={onboardingMutation.isPending}
              >
                {onboardingMutation.isPending ? "Saving..." : "Get Started"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
