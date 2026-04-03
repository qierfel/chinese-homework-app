export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript } = req.body
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'transcript is required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
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
      return res.status(502).json({ error: 'Upstream API error' })
    }

    const data = await response.json()
    const char = data.content?.[0]?.text?.trim()
    res.status(200).json({ char: char || null })
  } catch (e) {
    res.status(500).json({ error: 'Internal error' })
  }
}
