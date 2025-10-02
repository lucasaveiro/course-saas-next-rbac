const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const targets = [
  path.join(root, 'apps', 'web', 'src'),
  path.join(root, 'packages'),
]

const violations = []

function walk(dir) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      walk(p)
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      let content
      try {
        content = fs.readFileSync(p, 'utf8')
      } catch {
        continue
      }
      const lines = content.split(/\r?\n/)
      lines.forEach((line, i) => {
        if (!line.includes('.ref')) return

        // ignore safe pattern: .props.ref
        if (line.includes('.props.ref')) return

        const trimmed = line.trim()
        // ignore comments
        if (trimmed.startsWith('//')) return

        // crude check to ignore strings
        const idx = line.indexOf('.ref')
        const inQuotes = (quote) => {
          const before = line.lastIndexOf(quote, idx)
          const after = line.indexOf(quote, idx)
          return before !== -1 && after !== -1 && before < idx && idx < after
        }
        if (inQuotes('"') || inQuotes("'") || inQuotes('`')) return

        violations.push({ file: p, line: i + 1, text: line })
      })
    }
  }
}

for (const dir of targets) {
  walk(dir)
}

if (violations.length) {
  console.error('Disallowed element ref reads detected (.ref not via props):')
  for (const v of violations) {
    console.error(
      `${path.relative(root, v.file)}:${v.line}: ${v.text.trim()}`,
    )
  }
  process.exit(1)
} else {
  console.log('OK: No direct element .ref reads found.')
}