export type CoverLetterBlock = {
  id: string
  text: string
  marked: boolean
}

export function splitCoverLetter(letter: string): CoverLetterBlock[] {
  const parts = letter
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return [{ id: 'block-0', text: '', marked: false }]
  }

  return parts.map((text, index) => ({
    id: `block-${index}`,
    text,
    marked: false,
  }))
}

export function joinCoverLetter(blocks: CoverLetterBlock[]): string {
  return blocks
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join('\n\n')
}
