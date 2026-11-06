import {emphasizeCues} from './oscp-emphasis.ts';
import {foldMethods} from './oscp-folds.ts';
import {commandPairs} from './oscp-pairs.ts';
import snapshot from '../content/oscp-plain.snapshot.json' with {type:'json'};
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import {glossaryLinks,methodContext} from './oscp-study.ts';
import {chapters,describe,escape,numberMarkup,resultRoutes} from './oscp-numbering.ts';

export const plainPages=snapshot.pages;
export type PlainPage=typeof plainPages[number];
export interface Heading {depth:number;slug:string;text:string;number?:string}
interface IndexNode {key:string;title:string;url?:string;children:IndexNode[];depth?:number}
const byPath=new Map(plainPages.map(page=>[page.path,page]));
const processor=createMarkdownProcessor({syntaxHighlight:false,smartypants:false,rehypePlugins:[glossaryLinks]});
const plainProcessor=createMarkdownProcessor({syntaxHighlight:false,smartypants:false});
const cache=new Map<string,Promise<{html:string;headings:Heading[]}>>();
const publicRoots=['https://github.com/ArmaanLeg3nd/OSCP-Exploitation-Reference/blob/main/','https://raw.githubusercontent.com/ArmaanLeg3nd/OSCP-Exploitation-Reference/main/'];
export function plainURL(page:PlainPage){return '/oscp/'+(page.slug?page.slug+'/':'');}
export function localTarget(target:string,sourcePath:string) {
 if(target.startsWith('#')||/^(?:mailto:|anytype:)/i.test(target))return target;
 let relative=target;const publicRoot=publicRoots.find(root=>target.startsWith(root));
 if(publicRoot)relative=target.slice(publicRoot.length);
 else if(/^(?:[a-z]+:|\/\/|\/)/i.test(target))return target;
 const resolved=new URL(relative,publicRoot?'https://reference.invalid/':'https://reference.invalid/'+sourcePath);
 const path=decodeURIComponent(resolved.pathname.slice(1));const page=byPath.get(path);
 if(page)return plainURL(page)+resolved.search+resolved.hash;
 if(snapshot.assets.includes(path))return '/oscp/'+path+resolved.hash;
 return publicRoots[0]+path+resolved.hash;
}
async function compile(page:PlainPage) {
 let fence=false;
 const markdown=page.markdown.split('\n').map(line=>{
   if(/^\s*`{3,}/.test(line)){fence=!fence;return line;}
   if(fence)return line;
   return line.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g,(_all,image,label,target)=>image+'['+label+']('+localTarget(target,page.path)+')');
 }).join('\n');
 const result=await (await (page.path.endsWith('/glossary.md')?plainProcessor:processor)).render(markdown);
 if(/<(?:script|iframe|object|embed|style|form|input)\b|<[^>]+\son\w+\s*=|<[^>]+(?:href|src)=["']\s*(?:javascript|data):/i.test(result.code))throw new Error('Active reference markup: '+page.path);
 const numbered=numberMarkup(resultRoutes(result.code,page),page,result.metadata.headings);
 return {...numbered,html:emphasizeCues(foldMethods(commandPairs(methodContext(numbered.html,page.path)),page.path))};
}
export function renderPlain(page:PlainPage) {
 if(!cache.has(page.path))cache.set(page.path,compile(page));
 return cache.get(page.path)!;
}
export function indexTree() {
 const roots:IndexNode[]=[];const nodes=new Map<string,IndexNode>();
 const create=(number:string):IndexNode=>{
   const existing=nodes.get(number);if(existing)return existing;
   const parts=number.split('.');const parent=parts.length>1?create(parts.slice(0,-1).join('.')):null;
   const node:IndexNode={key:number,title:number+' '+(chapters[number]||'Sections'),children:[]};
   (parent?parent.children:roots).push(node);nodes.set(number,node);return node;
 };
 for(const page of plainPages) {
   const descriptor=describe(page);const node=create(descriptor.number);
   node.title=descriptor.number+' '+descriptor.title;node.url=plainURL(page);
 }
 const sort=(items:IndexNode[])=>{items.sort((a,b)=>a.key.localeCompare(b.key,undefined,{numeric:true}));items.forEach(node=>sort(node.children));};
 sort(roots);return roots;
}
function list(nodes:IndexNode[],active:string):string {
 return '<ul>'+nodes.map(node=>{
   const isCurrent=node.url===active;
   const hasCurrent=(entry:IndexNode):boolean=>entry.url===active||entry.children.some(hasCurrent);
   const label=node.url?'<a href="'+escape(node.url)+'"'+(isCurrent?' aria-current="page"':'')+'>'+escape(node.title)+'</a>':escape(node.title);
   return '<li>'+(node.children.length?'<details '+(node.depth===undefined?'data-section="'+node.key+'"':'data-page-branch')+(node.depth===undefined&&hasCurrent(node)?' open':'')+'><summary>'+label+'</summary>'+list(node.children,active)+'</details>':label+(node.children.length?list(node.children,active):''))+'</li>';
 }).join('')+'</ul>';
}
export function renderIndex(current:PlainPage,_headings:Heading[]) {return list(indexTree(),plainURL(current));}
export function renderPageIndex(page:PlainPage,headings:Heading[]) {
 const roots:IndexNode[]=[];const stack=[{depth:0,children:roots}];
 for(const heading of headings.filter(h=>h.depth>1)) {
   while(stack.length>1&&stack.at(-1)!.depth>=heading.depth)stack.pop();
   const node:IndexNode={key:heading.slug,title:heading.text,url:plainURL(page)+'#'+heading.slug,children:[],depth:heading.depth};
   stack.at(-1)!.children.push(node);stack.push({depth:heading.depth,children:node.children});
 }
 if(!roots.length) {
   const prefix=describe(page).number+'.';
   for(const other of plainPages) {
     const item=describe(other);
     if(item.number.startsWith(prefix)&&item.number.split('.').length===prefix.split('.').length)roots.push({key:item.number,title:item.number+' '+item.title,url:plainURL(other),children:[],depth:2});
   }
 }
 return list(roots,plainURL(page));
}
