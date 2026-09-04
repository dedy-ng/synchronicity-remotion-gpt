import path from 'node:path';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import type {PlannedSegment, SynchronicityVideoProps} from '../src/types.js';
import {synthesizeWithTiming} from './elevenlabs.js';
import {timePlannedSegments} from './segments.js';
import {patchJob} from './jobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const renderDir = path.join(root, 'renders');
let bundlePromise: Promise<string> | null = null;

const getRenderConcurrency = () => {
  const parsed = Number(process.env.RENDER_CONCURRENCY ?? '1');
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
};

const getRenderScale = () => {
  const parsed = Number(process.env.RENDER_SCALE ?? '1');
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(1, Math.max(0.5, parsed));
};

const MEDIA_CACHE_BYTES = 256 * 1024 * 1024;
const OFFTHREAD_CACHE_BYTES = 32 * 1024 * 1024;

const getBundle = () => {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(root, 'src', 'index.ts'),
      webpackOverride: (config) => {
        // The project uses NodeNext-style `.js` import specifiers in TypeScript source
        // (for example `./Root.js`). During Remotion's Webpack bundle those files
        // physically exist as `.ts` / `.tsx`, so alias explicit `.js` imports back
        // to their TypeScript source counterparts.
        const resolve = (config.resolve ?? {}) as typeof config.resolve & {
          extensionAlias?: Record<string, string[]>;
        };
        resolve.extensionAlias = {
          ...(resolve.extensionAlias ?? {}),
          '.js': ['.tsx', '.ts', '.js'],
        };
        config.resolve = resolve;
        return config;
      },
    });
  }
  return bundlePromise;
};

export const processRender = async ({
  jobId,
  script,
  plannedSegments,
}: {
  jobId: string;
  script: string;
  plannedSegments?: PlannedSegment[];
}) => {
  try {
    patchJob(jobId, {status: 'voice', progress: 0.08});
    const {audioDataUrl, words, durationSeconds} = await synthesizeWithTiming(script);
    const segments = timePlannedSegments(plannedSegments, words);
    patchJob(jobId, {status: 'rendering', progress: 0.2});

    const inputProps: SynchronicityVideoProps = {
      script,
      audioDataUrl,
      durationSeconds,
      segments,
      logoUrl: process.env.LOGO_URL || undefined,
    };

    await mkdir(renderDir, {recursive: true});
    const serveUrl = await getBundle();
    const composition = await selectComposition({
      serveUrl,
      id: 'SynchronicityShort',
      inputProps,
      timeoutInMilliseconds: 120_000,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
    });

    const outputLocation = path.join(renderDir, `${jobId}.mp4`);
    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      outputLocation,
      inputProps,
      // Conservative server defaults for container hosts such as Railway.
      // 1080x1920 rendering can otherwise launch multiple Chromium workers and
      // leave too little memory for the final FFmpeg H.264 encode.
      crf: 23,
      x264Preset: 'superfast',
      pixelFormat: 'yuv420p',
      concurrency: getRenderConcurrency(),
      scale: getRenderScale(),
      imageFormat: 'jpeg',
      jpegQuality: 72,
      // Critical for small Railway instances: do not encode frames while
      // Chromium is still rendering them. This trades speed for lower peak RAM.
      disallowParallelEncoding: true,
      // @remotion/media requires enough decoded-media cache for the narration.
      // The previous 64 MiB value was below Remotion's runtime minimum for this
      // project. 256 MiB clears the reported 240 MiB minimum while still leaving
      // headroom on a 1 GiB Railway container for Chromium + FFmpeg.
      mediaCacheSizeInBytes: MEDIA_CACHE_BYTES,
      offthreadVideoCacheSizeInBytes: OFFTHREAD_CACHE_BYTES,
      offthreadVideoThreads: 1,
      timeoutInMilliseconds: 300_000,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
      onProgress: ({progress}) => patchJob(jobId, {progress: 0.2 + progress * 0.78}),
    });

    const base = (process.env.PUBLIC_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    patchJob(jobId, {status: 'completed', progress: 1, videoUrl: `${base}/renders/${jobId}.mp4`});
  } catch (error) {
    patchJob(jobId, {
      status: 'failed',
      progress: 1,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
