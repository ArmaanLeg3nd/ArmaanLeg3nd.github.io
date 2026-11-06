/** Restrained emphasis on authored cues; never infer danger from a tool name. */
const labels:Record<string,string>={
 'requires':'condition','need':'condition','prerequisite':'condition','prerequisites':'condition',
 'required conditions':'condition','still missing':'condition',
 'decisive output':'evidence','decisive clue':'evidence',
 'warning':'critical','disruptive':'critical'
};
const phrases=[
 'old unknown password cannot be restored',
 'an unknown original password cannot be restored',
 'This is disruptive',
 'destroys cached tickets',
 'this changes directory state'
];
export function emphasizeCues(html:string) {
 // Tokenize existing markup, keeping code, links, headings and summaries opaque.
 const stack:string[]=[];
 return html.split(/(<[^>]+>)/g).map(part=>{
  if(part.startsWith('<')){
   const close=part.match(/^<\/([a-z][\w-]*)/i);
   if(close){const index=stack.lastIndexOf(close[1].toLowerCase());if(index>=0)stack.length=index;return part;}
   const open=part.match(/^<([a-z][\w-]*)\b/i);
   if(open&&!/\/$/.test(part.slice(0,-1))&&!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(open[1]))stack.push(open[1].toLowerCase());
   return part;
  }
  if(stack.some(t=>/^(?:pre|code|a|script|style|summary|h[1-6])$/.test(t)))return part;
  if(stack.at(-1)==='strong'){
   const normalized=part.trim().replace(/:$/,'').toLowerCase(),kind=labels[normalized];
   return kind?'<span class="reference-cue cue-'+kind+'">'+part+'</span>':part;
  }
  if(!stack.some(t=>t==='p'||t==='td'||t==='li'))return part;
  let result=part;
  for(const phrase of phrases)result=result.replace(phrase,'<strong class="reference-cue cue-critical">'+phrase+'</strong>');
  return result;
 }).join('');
}
