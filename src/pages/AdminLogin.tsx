/**
 * 管理员登录页面
 * 背景色与主站一致 #CCE8CF
 * 登录成功后跳转到 /admin 页面
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, initDefaultPassword, resetToDefaultPassword } from '../utils/auth'
import './AdminLogin.css'

function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const navigate = useNavigate()

  // 初始化默认密码
  useEffect(() => {
    initDefaultPassword()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await adminLogin(password)
      if (success) {
        navigate('/admin', { replace: true })
      } else {
        setError('密码错误，请重试')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('登录失败，请稍后重试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      await resetToDefaultPassword()
      setError('')
      setResetSuccess(true)
      setPassword('')
      setTimeout(() => setResetSuccess(false), 3000)
    } catch {
      setError('恢复默认密码失败，请稍后重试')
    }
  }

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <h1 className="login-title">管理员登录</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              autoFocus
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {resetSuccess && <p className="success-message">默认密码已恢复，请使用默认密码登录</p>}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="reset-password-section">
          <button type="button" className="reset-password-button" onClick={handleResetPassword}>
            恢复默认密码
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin