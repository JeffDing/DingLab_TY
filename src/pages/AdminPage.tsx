/**
 * 导航管理页面
 * 用于管理导航中的分类、链接和本地页面
 */

import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdminLoggedIn, adminLogout } from '../utils/auth'
import type { NavItem } from '../types/nav'
import {
  fetchNavData,
  saveNavData,
  resetToDefault,
  addCategory,
  deleteCategory,
  updateCategoryName,
  addChildToCategory,
  updateChildItem,
  deleteChildItem,
  moveCategory,
  moveChildItem,
} from '../utils/navigationData'
import './AdminPage.css'

function AdminPage() {
  // 路由守卫：未登录则重定向到登录页
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin-login" replace />
  }

  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // 加载导航数据（优先文件式数据库，回退 localStorage）
  useEffect(() => {
    let cancelled = false
    fetchNavData().then((data) => {
      if (!cancelled) {
        setNavItems(data)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 显示提示消息
  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2000)
  }, [])

  // 切换分类展开/折叠
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 添加新分类
  const handleAddCategory = () => {
    const name = prompt('请输入新分类名称：')
    if (name && name.trim()) {
      const newItems = addCategory(navItems, name)
      setNavItems(newItems)
      showMessage('分类添加成功')
    }
  }

  // 删除分类
  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (confirm(`确定删除分类"${categoryName}"及其所有子项吗？`)) {
      const newItems = deleteCategory(navItems, categoryId)
      setNavItems(newItems)
      showMessage('分类已删除')
    }
  }

  // 更新分类名称
  const handleUpdateCategoryName = (categoryId: string, currentName: string) => {
    const newName = prompt('请输入新分类名称：', currentName)
    if (newName && newName.trim() && newName.trim() !== currentName) {
      const newItems = updateCategoryName(navItems, categoryId, newName.trim())
      setNavItems(newItems)
      showMessage('分类名称已更新')
    }
  }

  // 添加子项
  const handleAddChild = (categoryId: string) => {
    const childType = prompt('请输入子项类型（link 或 local-page）：', 'link')
    if (!childType || !['link', 'local-page'].includes(childType.trim())) {
      alert('类型只能为 link 或 local-page')
      return
    }

    const type = childType.trim() as 'link' | 'local-page'
    const name = prompt('请输入子项名称：')
    if (!name || !name.trim()) return

    const url = prompt('请输入 URL：')
    if (!url || !url.trim()) return

    const targetOptions = ['_self', '_blank', '_top', 'main']
    const target = prompt(`请输入 target（${targetOptions.join(', ')}）：`, '_blank')
    if (!target || !targetOptions.includes(target.trim())) {
      alert(`target 只能是：${targetOptions.join(', ')}`)
      return
    }

    const newItems = addChildToCategory(navItems, categoryId, {
      name: name.trim(),
      url: url.trim(),
      target: target.trim() as '_self' | '_blank' | '_top' | 'main',
      type,
      parentId: categoryId,
    })

    setNavItems(newItems)
    showMessage('子项添加成功')
  }

  // 更新子项
  const handleUpdateChild = (

    childId: string,
    field: 'name' | 'url' | 'target' | 'type',
    currentValue: string,
  ) => {
    let newValue: string | undefined
    if (field === 'type') {
      const input = prompt('请输入类型（link 或 local-page）：', currentValue)
      if (!input || !['link', 'local-page'].includes(input.trim())) {
        alert('类型只能为 link 或 local-page')
        return
      }
      newValue = input.trim()
    } else if (field === 'target') {
      const targetOptions = ['_self', '_blank', '_top', 'main']
      const input = prompt(`请输入 target（${targetOptions.join(', ')}）：`, currentValue)
      if (!input || !targetOptions.includes(input.trim())) {
        alert(`target 只能是：${targetOptions.join(', ')}`)
        return
      }
      newValue = input.trim()
    } else {
      const input = prompt(`请输入${field === 'name' ? '名称' : 'URL'}：`, currentValue)
      if (input === null) return
      newValue = input.trim() || undefined
    }

    if (newValue === undefined) return

    const newItems = updateChildItem(navItems, childId, { [field]: newValue })
    setNavItems(newItems)
    showMessage('子项已更新')
  }

  // 删除子项
  const handleDeleteChild = (childId: string, childName: string) => {
    if (confirm(`确定删除子项"${childName}"吗？`)) {
      const newItems = deleteChildItem(navItems, childId)
      setNavItems(newItems)
      showMessage('子项已删除')
    }
  }

  // 移动分类顺序
  const handleMoveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const newItems = moveCategory(navItems, categoryId, direction)
    setNavItems(newItems)
  }

  // 移动子项顺序
  const handleMoveChild = (childId: string, direction: 'up' | 'down') => {
    const newItems = moveChildItem(navItems, childId, direction)
    setNavItems(newItems)
  }

  // 重置为默认
  const handleResetToDefault = () => {
    if (confirm('确定重置为默认导航数据吗？所有自定义修改将被丢失。')) {
      const defaultData = resetToDefault()
      saveNavData(defaultData)
      setNavItems(defaultData)
      setExpandedIds(new Set())
      showMessage('已重置为默认数据')
    }
  }

  // 退出登录
  const handleLogout = () => {
    adminLogout()
  }

  // 排序后的导航项
  const sortedItems = [...navItems].sort((a, b) => a.order - b.order)

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>导航管理</h1>
          <div className="admin-header-actions">
            <button onClick={handleResetToDefault} className="admin-reset-btn">
              重置为默认
            </button>
            <button onClick={handleLogout} className="admin-logout-btn">
              退出登录
            </button>
          </div>
        </div>

        {message && <div className="admin-message">{message}</div>}

        {isLoading ? (
          <div className="admin-loading">加载中...</div>
        ) : (
        <div className="admin-content">
          {sortedItems.map((item, index) => {
            if (item.type !== 'category') return null

            const isExpanded = expandedIds.has(item.id)
            const children = item.children || []
            const isFirstCategory = index === 0
            const isLastCategory = index === sortedItems.length - 1

            return (
              <div key={item.id} className="category-card">
                <div className="category-header">
                  <div className="category-title">
                    <span
                      className="category-name"
                      onClick={() => toggleExpand(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleExpand(item.id)
                        }
                      }}
                    >
                      <span className={`category-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
                      {item.name}
                    </span>
                    <span className="category-count">({children.length})</span>
                  </div>
                  <div className="category-actions">
                    <button
                      onClick={() => handleMoveCategory(item.id, 'up')}
                      className="admin-btn admin-btn-small admin-btn-move"
                      disabled={isFirstCategory}
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveCategory(item.id, 'down')}
                      className="admin-btn admin-btn-small admin-btn-move"
                      disabled={isLastCategory}
                      title="下移"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleUpdateCategoryName(item.id, item.name)}
                      className="admin-btn admin-btn-edit"
                    >
                      编辑分类
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(item.id, item.name)}
                      className="admin-btn admin-btn-delete"
                    >
                      删除分类
                    </button>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="admin-btn admin-btn-toggle"
                    >
                      {isExpanded ? '折叠' : '展开'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="category-body">
                    <div className="children-list">
                      {children.length === 0 ? (
                        <p className="no-children">暂无子项</p>
                      ) : (
                        children
                          .sort((a, b) => a.order - b.order)
                          .map((child, childIndex) => (
                            <div key={child.id} className="child-item">
                              <div className="child-info">
                                <span className="child-name">{child.name}</span>
                                <span className="child-type">[{child.type}]</span>
                                {child.url && <span className="child-url">{child.url}</span>}
                                <span className="child-target">target: {child.target}</span>
                              </div>
                              <div className="child-actions">
                                <button
                                  onClick={() => handleMoveChild(child.id, 'up')}
                                  className="admin-btn admin-btn-small admin-btn-move"
                                  disabled={childIndex === 0}
                                  title="上移"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => handleMoveChild(child.id, 'down')}
                                  className="admin-btn admin-btn-small admin-btn-move"
                                  disabled={childIndex === children.length - 1}
                                  title="下移"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => handleUpdateChild(child.id, 'name', child.name)}
                                  className="admin-btn admin-btn-small admin-btn-edit"
                                >
                                  名称
                                </button>
                                <button
                                  onClick={() => handleUpdateChild(child.id, 'url', child.url || '')}
                                  className="admin-btn admin-btn-small admin-btn-edit"
                                >
                                  URL
                                </button>
                                <button
                                  onClick={() => handleUpdateChild(child.id, 'target', child.target || '_self')}
                                  className="admin-btn admin-btn-small admin-btn-edit"
                                >
                                  Target
                                </button>
                                <button
                                  onClick={() => handleUpdateChild(child.id, 'type', child.type)}
                                  className="admin-btn admin-btn-small admin-btn-edit"
                                >
                                  类型
                                </button>
                                <button
                                  onClick={() => handleDeleteChild(child.id, child.name)}
                                  className="admin-btn admin-btn-small admin-btn-delete"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                    <button
                      onClick={() => handleAddChild(item.id)}
                      className="admin-btn admin-btn-add-child"
                    >
                      + 添加子项
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        )}

        <div className="admin-footer">
          <button onClick={handleAddCategory} className="admin-btn admin-btn-add-category">
            + 添加新分类
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
