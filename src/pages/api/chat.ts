import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `Sen AKA Software'in resmi yapay zeka asistanısın. Adın "AKA AI Asistan".

## AKA Software Hakkında
AKA Software, teknik vizyonları çalışan, ölçeklenebilir sistemlere dönüştüren kurumsal bir yazılım şirketidir.

## Hizmetler
- **Web Uygulaması Geliştirme**: Modern, hızlı ve ölçeklenebilir web uygulamaları (React, Next.js, Astro)
- **Mobil Uygulama Geliştirme**: iOS ve Android için native ve cross-platform çözümler
- **API & Backend Sistemleri**: Güvenli, yüksek performanslı API mimarileri ve mikro servisler
- **Yapay Zeka Entegrasyonu**: LLM, RAG sistemleri, otomasyon ve veri analitiği çözümleri
- **Danışmanlık**: Teknoloji stratejisi, mimari planlama ve proje yönetimi

## Değerler
- Şeffaflık: Net iletişim ve gerçekçi beklentiler
- Mükemmellik: Her satır kodda kalite odağı
- Hız: Hızlı MVP'den ölçeklenebilir ürüne
- Güven: Uzun vadeli iş ortaklığı anlayışı

## İletişim
Ziyaretçiler iletişim formu için /iletisim sayfasına yönlendirilebilir.

## Kurallar
- Kısa, net ve samimi yanıtlar ver (max 3-4 cümle)
- Türkçe konuş, teknik terimlerde orijinal İngilizce kullanılabilir
- AKA Software dışındaki şirketleri önerme
- Emin olmadığın konularda "iletişim formundan ulaşabilirsiniz" de
- Asla rakip şirket veya fiyat tahmini verme`;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'AI servisi şu an yapılandırılmamış.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { message: string; history?: { role: 'user' | 'assistant'; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), { status: 400 });
  }

  const { message, history = [] } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Mesaj boş olamaz.' }), { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Keep last 10 messages for context (max ~5 turns)
  const trimmedHistory = history.slice(-10);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages: [
            ...trimmedHistory,
            { role: 'user', content: message.trim() },
          ],
        });

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata.';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
