import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Generate /public/favicon.ico from the existing icon-192.svg.
 *
 * Sharp's PNG output, written with a `.ico` extension, is accepted by every
 * mainstream browser (Chrome, Firefox, Safari, Edge, Bing's crawler) — they
 * sniff the magic bytes rather than trusting the extension. This is the
 * minimum-viable favicon for production.
 *
 * Run once locally or as part of CI:
 *   node scripts/generate-favicon.js
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '../public')

async function main() {
  const svgPath = path.join(publicDir, 'icons', 'icon-192.svg')
  const icoPath = path.join(publicDir, 'favicon.ico')

  if (!fs.existsSync(svgPath)) {
    console.error('Source icon not found:', svgPath)
    process.exit(1)
  }

  // Browsers happily accept a 32x32 PNG saved as favicon.ico.
  await sharp(svgPath).resize(32, 32).png().toFile(icoPath)
  console.log('Generated', icoPath)
}

main().catch((error) => {
  console.error('Failed to generate favicon:', error)
  process.exit(1)
})
