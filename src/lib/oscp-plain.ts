import snapshot from '../content/oscp-plain.snapshot.json' with { type: 'json' };
import {createMarkdownProcessor} from '@astrojs/markdown-remark';

export const plainPages = snapshot.pages;
export type PlainPage = typeof plainPages[number];
export interface Heading {depth:number; slug:string; text:string}
interface IndexNode {key:string; title:string; url?:string; children:IndexNode[]; depth?:number}
const byPath = new Map(plainPages.map(page=>[page.path,page]));
const processor = createMarkdownProcessor({syntaxHighlight:false,smartypants:false});
const publicRoots = [
  'https://github.com/ArmaanLeg3nd/OSCP-Exploitation-Reference/blob/main/',
  'https://raw.githubusercontent.com/ArmaanLeg3nd/OSCP-Exploitation-Reference/main/'
];

export function plainURL(page:PlainPage) {
  return '/oscp/'+(page.slug ? page.slug+'/' : '');
}

export function localTarget(target:string, sourcePath:string) {
  if(target.startsWith('#') || /^(?:mailto:|anytype:)/i.test(target)) return target;
  let relative = target;
  const publicRoot = publicRoots.find(root=>target.startsWith(root));
  if(publicRoot) relative = target.slice(publicRoot.length);
  else if(/^(?:[a-z]+:|\/\/|\/)/i.test(target)) return target;
  const resolved = new URL(relative,publicRoot ? 'https://reference.invalid/' : 'https://reference.invalid/'+sourcePath);
  const path = decodeURIComponent(resolved.pathname.slice(1));
  const page = byPath.get(path);
  if(page) return plainURL(page)+resolved.search+resolved.hash;
  if(snapshot.assets.includes(path)) return '/oscp/'+path+resolved.hash;
  // Non-page files remain at the public source, rather than a broken guessed route.
  return publicRoots[0]+path+resolved.hash;
}

export async function renderPlain(page:PlainPage) {
  let inFence = false;
  const markdown = page.markdown.split('\n').map(line=>{
    if(/^\s*`{3,}/.test(line)){inFence=!inFence;return line;}
    if(inFence)return line;
    return line.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g,(_all,image,label,target)=>{
      return image+'['+label+']('+localTarget(target,page.path)+')';
    });
  }).join('\n');
  const result = await (await processor).render(markdown);
  if(/<(?:script|iframe|object|embed|style|form|input)\b|<[^>]+\son\w+\s*=|<[^>]+(?:href|src)=["']\s*(?:javascript|data):/i.test(result.code)) {
    throw new Error('Unexpected active reference markup: '+page.path);
  }
  return {html:result.code,headings:result.metadata.headings as Heading[]};
}

function escape(value:string) {
  return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
}
const labels:Record<string,string>={
  notes:'Study notes', reference:'Operational procedures', cheatsheets:'Cheatsheets',
  'ad-investigation':'AD Notes — focused checks',methods:'Method guides',
  '01-discovery-scanning':'01 — Discovery and scanning',
  '02-service-enumeration':'02 — Service enumeration',
  '03-initial-access':'03 — Initial access',
  '04-shells-transfers-credentials':'04 — Shells, transfers and credentials',
  '05-local-privilege-escalation':'05 — Local privilege escalation',
  '06-ad-lateral-movement':'06 — AD and lateral movement',
  '07-pivoting-tunneling':'07 — Pivoting and tunneling',
  '08-evidence-reporting':'08 — Evidence and reporting'
};

export function indexTree() {
  const roots:IndexNode[]=[];
  const folders = new Map<string,IndexNode>();
  const folder = (parts:string[]):IndexNode => {
    const key=parts.join('/');
    const existing=folders.get(key);
    if(existing)return existing;
    const name=parts.at(-1)!;
    const node:IndexNode={key,title:labels[name]||name.replaceAll('-',' '),children:[]};
    (parts.length===1 ? roots : folder(parts.slice(0,-1)).children).push(node);
    folders.set(key,node);
    return node;
  };
  for(const page of plainPages) {
    if(page.path==='README.md')continue;
    const parts=page.path.split('/');
    const name=parts.pop()!;
    const parent=folder(parts);
    if(name==='README.md')parent.url=plainURL(page);
    else parent.children.push({key:page.path,title:page.title,url:plainURL(page),children:[]});
  }
  const order=['reference','cheatsheets','notes'];
  roots.sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key));
  return roots;
}

function headingTree(headings:Heading[], page:PlainPage) {
  const roots:IndexNode[]=[];
  const stack=[{depth:0,children:roots}];
  for(const heading of headings.filter(h=>h.depth>1)) {
    while(stack.length>1 && stack.at(-1)!.depth>=heading.depth)stack.pop();
    const node:IndexNode={key:heading.slug,title:heading.text,url:plainURL(page)+'#'+heading.slug,children:[],depth:heading.depth};
    stack.at(-1)!.children.push(node);stack.push({depth:heading.depth,children:node.children});
  }
  return roots;
}

export function renderIndex(current:PlainPage,headings:Heading[]) {
  const active=plainURL(current);
  const hasActive=(node:IndexNode):boolean=>node.url===active || node.children.some(hasActive);
  const render=(nodes:IndexNode[]):string=>'<ul>'+nodes.map(node=>{
    const currentPage=node.url===active;
    const children=node.children;
    const name=node.url ? '<a href="'+escape(node.url)+'"'+(currentPage?' aria-current="page"':'')+'>'+escape(node.title)+'</a>' : escape(node.title);
    if(children.length && node.depth===undefined) {
      return '<li><details'+(hasActive(node)?' open':'')+'><summary>'+name+'</summary>'+render(children)+'</details></li>';
    }
    return '<li>'+name+(children.length?render(children):'')+'</li>';
  }).join('')+'</ul>';
  const currentHeadings='<details open><summary>On this page</summary>'+render(headingTree(headings,current))+'</details>';
  // Keep AD questions one click from every page.
  const ad=byPath.get('notes/ad-investigation/README.md');
  return (ad?'<p><a href="'+plainURL(ad)+'">AD Notes</a> · <a href="/oscp/notes/ad-investigation/quick-reference/">AD quick reference</a></p>':'')+currentHeadings+render(indexTree());
}
