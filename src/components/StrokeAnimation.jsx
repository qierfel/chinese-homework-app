import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'

export default function StrokeAnimation({ char, strokes }) {
  const containerRef = useRef(null)
  const writerRef = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ''
    setStatus('loading')
    writerRef.current = null

    // 动态导入离线笔画数据
    import(`hanzi-writer-data/${char}.json`)
      .then(module => {
        const charData = module.default
        const writer = HanziWriter.create(containerRef.current, char, {
          width: 250,
          height: 250,
          padding: 10,
          showOutline: true,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 300,
          strokeColor: '#333',
          outlineColor: '#ddd',
          charDataLoader: () => Promise.resolve(charData),
        })
        writerRef.current = writer
        setStatus('ready')
      })
      .catch(() => {
        // 回退到 CDN 加载
        const writer = HanziWriter.create(containerRef.current, char, {
          width: 250,
          height: 250,
          padding: 10,
          showOutline: true,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 300,
          strokeColor: '#333',
          outlineColor: '#ddd',
          onLoadCharDataSuccess: () => setStatus('ready'),
          onLoadCharDataError: () => setStatus('error'),
        })
        writerRef.current = writer
      })

    return () => {
      try { writerRef.current?.cancelAnimation() } catch {}
      writerRef.current = null
    }
  }, [char])

  return (
    <div className="stroke-area">
      <div className="tian-wrapper">
        <svg className="tian-grid" viewBox="0 0 250 250" width="250" height="250">
          <rect x="1" y="1" width="248" height="248" fill="none" stroke="#ccc" strokeWidth="1.5"/>
          <line x1="125" y1="1" x2="125" y2="249" stroke="#ccc" strokeWidth="1" strokeDasharray="6,4"/>
          <line x1="1" y1="125" x2="249" y2="125" stroke="#ccc" strokeWidth="1" strokeDasharray="6,4"/>
          <line x1="1" y1="1" x2="249" y2="249" stroke="#eee" strokeWidth="1" strokeDasharray="4,6"/>
          <line x1="249" y1="1" x2="1" y2="249" stroke="#eee" strokeWidth="1" strokeDasharray="4,6"/>
        </svg>
        <div ref={containerRef} className="hanzi-container" />
      </div>

      {status === 'loading' && <p className="anim-hint">加载笔画数据...</p>}
      {status === 'error' && <p className="anim-hint anim-error">笔画数据加载失败</p>}

      {status === 'ready' && (
        <div className="anim-btns">
          <button className="anim-btn primary" onClick={() => writerRef.current?.animateCharacter()}>
            播放笔画
          </button>
          <button className="anim-btn secondary" onClick={() => writerRef.current?.quiz()}>
            我来练习
          </button>
        </div>
      )}

      {status === 'ready' && (
        <p className="stroke-count">共 {strokes} 画</p>
      )}
    </div>
  )
}
