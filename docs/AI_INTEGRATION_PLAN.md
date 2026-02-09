# AI Video Analysis - Implementation Plan

## Overview

This plan outlines the phased implementation of AI-powered video analysis for recipe import in FreshIQ. The system will analyze videos from YouTube, Instagram, and TikTok to automatically extract recipes.

---

## Architecture

### Backend
- **Supabase Edge Functions** - Serverless processing for video analysis
- **Gemini AI** - LLM for recipe extraction and structuring
- **Platform APIs** - YouTube, Instagram, TikTok metadata/transcript access

### Analysis Layers (Priority Order)

**Layer 1: Metadata Analysis** ⚡ Fast & Cheap
- Video title, description, hashtags, creator caption
- Often contains ingredients list and dish name
- ✅ YouTube | ✅ Instagram | ✅ TikTok

**Layer 2: Transcript/Caption Analysis** 🎯 Most Reliable
- YouTube: Captions/auto-generated transcripts (highly accurate)
- Instagram: Auto-captions (when available)
- TikTok: On-screen captions/description text
- Primary source for recipe steps

**Layer 3: Speech-to-Text Analysis** 🔄 Backup
- When captions unavailable or low-quality
- Extract audio → Transcribe → Parse recipe
- Slower but produces cleaner results
- **Note:** Will design for this but test in later phases

---

## Phase 1: Foundation & Metadata Analysis

**Goal:** Set up infrastructure and implement Layer 1 (metadata) analysis

### 1.1 Supabase Edge Function Setup

**Tasks:**
- [ ] Create `analyze-video` Edge Function
- [ ] Set up environment variables (Gemini API key, platform API keys)
- [ ] Configure CORS and request validation
- [ ] Add error handling and logging

**Deliverables:**
- `supabase/functions/analyze-video/index.ts`
- Environment configuration in Supabase dashboard
- Testing endpoint ready

**Testing Checkpoint:**
- ✅ Function deploys successfully
- ✅ Can receive POST requests from app
- ✅ Returns proper error responses

### 1.2 Platform Metadata Extraction

**Tasks:**
- [ ] Implement YouTube metadata extraction (YouTube Data API v3)
  - Extract: title, description, tags
  - Handle Shorts URLs
- [ ] Implement Instagram metadata extraction (oEmbed or scraping)
  - Extract: caption, hashtags
- [ ] Implement TikTok metadata extraction
  - Extract: description, hashtags
- [ ] Create unified metadata schema

**Deliverables:**
- `utils/youtube.ts` - YouTube metadata extractor
- `utils/instagram.ts` - Instagram metadata extractor
- `utils/tiktok.ts` - TikTok metadata extractor
- `types/metadata.ts` - Unified metadata interface

**Testing Checkpoint:**
- ✅ Extract YouTube video metadata
- ✅ Extract Instagram Reel metadata
- ✅ Extract TikTok video metadata
- ✅ Handle invalid/private videos gracefully

### 1.3 Gemini AI Integration (Metadata → Recipe)

**Tasks:**
- [ ] Set up Gemini API client
- [ ] Create prompt templates for recipe extraction
- [ ] Implement metadata-to-recipe parser
- [ ] Structure output as recipe JSON (ingredients, steps, metadata)
- [ ] Add confidence scoring

**Deliverables:**
- `utils/gemini.ts` - Gemini client wrapper
- `prompts/extract-recipe.ts` - Recipe extraction prompts
- `types/recipe-extraction.ts` - Extraction result types

**Prompt Example:**
```
Given the following video metadata, extract a structured recipe if present:

Title: {title}
Description: {description}
Hashtags: {hashtags}

Extract:
1. Dish name
2. Ingredients (with quantities)
3. Cooking steps (if available)
4. Prep time, cook time, servings (if mentioned)
5. Dietary info (vegetarian, vegan, etc.)

Return as JSON with confidence score (0-1).
```

**Testing Checkpoint:**
- ✅ Metadata extraction produces valid recipe JSON
- ✅ Ingredients list formatted correctly
- ✅ Steps are sequential and coherent
- ✅ Confidence score > 0.7 for good metadata

### 1.4 Client Integration

**Tasks:**
- [ ] Update `useRecipeImports` hook to call Edge Function
- [ ] Show detailed progress (metadata extraction → AI processing)
- [ ] Handle low-confidence results (show warning, allow manual edit)
- [ ] Update `generating.tsx` with progress indicators

**Deliverables:**
- Updated `hooks/useRecipeImports.ts`
- Enhanced `app/generating.tsx` with status messages
- Error handling UI

**Testing Checkpoint:**
- ✅ Submit video link → Edge Function called
- ✅ Progress indicators update correctly
- ✅ Recipe appears in app after completion
- ✅ Low-confidence warning displays when needed

---

## Phase 2: Transcript & Caption Analysis

**Goal:** Implement Layer 2 (transcript/caption) for accurate recipe extraction

### 2.1 YouTube Transcript Extraction

**Tasks:**
- [ ] Implement YouTube Transcript API integration
- [ ] Handle auto-generated vs manual captions
- [ ] Support multiple languages (priority: English)
- [ ] Fall back to metadata if no transcript available

**Deliverables:**
- `utils/youtube-transcript.ts` - Transcript fetcher
- Language detection logic

**Testing Checkpoint:**
- ✅ Extract transcript from YouTube video with captions
- ✅ Handle videos without captions gracefully
- ✅ Detect primary language

### 2.2 Instagram & TikTok Caption Extraction

**Tasks:**
- [ ] Instagram: Extract auto-captions when available
  - May require Instagram Graph API or scraping
- [ ] TikTok: Extract on-screen captions
  - Parse from TikTok API or OCR fallback
- [ ] Standardize caption format

**Deliverables:**
- `utils/instagram-captions.ts`
- `utils/tiktok-captions.ts`

**Testing Checkpoint:**
- ✅ Extract Instagram Reel captions
- ✅ Extract TikTok captions
- ✅ Handle missing captions

### 2.3 Enhanced Gemini Prompts (Transcript-based)

**Tasks:**
- [ ] Create new prompts for transcript analysis
- [ ] Combine metadata + transcript for better accuracy
- [ ] Extract timing information (when mentioned)
- [ ] Improve ingredient quantity detection

**Prompt Example:**
```
Video Transcript:
{transcript}

Metadata:
Title: {title}
Description: {description}

Extract a detailed recipe including:
1. All ingredients with exact quantities
2. Step-by-step instructions in order
3. Timing for each step (if mentioned)
4. Tips or variations (if mentioned)

Prioritize transcript over metadata for accuracy.
```

**Testing Checkpoint:**
- ✅ Transcript-based extraction more accurate than metadata-only
- ✅ Ingredient quantities correctly parsed
- ✅ Steps include timing information

### 2.4 Fallback Logic

**Tasks:**
- [ ] Implement cascade: Transcript → Metadata → Error
- [ ] Track which layer succeeded in `recipe_imports` table
- [ ] Log layer usage for analytics

**Database Update:**
```sql
ALTER TABLE recipe_imports
ADD COLUMN extraction_layer TEXT; -- 'metadata', 'transcript', 'speech-to-text'
```

**Testing Checkpoint:**
- ✅ System tries transcript first, falls back to metadata
- ✅ `extraction_layer` field populated correctly
- ✅ Error state handled when all layers fail

---

## Phase 3: Refinement & Speech-to-Text (Future)

**Goal:** Add Layer 3 (speech-to-text) as ultimate fallback

### 3.1 Audio Extraction

**Tasks:**
- [ ] Extract audio track from video
- [ ] Convert to suitable format (WAV/MP3)
- [ ] Implement file size limits

**Deliverables:**
- `utils/audio-extractor.ts`
- Audio file upload to Supabase Storage

### 3.2 Speech-to-Text Integration

**Tasks:**
- [ ] Integrate speech-to-text API (Google Cloud Speech-to-Text, Whisper, etc.)
- [ ] Handle long audio files (chunking)
- [ ] Language detection and selection

**Deliverables:**
- `utils/speech-to-text.ts`

### 3.3 Full Cascade Implementation

**Tasks:**
- [ ] Update fallback logic to include speech-to-text
- [ ] Optimize for cost (only use when necessary)
- [ ] Add processing time estimates

**Testing Checkpoint:**
- ✅ Speech-to-text produces accurate transcript
- ✅ Cascade works: Transcript → Metadata → STT
- ✅ Cost per extraction tracked

### 3.4 Quality Improvements

**Tasks:**
- [ ] Add user feedback loop (was extraction accurate?)
- [ ] Collect training data for better prompts
- [ ] A/B test different AI models
- [ ] Optimize token usage

---

## Database Schema Updates

### `recipe_imports` Table

```sql
ALTER TABLE recipe_imports
ADD COLUMN extraction_layer TEXT,          -- Which layer succeeded
ADD COLUMN confidence_score DECIMAL(3,2),  -- AI confidence (0-1)
ADD COLUMN metadata_json JSONB,            -- Raw metadata
ADD COLUMN transcript TEXT,                 -- Raw transcript
ADD COLUMN processing_time_ms INTEGER,     -- Performance tracking
ADD COLUMN tokens_used INTEGER;            -- Cost tracking
```

---

## Testing Strategy

### After Each Phase

**Unit Tests:**
- [ ] Platform metadata extraction functions
- [ ] Gemini prompt/response parsing
- [ ] Transcript extraction

**Integration Tests:**
- [ ] End-to-end video link → recipe
- [ ] Error handling (invalid link, private video, no content)
- [ ] Confidence score accuracy

**Manual Testing:**
- [ ] Submit 10+ videos from each platform
- [ ] Verify recipe quality
- [ ] Check edge cases (non-recipe videos, multiple languages)

---

## File Structure

```
FreshIQ/
├── supabase/
│   └── functions/
│       └── analyze-video/
│           ├── index.ts              # Main Edge Function
│           ├── utils/
│           │   ├── youtube.ts        # YouTube API
│           │   ├── instagram.ts      # Instagram API
│           │   ├── tiktok.ts         # TikTok API
│           │   ├── gemini.ts         # Gemini AI client
│           │   ├── transcript.ts     # Transcript extraction
│           │   └── speech-to-text.ts # STT (Phase 3)
│           ├── prompts/
│           │   ├── extract-recipe-metadata.ts
│           │   └── extract-recipe-transcript.ts
│           └── types/
│               ├── metadata.ts
│               ├── recipe-extraction.ts
│               └── platform.ts
├── docs/
│   ├── AI_INTEGRATION.md            # This document
│   ├── API_KEYS.md                  # API key setup guide
│   └── RECIPE_EXTRACTION_PROMPTS.md # Prompt engineering docs
└── hooks/
    └── useRecipeImports.ts          # Updated to call Edge Function
```

---

## Cost Estimates (Rough)

### Layer 1: Metadata
- API Calls: Free (YouTube) / Minimal (Instagram, TikTok)
- Gemini Tokens: ~500-1000 tokens per request
- Cost: **$0.001 - $0.005 per recipe**

### Layer 2: Transcript
- Transcript API: Free (YouTube) / Minimal (others)
- Gemini Tokens: ~2000-5000 tokens per request
- Cost: **$0.01 - $0.03 per recipe**

### Layer 3: Speech-to-Text
- STT: ~$0.006 per minute (Google Cloud)
- Gemini Tokens: ~2000-5000 tokens
- Cost: **$0.05 - $0.15 per recipe**

**Total Estimated Cost Per Recipe:**
- Successful Layer 1: $0.001 - $0.005
- Fallback to Layer 2: $0.01 - $0.03
- Fallback to Layer 3: $0.05 - $0.15

---

## Success Metrics

- **Extraction Accuracy:** >85% recipes correctly extracted
- **Confidence Threshold:** >70% for auto-approved recipes
- **Processing Time:** <30 seconds for Layer 1/2, <2 minutes for Layer 3
- **Cost Per Recipe:** <$0.05 average
- **User Satisfaction:** Manual edits required <20% of the time

---

## Next Steps After Approval

1. Review and approve this implementation plan
2. Set up Supabase Edge Functions environment
3. Obtain API keys (YouTube Data API, potentially Instagram/TikTok)
4. Begin Phase 1, Task 1.1 (Edge Function setup)
5. Implement testing checkpoints after each subtask

**Awaiting your green light to proceed.**
