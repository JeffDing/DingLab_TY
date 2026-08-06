/**
 * 认证工具模块
 * 提供管理员密码哈希、验证、登录状态管理等功能
 * 注意：前端密码哈希仅用于基本防护，不是安全存储方案
 */

// localStorage 中存储管理员登录状态的键名
const ADMIN_LOGIN_KEY = 'dinglab_admin_logged_in'
// localStorage 中存储密码哈希的键名
const ADMIN_PASSWORD_HASH_KEY = 'dinglab_admin_password_hash'
// 初始密码的 SHA-256 哈希值
const INITIAL_PASSWORD_HASH = 'ce1a59f60bed4775f1ba2af66e22f515623673dbcece2d7f95bee02e94406c3a'

/**
 * 使用 Web Crypto API 或纯 JS 回退实现计算字符串的 SHA-256 哈希
 * @param password 待哈希的密码字符串
 * @returns Promise<string> 返回十六进制哈希字符串
 */
export async function hashPassword(password: string): Promise<string> {
  // 优先使用 Web Crypto API（更安全、更快速）
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      // 如果 Web Crypto API 失败，回退到纯 JS 实现
    }
  }

  // 纯 JavaScript 回退实现（适用于非安全上下文或旧浏览器）
  return sha256Fallback(password)
}

/**
 * 纯 JavaScript SHA-256 回退实现
 * 用于 Web Crypto API 不可用的环境（如 file:// 协议、非 HTTPS 等）
 */
function sha256Fallback(message: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount))
  }

  // 初始哈希值
  let h0 = 0x6a09e667
  let h1 = 0xbb67ae85
  let h2 = 0x3c6ef372
  let h3 = 0xa54ff53a
  let h4 = 0x510e527f
  let h5 = 0x9b05688c
  let h6 = 0x1f83d9ab
  let h7 = 0x5be0cd19

  // 常量 K
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]

  // 预处理消息
  let msg = ''
  for (let i = 0; i < message.length; i++) {
    msg += String.fromCharCode(message.charCodeAt(i))
  }

  const msgLen = message.length * 8
  msg += String.fromCharCode(0x80)
  while (msg.length % 64 !== 56) {
    msg += String.fromCharCode(0)
  }

  for (let i = 56; i >= 0; i -= 8) {
    msg += String.fromCharCode((msgLen / Math.pow(2, i)) & 0xff)
  }

  // 处理消息块
  for (let offset = 0; offset < msg.length; offset += 64) {
    const block = msg.slice(offset, offset + 64)
    const w = new Array(64)

    // 填充消息调度数组
    for (let i = 0; i < 16; i++) {
      w[i] = 0
      for (let j = 0; j < 4; j++) {
        w[i] = (w[i] << 8) | block.charCodeAt(i * 4 + j)
      }
    }

    // 扩展消息调度数组
    for (let i = 16; i < 64; i++) {
      const w15 = w[i - 15]
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)
      const w2 = w[i - 2]
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0
    }

    // 初始化工作变量
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7

    // 主循环
    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
      const chVal = (e & f) ^ (~e & g)
      const temp1 = (h + s1 + chVal + k[i] + w[i]) | 0
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
      const majVal = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (s0 + majVal) | 0

      h = g
      g = f
      f = e
      e = (d + temp1) | 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) | 0
    }

    // 更新哈希值
    h0 = (h0 + a) | 0
    h1 = (h1 + b) | 0
    h2 = (h2 + c) | 0
    h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0
    h5 = (h5 + f) | 0
    h6 = (h6 + g) | 0
    h7 = (h7 + h) | 0
  }

  // 输出最终哈希值
  const result = [h0, h1, h2, h3, h4, h5, h6, h7]
  let hex = ''
  for (let i = 0; i < 8; i++) {
    hex += ('00000000' + (result[i] >>> 0).toString(16)).slice(-8)
  }
  return hex
}


/**
 * 验证输入密码是否与存储的哈希值匹配
 * @param input 用户输入的密码
 * @param storedHash 存储的哈希值
 * @returns boolean 密码是否匹配
 */
export async function verifyPassword(input: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(input)
  return inputHash === storedHash
}

/**
 * 检查管理员是否已登录
 * @returns boolean 登录状态
 */
export function isAdminLoggedIn(): boolean {
  return sessionStorage.getItem(ADMIN_LOGIN_KEY) === 'true'
}

/**
 * 管理员登录
 * @param password 输入的密码
 * @returns boolean 登录是否成功
 */
export async function adminLogin(password: string): Promise<boolean> {
  const storedHash = localStorage.getItem(ADMIN_PASSWORD_HASH_KEY)
  
  // 如果 localStorage 中没有密码哈希，说明是首次使用，自动初始化默认密码
  if (!storedHash) {
    localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, INITIAL_PASSWORD_HASH)
  }
  
  const currentHash = localStorage.getItem(ADMIN_PASSWORD_HASH_KEY) || INITIAL_PASSWORD_HASH
  const isValid = await verifyPassword(password, currentHash)
  if (isValid) {
    sessionStorage.setItem(ADMIN_LOGIN_KEY, 'true')
    return true
  }
  
  // 如果存储的哈希不是默认密码哈希，说明密码已被修改，给出明确提示
  if (currentHash !== INITIAL_PASSWORD_HASH) {
    throw new Error('默认密码已更改，请使用"恢复默认密码"功能')
  }
  
  return false
}

/**
 * 管理员退出登录
 */
export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_LOGIN_KEY)
}

/**
 * 修改管理员密码
 * @param newPassword 新密码
 * @throws Error 如果新密码为空
 */
export async function changePassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.trim() === '') {
    throw new Error('新密码不能为空')
  }
  const newHash = await hashPassword(newPassword.trim())
  localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, newHash)
}

/**
 * 初始化默认密码（仅在首次使用时调用）
 * 将初始密码的哈希值写入 localStorage
 */
export async function initDefaultPassword(): Promise<void> {
  const storedHash = localStorage.getItem(ADMIN_PASSWORD_HASH_KEY)
  if (!storedHash) {
    localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, INITIAL_PASSWORD_HASH)
  }
}

/**
 * 重置为默认密码
 * 将管理员密码恢复到出厂默认值
 */
export async function resetToDefaultPassword(): Promise<void> {
  localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, INITIAL_PASSWORD_HASH)
}