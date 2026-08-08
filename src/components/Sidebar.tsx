/**
 * 左侧导航 Sidebar 组件
 * 支持折叠/展开分类、本地页面和外部链接导航
 */

import { useState, useEffect, useCallback } from 'react'
import type { NavItem } from '../types/nav'
import { fetchNavData } from '../utils/navigationData'
import './Sidebar.css'

interface SidebarProps {
  onNavigate: (url: string, target: '_self' | '_blank' | 'main') => void
  navData?: NavItem[]
}

function Sidebar({ onNavigate, navData: propNavData }: SidebarProps) {
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const hasPropNavData = !!propNavData

  // 从文件式数据库（或回退 localStorage）加载导航数据
  useEffect(() => {
    if (hasPropNavData) {
      setNavItems(propNavData)
      return
    }

    let cancelled = false
    fetchNavData().then((data) => {
      if (!cancelled) setNavItems(data)
    })
    return () => {
      cancelled = true
    }
  }, [hasPropNavData, propNavData])

  // 监听数据更新事件，重新拉取最新数据
  useEffect(() => {
    if (hasPropNavData) return

    const handleUpdate = () => {
      fetchNavData().then((data) => setNavItems(data))
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarNavData') handleUpdate()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('navDataUpdated', handleUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('navDataUpdated', handleUpdate)
    }
  }, [hasPropNavData])



  // 切换分类展开/折叠状态
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

  // 处理链接点击
  const handleItemClick = useCallback(
    (item: NavItem) => {
      if (!item.url) return

      const target = item.target as '_self' | '_blank' | 'main' | undefined

      if (target === '_blank') {
        // 在新标签页打开
        window.open(item.url, '_blank', 'noopener,noreferrer')
      } else if (target === '_self') {
        // 当前页面跳转
        window.location.href = item.url
      } else if (target === 'main' || target === '_top') {
        // 通过父组件回调传递，在 iframe 中加载
        onNavigate(item.url, 'main')
      }
    },
    [onNavigate],
  )

  // 渲染分类
  const renderCategory = (item: NavItem) => {
    const isExpanded = expandedIds.has(item.id)

    return (
      <li key={item.id} className="nav-category">
        <div
          className={`nav-category-title ${isExpanded ? 'expanded' : ''}`}
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
          <span className="nav-category-name">{item.name}</span>
          <span className={`nav-category-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
        </div>
        {isExpanded && item.children && item.children.length > 0 && (
          <ul className="nav-children">
            {item.children
              .sort((a, b) => a.order - b.order)
              .map((child) => (
                <li key={child.id} className="nav-child">
                  <a
                    className="nav-child-link"
                    href={child.url || '#'}
                    onClick={(e) => {
                      e.preventDefault()
                      handleItemClick(child)
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  >
                    {child.name}
                  </a>
                </li>
              ))}
          </ul>
        )}
      </li>
    )
  }

  // 渲染独立链接（非分类项）
  const renderLink = (item: NavItem) => (
    <li key={item.id} className="nav-link-item">
      <a
        className="nav-link"
        href={item.url || '#'}
        onClick={(e) => {
          e.preventDefault()
          handleItemClick(item)
        }}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      >
        {item.name}
      </a>
    </li>
  )

  // 对导航项按 order 排序
  const sortedItems = [...navItems].sort((a, b) => a.order - b.order)

  return (
    <nav className="sidebar" aria-label="侧边导航">
      <ul className="nav-list">
        {sortedItems.map((item) => {
          if (item.type === 'category') {
            return renderCategory(item)
          }
          return renderLink(item)
        })}
      </ul>
    </nav>
  )
}

export default Sidebar