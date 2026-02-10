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
import { searchFoods, type FoodItem } from "@/lib/api/food";
import {
  createRecipe,
  deleteRecipe,
  listRecipes,
  logRecipe,
  type IngredientInput,
  type Recipe,
} from "@/lib/api/recipes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IngredientDraft {
  food: FoodItem;
  quantity: number;
}

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logRecipeId, setLogRecipeId] = useState("");
  const [logMeal, setLogMeal] = useState("lunch");
  const [logServings, setLogServings] = useState("1");

  // Create recipe form
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeServings, setRecipeServings] = useState("1");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: listRecipes,
  });

  const { data: foodSearchResults } = useQuery({
    queryKey: ["food-search-recipe", ingredientSearch],
    queryFn: () => searchFoods(ingredientSearch),
    enabled: ingredientSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      resetCreateDialog();
      toast.success("Recipe created");
    },
    onError: () => toast.error("Failed to create recipe"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe deleted");
    },
  });

  const logMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { meal: string; servings: number } }) =>
      logRecipe(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-log"] });
      queryClient.invalidateQueries({ queryKey: ["daily-totals"] });
      setLogOpen(false);
      toast.success("Recipe logged");
    },
    onError: () => toast.error("Failed to log recipe"),
  });

  function resetCreateDialog() {
    setCreateOpen(false);
    setRecipeName("");
    setRecipeDescription("");
    setRecipeServings("1");
    setIngredients([]);
    setIngredientSearch("");
    setShowIngredientSearch(false);
  }

  function addIngredient(food: FoodItem) {
    setIngredients((prev) => [...prev, { food, quantity: 1 }]);
    setIngredientSearch("");
    setShowIngredientSearch(false);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngredientQty(index: number, qty: number) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, quantity: qty } : ing))
    );
  }

  function handleCreate() {
    if (!recipeName.trim() || ingredients.length === 0) return;
    const ingredientInputs: IngredientInput[] = ingredients.map((ing) => ({
      food_id: ing.food.id,
      quantity: ing.quantity,
    }));
    createMutation.mutate({
      name: recipeName.trim(),
      description: recipeDescription.trim() || undefined,
      servings: Number(recipeServings) || 1,
      ingredients: ingredientInputs,
    });
  }

  function handleLog() {
    logMutation.mutate({
      id: logRecipeId,
      data: {
        meal: logMeal,
        servings: Number(logServings) || 1,
      },
    });
  }

  // Calculate running totals
  const runningTotal = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.food.calories * ing.quantity,
      protein: acc.protein + ing.food.protein_g * ing.quantity,
      carbs: acc.carbs + ing.food.carbs_g * ing.quantity,
      fat: acc.fat + ing.food.fat_g * ing.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const servingsNum = Number(recipeServings) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Recipes</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Recipe
        </Button>
      </div>

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <BookOpen className="h-8 w-8" />
              <p>No recipes yet. Create your first recipe to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: Recipe) => (
            <Card key={recipe.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{recipe.name}</span>
                  <Badge variant="secondary">
                    {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
                {recipe.description && (
                  <p className="text-xs text-muted-foreground">
                    {recipe.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Per serving</p>
                    <p className="font-medium">
                      {recipe.per_serving.calories.toFixed(0)} kcal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recipe.per_serving.protein_g.toFixed(0)}g P ·{" "}
                      {recipe.per_serving.carbs_g.toFixed(0)}g C ·{" "}
                      {recipe.per_serving.fat_g.toFixed(0)}g F
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {recipe.ingredients.length} ingredient
                      {recipe.ingredients.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setLogRecipeId(recipe.id);
                      setLogOpen(true);
                    }}
                  >
                    <UtensilsCrossed className="mr-1 h-3 w-3" />
                    Log
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                    title="Delete recipe?"
                    description={`Remove "${recipe.name}" permanently?`}
                    onConfirm={() => deleteMutation.mutate(recipe.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Recipe Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetCreateDialog(); else setCreateOpen(true); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipe Name *</Label>
              <Input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g. Protein Bowl"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Servings</Label>
              <Input
                type="number"
                min="1"
                value={recipeServings}
                onChange={(e) => setRecipeServings(e.target.value)}
              />
            </div>

            {/* Ingredient List */}
            <div className="space-y-2">
              <Label>Ingredients</Label>
              {ingredients.length > 0 && (
                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ing.food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(ing.food.calories * ing.quantity).toFixed(0)} kcal ·{" "}
                          {(ing.food.protein_g * ing.quantity).toFixed(0)}g P
                        </p>
                      </div>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.25"
                        className="w-20"
                        value={ing.quantity}
                        onChange={(e) =>
                          updateIngredientQty(idx, Number(e.target.value) || 1)
                        }
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeIngredient(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Ingredient Search */}
              {showIngredientSearch ? (
                <div className="space-y-2 rounded-md border p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search foods to add..."
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                  {foodSearchResults && foodSearchResults.results.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {foodSearchResults.results.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => addIngredient(food)}
                          className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          <span className="font-medium">{food.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {food.calories} kcal · {food.protein_g}g P
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowIngredientSearch(false);
                      setIngredientSearch("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIngredientSearch(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Ingredient
                </Button>
              )}
            </div>

            {/* Running Total */}
            {ingredients.length > 0 && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span>
                    {runningTotal.calories.toFixed(0)} kcal ·{" "}
                    {runningTotal.protein.toFixed(0)}g P ·{" "}
                    {runningTotal.carbs.toFixed(0)}g C ·{" "}
                    {runningTotal.fat.toFixed(0)}g F
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Per serving</span>
                  <span>
                    {(runningTotal.calories / servingsNum).toFixed(0)} kcal ·{" "}
                    {(runningTotal.protein / servingsNum).toFixed(0)}g P ·{" "}
                    {(runningTotal.carbs / servingsNum).toFixed(0)}g C ·{" "}
                    {(runningTotal.fat / servingsNum).toFixed(0)}g F
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetCreateDialog}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={
                  !recipeName.trim() ||
                  ingredients.length === 0 ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? "Creating..." : "Create Recipe"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Recipe Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Meal</Label>
              <Select value={logMeal} onValueChange={setLogMeal}>
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
              <Label>Servings</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={logServings}
                onChange={(e) => setLogServings(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleLog}
              disabled={logMutation.isPending}
            >
              {logMutation.isPending ? "Logging..." : "Log Recipe"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
