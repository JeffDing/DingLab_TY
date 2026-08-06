#!/usr/bin/env node
/**
 * 根据 src/data/navData.json 同步 public/wap.html 的菜单部分
 *
 * 规则：
 * 1. 解析 wap.html 现有菜单（分类 + 独立链接）
 * 2. 解析 navData.json
 * 3. 按"分类名"匹配：
 *    - wap.html 已有的分类：保留其原有链接，追加 navData.json 中有但 wap.html 没有的新链接（按名称匹配）
 *    - navData.json 中有但 wap.html 没有的分类：追加到末尾，用 navData.json 的链接
 *    - wap.html 有但 navData.json 没有的分类：保留不动
 * 4. 独立链接（非分类项）按名称匹配，navData.json 新增的追加到末尾
 * 5. 重新分配连续编号 menu1/list1、menu2/list2...
 *
 * 用法：node scripts/sync-wap-html.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const NAV_DATA_PATH = path.join(projectRoot, 'src/data/navData.json')
const WAP_HTML_PATH = path.join(projectRoot, 'public/wap.html')

// ---------- 解析 navData.json ----------
function loadNavData() {
  const raw = fs.readFileSync(NAV_DATA_PATH, 'utf-8')
  return JSON.parse(raw)
}

// ---------- 解析 wap.html 菜单 ----------
// 提取 <div id="nav"> ... </div> 内的菜单项
function parseWapMenu(html) {
  // 定位 #nav div 内容
  const navStart = html.indexOf('<div id="nav">')
  if (navStart === -1) throw new Error('未找到 <div id="nav">')
  // 找到匹配的 </div>（考虑嵌套）
  let depth = 0
  let i = navStart
  let navEnd = -1
  while (i < html.length) {
    if (html.slice(i, i + 4) === '<div') depth++
    if (html.slice(i, i + 6) === '</div>') {
      depth--
      if (depth === 0) {
        navEnd = i + 6
        break
      }
    }
    i++
  }
  if (navEnd === -1) throw new Error('未找到 #nav 闭合标签')

  const navContent = html.slice(navStart, navEnd)
  // 用正则切分每个顶层菜单项：class="title" 的 div
  // 每个 title div 可能后跟一个 content div（分类）或自带链接（独立项）
  const items = []
  // 匹配 <div class="title" id="menuX" onclick="showmenu('X')">...</div>
  // 由于 div 内可能嵌套 <a>，我们匹配到第一个 </div>
  const titleRegex = /<div\s+class="title"\s+id="menu(\d+)"\s+onclick="showmenu\('(\d+)'\)"\s*>([\s\S]*?)<\/div>/g
  let match
  const titleMatches = []
  while ((match = titleRegex.exec(navContent)) !== null) {
    titleMatches.push({
      full: match[0],
      num: match[1],
      inner: match[3],
      index: match.index,
      endIndex: titleRegex.lastIndex,
    })
  }

  for (const tm of titleMatches) {
    const inner = tm.inner.trim()
    // 判断是否独立链接（内含 <a> 标签）
    const linkMatch = inner.match(/<a\s+[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/i)
    if (linkMatch) {
      // 独立链接项
      const targetMatch = inner.match(/target="([^"]*)"/i)
      items.push({
        type: 'link',
        name: linkMatch[2].trim(),
        url: linkMatch[1],
        target: targetMatch ? targetMatch[1] : '_self',
        originalTitle: tm.full,
      })
    } else {
      // 分类项，inner 是分类名（纯文本）
      const categoryName = inner.trim()
      // 查找紧随其后的 <div id="listX" class="content" ...>...</div>
      const listRegex = new RegExp(`<div\\s+id="list${tm.num}"\\s+class="content"[^>]*>([\\s\\S]*?)<\\/div>\\s*(?=\\s*<div\\s+class="title"|\\s*<script|\\s*<\\/div>)`, 'i')
      // 上面正则不可靠，改用从 title 结束位置向后搜索 listX
      const afterTitle = navContent.slice(tm.endIndex)
      const listStartRegex = new RegExp(`<div\\s+id="list${tm.num}"\\s+class="content"[^>]*>`, 'i')
      const listStartMatch = listStartRegex.exec(afterTitle)
      let children = []
      let listFull = ''
      if (listStartMatch) {
        const listContentStart = tm.endIndex + listStartMatch.index + listStartMatch[0].length
        // 找到 list div 的闭合（注意 ul/li 嵌套，但 list div 内只有 ul>li，无嵌套 div）
        const listCloseIdx = findMatchingDivClose(navContent, listContentStart)
        if (listCloseIdx !== -1) {
          listFull = navContent.slice(tm.endIndex + listStartMatch.index, listCloseIdx + 6)
          const listInner = navContent.slice(listContentStart, listCloseIdx)
          // 提取所有 <li><a ...>name</a></li>
          const liRegex = /<li>\s*<a\s+[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>\s*<\/li>/gi
          let liMatch
          while ((liMatch = liRegex.exec(listInner)) !== null) {
            const liFull = liMatch[0]
            const targetMatch = liFull.match(/target="([^"]*)"/i)
            children.push({
              name: liMatch[2].trim(),
              url: liMatch[1],
              target: targetMatch ? targetMatch[1] : '_self',
            })
          }
        }
      }
      items.push({
        type: 'category',
        name: categoryName,
        children,
        originalTitle: tm.full,
        originalList: listFull,
      })
    }
  }

  return { items, navStart, navEnd, navContent }
}

// 从 pos 开始找第一个 </div>（假设 pos 在某个 div 内部，且内部无嵌套 div）
function findMatchingDivClose(html, pos) {
  let depth = 1
  let i = pos
  while (i < html.length) {
    if (html.slice(i, i + 4) === '<div') depth++
    if (html.slice(i, i + 6) === '</div>') {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

// ---------- 合并逻辑 ----------
function mergeMenus(wapItems, navItems) {
  // navItems 按 order 排序
  const sortedNav = [...navItems].sort((a, b) => a.order - b.order)

  // 用 Map 按 name 索引 wap 分类
  const wapCategoryByName = new Map()
  const wapLinkNames = new Set()
  for (const item of wapItems) {
    if (item.type === 'category') {
      wapCategoryByName.set(item.name, item)
    } else {
      wapLinkNames.add(item.name)
    }
  }

  const result = [] // 合并后的菜单项列表

  // 1. 先按 navData 顺序处理
  const navCategoryNames = new Set()
  for (const navItem of sortedNav) {
    if (navItem.type === 'category') {
      navCategoryNames.add(navItem.name)
      const wapCat = wapCategoryByName.get(navItem.name)
      if (wapCat) {
        // 已有分类：保留 wap 原有链接，追加 navData 新链接
        const existingChildNames = new Set(wapCat.children.map((c) => c.name))
        const navChildren = (navItem.children || [])
          .slice()
          .sort((a, b) => a.order - b.order)
        const newChildren = [...wapCat.children]
        for (const nc of navChildren) {
          if (!existingChildNames.has(nc.name)) {
            newChildren.push({
              name: nc.name,
              url: nc.url || '#',
              target: nc.target || '_self',
            })
          }
        }
        result.push({
          type: 'category',
          name: navItem.name,
          children: newChildren,
        })
      } else {
        // 新分类：用 navData 的链接
        const children = (navItem.children || [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((c) => ({
            name: c.name,
            url: c.url || '#',
            target: c.target || '_self',
          }))
        result.push({
          type: 'category',
          name: navItem.name,
          children,
        })
      }
    } else {
      // 独立链接项
      if (!wapLinkNames.has(navItem.name)) {
        // 新链接，追加
        result.push({
          type: 'link',
          name: navItem.name,
          url: navItem.url || '#',
          target: navItem.target || '_self',
        })
      } else {
        // 已存在，保留 wap 原样（稍后处理）
        result.push({
          type: 'link',
          name: navItem.name,
          url: navItem.url || '#',
          target: navItem.target || '_self',
          _existing: true,
        })
      }
    }
  }

  // 2. 追加 wap.html 有但 navData 没有的分类（保留原样）
  for (const wapItem of wapItems) {
    if (wapItem.type === 'category' && !navCategoryNames.has(wapItem.name)) {
      result.push({
        type: 'category',
        name: wapItem.name,
        children: wapItem.children,
      })
    }
  }

  // 3. 追加 wap.html 有但 navData 没有的独立链接（保留原样）
  const navLinkNames = new Set(sortedNav.filter((i) => i.type !== 'category').map((i) => i.name))
  for (const wapItem of wapItems) {
    if (wapItem.type === 'link' && !navLinkNames.has(wapItem.name)) {
      // 避免重复（已在 result 中标记 _existing 的跳过）
      if (!result.some((r) => r.type === 'link' && r.name === wapItem.name)) {
        result.push({
          type: 'link',
          name: wapItem.name,
          url: wapItem.url,
          target: wapItem.target,
        })
      }
    }
  }

  // 4. 对 result 中标记 _existing 的独立链接，用 wap 原始数据替换
  for (let i = 0; i < result.length; i++) {
    if (result[i]._existing) {
      const wapItem = wapItems.find((w) => w.type === 'link' && w.name === result[i].name)
      if (wapItem) {
        result[i].url = wapItem.url
        result[i].target = wapItem.target
      }
      delete result[i]._existing
    }
  }

  return result
}

// ---------- 生成 HTML ----------
function generateMenuHtml(items) {
  const lines = []
  let num = 1
  for (const item of items) {
    if (item.type === 'link') {
      // 独立链接：<div class="title" id="menuN" onclick="showmenu('N') "><a target="X" href="URL">NAME</a></div>
      lines.push(
        `            <div class="title" id="menu${num}" onclick="showmenu('${num}') "><a target="${item.target}" href="${item.url}">${item.name}</a></div>`,
      )
      lines.push('')
      num++
    } else {
      // 分类
      lines.push(`            <div class="title" id="menu${num}" onclick="showmenu('${num}')">${item.name}</div>`)
      lines.push(`            <div id="list${num}" class="content" style="display:none">`)
      lines.push(`                <ul>`)
      for (const child of item.children) {
        lines.push(`                    <li><a target="${child.target}" href="${child.url}">${child.name}</a></li>`)
      }
      lines.push(`                </ul>`)
      lines.push(`            </div>`)
      lines.push('')
      num++
    }
  }
  return lines.join('\n')
}

// ---------- 主流程 ----------
function main() {
  console.log('读取 navData.json...')
  const navItems = loadNavData()
  console.log(`  navData 共 ${navItems.length} 个顶级项`)

  console.log('读取 wap.html...')
  const html = fs.readFileSync(WAP_HTML_PATH, 'utf-8')
  const { items: wapItems, navStart, navEnd } = parseWapMenu(html)
  console.log(`  wap.html 共 ${wapItems.length} 个菜单项`)

  console.log('合并菜单...')
  const merged = mergeMenus(wapItems, navItems)
  console.log(`  合并后共 ${merged.length} 个菜单项`)

  // 统计变化
  const wapCatNames = new Set(wapItems.filter((i) => i.type === 'category').map((i) => i.name))
  const mergedCatNames = new Set(merged.filter((i) => i.type === 'category').map((i) => i.name))
  const newCats = [...mergedCatNames].filter((n) => !wapCatNames.has(n))
  if (newCats.length > 0) {
    console.log(`  新增分类: ${newCats.join(', ')}`)
  } else {
    console.log('  无新增分类')
  }

  console.log('生成新菜单 HTML...')
  const newMenuHtml = generateMenuHtml(merged)

  // 替换原 #nav 内容
  const newHtml = html.slice(0, navStart) + `<div id="nav">\n` + newMenuHtml + `        </div>` + html.slice(navEnd)

  // 备份原文件
  const backupPath = WAP_HTML_PATH + '.bak'
  fs.writeFileSync(backupPath, html, 'utf-8')
  console.log(`已备份原文件到 ${backupPath}`)

  fs.writeFileSync(WAP_HTML_PATH, newHtml, 'utf-8')
  console.log(`已写入新 wap.html`)
  console.log('完成！')
}

main()
