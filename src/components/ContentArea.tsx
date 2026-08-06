import { useState, useEffect } from 'react'
import './ContentArea.css'

interface ContentAreaProps {
  src?: string
}

function ContentArea({ src = 'gx.html' }: ContentAreaProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  // 监听导航事件，更新 iframe 地址
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string }>
      if (customEvent.detail?.url) {
        setCurrentSrc(customEvent.detail.url)
      }
    }

    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

  return (
    <div className="content-area">
      <iframe
        src={currentSrc}
        title="内容区域"
        className="content-iframe"
        frameBorder="0"
        scrolling="auto"
      />
    </div>
  )
}

export default ContentArea