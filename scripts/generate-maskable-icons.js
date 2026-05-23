import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const iconsDir = path.resolve(__dirname, '../public/icons')

// Maskable spec: keep the logo within the central 80% "safe zone".
// Logo occupies ~62% of the canvas, centered on the brand background.
const BG = '#1c1b35'

async function makeMaskable(size) {
  const logoSize = Math.round(size * 0.62)
  const offset = Math.round((size - logoSize) / 2)
  const logo = await sharp(path.join(iconsDir, 'icon-512.svg')).resize(logoSize, logoSize).png().toBuffer()

  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${BG}"/></svg>`,
  )

  await sharp(bg)
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(path.join(iconsDir, `icon-${size}-maskable.png`))
  console.log(`Successfully generated: icon-${size}-maskable.png`)
}

async function main() {
  try {
    await makeMaskable(192)
    await makeMaskable(512)
  } catch (err) {
    console.error('Failed to generate maskable icons:', err)
    process.exit(1)
  }
}

main()
