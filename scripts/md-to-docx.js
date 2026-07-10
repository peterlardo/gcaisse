const fs = require('fs')
const path = require('path')
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, LevelFormat, NumberFormat } = require('docx')

const markdown = fs.readFileSync(path.join(__dirname, '..', 'MANUEL_UTILISATEUR.md'), 'utf-8')

const lines = markdown.split('\n')

const children = []
let i = 0

function addParagraph(text, options = {}) {
  const runs = []
  const parts = text.split(/(\*\*.*?\*\*)/g)
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, ...options }))
    } else {
      runs.push(new TextRun({ text: part, ...options }))
    }
  }
  return new Paragraph({ children: runs, spacing: { after: 120 } })
}

function addHeading(text, level) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 300, after: 200 },
  })
}

function parseTableRow(line) {
  return line.split('|').filter(c => c.trim()).map(c => c.trim())
}

while (i < lines.length) {
  const line = lines[i]

  if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ') || line.startsWith('#### ')) {
    const level = line.match(/^#+/)[0].length
    const text = line.replace(/^#+ /, '').replace(/\*\*/g, '')
    const headingMap = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
    }
    children.push(addHeading(text, headingMap[level] || HeadingLevel.HEADING_3))
    i++
    continue
  }

  if (line.startsWith('---')) {
    i++
    continue
  }

  if (line.match(/^\d+\. /)) {
    const match = line.match(/^\d+\.\s+(.*)/)
    if (match) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: line, indent: { left: 400 } }),
        ],
        spacing: { after: 80 },
      }))
    }
    i++
    continue
  }

  if (line.startsWith('- ') || line.startsWith('* ')) {
    children.push(new Paragraph({
      children: [new TextRun({ text: line })],
      spacing: { after: 60 },
      indent: { left: 400 },
    }))
    i++
    continue
  }

  if (line.startsWith('|') && lines[i + 1] && lines[i + 1].match(/^[\s\|:-]+$/)) {
    const headers = parseTableRow(line)
    const separator = parseTableRow(lines[i + 1])
    const rows = []
    let j = i + 2
    while (j < lines.length && lines[j].startsWith('|')) {
      rows.push(parseTableRow(lines[j]))
      j++
    }

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          children: [new Paragraph({ text: h, bold: true, alignment: AlignmentType.CENTER })],
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
          shading: { fill: 'E8E8E8' },
        })),
      }),
      ...rows.map(row => new TableRow({
        children: row.map(c => new TableCell({
          children: [new Paragraph({ text: c })],
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
        })),
      })),
    ]

    children.push(new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }))
    children.push(new Paragraph({ spacing: { after: 200 } }))

    i = j
    continue
  }

  if (line.trim()) {
    children.push(addParagraph(line.replace(/\*\*/g, '')))
    i++
    continue
  }

  children.push(new Paragraph({ spacing: { after: 120 } }))
  i++
}

const doc = new Document({
  title: 'Manuel Utilisateur - LCG Management',
  description: 'Manuel de l\'utilisateur pour l\'application LCG Management (La Congolaise des Glaçons)',
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22 },
      },
    },
  },
  sections: [{
    properties: {},
    children,
  }],
})

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, '..', 'MANUEL_UTILISATEUR.docx')
  fs.writeFileSync(outputPath, buffer)
  console.log('✅ DOCX créé :', outputPath)
})
