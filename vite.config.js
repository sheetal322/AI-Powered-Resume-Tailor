import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tailorHandler from './api/tailor.js'
import atsScoreHandler from './api/ats-score.js'

const handlers = {
  'tailor': tailorHandler,
  'ats-score': atsScoreHandler,
}

function apiPlugin() {
  return {
    name: 'vercel-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url?.startsWith('/api/')) return next()

        const name = url.slice(5)
        const handler = handlers[name]

        if (!handler) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'API route not found' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          req.body = body ? (() => { try { return JSON.parse(body) } catch { return {} } })() : {}

          const respond = {
            _status: 200,
            status(code) { this._status = code; return this },
            json(data) {
              res.writeHead(this._status, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(data))
            },
          }

          try {
            await handler(req, respond)
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
})
