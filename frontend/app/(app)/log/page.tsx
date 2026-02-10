"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  copyMeal,
  createFood,
  deleteFoodLogEntry,
  getFavoriteFoods,
  getFoodLog,
  getRecentFoods,
  logFood,
  searchFoods,
  toggleFavoriteFood,
  type FoodItem,
  type FoodLogEntry,
  type RecentFood,
} from "@/lib/api/food";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Copy, Heart, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

type DialogView = "search" | "detail" | "custom" | "copy";

export default function FoodLogPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogView, setDialogView] = useState<DialogView>("search");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [meal, setMeal] = useState<string>("lunch");
  const [quantity, setQuantity] = useState("1");

  // Copy meal state
  const [copySourceDate, setCopySourceDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [copySourceMeal, setCopySourceMeal] = useState("lunch");
  const [copyTargetDate, setCopyTargetDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [copyTargetMeal, setCopyTargetMeal] = useState("dinner");

  // Custom food form state
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customServing, setCustomServing] = useState("1 serving");
  const [customServingGrams, setCustomServingGrams] = useState("100");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  const { data: entries = [] } = useQuery({
    queryKey: ["food-log", "today"],
    queryFn: () => getFoodLog(),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["food-search", searchQuery],
    queryFn: () => searchFoods(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const { data: recentFoods = [] } = useQuery({
    queryKey: ["recent-foods"],
    queryFn: () => getRecentFoods(),
  });

  const { data: favoriteFoods = [] } = useQuery({
    queryKey: ["favorite-foods"],
    queryFn: () => getFavoriteFoods(),
  });

  const logMutation = useMutation({
    mutationFn: logFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-log"] });
      queryClient.invalidateQueries({ queryKey: ["daily-totals"] });
      queryClient.invalidateQueries({ queryKey: ["recent-foods"] });
      resetDialog();
      toast.success("Food logged");
    },
    onError: () => toast.error("Failed to log food"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFoodLogEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-log"] });
      queryClient.invalidateQueries({ queryKey: ["daily-totals"] });
      toast.success("Entry removed");
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: toggleFavoriteFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-foods"] });
    },
  });

  const copyMutation = useMutation({
    mutationFn: copyMeal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["food-log"] });
      queryClient.invalidateQueries({ queryKey: ["daily-totals"] });
      resetDialog();
      toast.success(`Copied ${data.copied} entries`);
    },
    onError: () => toast.error("No entries found for that meal"),
  });

  const createFoodMutation = useMutation({
    mutationFn: createFood,
    onSuccess: (food) => {
      queryClient.invalidateQueries({ queryKey: ["food-search"] });
      setSelectedFood(food);
      setDialogView("detail");
      toast.success("Custom food created");
    },
    onError: () => toast.error("Failed to create food"),
  });

  function resetDialog() {
    setDialogOpen(false);
    setDialogView("search");
    setSelectedFood(null);
    setSearchQuery("");
    setQuantity("1");
    setCustomName("");
    setCustomBrand("");
    setCustomServing("1 serving");
    setCustomServingGrams("100");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
  }

  function handleLog() {
    if (!selectedFood) return;
    const qty = Number(quantity) || 1;
    logMutation.mutate({
      food_id: selectedFood.id,
      food_name: selectedFood.name,
      meal,
      serving_label: selectedFood.serving_label,
      quantity: qty,
      calories: selectedFood.calories * qty,
      protein_g: selectedFood.protein_g * qty,
      carbs_g: selectedFood.carbs_g * qty,
      fat_g: selectedFood.fat_g * qty,
      fiber_g: selectedFood.fiber_g * qty,
      sugar_g: selectedFood.sugar_g * qty,
      sodium_mg: selectedFood.sodium_mg * qty,
      saturated_fat_g: selectedFood.saturated_fat_g * qty,
    });
  }

  function handleRecentClick(recent: RecentFood) {
    setSelectedFood({
      id: recent.food_id || "",
      name: recent.food_name,
      brand: "",
      source: "recent",
      serving_label: recent.serving_label,
      serving_grams: 0,
      calories: recent.calories,
      protein_g: recent.protein_g,
      carbs_g: recent.carbs_g,
      fat_g: recent.fat_g,
      fiber_g: recent.fiber_g,
      sugar_g: recent.sugar_g,
      sodium_mg: recent.sodium_mg,
      saturated_fat_g: recent.saturated_fat_g,
    });
    setDialogView("detail");
  }

  function handleCreateCustomFood(e: React.FormEvent) {
    e.preventDefault();
    createFoodMutation.mutate({
      name: customName,
      brand: customBrand || undefined,
      serving_label: customServing,
      serving_grams: Number(customServingGrams) || 100,
      calories: Number(customCalories) || 0,
      protein_g: Number(customProtein) || 0,
      carbs_g: Number(customCarbs) || 0,
      fat_g: Number(customFat) || 0,
    });
  }

  function handleCopyMeal() {
    copyMutation.mutate({
      source_date: copySourceDate,
      source_meal: copySourceMeal,
      target_date: copyTargetDate,
      target_meal: copyTargetMeal,
    });
  }

  // Group entries by meal
  const grouped = MEALS.map((m) => ({
    meal: m,
    entries: entries.filter((e: FoodLogEntry) => e.meal === m),
  })).filter((g) => g.entries.length > 0);

  const favoriteIds = new Set(favoriteFoods.map((f) => f.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Food Log</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setDialogView("copy"); setDialogOpen(true); }}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Meal
          </Button>
          <Button onClick={() => { setDialogView("search"); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Food
          </Button>

          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {dialogView === "search" && "Log Food"}
                  {dialogView === "detail" && "Log Food"}
                  {dialogView === "custom" && "Create Custom Food"}
                  {dialogView === "copy" && "Copy Meal"}
                </DialogTitle>
              </DialogHeader>

              {dialogView === "copy" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Date</Label>
                      <Input
                        type="date"
                        value={copySourceDate}
                        onChange={(e) => setCopySourceDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Source Meal</Label>
                      <Select value={copySourceMeal} onValueChange={setCopySourceMeal}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEALS.map((m) => (
                            <SelectItem key={m} value={m} className="capitalize">
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Date</Label>
                      <Input
                        type="date"
                        value={copyTargetDate}
                        onChange={(e) => setCopyTargetDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Meal</Label>
                      <Select value={copyTargetMeal} onValueChange={setCopyTargetMeal}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEALS.map((m) => (
                            <SelectItem key={m} value={m} className="capitalize">
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetDialog}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCopyMeal}
                      disabled={copyMutation.isPending}
                    >
                      {copyMutation.isPending ? "Copying..." : "Copy Meal"}
                    </Button>
                  </div>
                </div>
              )}

              {dialogView === "search" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search foods..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>

                  {/* Search Results */}
                  {searchQuery.length >= 2 && searchResults && searchResults.results.length > 0 && (
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {searchResults.results.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => {
                            setSelectedFood(food);
                            setDialogView("detail");
                          }}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{food.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {food.serving_label}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {food.calories} kcal · {food.protein_g}g P
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                favoriteMutation.mutate(food.id);
                              }}
                              className="p-1"
                            >
                              <Heart
                                className={`h-3.5 w-3.5 ${
                                  favoriteIds.has(food.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 &&
                    searchResults?.results.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No foods found for &quot;{searchQuery}&quot;
                      </p>
                    )}

                  {/* Favorites Section */}
                  {searchQuery.length < 2 && favoriteFoods.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Favorites
                      </p>
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {favoriteFoods.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => {
                              setSelectedFood(food);
                              setDialogView("detail");
                            }}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <div className="flex items-center gap-2">
                              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                              <div>
                                <p className="font-medium">{food.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {food.serving_label}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {food.calories} kcal · {food.protein_g}g P
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Section */}
                  {searchQuery.length < 2 && recentFoods.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Recent
                      </p>
                      <div className="max-h-60 space-y-1 overflow-y-auto">
                        {recentFoods.map((recent) => (
                          <button
                            key={recent.food_name}
                            onClick={() => handleRecentClick(recent)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <div>
                              <p className="font-medium">{recent.food_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {recent.serving_label} · logged {recent.count}x
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {recent.calories} kcal · {recent.protein_g}g P
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create Custom Food button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDialogView("custom")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Custom Food
                  </Button>
                </div>
              )}

              {dialogView === "detail" && selectedFood && (
                <div className="space-y-4">
                  <div className="rounded-md border p-3">
                    <p className="font-medium">{selectedFood.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Per {selectedFood.serving_label}: {selectedFood.calories}{" "}
                      kcal · {selectedFood.protein_g}g P ·{" "}
                      {selectedFood.carbs_g}g C · {selectedFood.fat_g}g F
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meal</Label>
                      <Select value={meal} onValueChange={setMeal}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qty">Servings</Label>
                      <Input
                        id="qty"
                        type="number"
                        step="0.5"
                        min="0.25"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                  </div>

                  {Number(quantity) > 0 && (
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium">Total</p>
                      <p>
                        {(selectedFood.calories * Number(quantity)).toFixed(0)}{" "}
                        kcal ·{" "}
                        {(selectedFood.protein_g * Number(quantity)).toFixed(0)}g P
                        ·{" "}
                        {(selectedFood.carbs_g * Number(quantity)).toFixed(0)}g C ·{" "}
                        {(selectedFood.fat_g * Number(quantity)).toFixed(0)}g F
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFood(null);
                        setDialogView("search");
                        setQuantity("1");
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleLog}
                      disabled={logMutation.isPending}
                    >
                      {logMutation.isPending ? "Logging..." : "Log Food"}
                    </Button>
                  </div>
                </div>
              )}

              {dialogView === "custom" && (
                <form onSubmit={handleCreateCustomFood} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Homemade Granola"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Serving Label</Label>
                      <Input
                        value={customServing}
                        onChange={(e) => setCustomServing(e.target.value)}
                        placeholder="e.g. 1 cup"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Serving (g)</Label>
                      <Input
                        type="number"
                        value={customServingGrams}
                        onChange={(e) => setCustomServingGrams(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Calories *</Label>
                      <Input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Protein (g) *</Label>
                      <Input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Carbs (g) *</Label>
                      <Input
                        type="number"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fat (g) *</Label>
                      <Input
                        type="number"
                        value={customFat}
                        onChange={(e) => setCustomFat(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setDialogView("search")}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      type="submit"
                      disabled={createFoodMutation.isPending}
                    >
                      {createFoodMutation.isPending
                        ? "Creating..."
                        : "Create & Log"}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No food logged today. Tap &quot;Add Food&quot; to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(({ meal: mealName, entries: mealEntries }) => (
          <Card key={mealName}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 capitalize">
                {mealName}
                <Badge variant="secondary">
                  {mealEntries
                    .reduce((sum: number, e: FoodLogEntry) => sum + e.calories, 0)
                    .toFixed(0)}{" "}
                  kcal
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mealEntries.map((entry: FoodLogEntry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{entry.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.quantity}× {entry.serving_label} ·{" "}
                      {entry.calories.toFixed(0)} kcal · {entry.protein_g.toFixed(0)}g P
                    </p>
                  </div>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    }
                    title="Delete food entry?"
                    description={`Remove "${entry.food_name}" from your log?`}
                    onConfirm={() => deleteMutation.mutate(entry.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
