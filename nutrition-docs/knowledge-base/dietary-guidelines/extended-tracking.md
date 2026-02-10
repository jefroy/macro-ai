# Extended Nutrient Tracking Guide

Comprehensive tracking approach for macronutrients, micronutrients, and additives. Modeled after apps like MyFitnessPal and Cronometer with USDA FoodData Central as the reference standard.

---

## Tracking Priority Tiers

### Tier 1 - Core Macros (Track Every Meal)

Essential for body composition and energy balance.

| Nutrient | Daily Target | Priority | Notes |
|----------|-------------|----------|-------|
| **Calories** | 2500 kcal | Highest | Adjust based on goal |
| **Protein** | 180g | Highest | 2.0-2.2g per kg bodyweight |
| **Carbohydrates** | 280g | High | Fill remaining calories |
| **Fat (Total)** | 70g | High | 0.8-1.0g per kg |
| **Fiber** | 30-40g | High | Gut health, satiety |

---

### Tier 2 - Detailed Macros (Track Daily)

Important for long-term health and specific goals.

| Nutrient | Daily Target | Upper Limit | Why Track |
|----------|-------------|-------------|-----------|
| **Sugar (Total)** | <50g | <100g | Blood sugar management |
| **Added Sugar** | <25g | <50g | WHO recommendation |
| **Saturated Fat** | <20g | <25g | Heart health |
| **Sodium** | 1500-2300mg | 3000mg | Blood pressure, hydration |
| **Caffeine** | <400mg | 600mg | Sleep quality, anxiety |
| **Trans Fat** | 0g | 0g | Avoid completely |

#### Sugar Tracking Notes

- **Total Sugar**: All sugars including natural (fruit, dairy)
- **Added Sugar**: Sugars added during processing (the one to limit)
- Now required on US Nutrition Facts labels (separate line)
- Natural sugars in whole foods come with fiber, vitamins

#### Caffeine Sources Reference

| Source | Caffeine |
|--------|----------|
| Coffee (240ml) | 95mg |
| Espresso shot | 63mg |
| Black tea (240ml) | 47mg |
| Green tea (240ml) | 28mg |
| Cola (355ml) | 34mg |
| Energy drink (240ml) | 80-150mg |
| Dark chocolate (28g) | 23mg |
| Pre-workout (1 scoop) | 150-300mg |

---

### Tier 3 - Micronutrients (Weekly Monitoring)

Track weekly averages rather than daily. Focus on commonly deficient nutrients.

#### Key Vitamins

| Vitamin | RDA | Optimal | Common Deficiency Signs |
|---------|-----|---------|------------------------|
| **Vitamin D** | 600-800 IU | 2000-4000 IU | Fatigue, weak bones, depression |
| **Vitamin C** | 90mg | 200-500mg | Slow healing, weak immunity |
| **Vitamin B12** | 2.4mcg | 5-10mcg | Fatigue, nerve issues, anemia |
| **Vitamin A** | 900mcg | 700-900mcg | Night blindness, dry skin |
| **Vitamin K** | 120mcg | 100-200mcg | Easy bruising, weak bones |
| **Folate (B9)** | 400mcg | 400-800mcg | Fatigue, mouth sores |

#### Key Minerals

| Mineral | RDA | Optimal | Common Deficiency Signs |
|---------|-----|---------|------------------------|
| **Magnesium** | 400-420mg | 400-500mg | Cramps, poor sleep, anxiety |
| **Calcium** | 1000mg | 1000-1200mg | Weak bones, muscle cramps |
| **Iron** | 8mg (men) | 8-18mg | Fatigue, weakness, pale skin |
| **Zinc** | 11mg | 15-30mg | Weak immunity, slow healing |
| **Potassium** | 3400mg | 3500-4700mg | Cramps, fatigue, high BP |
| **Selenium** | 55mcg | 55-100mcg | Thyroid issues, weak immunity |

#### Omega-3 Fatty Acids

| Type | Target | Best Sources |
|------|--------|--------------|
| EPA + DHA | 1000-3000mg | Fatty fish, fish oil |
| ALA | 1600mg | Flaxseed, walnuts, chia |

---

### Tier 4 - Additives to Avoid/Monitor

Alert-based tracking - flag when consumed rather than targeting amounts.

| Additive | Category | Health Concern | Found In |
|----------|----------|----------------|----------|
| **Aspartame** | Artificial sweetener | Headaches, controversy | Diet sodas, sugar-free gum |
| **Sucralose** | Artificial sweetener | Gut microbiome | Splenda, protein bars |
| **Acesulfame-K** | Artificial sweetener | Often paired with aspartame | Diet drinks |
| **Trans Fat** | Processed fat | Heart disease | Margarine, fried foods |
| **High Fructose Corn Syrup** | Added sugar | Metabolic issues | Sodas, processed foods |
| **MSG** | Flavor enhancer | Sensitivity in some | Fast food, chips |
| **Sodium Nitrate** | Preservative | Linked to cancer | Processed meats |

#### Artificial Sweetener Quick Reference

| Sweetener | Sweetness vs Sugar | Common Names |
|-----------|-------------------|--------------|
| Aspartame | 200x | Equal, NutraSweet |
| Sucralose | 600x | Splenda |
| Saccharin | 300x | Sweet'N Low |
| Stevia | 200-300x | Truvia, PureVia |
| Monk Fruit | 150-200x | Lakanto |
| Erythritol | 0.7x | Swerve |

**Note**: Stevia, monk fruit, and erythritol are generally considered safer alternatives.

---

## Tracking Implementation

### Daily Tracking (Tier 1 + 2)

For every meal/snack, log:

```
| Food | Calories | Protein | Carbs | Fat | Fiber | Sugar | Sodium | Caffeine |
```

### Weekly Review (Tier 3)

Every Sunday, check:
- Average vitamin D intake (supplement if <1000 IU/day)
- Magnesium intake (most people need to supplement)
- Iron intake (especially important for women)
- Omega-3 frequency (aim for fatty fish 2-3x/week)

### Alert Triggers (Tier 4)

Flag for user notification when logging:
- Any artificial sweetener consumption
- Trans fat > 0g
- Sodium > 3000mg in a day
- Added sugar > 50g in a day
- Caffeine > 400mg (especially after 2 PM)

---

## Data Sources

### USDA FoodData Central

Free API for nutritional data:
- **API**: https://api.nal.usda.gov/fdc/v1
- **Documentation**: https://fdc.nal.usda.gov/api-guide/
- **Rate Limit**: 1000 requests/hour
- **License**: Public domain (CC0 1.0)

### Recommended Apps for Reference

| App | Best For | Micronutrient Coverage |
|-----|----------|----------------------|
| [Cronometer](https://cronometer.com) | Most complete | 50+ nutrients, USDA data |
| [MyFitnessPal](https://myfitnesspal.com) | User-friendly | Basic vitamins/minerals |
| [ViCa](https://vitamintracker.site) | Vitamins focus | 15 vitamins, 11 minerals |
| [Microgram](https://microgramapp.com) | AI-powered | Photo-based, 50+ nutrients |

---

## Setting Personal Targets

### By Goal

| Goal | Calories | Protein | Carbs | Fat | Notes |
|------|----------|---------|-------|-----|-------|
| Fat Loss | TDEE - 500 | 2.0-2.4g/kg | Low-mod | 0.8g/kg | Higher protein preserves muscle |
| Maintenance | TDEE | 1.6-2.0g/kg | Moderate | 0.8-1.0g/kg | Balanced approach |
| Muscle Gain | TDEE + 300 | 1.8-2.2g/kg | High | 0.8-1.0g/kg | Surplus from carbs |
| Endurance | TDEE + 200 | 1.4-1.8g/kg | Very high | 0.8g/kg | Fuel performance |

### Adjustments for Activity

| Factor | Sodium | Potassium | Magnesium | Caffeine |
|--------|--------|-----------|-----------|----------|
| Intense training | +500-1000mg | +500mg | +100mg | Pre-workout timing |
| Hot climate | +500mg | +300mg | Standard | Hydration focus |
| High stress | Standard | Standard | +100mg | Reduce if anxious |
| Poor sleep | Standard | Standard | +100-200mg | Cut after noon |

---

## Quick Start Checklist

1. **Track Tier 1 for 2 weeks** - Get baseline calorie/protein habits
2. **Add Tier 2 after 2 weeks** - Sugar and sodium awareness
3. **Monthly Tier 3 review** - Check vitamin D, magnesium, iron
4. **Ongoing Tier 4 awareness** - Note artificial sweetener consumption

Most people see 80% of benefits from tracking just Tier 1 + 2.
