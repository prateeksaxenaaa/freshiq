# Inventory Intelligence Logic

## Core Concept
FreshIQ uses a **Confidence Score (0% - 100%)** to represent the likelihood that an item is available. We do not force users to scan things out. Instead, we predict availability based on time and activity.

## 1. Availability States
We simplify the decimal score into 3 user-friendly states:

| State | Color | Confidence Score | User Meaning |
| :--- | :--- | :--- | :--- |
| **In Stock** | 🟢 Green | **70% - 100%** | "You definitely have this." |
| **Uncertain** | 🟡 Yellow | **30% - 69%** | "You might have this / Check before buying." |
| **Likely Empty**| 🔴 Red | **0% - 29%** | "Probably gone." (Prompt to delete) |

---

## 2. Confidence Mechanics

### A. Time Decay (The "Rot" Factor)
Items lose confidence automatically over time.
- **Perishables (Fridge)**: Decay fast.
- **Pantry lines**: Decay slow.

**Formula:**
`NewConfidence = OldConfidence * DecayRate`

| Type | Decay Rate (Daily) | Approx Life |
| :--- | :--- | :--- |
| Produce / Fridge | **0.95** | ~2 weeks until "Uncertain" |
| Pantry / Dry | **0.99** | ~3 months until "Uncertain" |
| Freezer | **0.995** | ~6 months until "Uncertain" |

### B. Cooking Actions
When a user cooks a recipe, we deduct inventory.
- **Exact Match** (e.g., Recipe: 2 eggs, Inv: 12 eggs):
  - Subtract quantity.
  - If Quantity hits 0 -> Confidence = 0%.
- **Loose Match** (e.g., Recipe: "Some Milk", Inv: "Milk Bottle"):
  - We don't know how much was used.
  - Apply a **Usage Penalty**: `Confidence = Confidence * 0.8`.

### C. Manual Actions
Users can "True Up" the inventory at any time.
- **"I have this"**: Sets Confidence to **100%** (Resets decay).
- **"I used some"**: Sets Confidence to **50%** (Uncertain).
- **"It's gone"**: Sets Confidence to **0%** (Archive/Delete).

---

## 3. Pseudocode Logic

### Scenario 1: Daily Update Job (Scheduled)
*Passed to a Postgres Function or Edge Function*

```javascript
FOR EACH item IN inventory_items:
  
  // 1. Determine Decay Rate based on storage
  IF storage == 'fridge' THEN rate = 0.95
  ELSE IF storage == 'freezer' THEN rate = 0.995
  ELSE rate = 0.99 // Pantry

  // 2. Apply Decay
  item.confidence_score = item.confidence_score * rate

  // 3. Check for "Ghost" items (Too low to show)
  IF item.confidence_score < 0.10 THEN
    mark_as_archived(item.id)
  
  UPDATE item
```

### Scenario 2: User Cooks a Recipe
*Triggered when user clicks "Cooked This"*

```javascript
FUNCTION on_cook_recipe(recipe_id):
  ingredients = get_recipe_ingredients(recipe_id)

  FOR EACH ingredient IN ingredients:
    // Find matching inventory item (fuzzy search)
    match = find_inventory_item(ingredient.name)

    IF match IS FOUND:
      
      IF ingredient.has_exact_quantity AND match.has_exact_quantity:
        // Precise Logic
        match.quantity = match.quantity - ingredient.quantity
        IF match.quantity <= 0 THEN
           match.confidence_score = 0
        ELSE
           // Bump confidence slightly because we just verified it exists to use it
           match.confidence_score = MAX(match.confidence_score, 0.9)
      
      ELSE:
        // Loose / Fuzzy Logic
        // We know they used it, so it DOES exist right now, but there is less of it.
        // Rule: Reset to "Verified" then apply heavy usage penalty? 
        // Better Rule: Just reduce confidence to reflect consumption uncertainty.
        match.confidence_score = match.confidence_score * 0.75
      
      UPDATE match
      LOG_ACTIVITY("cooked", match.id)
```
