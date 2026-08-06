/**
 * URL 验证工具模块
 * 提供 URL 合法性校验、本地页面路径判断等功能
 */

/**
 * 验证 URL 是否合法
 * @param url 待验证的 URL 字符串
 * @returns boolean URL 是否合法
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 判断是否为本地页面
 * 以 ./ 或 / 开头，且不是 http/https 开头
 * @param url 待判断的 URL 字符串
 * @returns boolean 是否为本地页面
 */
export function isLocalPage(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  // 排除 http/https 开头的 URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false
  }
  // 以 ./ 或 / 开头的视为本地页面
  return url.startsWith('/') || url.startsWith('./')
}

/**
 * 获取本地页面路径
 * 去掉 ./ 前缀，用于 public 目录访问
 * @param url 本地页面 URL
 * @returns string 处理后的页面路径
 */
export function getLocalPagePath(url: string): string {
  if (!url || typeof url !== 'string') {
    return url
  }
  // 去掉开头的 ./ 
  if (url.startsWith('./')) {
    return url.slice(2)
  }
  // 以 / 开头的路径保持不变（或去掉首斜杠，根据实际需求）
  return url
}