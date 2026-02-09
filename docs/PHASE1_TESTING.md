# Testing Guide - Phase 1 AI Video Analysis

## ✅ Prerequisites Checklist

Before testing, ensure you've completed:

- [x] Deployed Edge Function to Supabase
- [x] Set environment variables in Supabase Dashboard:
  - `YOUTUBE_API_KEY`
  - `GEMINI_API_KEY`
- [x] Ran `ai_extraction_schema.sql` in Supabase SQL Editor
- [ ] Regenerated TypeScript types (optional, but removes linting errors)

---

## 📝 Regenerating Types (Optional)

To fix TypeScript linting errors:

```bash
npx supabase gen types typescript --project-id kummlmjmomktnngmmydr > types/supabase.ts
```

This updates the type definitions to match the new database schema.

---

## 🧪 Testing Steps

### 1. Start the App
```bash
npx expo start
```

### 2. Test YouTube Video Import

1. Open the app
2. Tap the FAB (Floating Action Button)
3. Select **"Paste link"**
4. Enter a cooking video URL:
   ```
   https://www.youtube.com/watch?v=VIDEO_ID
   ```
   
**Recommended test videos:**
- Short cooking recipe with good description
- Video with ingredients in description
- Video with clear title mentioning the dish

5. Submit the link
6. Watch the "Generating" screen:
   - Should show "Starting Analysis..." (PENDING)
   - Then "Analyzing Video..." (PROCESSING)
   - Finally "Recipe Ready!" with confidence score

7. Verify you're redirected to the recipe detail screen
8. Check that ingredients and steps are populated

### 3. Test Instagram Reel (Optional)

Use the same flow with an Instagram Reel URL:
```
https://www.instagram.com/reel/REEL_ID/
```

**Note:** Instagram extraction may be limited without proper access tokens.

### 4. Test TikTok Video (Optional)

Same flow with a TikTok URL:
```
https://www.tiktok.com/@user/video/VIDEO_ID
```

---

## 🔍 What to Check

### Success Indicators ✅
- Import status changes from `pending` → `processing` → `completed`
- Recipe is created with:
  - Title
  - Ingredients
  - Steps
  - Confidence score > 0.5
- Redirect to recipe detail screen works
- Recipe appears in "Uncategorized" cookbook

### Common Issues ❌

**"YOUTUBE_API_KEY not configured"**
- Set the key in Supabase Dashboard → Edge Functions → Secrets

**"GEMINI_API_KEY not configured"**
- Set the key in Supabase Dashboard

**Import stays "pending" forever**
- Check Edge Function logs:
  ```bash
  supabase  functions logs analyze-video --project-ref kummlmjmomktnngmmydr
  ```

**"Low confidence" or "Failed"**
- Video metadata may not contain enough recipe info
- Try a different video with better description

**TypeScript errors**
- These are expected until types are regenerated
- App will still run, errors are cosmetic

---

## 📊 Monitoring

### Check Edge Function Logs
```bash
supabase functions logs analyze-video --project-ref kummlmjmomktnngmmydr
```

Look for:
- `[import_id] Starting analysis for:`
- `[import_id] Detected platform:`
- `[import_id] Metadata fetched:`
- `[import_id] Extraction complete. Confidence:`
- `[import_id] Recipe created:`

### Check Database

In Supabase SQL Editor:
```sql
-- View recent imports
SELECT id, status, confidence_score, extraction_layer, error_message
FROM recipe_imports
ORDER BY created_at DESC
LIMIT 10;

-- View created recipes
SELECT id, title, source_platform, source_url
FROM recipes
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Expected Behavior

### High Confidence (>0.7)
- Video has clear recipe in title/description
- Ingredients listed
- Steps may be minimal but structure should exist

### Medium Confidence (0.5-0.7)
- Some recipe info in metadata
- May need manual editing after import

### Low Confidence (<0.5)
- Import will fail
- User sees error message with confidence score
- Can try different link

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|---------|
| No response from Edge Function | Check if deployed, verify API keys |
| 403 Forbidden (YouTube) | Invalid API key or quota exceeded |
| Recipe missing fields | Expected - metadata may not contain all info |
| TypeScript errors breaking build | Regenerate types or ignore for now |

---

## ✅ Success Criteria for Phase 1

- [ ] Can import YouTube video with recipe in description
- [ ] Recipe is created with title, ingredients, steps
- [ ] Confidence score displayed
- [ ] Navigation to recipe detail works
- [ ] Recipe appears in Uncategorized cookbook

---

**Ready to test!** Start with a simple cooking video and verify the full flow works end-to-end.
