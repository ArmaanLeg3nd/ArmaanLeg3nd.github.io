export interface CheckAnnotation { sample?: string; meaning?: string; confirm?: string }

// Client prompt text, raw requests and unknown formats have no safe universal
// comment syntax. Keep their interpretation beside the block instead.
const prefixes: Record<string,string> = {bash:'# ',sh:'# ',zsh:'# ',powershell:'# ',python:'# ',cmd:'REM ',sql:'-- ',javascript:'// ',js:'// ',c:'// '};
export function annotateCheck(markdown: string, annotation: CheckAnnotation): {markdown:string;inline:boolean} {
  const blocks=[...markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)];
  const languages=new Set(blocks.map(block=>block[1].trim().toLowerCase()));
  const language=blocks[0]?.[1].trim().toLowerCase() || '';
  const prefix=prefixes[language];
  if(!blocks.length || languages.size!==1 || !prefix)return {markdown,inline:false};
  const lines:string[]=[];
  function add(label:string,value?:string,wrap=true) {
    if(!value)return;
    lines.push('',label);
    for(const line of value.replace(/\r\n?/g,'\n').split('\n')) {
      if(!wrap){lines.push('  '+line);continue;}
      let buffer='';
      for(const word of line.split(/\s+/).filter(Boolean)) {
        if(buffer && buffer.length+word.length+1>90){lines.push(buffer);buffer='';}
        buffer+=(buffer?' ':'')+word;
      }
      lines.push(buffer);
    }
  }
  add('Example output (synthetic):',annotation.sample,false);
  add('Meaning:',annotation.meaning);
  add('Check before continuing:',annotation.confirm);
  if(!lines.length)return {markdown,inline:false};
  const last=blocks.at(-1)!;
  // REM does not shield CMD metacharacters; fall back to adjacent prose rather
  // than turn example text into something executable when the block is copied.
  if(language==='cmd' && lines.some(line=>/[&|<>^%!]/.test(line)))return {markdown,inline:false};
  if(/(?:\\|`|\^)\s*$/.test(last[2]))return {markdown,inline:false};
  const end=last.index!+last[0].lastIndexOf('```');
  return {markdown:markdown.slice(0,end)+lines.map(line=>prefix+line).join('\n')+'\n'+markdown.slice(end),inline:true};
}
