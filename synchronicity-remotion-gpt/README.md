# Synchronicity Remotion GPT

A starter system where the user only pastes a script into a GPT. The GPT silently creates a visual plan, calls a private rendering API, ElevenLabs generates narration with timing, and Remotion renders a 1080x1920 MP4 in the Synchronicity visual style.

## What is included

- Custom GPT instruction file
- OpenAPI Action schema
- ElevenLabs text-to-speech with timing
- Automatic fallback segmentation if GPT visual chunks do not match perfectly
- Audio-reactive radial waveform using Remotion media utilities
- Kinetic centered typography
- Purple, cyan, green, orange, and white accent system
- Synchronicity logo support
- Async render jobs with status polling
- Express API
- Docker deployment starter

## Architecture

User pastes script
→ GPT creates a visual segment plan
→ GPT Action POSTs to `/v1/renders`
→ ElevenLabs creates narration and character timing
→ server converts timing to words
→ visual segments are attached to exact spoken timing
→ Remotion renders MP4
→ GPT polls `/v1/renders/{id}`
→ GPT returns the video URL

## 1. Configure the renderer

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `API_KEY`, use a long random secret
- `PUBLIC_BASE_URL`, change this to your deployed HTTPS renderer URL

`LOGO_URL` is already set to the Synchronicity logo URL used in the current brand setup. Change it if you want a different mark.

## 2. Run locally

```bash
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:3001/health
```

Open Remotion Studio for visual tuning:

```bash
npm run studio
```

## 3. Test a render directly

```bash
curl -X POST http://localhost:3001/v1/renders \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "What you notice changes what becomes possible. Your attention is not passive. It is selecting your reality."
  }'
```

The server returns a `job_id`. Check it with:

```bash
curl "http://localhost:3001/v1/renders/JOB_ID?wait_seconds=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

When complete, the response contains the MP4 URL.

## 4. Deploy

The simplest path is a Docker-capable host such as Railway, Render, Fly.io, a VPS, or your own cloud service.

Build locally:

```bash
docker build -t synchronicity-video-gpt .
docker run --env-file .env -p 3001:3001 synchronicity-video-gpt
```

For higher render volume, move the rendering layer to Remotion Lambda or Remotion Cloud Run. The GPT Action contract can remain the same.

### Important production note

The included job store is in memory. This is fine for an MVP and single instance. For production with multiple instances, replace `server/jobs.ts` with Redis, Postgres, or another persistent shared store.

The included `/renders` folder is local disk. For production, upload finished MP4s to S3, Cloudflare R2, GCS, or another persistent object store and put that public URL into `videoUrl`.

## 5. Create the GPT

In the GPT editor:

1. Name: `Synchronicity Video GPT`
2. Description: `Paste a script. Get a branded Synchronicity vertical video.`
3. Copy the contents of `gpt/GPT_INSTRUCTIONS.md` into Instructions.
4. Add the conversation starters from `gpt/CONVERSATION_STARTERS.txt`.
5. Add a new Action.
6. Paste `gpt/openapi.yaml` as the schema.
7. Replace `https://YOUR-RENDER-SERVICE.example.com` with your real renderer domain.
8. Configure authentication as Bearer API key and use the same value as `API_KEY` on the render server.
9. Test in Preview by pasting only a script.

## 6. Desired end-user experience

The user pastes:

> Most people think synchronicity is coincidence. But your attention is constantly filtering what reaches awareness...

The GPT should not ask for settings. It plans the visuals, starts the render, polls the job, then returns the finished MP4 URL.

## Visual tuning

The main files to adjust are:

- `src/components/EnergyField.tsx`, ring and radial energy effect
- `src/components/KineticCaption.tsx`, typography and word emphasis
- `src/components/WaveformFrame.tsx`, top/bottom audio motif
- `src/SynchronicityVideo.tsx`, overall composition and brand palette

## Why ElevenLabs timing is used directly

The ElevenLabs text-to-speech endpoint with timestamps returns the generated audio plus character-level alignment in the same request. The server converts this to word timing, so an extra Whisper transcription pass is unnecessary for this workflow.

## Render specification

- 1080x1920
- 30 fps
- H.264
- CRF 18
- yuv420p
- vertical short-form social format
- voice-reactive radial spectrum
- exact scripted narration
