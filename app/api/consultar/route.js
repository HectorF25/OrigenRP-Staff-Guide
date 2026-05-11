import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { NORMATIVA_FULL } from '@/lib/normativa';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado. Inicia sesión con Discord.' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const situacion = body?.situacion;
  if (!situacion || !situacion.trim()) {
    return NextResponse.json({ error: 'Situación requerida' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no configurada en el servidor' }, { status: 500 });
  }

  const prompt = `Eres un asistente experto en la normativa del servidor de roleplay FiveM "OrigenRP". Ayudas al STAFF a determinar si una situación es sancionable, qué infracción es y la sanción exacta.

NORMATIVA OFICIAL (incluye normas generales, organizaciones criminales, robos y sanciones administrativas):
${NORMATIVA_FULL}

INSTRUCCIONES:
1. Analiza la situación.
2. Primera línea SIEMPRE: "VEREDICTO: SANCIONABLE", "VEREDICTO: NO SANCIONABLE" o "VEREDICTO: DEPENDE DEL CONTEXTO"
3. Indica la infracción exacta.
4. Indica la sanción exacta (minutos jail, BAN, etc).
5. Si pertenece a OC/Mafia, el jail se DUPLICA.
6. Explica el razonamiento basándote en la normativa.
7. Sé conciso y claro. Responde en español.
8. RESPONDE a lo ultimo indicando al usuario que debe hacer ejemplo /ban o /jail y /jailof para ejecutar la sanción, o que no es sancionable si ese es el caso, dale el comando exacto a ejecutar.
9. SIEMPRE SUGIERE EL /jailof para indicar al usuario que si el usuario desconecto o no se pudo sancionar en el momento, se deje la sanción pendiente para ejecutar cuando vuelva a conectarse.

COMANDOS:
- /jail [ID] [MINUTOS] "[RAZÓN]"
- /ban [ID] "[RAZÓN]"
- /unban [ID]
- /jailof [ID] [MINUTOS] "[RAZÓN]"

SITUACIÓN REPORTADA:
${situacion.trim()}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1200, temperature: 0.3 }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error('Gemini error:', err);
      const isQuota =
        geminiRes.status === 429 ||
        err?.error?.status === 'RESOURCE_EXHAUSTED' ||
        err?.error?.code === 429;
      if (isQuota) {
        return NextResponse.json(
          { error: 'Cuota diaria de Gemini alcanzada' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Error al contactar con Gemini', detail: err?.error?.message },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se obtuvo respuesta.';
    return NextResponse.json({ text });
  } catch (e) {
    console.error('Handler error:', e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
