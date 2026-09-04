import type {Accent, Effect, PlannedSegment, TimedSegment, WordTiming} from '../src/types.js';

const STOP = new Set(['a','an','the','and','or','but','if','then','to','of','in','on','at','for','with','is','are','was','were','be','been','being','it','this','that','these','those','you','your','we','our','i','they','their']);
const accents: Accent[] = ['purple', 'cyan', 'green', 'purple', 'orange', 'cyan'];
const effects: Effect[] = ['burst', 'ring', 'ring', 'tunnel', 'ring', 'minimal'];

const token = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}'’_-]+/gu, '');
const tokenize = (s: string) => (s.match(/[\p{L}\p{N}'’_-]+/gu) || []).map(token).filter(Boolean);

const chooseEmphasis = (words: string[]) => {
  const candidates = words
    .map((w) => w.replace(/[^\p{L}\p{N}'’_-]/gu, ''))
    .filter((w) => w.length >= 4 && !STOP.has(token(w)))
    .sort((a, b) => b.length - a.length);
  return candidates[0] ? [candidates[0]] : words[words.length - 1] ? [words[words.length - 1]] : [];
};

export const fallbackSegments = (words: WordTiming[]): TimedSegment[] => {
  const result: TimedSegment[] = [];
  let i = 0;
  let scene = 0;
  while (i < words.length) {
    const start = i;
    let end = Math.min(words.length - 1, i + 2);

    while (end + 1 < words.length && end - start < 4) {
      const duration = words[end + 1].end - words[start].start;
      if (duration > 1.9) break;
      end += 1;
      if (/[.!?;:]$/u.test(words[end].text)) break;
    }

    const chunk = words.slice(start, end + 1);
    const text = chunk.map((w) => w.text).join(' ');
    result.push({
      text,
      emphasis: chooseEmphasis(chunk.map((w) => w.text)),
      accent: accents[scene % accents.length],
      effect: effects[scene % effects.length],
      intensity: scene === 0 ? 0.95 : 0.62 + ((scene * 17) % 28) / 100,
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end + 0.08,
    });
    scene += 1;
    i = end + 1;
  }
  return result;
};

export const timePlannedSegments = (planned: PlannedSegment[] | undefined, words: WordTiming[]): TimedSegment[] => {
  if (!planned?.length) return fallbackSegments(words);

  const sourceTokens = words.map((w) => token(w.text)).filter(Boolean);
  const plannedTokens = planned.flatMap((s) => tokenize(s.text));
  if (sourceTokens.length !== plannedTokens.length || sourceTokens.some((v, i) => v !== plannedTokens[i])) {
    return fallbackSegments(words);
  }

  let cursor = 0;
  const result: TimedSegment[] = [];
  for (let i = 0; i < planned.length; i++) {
    const seg = planned[i];
    const count = tokenize(seg.text).length;
    const chunk = words.slice(cursor, cursor + count);
    if (!chunk.length) continue;

    const accent = seg.accent || accents[i % accents.length];
    const effect = seg.effect || effects[i % effects.length];
    const intensity = Math.max(0.25, Math.min(1, seg.intensity ?? 0.72));
    result.push({
      ...seg,
      accent,
      effect,
      intensity,
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end + 0.08,
    });
    cursor += count;
  }

  return result.length ? result : fallbackSegments(words);
};
