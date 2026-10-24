// Quick reference presentation. Commands remain byte-for-byte in source order.
const fences = (markdown: string) => [...markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)];
const flatten = (markdown: string) => markdown.replace(/<\/?details\b[^>]*>/gi, '').replace(/<summary>([\s\S]*?)<\/summary>/gi, '\n#### $1\n');
const plain = (text: string) => text.replace(/<[^>]*>/g, '').replace(/\*\*|`/g, '').replace(/\uFFFD/g, '—').trim();
function contextCue(text: string): string {
  // Keep authored constraints and execution locations; never invent a host from
  // the code language. Complete prose remains in Full notes as well.
  const prose=text.replace(/<summary>[\s\S]*?<\/summary>/gi,'').replace(/<\/?details\b[^>]*>/gi,'').replace(/^#{1,6}\s+[^\n]*$/gm,'');
  return prose.split(/\n\s*\n/).map(part=>part.trim()).filter(part=>/\b(?:requires?|prerequisites?|must|only|before|run on|on the (?:pivot|target|attacker)|on kali|kali then|verify on|listener appears|identity|logon context|OSCP|exam|restricted|prohibit\w*)\b/i.test(plain(part)))
    .map(part=>part.split('\n').map(line=>'> '+line.replace(/^>\s?/, '')).join('\n')).join('\n\n');
}
export function procedureNotes(markdown: string): string {
  return flatten(markdown.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '')).trim();
}
export function combinedProcedure(markdown: string): string {
  const blocks = fences(markdown);
  // HTTP request bytes have no comment syntax.
  if (!blocks.length || blocks.some(block => block[1].trim() === 'http')) return flatten(markdown);
  const groups: { language: string; title: string; body: string; context:string }[] = [];
  let cursor = 0;
  let label = 'Baseline';
  for (const block of blocks) {
    const before = markdown.slice(cursor, block.index);
    const cue = contextCue(before);
    const headings = [...before.matchAll(/<summary>([\s\S]*?)<\/summary>|^#{1,6}\s+([^\n]+)/gm)];
    if (headings.length) label = plain(headings.at(-1)![1] || headings.at(-1)![2]);
    const prompt = plain(before).match(/(?:^|\n)([^\n]{1,90}:)\s*$/);
    const section = prompt ? prompt[1].slice(0,-1) : label;
    // A short location already used as the heading/comment needs no duplicate
    // paragraph, but it must still prevent merging across that boundary.
    const context = plain(cue.replace(/^>\s?/gm,'')).replace(/:$/,'')===section ? '' : cue;
    const language = block[1].trim() || 'text';
    const prefix = language === 'cmd' ? 'REM ' : language === 'sql' ? '-- ' : ['c','javascript'].includes(language) ? '// ' : language === 'vb' ? "' " : '# ';
    const comment = ['html','xml','markdown'].includes(language) ? `<!-- ${section.replace(/--/g,'—')} -->` : prefix + section;
    const body = comment + '\n' + block[2].trimEnd();
    const previous = groups.at(-1);
    if (previous?.language === language && !cue) previous.body += '\n\n' + body;
    else {
      const names: Record<string,string> = {bash:'Shell commands',cmd:'Windows commands',powershell:'PowerShell commands',text:'Client commands / example output',sql:'SQL commands',c:'C source',python:'Python',javascript:'JavaScript',html:'HTML',xml:'XML',sshconfig:'SSH configuration',vb:'Visual Basic'};
      const title=section==='Baseline' ? (names[language] || 'Commands') : section.replace(/^(?:Baseline|Variant)\s*[:—–-]\s*/i,'').replace(/^./,letter=>letter.toUpperCase());
      groups.push({language,title,body,context});
    }
    cursor = block.index! + block[0].length;
  }
  const trailing=contextCue(markdown.slice(cursor));
  return groups.map(group => `#### ${group.title}\n\n${group.context ? group.context+'\n\n' : ''}\`\`\`${group.language}\n${group.body}\n\`\`\``).join('\n\n')+(trailing ? '\n\n'+trailing : '');
}
