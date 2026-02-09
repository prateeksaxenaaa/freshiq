# Gemini API Free Tier - Setup Guide

## ✅ Yes, Gemini Works Without Billing!

Gemini has a very generous **free tier** that works perfectly for testing:

### Free Tier Limits:
- **15 requests per minute (RPM)**
- **1 million tokens per day**
- **1,500 requests per day**

This is more than enough for recipe extraction!

---

## Getting Your Gemini API Key

### 1. Go to Google AI Studio
https://aistudio.google.com/app/apikey

### 2. Create API Key
- Click "Create API Key"
- Select a Google Cloud project (or create new one)
- Copy the API key

### 3. Important Notes
- ✅ **NO billing required** for free tier
- ✅ **NO credit card needed**
- ⚠️ The key starts with `AIza...`

---

## Setting the API Key in Supabase

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/kummlmjmomktnngmmydr/settings/functions
2. Click **"Add new secret"**
3. Name: `GEMINI_API_KEY`
4. Value: Your API key (starts with `AIza...`)
5. Click **"Save"**

### Option 2: Command Line

```bash
supabase secrets set GEMINI_API_KEY=AIza... --project-ref kummlmjmomktnngmmydr
```

---

## Verify API Key Works

Test your Gemini API key directly:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'
```

If it works, you'll get a response. If not, you'll see an error message.

---

## Common Issues

### "API key not valid"
- Double-check you copied the entire key
- Make sure there are no extra spaces
- Regenerate the key if needed

### "403 Forbidden"
- Your project doesn't have Gemini API enabled
- Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
- Click "Enable"

### "Billing must be enabled"
- This shouldn't happen with free tier
- If it does, contact Google AI support

---

## After Setting the Key

1. **Redeploy the Edge Function** (it needs to pick up the new secret):
   ```bash
   supabase functions deploy analyze-video --project-ref kummlmjmomktnngmmydr
   ```

2. **Test again** from the app

---

**Next Step:** Set your Gemini API key in Supabase Dashboard, then redeploy the function!
