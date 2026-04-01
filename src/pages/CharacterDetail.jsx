import { useState } from 'react'
import characters from '../data/characters'
import StrokeAnimation from '../components/StrokeAnimation'

export default function CharacterDetail({ char, onBack }) {
  const [showAnimation, setShowAnimation] = useState(false)
  const data = characters[char]

  if (!data) {
    return (
      <div className="detail-page">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <p>暂无数据</p>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>← 返回</button>

      <div className="char-hero">
        <div className="char-display">{char}</div>
        <div className="char-pinyin-large">{data.pinyin}</div>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <div className="info-label">偏旁部首</div>
          <div className="info-value radical">{data.radical}</div>
        </div>
        <div className="info-card">
          <div className="info-label">笔画数</div>
          <div className="info-value">{data.strokes} 画</div>
        </div>
      </div>

      <div className="words-section">
        <h2>组词</h2>
        <div className="words-list">
          {data.words.map(word => (
            <div key={word} className="word-chip">{word}</div>
          ))}
        </div>
      </div>

      <div className="animation-section">
        <button
          className="animate-btn"
          onClick={() => setShowAnimation(!showAnimation)}
        >
          {showAnimation ? '收起笔画动画' : '看笔画怎么写'}
        </button>

        {showAnimation && (
          <StrokeAnimation char={char} strokes={data.strokes} />
        )}
      </div>
    </div>
  )
}
