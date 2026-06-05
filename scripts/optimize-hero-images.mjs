// One-off: compress oversized hero PNGs in public/ into web-sized WebP.
// Run: node scripts/optimize-hero-images.mjs
import sharp from 'sharp'
import { stat } from 'node:fs/promises'

const names = ['main_image', 'parentlogin', 'teacher']
const MAX_WIDTH = 960

for (const name of names) {
  const src = `public/${name}.png`
  const out = `public/${name}.webp`
  try {
    const before = (await stat(src)).size
    await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(out)
    const after = (await stat(out)).size
    console.log(`${name}: ${(before / 1024).toFixed(0)}KB png -> ${(after / 1024).toFixed(0)}KB webp`)
  } catch (err) {
    console.error(`skip ${name}:`, err.message)
  }
}
