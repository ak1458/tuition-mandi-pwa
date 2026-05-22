import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicIconsDir = path.resolve(__dirname, '../public/icons')

async function main() {
  try {
    console.log('Generating PWA PNG icons from SVGs...')
    
    const svg192Path = path.join(publicIconsDir, 'icon-192.svg')
    const png192Path = path.join(publicIconsDir, 'icon-192.png')
    const svg512Path = path.join(publicIconsDir, 'icon-512.svg')
    const png512Path = path.join(publicIconsDir, 'icon-512.png')

    // Create 192x192 PNG
    await sharp(svg192Path)
      .resize(192, 192)
      .png()
      .toFile(png192Path)
    console.log('Successfully generated: icon-192.png')

    // Create 512x512 PNG
    await sharp(svg512Path)
      .resize(512, 512)
      .png()
      .toFile(png512Path)
    console.log('Successfully generated: icon-512.png')
    
    console.log('PWA icon generation complete!')
  } catch (err) {
    console.error('Failed to generate PNG icons:', err)
    process.exit(1)
  }
}

main()
