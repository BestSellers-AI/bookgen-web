import { Injectable, Logger } from '@nestjs/common';
import { EdgeTTS } from 'node-edge-tts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

export type VoiceGender = 'female' | 'male';

interface VoiceEntry {
  voiceId: string;
  voiceName: string;
}

/** Language code → { female, male } Edge TTS voice mapping */
const VOICE_MAP: Record<string, { female: VoiceEntry; male: VoiceEntry }> = {
  'en': {
    female: { voiceId: 'en-US-AriaNeural', voiceName: 'Aria (English US)' },
    male: { voiceId: 'en-US-GuyNeural', voiceName: 'Guy (English US)' },
  },
  'en-US': {
    female: { voiceId: 'en-US-AriaNeural', voiceName: 'Aria (English US)' },
    male: { voiceId: 'en-US-GuyNeural', voiceName: 'Guy (English US)' },
  },
  'en-GB': {
    female: { voiceId: 'en-GB-SoniaNeural', voiceName: 'Sonia (English UK)' },
    male: { voiceId: 'en-GB-RyanNeural', voiceName: 'Ryan (English UK)' },
  },
  'pt-BR': {
    female: { voiceId: 'pt-BR-FranciscaNeural', voiceName: 'Francisca (Português BR)' },
    male: { voiceId: 'pt-BR-AntonioNeural', voiceName: 'Antonio (Português BR)' },
  },
  'pt': {
    female: { voiceId: 'pt-BR-FranciscaNeural', voiceName: 'Francisca (Português BR)' },
    male: { voiceId: 'pt-BR-AntonioNeural', voiceName: 'Antonio (Português BR)' },
  },
  'es': {
    female: { voiceId: 'es-ES-ElviraNeural', voiceName: 'Elvira (Español)' },
    male: { voiceId: 'es-ES-AlvaroNeural', voiceName: 'Alvaro (Español)' },
  },
  'es-ES': {
    female: { voiceId: 'es-ES-ElviraNeural', voiceName: 'Elvira (Español)' },
    male: { voiceId: 'es-ES-AlvaroNeural', voiceName: 'Alvaro (Español)' },
  },
  'es-MX': {
    female: { voiceId: 'es-MX-DaliaNeural', voiceName: 'Dalia (Español MX)' },
    male: { voiceId: 'es-MX-JorgeNeural', voiceName: 'Jorge (Español MX)' },
  },
  'fr': {
    female: { voiceId: 'fr-FR-DeniseNeural', voiceName: 'Denise (Français)' },
    male: { voiceId: 'fr-FR-HenriNeural', voiceName: 'Henri (Français)' },
  },
  'de': {
    female: { voiceId: 'de-DE-KatjaNeural', voiceName: 'Katja (Deutsch)' },
    male: { voiceId: 'de-DE-ConradNeural', voiceName: 'Conrad (Deutsch)' },
  },
  'it': {
    female: { voiceId: 'it-IT-ElsaNeural', voiceName: 'Elsa (Italiano)' },
    male: { voiceId: 'it-IT-DiegoNeural', voiceName: 'Diego (Italiano)' },
  },
  'ja': {
    female: { voiceId: 'ja-JP-NanamiNeural', voiceName: 'Nanami (日本語)' },
    male: { voiceId: 'ja-JP-KeitaNeural', voiceName: 'Keita (日本語)' },
  },
  'ko': {
    female: { voiceId: 'ko-KR-SunHiNeural', voiceName: 'SunHi (한국어)' },
    male: { voiceId: 'ko-KR-InJoonNeural', voiceName: 'InJoon (한국어)' },
  },
  'zh': {
    female: { voiceId: 'zh-CN-XiaoyiNeural', voiceName: 'Xiaoyi (中文)' },
    male: { voiceId: 'zh-CN-YunxiNeural', voiceName: 'Yunxi (中文)' },
  },
  'zh-CN': {
    female: { voiceId: 'zh-CN-XiaoyiNeural', voiceName: 'Xiaoyi (中文)' },
    male: { voiceId: 'zh-CN-YunxiNeural', voiceName: 'Yunxi (中文)' },
  },
};

const DEFAULT_VOICES = VOICE_MAP['en'];

// Edge TTS has a ~3000 char limit per request — split at paragraph/sentence boundaries
const MAX_CHUNK_CHARS = 2500;

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  /**
   * Resolve Edge TTS voice for a given language code and gender.
   */
  getVoiceForLanguage(
    lang: string,
    gender: VoiceGender = 'female',
  ): VoiceEntry {
    const voices = VOICE_MAP[lang] ?? VOICE_MAP[lang.split('-')[0]] ?? DEFAULT_VOICES;
    return voices[gender];
  }

  /**
   * Synthesize text to MP3 using Edge TTS.
   * Automatically chunks long text to avoid Edge TTS limits.
   * Returns the audio buffer and estimated duration in seconds.
   */
  async synthesize(
    text: string,
    voiceId: string,
  ): Promise<{ buffer: Buffer; durationSecs: number }> {
    const chunks = this.splitIntoChunks(text);
    this.logger.debug(`Synthesizing ${text.length} chars in ${chunks.length} chunk(s)`);

    const buffers: Buffer[] = [];
    let totalDuration = 0;

    for (const chunk of chunks) {
      const result = await this.synthesizeChunk(chunk, voiceId);
      buffers.push(result.buffer);
      totalDuration += result.durationSecs;
    }

    const buffer = buffers.length === 1 ? buffers[0] : Buffer.concat(buffers);

    this.logger.debug(
      `Synthesized ${text.length} chars → ${buffer.length} bytes (~${totalDuration}s)`,
    );

    return { buffer, durationSecs: totalDuration };
  }

  /**
   * Synthesize a single chunk (must be within Edge TTS char limit).
   */
  private async synthesizeChunk(
    text: string,
    voiceId: string,
  ): Promise<{ buffer: Buffer; durationSecs: number }> {
    const tmpFile = path.join(os.tmpdir(), `tts-${randomUUID()}.mp3`);

    try {
      const tts = new EdgeTTS({
        voice: voiceId,
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
        saveSubtitles: true,
        timeout: 120_000,
      });

      await tts.ttsPromise(text, tmpFile);
      const buffer = await fs.promises.readFile(tmpFile);

      // Try to get accurate duration from subtitles file
      let durationSecs: number;
      const subtitlePath = tmpFile.replace('.mp3', '.json');
      try {
        const subtitleData = await fs.promises.readFile(subtitlePath, 'utf-8');
        const subtitles: Array<{ part: string; start: number; end: number }> =
          JSON.parse(subtitleData);
        if (subtitles.length > 0) {
          const lastEntry = subtitles[subtitles.length - 1];
          durationSecs = Math.ceil(lastEntry.end / 1000);
        } else {
          durationSecs = Math.ceil(buffer.length / 6000);
        }
      } catch {
        durationSecs = Math.ceil(buffer.length / 6000);
      }

      // Clean up subtitle file
      fs.promises.unlink(subtitlePath).catch(() => {});

      return { buffer, durationSecs };
    } finally {
      fs.promises.unlink(tmpFile).catch(() => {});
    }
  }

  /**
   * Split text into chunks at paragraph/sentence boundaries,
   * staying under MAX_CHUNK_CHARS per chunk.
   */
  private splitIntoChunks(text: string): string[] {
    if (text.length <= MAX_CHUNK_CHARS) return [text];

    const chunks: string[] = [];
    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let current = '';

    for (const para of paragraphs) {
      if (para.length > MAX_CHUNK_CHARS) {
        // Paragraph itself is too long — split by sentences
        if (current.trim()) {
          chunks.push(current.trim());
          current = '';
        }
        const sentences = para.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if ((current + ' ' + sentence).length > MAX_CHUNK_CHARS && current.trim()) {
            chunks.push(current.trim());
            current = sentence;
          } else {
            current = current ? current + ' ' + sentence : sentence;
          }
        }
      } else if ((current + '\n\n' + para).length > MAX_CHUNK_CHARS) {
        if (current.trim()) chunks.push(current.trim());
        current = para;
      } else {
        current = current ? current + '\n\n' + para : para;
      }
    }

    if (current.trim()) chunks.push(current.trim());

    return chunks.length > 0 ? chunks : [text];
  }
}
