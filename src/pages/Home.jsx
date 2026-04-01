import { useState, useEffect, useRef } from 'react'
import characters from '../data/characters'

export default function Home({ onSelect }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('history') || '[]') } catch { return [] }
  })
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
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

  function startVoice() {
    setVoiceError('')
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
      setVoiceError('语音识别失败，请重试')
    }
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript.trim()
      // 提取第一个汉字
      const match = text.match(/[\u4e00-\u9fa5]/)
      if (match) {
        setInput(match[0])
        // 如果字典里有，直接跳转
        if (characters[match[0]]) {
          setTimeout(() => handleSelect(match[0]), 300)
        }
      } else {
        setVoiceError(`没有识别到汉字，听到了：${text}`)
      }
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
      </header>

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
        {listening && <p className="voice-hint">正在听...请说出汉字</p>}
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
