exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let transcript
  try {
    const body = JSON.parse(event.body)
    transcript = body.transcript
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  if (!transcript || typeof transcript !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'transcript is required' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
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
      return { statusCode: 502, body: JSON.stringify({ error: 'Upstream API error' }) }
    }

    const data = await response.json()
    const char = data.content?.[0]?.text?.trim()
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ char: char || null }),
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
