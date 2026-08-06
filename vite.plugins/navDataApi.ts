/**
 * Vite 插件：提供导航数据的文件式持久化 REST API
 *
 * 拦截 /api/nav-data 路径：
 *   GET  -> 返回 src/data/navData.json 内容
 *   POST -> 将请求体写入 src/data/navData.json
 *
 * 适用于 dev server 与 preview server（均为 Node 进程）。
 * 静态托管无 Node 后端时，前端会自动回退到 localStorage。
 */
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

const API_PATH = '/api/nav-data'

export function navDataApiPlugin(dataFilePath: string): Plugin {
  return {
    name: 'nav-data-api',
    configureServer(server) {
      server.middlewares.use(API_PATH, async (req, res) => {
        try {
          if (req.method === 'GET') {
            if (!fs.existsSync(dataFilePath)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'navData.json not found' }))
              return
            }
            const content = await fs.promises.readFile(dataFilePath, 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(content)
            return
          }

          if (req.method === 'POST') {
            const body = await readBody(req)
            // 校验是合法 JSON 数组
            const parsed = JSON.parse(body)
            if (!Array.isArray(parsed)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'payload must be a JSON array' }))
              return
            }
            // 确保目录存在
            await fs.promises.mkdir(path.dirname(dataFilePath), { recursive: true })
            await fs.promises.writeFile(dataFilePath, JSON.stringify(parsed, null, 2), 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: true }))
            return
          }

          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'method not allowed' }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
    configurePreviewServer(server) {
      // preview server 复用同一套逻辑
      server.middlewares.use(API_PATH, async (req, res) => {
        try {
          if (req.method === 'GET') {
            if (!fs.existsSync(dataFilePath)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'navData.json not found' }))
              return
            }
            const content = await fs.promises.readFile(dataFilePath, 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(content)
            return
          }

          if (req.method === 'POST') {
            const body = await readBody(req)
            const parsed = JSON.parse(body)
            if (!Array.isArray(parsed)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'payload must be a JSON array' }))
              return
            }
            await fs.promises.mkdir(path.dirname(dataFilePath), { recursive: true })
            await fs.promises.writeFile(dataFilePath, JSON.stringify(parsed, null, 2), 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: true }))
            return
          }

          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'method not allowed' }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: any) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}
