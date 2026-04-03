import { useState, useEffect, useRef } from 'react'
import characters from '../data/characters'

async function askClaudeForChar(transcript, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
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
  if (!res.ok) throw new Error(`API错误 ${res.status}`)
  const data = await res.json()
  const char = data.content?.[0]?.text?.trim()
  // 只接受单个汉字
  if (char && /^[\u4e00-\u9fa5]$/.test(char)) return char
  return null
}

export default function Home({ onSelect }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('history') || '[]') } catch { return [] }
  })
  const [listening, setListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_key') || '')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return }
    const matched = Object.keys(characters).filter(c => c.includes(input.trim()))
    setSuggestions(matched.slice(0, 12))
  }, [input])

  function handleSelect(char) {
    const newHistory = [char, ...history.filter(h => h !== char)].slice(0, 10)
    setHistory(newHistory)
    localStorage.setItem('history', JSON.stringify(newHistory))
    onSelect(char)
  }

  function saveApiKey() {
    const key = apiKeyInput.trim()
    if (!key.startsWith('sk-ant')) {
      alert('Key 格式不对，应以 sk-ant 开头')
      return
    }
    localStorage.setItem('anthropic_key', key)
    setApiKey(key)
    setApiKeyInput('')
    setShowSettings(false)
  }

  function clearApiKey() {
    localStorage.removeItem('anthropic_key')
    setApiKey('')
    setApiKeyInput('')
  }

  async function handleVoiceResult(transcript) {
    setVoiceStatus('')

    // 有 API key：用 Claude 做语义理解
    if (apiKey) {
      setVoiceStatus('正在理解...')
      try {
        const char = await askClaudeForChar(transcript, apiKey)
        if (char) {
          setInput(char)
          if (characters[char]) setTimeout(() => handleSelect(char), 300)
          return
        }
      } catch (e) {
        // API 调用失败，降级到正则
        console.warn('Claude API 失败，降级到正则:', e.message)
      }
    }

    // 降级：正则匹配
    const hanziList = transcript.match(/[\u4e00-\u9fa5]/g) || []
    let target = null
    const m1 = transcript.match(/([\u4e00-\u9fa5])字怎么写/)
    const m2 = transcript.match(/的([\u4e00-\u9fa5])字/)
    const m3 = transcript.match(/([\u4e00-\u9fa5])怎么写/)
    const m4 = transcript.match(/查([\u4e00-\u9fa5])/)
    if (m1) target = m1[1]
    else if (m2) target = m2[1]
    else if (m3) target = m3[1]
    else if (m4) target = m4[1]
    else if (hanziList.length > 0) target = hanziList[hanziList.length - 1]

    if (target) {
      setInput(target)
      if (characters[target]) setTimeout(() => handleSelect(target), 300)
    } else {
      setVoiceError(`没有识别到汉字，听到了：${transcript}`)
    }
  }

  function startVoice() {
    setVoiceError('')
    setVoiceStatus('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError('当前浏览器不支持语音识别，请用 Chrome 或 Safari')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed') setVoiceError('麦克风权限被拒绝，请在浏览器设置中允许')
      else if (e.error === 'network') setVoiceError('网络错误，语音识别需要联网')
      else if (e.error === 'service-not-allowed') setVoiceError('此浏览器不支持语音，请用 Chrome')
      else setVoiceError(`语音识别失败 (${e.error})，请重试`)
    }
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript.trim()
      handleVoiceResult(text)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="home">
      <header className="home-header">
        <div className="logo">字</div>
        <h1>语文小助手</h1>
        <p className="subtitle">查拼音 · 看笔画 · 学组词</p>
        <button className="settings-btn" onClick={() => { setShowSettings(true); setApiKeyInput('') }} title="设置">⚙️</button>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-title">AI 语音识别设置</div>
          <p className="settings-desc">
            配置 Anthropic API Key 后，语音识别会用 AI 理解你说的字，
            避免把"巍"识别成"威"这类同音错误。
          </p>
          {apiKey ? (
            <div className="key-status">
              已配置 Key：sk-ant...{apiKey.slice(-6)}
              <button className="clear-key-btn" onClick={clearApiKey}>删除</button>
            </div>
          ) : (
            <div className="key-input-row">
              <input
                className="key-input"
                type="password"
                placeholder="粘贴你的 sk-ant-... Key"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
              />
              <button className="save-key-btn" onClick={saveApiKey}>保存</button>
            </div>
          )}
          <button className="close-settings-btn" onClick={() => setShowSettings(false)}>关闭</button>
        </div>
      )}

      <div className="search-area">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="输入一个汉字..."
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && suggestions.length > 0) handleSelect(suggestions[0])
            }}
          />
          <button
            className={`voice-btn ${listening ? 'listening' : ''}`}
            onClick={listening ? stopVoice : startVoice}
            title="语音输入"
          >
            {listening ? '⏹' : '🎤'}
          </button>
        </div>
        {listening && <p className="voice-hint">正在听...说出想查的字，比如"巍峨的巍怎么写"</p>}
        {voiceStatus && <p className="voice-hint">{voiceStatus}</p>}
        {voiceError && <p className="voice-error">{voiceError}</p>}

        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map(char => (
              <button key={char} className="char-btn" onClick={() => handleSelect(char)}>
                <span className="char-big">{char}</span>
                <span className="char-pinyin">{characters[char].pinyin}</span>
              </button>
            ))}
          </div>
        )}

        {input && suggestions.length === 0 && (
          <p className="not-found">暂无这个字的数据，正在持续完善中...</p>
        )}
      </div>

      {history.length > 0 && (
        <div className="history-area">
          <h2>最近查过</h2>
          <div className="history-list">
            {history.map(char => (
              <button key={char} className="history-btn" onClick={() => handleSelect(char)}>
                {char}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
