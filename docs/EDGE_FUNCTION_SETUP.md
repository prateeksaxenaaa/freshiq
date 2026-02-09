# AI Video Analysis Edge Function - Setup Guide

## Prerequisites

1. **Supabase CLI** installed and authenticated
2. **API Keys**:
   - YouTube Data API v3 key
   - Gemini API key
   - (Optional) Instagram/TikTok access tokens

---

## Environment Variables

Set these in your Supabase project dashboard under Settings > Edge Functions:

```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
INSTAGRAM_ACCESS_TOKEN=your_instagram_token (optional)
```

### Getting API Keys

#### 1. YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the key

#### 2. Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Copy the key

---

## Database Schema Updates

Run this SQL to add tracking fields to `recipe_imports`:

```sql
ALTER TABLE recipe_imports
ADD COLUMN IF NOT EXISTS extraction_layer TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS metadata_json JSONB,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
```

---

## Local Testing

### 1. Start Supabase locally
```bash
supabase start
```

### 2. Set environment variables locally
Create `.env.local` file:
```
YOUTUBE_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### 3. Serve function locally
```bash
supabase functions serve analyze-video --env-file .env.local
```

### 4. Test with curl
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/analyze-video' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "import_id": "test-import-id",
    "user_id": "test-user-id"
  }'
```

---

## Deployment

### 1. Deploy to Supabase
```bash
supabase functions deploy analyze-video
```

### 2. Set secrets in production
```bash
supabase secrets set YOUTUBE_API_KEY=your_key
supabase secrets set GEMINI_API_KEY=your_key
```

---

## Usage from Client

```typescript
const { data, error } = await supabase.functions.invoke('analyze-video', {
    body: {
        video_url: 'https://www.youtube.com/watch?v=...',
        import_id: importRecord.id,
        user_id: session.user.id,
    },
});
```

---

## Monitoring

Check logs:
```bash
supabase functions logs analyze-video
```

---

## Cost Estimates

- YouTube API: Free (10,000 units/day)
- Gemini API: ~$0.001-0.005 per request
- Edge Functions: Free tier available

---

## Troubleshooting

**"GEMINI_API_KEY not configured"**
- Set environment variable in Supabase dashboard

**"YouTube API error: 403"**
- Check API key is valid
- Ensure YouTube Data API v3 is enabled

**"Video not found or is private"**
- Video may be private/deleted
- Check video ID extraction logic

---

**Next Steps:** Update client-side hooks to call this Edge Function
