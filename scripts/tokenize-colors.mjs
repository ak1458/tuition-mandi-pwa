// One-off: replace exact-token hex Tailwind classes with theme tokens so dark
// mode works. Each mapping's light value equals the token's light value, so
// LIGHT MODE IS UNCHANGED; only dark mode adapts. Excludes the avatar/illustration
// kit (intentional fixed colors).
import { readFile, writeFile } from 'node:fs/promises'
import { globSync } from 'node:fs'

const MAP = {
  'bg-[#f4f1ea]': 'bg-paper',
  'bg-[#ece7dc]': 'bg-paper-2',
  'bg-[#ffffff]': 'bg-surface',
  'bg-[#fffdf8]': 'bg-surface-2',
  'bg-[#fbf9f4]': 'bg-surface-2',
  'border-[#e5decf]': 'border-line',
  'border-[#d7cdb9]': 'border-line-strong',
  'text-[#1c1916]': 'text-ink',
  'text-[#4e463d]': 'text-ink-2',
  'text-[#5d544c]': 'text-ink-2',
  'text-[#5e554c]': 'text-ink-2',
  'text-[#847a6c]': 'text-ink-soft',
  'text-[#9c9183]': 'text-ink-soft',
  'text-[#d6850a]': 'text-marigold-deep',
  'text-[#f2a114]': 'text-marigold',
  'text-[#138a5e]': 'text-leaf',
  'text-[#0e6e4b]': 'text-leaf-deep',
  'text-[#e14b36]': 'text-coral',
  'text-[#c13a27]': 'text-coral-deep',
  'bg-[#dcf1e7]': 'bg-leaf-wash',
  'bg-[#fbe6e1]': 'bg-coral-wash',
  'bg-[#fcefd2]': 'bg-marigold-wash',
  'bg-[#e5eff9]': 'bg-sky-wash',
  'focus:border-[#d6850a]': 'focus:border-marigold-deep',
  'focus-within:border-[#d6850a]': 'focus-within:border-marigold-deep',
  'placeholder:text-[#847a6c]': 'placeholder:text-ink-soft',
}

// also map bare `bg-white` (cards) -> bg-surface, but NOT bg-white/NN opacity.
const files = globSync('src/**/*.tsx').filter(
  (f) => !f.includes('tuition-mandi-ui.tsx'),
)

let touched = 0
for (const f of files) {
  let src = await readFile(f, 'utf8')
  const before = src
  for (const [from, to] of Object.entries(MAP)) src = src.split(from).join(to)
  src = src.replace(/\bbg-white\b(?!\/)/g, 'bg-surface')
  if (src !== before) {
    await writeFile(f, src)
    touched++
    console.log('tokenized', f)
  }
}
console.log(`done, ${touched} files`)
