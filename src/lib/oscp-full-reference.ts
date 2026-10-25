import snapshot from '../content/oscp-reference.snapshot.json';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

export const referencePages = snapshot.pages;
export const referenceSectionCount = snapshot.sectionCount;
const publicRoot='https://github.com/ArmaanLeg3nd/OSCP-Exploitation-Reference/blob/main/';
const rawRoot='https://raw.githubusercontent.com/ArmaanLeg3nd/OSCP-Exploitation-Reference/main/';
const processor=createMarkdownProcessor({syntaxHighlight:false,smartypants:false});

export async function renderReference(page:typeof referencePages[number]) {
  // Rewrite only Markdown prose links; literal commands remain byte-for-byte intact.
  let fence=false;
  const markdown=page.markdown.split('\n').map(line=>{
    if(/^```/.test(line)){fence=!fence;return line;}
    if(fence)return line;
    return line.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g,(all,image,label,target)=>{
      if(/^(?:https?:|mailto:|#)/.test(target))return all;
      const resolved=new URL(target,'https://reference.invalid/'+page.path);
      const path=decodeURIComponent(resolved.pathname.slice(1));
      const local=referencePages.find(item=>item.path===path);
      const url=path.startsWith('diagrams/') ? '/tools/oscp/'+path : local ? local.url+resolved.hash : (image ? rawRoot : publicRoot)+path+resolved.hash;
      return `${image}[${label}](${url})`;
    });
  }).join('\n');
  let html=(await (await processor).render(markdown)).code;
  let index=0;
  html=html.replace(/<h([1-6])(?:\s[^>]*)?>/g,(_match,level)=>{
    const section=page.sections[index++];
    if(!section || section.level!==Number(level))throw new Error(`Reference heading mismatch: ${page.path}`);
    return `<h${level} id="${section.anchor}">`;
  });
  if(index!==page.sections.length)throw new Error(`Missing reference heading: ${page.path}`);
  if(/<(?:script|iframe|object|embed|style|form|input)\b|<[^>]+\son\w+\s*=|<[^>]+(?:href|src)=["']\s*(?:javascript|data):/i.test(html))throw new Error('Unsafe reference markup');
  return html.replace(/<pre([^>]*)>/g,'<pre$1><button type="button" data-reference-copy aria-label="Copy command">Copy</button>');
}
