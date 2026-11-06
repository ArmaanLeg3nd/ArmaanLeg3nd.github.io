/** Pair only adjacent, explicitly labelled cues; never infer or reorder steps. */
export function commandPairs(html:string) {
 return html.replace(/(<pre><code[^>]*>(?:(?!<\/pre>)[\s\S])*?<\/code><\/pre>)\s*(<blockquote>[\s\S]*?<\/blockquote>|<p><strong>(?:Interpret|Output|Decisive|Look for|What this checks|Failure|Next)[\s\S]*?<\/p>)/g,(all,command,cue)=>{
  if(command.split('\n').length>16)return all;
  return '<div class="command-pair"><div class="command-action">'+command+'</div><div class="command-reading">'+cue+'</div></div>';
 });
}
