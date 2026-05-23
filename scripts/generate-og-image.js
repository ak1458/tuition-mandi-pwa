import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '../public')

const WIDTH = 1200
const HEIGHT = 630
const LOGO = 320

async function main() {
  try {
    const logoSvg = path.join(publicDir, 'icons', 'icon-512.svg')
    const logoBuffer = await sharp(logoSvg).resize(LOGO, LOGO).png().toBuffer()

    const bg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
        <rect width="${WIDTH}" height="${HEIGHT}" fill="#1c1b35"/>
        <text x="${WIDTH / 2}" y="500" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="#ffffff">Takhti</text>
        <text x="${WIDTH / 2}" y="560" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="30" font-weight="600" fill="#c9c4dd">Aapka Digital Register</text>
      </svg>`,
    )

    await sharp(bg)
      .composite([{ input: logoBuffer, top: 90, left: Math.round((WIDTH - LOGO) / 2) }])
      .png()
      .toFile(path.join(publicDir, 'og-image.png'))

    console.log('Successfully generated: og-image.png (1200x630)')
  } catch (err) {
    console.error('Failed to generate OG image:', err)
    process.exit(1)
  }
}

main()
