# MacroAI — Selector Reference

Complete selector reference for all interactive UI elements. Derived from reading the actual source code — these are the **real selectors**, not guesses.

---

## Global / Layout

| Element | Selector | Notes |
|---------|----------|-------|
| Sidebar (desktop) | `aside` | Hidden on mobile (`hidden md:block`) |
| Sidebar nav link | `aside a:has-text("Dashboard")` | Replace text for each nav item |
| Active nav link | `aside a.font-medium` | Has `bg-accent font-medium` when active |
| Mobile bottom nav | `nav.fixed.inset-x-0.bottom-0` | Visible only on `<md` viewport |
| Mobile nav link | `nav.fixed a:has-text("Dashboard")` | First 5 nav items only |
| Theme toggle (desktop) | `aside button:has-text("Toggle theme")` | Uses `sr-only` text; has Sun/Moon icons |
| Theme toggle (mobile) | `header button:has-text("Toggle theme")` | Same sr-only pattern |
| HTML theme class | `html.dark` or `html.light` | Check via `page.locator('html').getAttribute('class')` |

---

## Auth Pages

### Login (`/login`)

| Element | Selector | Notes |
|---------|----------|-------|
| Title | `text="MacroAI"` | CardTitle |
| Subtitle | `text="Sign in to your account"` | CardDescription |
| Email input | `#email` | `type="email"` |
| Password input | `#password` | `type="password"` |
| Sign in button | `button:has-text("Sign in")` | Changes to "Signing in..." while loading |
| Error message | `text="Invalid email or password"` | `.text-destructive` class |
| Register link | `a:has-text("Register")` | Links to `/register` |

### Register (`/register`)

| Element | Selector | Notes |
|---------|----------|-------|
| Title | `text="MacroAI"` | CardTitle |
| Subtitle | `text="Create your account"` | CardDescription |
| Email input | `#email` | `type="email"` |
| Password input | `#password` | `type="password"`, `minLength=8` |
| Create account button | `button:has-text("Create account")` | Changes to "Creating account..." |
| Error message | `text="Registration failed. Email may already be in use."` | `.text-destructive` |
| Sign in link | `a:has-text("Sign in")` | Links to `/login` |

---

## Onboarding (`/onboarding`)

### Step Indicators
| Element | Selector | Notes |
|---------|----------|-------|
| Progress bars (3) | `.h-1\\.5.flex-1.rounded-full` | `bg-primary` = active, `bg-muted` = inactive |

### Step 1: Profile

| Element | Selector | Notes |
|---------|----------|-------|
| Display Name | `#name` | Optional |
| Age | `#age` | `type="number"` |
| Height (cm) | `#height` | `type="number"` |
| Weight (kg) | `#weight` | `type="number"`, `step="0.1"` |
| Gender select trigger | First `[role="combobox"]` | Options: "Male", "Female" |
| Activity Level select | Second `[role="combobox"]` | Defaults to "Moderate" |
| Next button | `button:has-text("Next")` | Disabled if age/height/weight/gender empty |

### Step 2: Goals

| Element | Selector | Notes |
|---------|----------|-------|
| Goal select | `[role="combobox"]` | Options: "Cut (lose fat, -500 kcal)", "Maintain weight", "Bulk (build muscle, +300 kcal)" |
| Back button | `button:has-text("Back")` | Returns to Step 1 |
| Calculate button | `button:has-text("Calculate Targets")` | Calls TDEE API |

### Step 3: Review

| Element | Selector | Notes |
|---------|----------|-------|
| Calories input | `#cal` | Pre-filled from calculation |
| Protein input | `#prot` | Pre-filled |
| Carbs input | `#carb` | Pre-filled |
| Fat input | `#fat` | Pre-filled |
| TDEE display | `text=/TDEE: \d+ kcal/` | In CardDescription |
| Back button | `button:has-text("Back")` | Returns to Step 2 |
| Get Started button | `button:has-text("Get Started")` | Changes to "Saving..." |

---

## Dashboard (`/dashboard`)

| Element | Selector | Notes |
|---------|----------|-------|
| Heading | `h2:has-text("Dashboard")` | |
| Skeleton cards (loading) | `.h-4.w-20` inside Card (Skeleton) | 4 skeleton cards during load |
| Macro card labels | `text="Calories"`, `text="Protein"`, `text="Carbs"`, `text="Fat"` | CardTitle with `text-muted-foreground` |
| Macro card values | `.text-2xl.font-bold` | Format: `"X / Y"` or `"Xg / Yg"` |
| Progress bars | `.h-2.rounded-full.bg-muted` | Inner div has color class |
| Micronutrients card | `text="Micronutrients"` | Contains Fiber, Sugar, Sodium, Sat. Fat |
| Nutrient labels | `text="Fiber"`, `text="Sugar"`, `text="Sodium"`, `text="Sat. Fat"` | |
| Alerts card | `text="Alerts"` | Only visible if alerts exist |
| Daily Insights card | `text="Daily Insights"` | Only visible if insights exist |
| Checklist widget | `text="Daily Checklist"` | Only visible if checklist items exist |
| Checklist "View all" | `a:has-text("View all")` | Links to `/checklist` |
| Streak badge | `.text-orange-500` with Flame icon | `Nd` format (e.g., "3d") |
| Today's Meals card | `text="Today's Meals"` | |
| Empty meals message | `text="No meals logged yet. Start by adding food to your log."` | |
| Meal entry | `.text-sm.font-medium` inside meals card | Shows food name |

---

## Food Log (`/log`)

| Element | Selector | Notes |
|---------|----------|-------|
| Heading | `h2:has-text("Food Log")` | |
| Add Food button | `button:has-text("Add Food")` | Opens search dialog |
| Copy Meal button | `button:has-text("Copy Meal")` | Opens copy dialog |
| Empty state | `text='No food logged today. Tap "Add Food" to get started.'` | Shown when no entries |
| Meal section card | Card with capitalized meal name | "Breakfast", "Lunch", "Dinner", "Snack" |
| Meal badge | Badge inside CardTitle | Shows total kcal for that meal |
| Entry food name | `.text-sm.font-medium` inside entry row | |
| Entry details | `.text-xs.text-muted-foreground` | Format: `"Nx serving · X kcal · Xg P"` |
| Delete entry button | `button:has(svg.lucide-trash-2)` | Opens ConfirmDialog |

### Add Food Dialog (`role="dialog"`)

| Element | Selector | Context | Notes |
|---------|----------|---------|-------|
| Search input | `input[placeholder="Search foods..."]` | dialog | Auto-focused |
| Search results | `button .font-medium` | dialog `.max-h-80` | Food name text |
| Heart icon (unfavorited) | `svg.lucide-heart.text-muted-foreground` | result row | |
| Heart icon (favorited) | `svg.lucide-heart.fill-red-500` | result row | Has `fill-red-500 text-red-500` |
| Favorites section header | `text="Favorites"` (uppercase) | dialog | Visible when search empty + favorites exist |
| Recent section header | `text="Recent"` (uppercase) | dialog | Visible when search empty + recent exist |
| Recent "logged Nx" | `text=/logged \d+x/` | dialog | Count of times logged |
| Create Custom Food button | `button:has-text("Create Custom Food")` | dialog | |

### Food Detail View (inside dialog)

| Element | Selector | Notes |
|---------|----------|-------|
| Food name | `.font-medium` inside `.rounded-md.border.p-3` | |
| Serving info | `text=/Per .+: \d+ kcal/` | |
| Meal select trigger | `[role="combobox"]` (first in dialog) | Options: Breakfast, Lunch, Dinner, Snack |
| Quantity input | `#qty` | `type="number"`, `step="0.5"`, `min="0.25"` |
| Total line | `text="Total"` inside `.bg-muted.p-3` | Updates dynamically |
| Back button | `button:has-text("Back")` | Returns to search |
| Log Food button | `button:has-text("Log Food")` | Changes to "Logging..." |

### Custom Food Form (inside dialog)

| Element | Selector | Notes |
|---------|----------|-------|
| Name input | `input[placeholder="e.g. Homemade Granola"]` | Required |
| Brand input | `input[placeholder="Optional"]` | |
| Serving Label | `input[placeholder="e.g. 1 cup"]` | |
| Serving grams | First `input[type="number"]` in form | |
| Calories | Second `input[type="number"]` | Required |
| Protein | Third `input[type="number"]` | Required |
| Carbs | Fourth `input[type="number"]` | Required |
| Fat | Fifth `input[type="number"]` | Required |
| Back button | `button:has-text("Back")` | Returns to search |
| Create & Log button | `button:has-text("Create & Log")` | Changes to "Creating..." |

### Copy Meal Dialog (inside dialog)

| Element | Selector | Notes |
|---------|----------|-------|
| Source Date | First `input[type="date"]` | Defaults to today |
| Source Meal select | First `[role="combobox"]` | Options: Breakfast, Lunch, Dinner, Snack |
| Target Date | Second `input[type="date"]` | Defaults to today |
| Target Meal select | Second `[role="combobox"]` | |
| Cancel button | `button:has-text("Cancel")` | |
| Copy Meal button | `button:has-text("Copy Meal")` (last) | Changes to "Copying..." |

---

## Recipes (`/recipes`)

| Element | Selector | Notes |
|---------|----------|-------|
| Heading | `h2:has-text("Recipes")` | |
| New Recipe button | `button:has-text("New Recipe")` | |
| Empty state | `text="No recipes yet. Create your first recipe to get started."` | |
| Recipe card name | `.text-base` inside CardTitle | |
| Servings badge | Badge with `text=/\d+ servings?/` | |
| Per serving macros | `text=/\d+ kcal/` inside recipe card | |
| Log button | `button:has-text("Log")` | On recipe card |
| Delete button | `button:has(svg.lucide-trash-2)` | On recipe card |

### Create Recipe Dialog

| Element | Selector | Notes |
|---------|----------|-------|
| Recipe Name | `input[placeholder="e.g. Protein Bowl"]` | Required |
| Description | `input[placeholder="Optional description"]` | |
| Servings | First `input[type="number"]` | Min 1 |
| Add Ingredient button | `button:has-text("Add Ingredient")` | |
| Ingredient search | `input[placeholder="Search foods to add..."]` | Appears after clicking Add Ingredient |
| Ingredient qty inputs | `.w-20` input fields | One per ingredient |
| Running Total | `text="Total"` inside `.bg-muted.p-3` | |
| Per Serving line | `text="Per serving"` | |
| Cancel button | `button:has-text("Cancel")` | |
| Create Recipe button | `button:has-text("Create Recipe")` | Disabled until name + ingredients filled |

### Log Recipe Dialog

| Element | Selector | Notes |
|---------|----------|-------|
| Meal select | `[role="combobox"]` | Options: Breakfast, Lunch, Dinner, Snack |
| Servings input | `input[type="number"]` | `step="0.5"`, `min="0.5"` |
| Log Recipe button | `button:has-text("Log Recipe")` | |

---

## Profile (`/profile`)

| Element | Selector | Notes |
|---------|----------|-------|
| Heading | `h2:has-text("Profile")` | |
| Display Name | `#display_name` | |
| Age | `#age` | |
| Height | `#height` | ID is `height`, not `height_cm` |
| Weight | `#weight` | ID is `weight`, not `weight_kg` |
| Gender select | `[role="combobox"]` (in Personal Info card) | Options: Male, Female |
| Activity select | Next `[role="combobox"]` | Options: Sedentary, Lightly Active, Moderately Active, Active, Very Active |
| Save Changes button | `button:has-text("Save Changes")` | |
| Goal Templates card | `text="Goal Templates"` | |
| Template Apply buttons | `button:has-text("Apply")` | One per template |
| Calories target | `#calories` | |
| Protein target | `#protein` | |
| Carbs target | `#carbs` | |
| Fat target | `#fat` | |
| Fiber target | `#fiber` | |
| Save Targets button | `button:has-text("Save Targets")` | |

---

## Analytics (`/analytics`)

| Element | Selector | Notes |
|---------|----------|-------|
| Heading | `h2:has-text("Analytics")` | |
| Range selector | First `[role="combobox"]` | Options: "7 days", "14 days", "30 days", "90 days" |
| Weekly Summary card | `text="Weekly Summary"` | Only if report data exists |
| Calorie Trend card | `text="Calorie Trend"` | LineChart or empty state |
| Daily Macros card | `text="Daily Macros"` | BarChart |
| Macro Split card | `text="Macro Split"` | PieChart (donut) |
| Recharts SVG | `svg.recharts-surface` | Present when charts have data |
| Empty chart message | `text="No data yet"` | Shown when no data |
| Heatmap card | `text="Micronutrient Heatmap"` | Only if data exists |
| Desktop heatmap table | `table` inside `.hidden.md\\:block` | |
| Mobile heatmap cards | `.md\\:hidden .rounded-md.border` | |
| Weight Tracking card | `text="Weight Tracking"` | |
| Weight input | `#weight_kg` | `type="number"`, `step="0.1"` |
| Log weight button | `button:has-text("Log")` | Inside weight form |
| Recent Entries header | `text="Recent Entries"` | |
| Weight entry | `.space-y-1 .flex.items-center.justify-between` | Shows "X kg" |
| Delete weight button | `button:has(svg.lucide-trash-2)` inside weight entries | |
| Export Data card | `text="Export Data"` | |
| Export CSV button | `button:has-text("Export CSV")` | Text includes range: "Export CSV (14 days)" |

---

## Checklist (`/checklist`)

| Element | Selector | Notes |
|---------|----------|-------|
| Heading | `h2:has-text("Daily Checklist")` | |
| Streak badge | Badge with `text=/\d+ day streak/` | Only if streak > 0 |
| Completion badge | Badge with `text=/\d+\/\d+ · \d+%/` | Format: "N/M · X%" |
| Progress bar | `.h-2.rounded-full.bg-muted` | Color: emerald (≥80%), amber (≥50%), red (<50%) |
| Checklist item row | `.flex.items-center.justify-between.rounded-md.border` | |
| Check icon (checked) | `svg.lucide-check-square.text-emerald-500` | |
| Check icon (unchecked) | `svg.lucide-square.text-muted-foreground` | |
| Item title (checked) | `.line-through.text-muted-foreground` | |
| Auto label | `text="(auto)"` | On auto-generated items |
| Delete item button | `button:has(svg.lucide-trash-2)` | Only on custom items |
| Add Task input | `input[placeholder*="creatine"]` | Full: "e.g. Take creatine, Drink 2L water..." |
| Add button | `button:has-text("Add")` | |

---

## Settings (`/settings`)

| Element | Selector | Notes |
|---------|----------|-------|
| Heading | `h2:has-text("Settings")` | |
| AI Provider card | `text="AI Provider"` | |
| Provider select | First `[role="combobox"]` | Options: "Anthropic (Claude)", "OpenAI", "Local (Ollama / vLLM)", "Custom (OpenAI-compatible)" |
| Model input | `#model` | Pre-fills based on provider |
| API Key input | `#api_key` | Only visible for Claude/OpenAI. `type="password"` |
| Base URL input | `#base_url` | Only visible for Local/Custom |
| Save AI button | `button:has-text("Save")` | |
| Reminders card | `text="Reminders"` | |
| Add Reminder button | `button:has-text("Add Reminder")` | Toggles form |
| Reminder Type select | `[role="combobox"]` inside form | Options: Meal, Supplement, Hydration, Custom |
| Reminder Time input | `input[type="time"]` | |
| Reminder Title input | `input[placeholder*="Take Vitamin"]` | Full: "e.g. Take Vitamin D, Log lunch..." |
| Create button | `button:has-text("Create")` | |
| Reminder row | `.flex.items-center.justify-between.rounded-md.border` | |
| Reminder toggle | `[role="switch"]` | Radix Switch |
| Reminder type badge | Badge inside reminder row | Shows type text |
| Delete reminder button | `button:has(svg.lucide-trash-2)` inside reminder row | |
| Data Export card | `text="Data Export"` | |
| Export JSON button | `button:has-text("Export All Data")` | Full: "Export All Data (JSON)" |
| Account card | `text="Account"` | |
| Sign Out button | `button:has-text("Sign Out")` | `variant="destructive"` (red) |

---

## AI Chat (`/chat`)

| Element | Selector | Notes |
|---------|----------|-------|
| New Chat button (desktop) | `button:has-text("New Chat")` in sidebar `.hidden.md\\:flex` | |
| New Chat button (mobile) | `button:has-text("New Chat")` in `.md\\:hidden` header | |
| Session list | `.flex-1.space-y-1.overflow-y-auto` | Desktop sidebar |
| Session item | `.cursor-pointer` inside session list | Click to load |
| Session delete button | `button:has(svg.lucide-trash-2)` inside session item | Visible on hover (opacity-0 → opacity-100) |
| WebSocket status dot | `.h-2.w-2.rounded-full` | `bg-green-500`=connected, `bg-yellow-500`=connecting, `bg-red-500`=disconnected |
| Status text | `text="Connected"` or `text="Connecting..."` or `text="Disconnected"` | |
| Message input | `input[placeholder="Type a message..."]` | Disabled when not connected |
| Send button | `button[type="submit"]` | Has Send or Loader icon |
| User message bubble | `.bg-primary.text-primary-foreground` | Right-aligned |
| Assistant message bubble | `.bg-muted` | Left-aligned |
| Streaming spinner | `svg.lucide-loader-2.animate-spin` | Inside assistant placeholder |
| Empty state | `text="Ask me anything about nutrition"` | Full: "Ask me anything about nutrition, meal planning, or your fitness goals." |

---

## Confirm Dialog (AlertDialog)

Used for all destructive actions. Always the same pattern:

| Element | Selector | Notes |
|---------|----------|-------|
| Container | `[role="alertdialog"]` | Rendered in portal |
| Title | AlertDialogTitle inside alertdialog | Varies by context |
| Description | AlertDialogDescription | |
| Cancel button | `[role="alertdialog"] button:has-text("Cancel")` | Closes without action |
| Delete button | `[role="alertdialog"] button:has-text("Delete")` | Performs destructive action |

### Confirm Dialog Titles by Context

| Action | Title | Description Pattern |
|--------|-------|---------------------|
| Delete food entry | `"Delete food entry?"` | `Remove "FOOD_NAME" from your log?` |
| Delete weight entry | `"Delete weight entry?"` | `Remove X kg entry from DATE?` |
| Delete recipe | `"Delete recipe?"` | `Remove "RECIPE_NAME" permanently?` |
| Delete reminder | `"Delete reminder?"` | `Remove "REMINDER_TITLE" reminder?` |

---

## Toast Notifications (Sonner)

| Selector | Notes |
|----------|-------|
| `[data-sonner-toast]` | Any toast |
| `[data-sonner-toast]:has-text("Food logged")` | Specific toast |
| `li[role="status"]` | Alternative selector |

### Expected Toast Messages

| Action | Toast Text |
|--------|-----------|
| Log food | `"Food logged"` |
| Delete food entry | `"Entry removed"` |
| Create custom food | `"Custom food created"` |
| Copy meal (success) | `"Copied N entries"` |
| Copy meal (fail) | `"No entries found for that meal"` |
| Create recipe | `"Recipe created"` |
| Delete recipe | `"Recipe deleted"` |
| Log recipe | `"Recipe logged"` |
| Update profile | `"Profile updated"` |
| Update targets | `"Targets updated"` |
| Apply template | Dynamic success message |
| Log weight | `"Weight logged"` |
| Delete weight | `"Entry removed"` |
| Add checklist item | `"Item added"` |
| Delete checklist item | `"Item removed"` |
| Save AI settings | `"AI settings saved"` |
| Create reminder | `"Reminder created"` |
| Delete reminder | `"Reminder deleted"` |
