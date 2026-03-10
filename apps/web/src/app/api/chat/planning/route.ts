import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const ASSISTANT_IDS: Record<string, { flow1: string; flow2: string }> = {
  'pt-BR': {
    flow1: 'asst_H4a4SOBGUP3sDyNVzVSZwf1W', // Fluxo 1 — só briefing
    flow2: 'asst_FoDUkmA2F3RXbsZRinRXV3gx', // Fluxo 2 — título+subtítulo+briefing
  },
  es: {
    flow1: 'asst_b8gStRESdY7V5k7FrTTpb3Fs',
    flow2: 'asst_jAKBnZ9Qe49FkXaECBdIxhcC',
  },
  en: {
    flow1: 'asst_BJId4c9mEG9oaUccn2tLVqmz',
    flow2: 'asst_Wqck8QVpwMfA2V8LgxxbpIX8',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { path, briefing, title, subtitle, locale } = await request.json();

    if (!briefing || !path || !locale) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const ids = ASSISTANT_IDS[locale] ?? ASSISTANT_IDS['en'];
    const isCustom = path === 'custom';
    const assistantId = isCustom ? ids.flow2 : ids.flow1;

    // Build user message matching original Typebot prompts
    let userMessage: string;
    if (isCustom) {
      // Fluxo 2: title + subtitle + briefing concatenated
      const combinedBriefing = `Title: ${title}\nSubtitle: ${subtitle}\n\n${briefing}`;
      userMessage = `Follow your system instructions based on the ${combinedBriefing}. Remember that, based on the input from the ${combinedBriefing}, you must suggest the title, subtitle, and content, following your instructions (DO NOT use the input itself as the title).`;
    } else {
      // Fluxo 1: just briefing
      userMessage = `Follow your system instructions based on the ${briefing}.`;
    }

    // Create thread + run with streaming
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage,
    });

    const stream = openai.beta.threads.runs.stream(thread.id, {
      assistant_id: assistantId,
    });

    // Convert OpenAI stream to SSE ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.event === 'thread.message.delta') {
              const delta = event.data.delta;
              if (delta.content) {
                for (const block of delta.content) {
                  if (block.type === 'text' && block.text?.value) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ token: block.text.value })}\n\n`),
                    );
                  }
                }
              }
            } else if (event.event === 'thread.run.completed') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } else if (event.event === 'thread.run.failed') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: 'Run failed' })}\n\n`),
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
          // Cleanup thread (fire & forget)
          openai.beta.threads.delete(thread.id).catch(() => {});
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
