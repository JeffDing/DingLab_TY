import { useState, useEffect } from 'react'
import './Header.css'

function Header() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [utcTime, setUtcTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      
      setCurrentTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`)
      
      const utcHours = String(now.getUTCHours()).padStart(2, '0')
      const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0')
      const utcSeconds = String(now.getUTCSeconds()).padStart(2, '0')
      setUtcTime(`UTC ${utcHours}:${utcMinutes}:${utcSeconds}`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <header className="site-header">
      <div className="header-content">
        <h1 className="header-title">DingLab气象研究中心综合信息服务平台</h1>
        <div className="header-time">
          <div className="time-local">{currentTime}</div>
          <div className="time-utc">{utcTime}</div>
        </div>
      </div>
    </header>
  )
}

export default Header