# Edge Function Debugging Guide

## Current Error
```
Edge Function returned a non-2xx status code
```

This means the Edge Function is deployed but encountering an error when processing the request.

## Common Causes

### 1. Missing Environment Variables
**Check in Supabase Dashboard:**
- Go to: https://supabase.com/dashboard/project/kummlmjmomktnngmmydr/settings/functions
- Verify these secrets are set:
  - `YOUTUBE_API_KEY`
  - `GEMINI_API_KEY`
  - `SUPABASE_URL` (should be auto-set)
  - `SUPABASE_SERVICE_ROLE_KEY` (should be auto-set)

### 2. Check Function Logs in Dashboard
1. Go to: https://supabase.com/dashboard/project/kummlmjmomktnngmmydr/functions
2. Click on `analyze-video`
3. Click "Logs" tab
4. Look for recent errors

### 3. Test Function Directly

Try invoking the function with a test payload:

```bash
curl -i --location --request POST 'https://kummlmjmomktnngmmydr.supabase.co/functions/v1/analyze-video' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "import_id": "test-id",
    "user_id": "test-user"
  }'
```

## Quick Fixes

### Fix 1: Redeploy with Verbose Logging

Add more console.log statements to see where it's failing.

### Fix 2: Check API Key Permissions

**YouTube API:**
- Ensure the API key has YouTube Data API v3 enabled
- Check quota hasn't been exceeded (10,000 units/day)

**Gemini API:**
- Ensure the API key is valid
- Check billing is enabled

## Next Steps

1. Check the Supabase Dashboard logs
2. Verify all environment variables are set
3. Test with a simple YouTube video URL
4. If still failing, we may need to add error handling for specific platforms

---

**Open Supabase Dashboard:** https://supabase.com/dashboard/project/kummlmjmomktnngmmydr/functions
