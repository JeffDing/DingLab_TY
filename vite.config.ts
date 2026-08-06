import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { navDataApiPlugin } from './vite.plugins/navDataApi'

/**
 * Vite 插件：防止 public 目录中不存在的 HTML 文件触发 SPA fallback
 * 当 iframe 请求一个不存在的本地 HTML 文件时，避免返回 index.html 导致无限循环
 */
function preventSpaFallbackForMissingHtml(): Plugin {
  return {
    name: 'prevent-spa-fallback-for-missing-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url && url.endsWith('.html')) {
          // 检查文件是否存在于 public 目录
          const filePath = path.join(server.config.publicDir, url)
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end('<h1>404 - 页面未找到</h1><p>请求的页面不存在。</p>')
            return
          }
        }
        next()
      })
    }
  }
}

// 导航数据持久化文件路径（与 defaultNav.json 同目录）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const navDataFilePath = path.resolve(__dirname, 'src/data/navData.json')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), preventSpaFallbackForMissingHtml(), navDataApiPlugin(navDataFilePath)],
  // gh-pages 部署在 https://jeffding.github.io/DingLab_TY/，base 必须为该子路径
  base: '/DingLab_TY/',
  server: {
    port: 5173,
    host: true
  }
})
