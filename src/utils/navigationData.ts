/**
 * 导航数据模块
 * 提供导航数据的读取、写入、CRUD 操作及持久化
 *
 * 持久化策略（双模式）：
 * 1. 优先使用文件式数据库（通过 /api/nav-data 由 Vite 插件读写 src/data/navData.json）
 * 2. API 不可用时（静态托管）回退到 localStorage
 * 3. 始终双写 localStorage，保证前台实时生效与离线可用
 */

import type { NavItem } from '../types/nav'
import defaultNavData from '../data/defaultNav.json'

const STORAGE_KEY = 'sidebarNavData'
const API_URL = '/api/nav-data'

/**
 * 从 localStorage 或默认数据加载导航数据（同步，供初次渲染快速显示）
 * @returns NavItem[] 导航数据数组
 */
export function getNavData(): NavItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as NavItem[]
      return parsed
    }
  } catch {
    // 解析失败时回退到默认数据
  }
  return JSON.parse(JSON.stringify(defaultNavData)) as NavItem[]
}

/**
 * 异步加载导航数据：优先 GET API，失败回退 localStorage/defaultNav
 * @returns NavItem[] 导航数据数组
 */
export async function fetchNavData(): Promise<NavItem[]> {
  try {
    const res = await fetch(API_URL, { method: 'GET' })
    if (res.ok) {
      const data = (await res.json()) as NavItem[]
      // 双写 localStorage，保证前台其他组件同步可见
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // localStorage 不可用时忽略
      }
      return data
    }
  } catch {
    // API 不可用（静态托管），回退到 localStorage
  }
  return getNavData()
}

/**
 * 保存导航数据：同步写 localStorage + 派发事件，并异步 POST API（不阻塞）
 * @param data 导航数据数组
 */
export function saveNavData(data: NavItem[]): void {
  // 同步写 localStorage 并派发事件，保证前台实时生效
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('navDataUpdated'))
  } catch {
    // localStorage 不可用时静默失败
  }
  // 异步写文件式数据库（失败不影响前端）
  void persistToApi(data)
}

/**
 * 异步持久化到文件式数据库（POST API）
 * @param data 导航数据数组
 * @returns boolean 是否成功
 */
export async function persistToApi(data: NavItem[]): Promise<boolean> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 重置为默认导航数据
 * @returns NavItem[] 默认导航数据数组
 */
export function resetToDefault(): NavItem[] {
  return JSON.parse(JSON.stringify(defaultNavData)) as NavItem[]
}

/**
 * 根据 ID 查找导航项
 * @param items 导航数据数组
 * @param id 要查找的项 ID
 * @returns NavItem | undefined
 */
export function findNavItemById(items: NavItem[], id: string): NavItem | undefined {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const found = findNavItemById(item.children, id)
      if (found) return found
    }
  }
  return undefined
}

/**
 * 生成唯一 ID
 * @returns string 唯一 ID
 */
export function generateId(): string {
  return `nav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 添加顶级分类
 * @param items 当前导航数据数组
 * @param name 分类名称
 * @returns 新的导航数据数组
 */
export function addCategory(items: NavItem[], name: string): NavItem[] {
  if (!name || name.trim() === '') return items

  const maxOrder = items.reduce((max, item) => Math.max(max, item.order), 0)
  const newCategory: NavItem = {
    id: generateId(),
    name: name.trim(),
    type: 'category',
    order: maxOrder + 1,
  }

  const newItems = [...items, newCategory]
  saveNavData(newItems)
  return newItems
}

/**
 * 删除分类（级联删除子项）
 * @param items 当前导航数据数组
 * @param categoryId 要删除的分类 ID
 * @returns 新的导航数据数组
 */
export function deleteCategory(items: NavItem[], categoryId: string): NavItem[] {
  const newItems = items.filter((item) => item.id !== categoryId)
  saveNavData(newItems)
  return newItems
}

/**
 * 更新分类名称
 * @param items 当前导航数据数组
 * @param categoryId 分类 ID
 * @param newName 新名称
 * @returns 新的导航数据数组
 */
export function updateCategoryName(items: NavItem[], categoryId: string, newName: string): NavItem[] {
  const newItems = items.map((item) => {
    if (item.id === categoryId) {
      return { ...item, name: newName.trim() }
    }
    return item
  })

  saveNavData(newItems)
  return newItems
}

/**
 * 添加子项到分类
 * @param items 当前导航数据数组
 * @param categoryId 父分类 ID
 * @param childItem 子项数据
 * @returns 新的导航数据数组
 */
export function addChildToCategory(
  items: NavItem[],
  categoryId: string,
  childItem: Omit<NavItem, 'id' | 'order'>,
): NavItem[] {
  const newItems = items.map((item) => {
    if (item.id === categoryId && item.type === 'category') {
      const children = item.children || []
      const maxChildOrder = children.reduce((max, child) => Math.max(max, child.order), 0)
      const newChild: NavItem = {
        ...childItem,
        id: generateId(),
        order: maxChildOrder + 1,
      }
      return {
        ...item,
        children: [...children, newChild],
      }
    }
    return item
  })

  saveNavData(newItems)
  return newItems
}

/**
 * 更新子项信息
 * @param items 当前导航数据数组
 * @param childId 子项 ID
 * @param updates 要更新的字段
 * @returns 新的导航数据数组
 */
export function updateChildItem(
  items: NavItem[],
  childId: string,
  updates: Partial<Pick<NavItem, 'name' | 'url' | 'target' | 'type'>>,
): NavItem[] {
  const newItems = items.map((item) => {
    if (item.type !== 'category' || !item.children) return item

    const newChildren = item.children.map((child) => {
      if (child.id === childId) {
        return { ...child, ...updates }
      }
      return child
    })

    return { ...item, children: newChildren }
  })

  saveNavData(newItems)
  return newItems
}

/**
 * 删除子项
 * @param items 当前导航数据数组
 * @param childId 子项 ID
 * @returns 新的导航数据数组
 */
export function deleteChildItem(items: NavItem[], childId: string): NavItem[] {
  const newItems = items.map((item) => {
    if (item.type !== 'category' || !item.children) return item
    return {
      ...item,
      children: item.children.filter((child) => child.id !== childId),
    }
  })

  saveNavData(newItems)
  return newItems
}

/**
 * 移动顶级分类顺序（与相邻分类交换 order）
 * @param items 当前导航数据数组
 * @param categoryId 要移动的分类 ID
 * @param direction 'up' 上移 | 'down' 下移
 * @returns 新的导航数据数组
 */
export function moveCategory(
  items: NavItem[],
  categoryId: string,
  direction: 'up' | 'down',
): NavItem[] {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const index = sorted.findIndex((item) => item.id === categoryId)
  if (index === -1) return items

  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= sorted.length) return items

  const current = sorted[index]
  const target = sorted[swapIndex]
  const currentOrder = current.order
  const targetOrder = target.order

  const newItems = items.map((item) => {
    if (item.id === current.id) return { ...item, order: targetOrder }
    if (item.id === target.id) return { ...item, order: currentOrder }
    return item
  })

  saveNavData(newItems)
  return newItems
}

/**
 * 移动分类内子项顺序（与相邻子项交换 order）
 * @param items 当前导航数据数组
 * @param childId 要移动的子项 ID
 * @param direction 'up' 上移 | 'down' 下移
 * @returns 新的导航数据数组
 */
export function moveChildItem(
  items: NavItem[],
  childId: string,
  direction: 'up' | 'down',
): NavItem[] {
  const newItems = items.map((item) => {
    if (item.type !== 'category' || !item.children) return item

    const sortedChildren = [...item.children].sort((a, b) => a.order - b.order)
    const index = sortedChildren.findIndex((child) => child.id === childId)
    if (index === -1) return item

    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sortedChildren.length) return item

    const current = sortedChildren[index]
    const target = sortedChildren[swapIndex]
    const currentOrder = current.order
    const targetOrder = target.order

    const newChildren = item.children.map((child) => {
      if (child.id === current.id) return { ...child, order: targetOrder }
      if (child.id === target.id) return { ...child, order: currentOrder }
      return child
    })

    return { ...item, children: newChildren }
  })

  saveNavData(newItems)
  return newItems
}
