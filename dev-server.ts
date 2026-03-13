import express from 'express'
import { readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { readFileSync } from 'fs'

// Load .env manually (no dotenv dependency)
try {
  const envFile = readFileSync(join(import.meta.dirname, '.env'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const val = trimmed.slice(eq + 1)
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

const app = express()
app.use(express.json())

const apiDir = join(import.meta.dirname, 'api')

function findRoutes(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...findRoutes(full))
    } else if (entry.endsWith('.ts') && !entry.startsWith('_')) {
      files.push(full)
    }
  }
  return files
}

async function loadRoutes() {
  const files = findRoutes(apiDir)

  for (const file of files) {
    const rel = relative(apiDir, file).replace(/\.ts$/, '')
    const route = `/api/${rel}`
    let mod
    try {
      mod = await import(file)
    } catch (e) {
      console.log(`  ${route} (SKIPPED: ${e instanceof Error ? e.message.split('\n')[0] : 'import error'})`)
      continue
    }
    const handler = mod.default

    if (typeof handler === 'function') {
      app.all(route, (req, res) => {
        handler(req, res)
      })
      console.log(`  ${route}`)
    }
  }
}

async function start() {
  console.log('Loading API routes...')
  await loadRoutes()
  console.log('')
  app.listen(3000, () => {
    console.log('API server running at http://localhost:3000')
    console.log('Run "npm run dev" in another terminal for the frontend')
  })
}

start()
