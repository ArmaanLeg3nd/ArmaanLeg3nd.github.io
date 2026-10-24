// Presentation only: keep commands and their order intact, replace variant
// disclosures with commented sections in blocks sharing the same language.
export function combinedProcedure(markdown: string): string {
  const fences = [...markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)];
  if (!fences.length || fences.some(fence => fence[1].trim() === 'http')) return markdown.replace(/<\/?details\b[^>]*>/gi, '').replace(/<summary>([\s\S]*?)<\/summary>/gi, '\n#### $1\n');
  const groups: { language: string; body: string }[] = [];
  let cursor = 0;
  function notes(text: string, language: string) {
    const plain = text.replace(/<\/?(?:details|summary|strong|em)\b[^>]*>/gi, '\n')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/^\s*(?:#{1,6}\s+|>\s*)/gm, '').replace(/\*\*|`/g, '')
      .replace(/\uFFFD/g, '—').trim();
    const prefix = language === 'cmd' ? 'REM ' : language === 'sql' ? '-- ' : ['c','javascript'].includes(language) ? '// ' : language === 'vb' ? "' " : '# ';
    return plain.split(/\n/).map(line => {
      if (!line.trim()) return '';
      if (['html','xml','markdown'].includes(language)) return `<!-- ${line.replace(/--/g, '—')} -->`;
      // Wrap commentary, never command lines.
      return (line.match(/.{1,88}(?:\s+|$)|\S{89,}/g) || [line]).map(part => prefix + part.trim()).join('\n');
    }).join('\n').replace(/\n{3,}/g, '\n\n');
  }
  for (const fence of fences) {
    const language = fence[1].trim() || 'text';
    const before = markdown.slice(cursor, fence.index);
    const lead = notes(before, language);
    const body = [lead, fence[2].trimEnd()].filter(Boolean).join('\n\n');
    const previous = groups.at(-1);
    if (previous?.language === language) previous.body += '\n\n' + body;
    else groups.push({ language, body });
    cursor = fence.index! + fence[0].length;
  }
  const last = groups.at(-1)!;
  last.body += '\n\n' + notes(markdown.slice(cursor), last.language);
  return groups.map(group => `\`\`\`${group.language}\n${group.body.trim()}\n\`\`\``).join('\n\n');
}
