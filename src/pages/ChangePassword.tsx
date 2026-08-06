/**
 * 密码修改页面（隐藏页面）
 * 需要先登录管理员才能访问
 * 页面地址：/change-password
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdminLoggedIn, adminLogout, changePassword, verifyPassword, initDefaultPassword, resetToDefaultPassword } from '../utils/auth'
import './ChangePassword.css'

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // 初始化默认密码并检查登录状态
  useEffect(() => {
    initDefaultPassword().then(() => {
      if (!isAdminLoggedIn()) {
        navigate('/admin-login', { replace: true })
      }
    })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // 验证当前密码
      const storedHash = localStorage.getItem('dinglab_admin_password_hash') || ''
      const isValid = await verifyPassword(currentPassword, storedHash)
      if (!isValid) {
        setError('当前密码错误')
        setIsLoading(false)
        return
      }

      // 验证新密码与确认密码是否一致
      if (newPassword !== confirmPassword) {
        setError('两次输入的新密码不一致')
        setIsLoading(false)
        return
      }

      // 验证新密码不能与当前密码相同
      const newHash = await verifyPassword(newPassword, storedHash)
      if (newHash) {
        setError('新密码不能与当前密码相同')
        setIsLoading(false)
        return
      }

      // 修改密码
      await changePassword(newPassword)
      setSuccess('密码修改成功')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // 3秒后跳转到 /admin 页面
      setTimeout(() => {
        navigate('/admin', { replace: true })
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改密码失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    adminLogout()
    navigate('/admin-login', { replace: true })
  }

  const handleResetToDefault = async () => {
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      await resetToDefaultPassword()
      setSuccess('密码已恢复为出厂默认值，请使用默认密码登录')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        adminLogout()
        navigate('/admin-login', { replace: true })
      }, 1500)
    } catch {
      setError('恢复默认密码失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="change-password-page">
      <div className="change-password-container">
        <h1 className="change-password-title">修改管理员密码</h1>
        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">当前密码</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="请输入当前密码"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">新密码</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? '处理中...' : '修改密码'}
          </button>
          <button type="button" className="reset-button" onClick={handleResetToDefault} disabled={isLoading}>
            恢复默认密码
          </button>
          <button type="button" className="logout-button" onClick={handleLogout}>
            退出登录
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword