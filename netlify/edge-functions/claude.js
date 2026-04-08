export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let transcript
  try {
    const body = await req.json()
    transcript = body.transcript
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  if (!transcript || typeof transcript !== 'string') {
    return new Response(JSON.stringify({ error: 'transcript is required' }), { status: 400 })
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: `用户对着手机说了这句话想查一个汉字的写法："${transcript}"。语音识别可能把字识别错了，比如把"巍"识别成"威"。请根据语境推断用户真正想查的是哪一个汉字，只返回那一个汉字，不要任何解释或标点。`,
        }],
      }),
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Upstream API error' }), { status: 502 })
    }

    const data = await response.json()
    const char = data.content?.[0]?.text?.trim()
    return new Response(JSON.stringify({ char: char || null }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}

