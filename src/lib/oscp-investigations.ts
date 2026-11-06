// Fold only independent quick-reference investigations, never the steps of a full procedure.
export function foldInvestigations(html:string,path:string){
 if(!path.startsWith('cheatsheets/')||/README|tool-selection|tools-and-scripts|tool-command-reference/.test(path))return html;
 const points:Array<{start:number;headingEnd:number;heading?:string}>=[];
 let depth=0;
 const boundary=(pos:number)=>{const m=html.slice(0,pos).match(/(?:\s*<a\b[^>]*><\/a>\s*)+$/);return m?pos-m[0].length:pos;};
 for(const m of html.matchAll(/<details\b[^>]*>|<\/details>|<h2\b[^>]*>[\s\S]*?<\/h2>/g)){
  if(m[0].startsWith('</details')){depth--;continue;}
  if(m[0].startsWith('<details')){
   if(depth===0&&/^<details[^>]*>\s*<summary[^>]*>\s*<h2\b/.test(html.slice(m.index)))points.push({start:boundary(m.index!),headingEnd:0});
   depth++;continue;
  }
  if(depth===0)points.push({start:boundary(m.index!),headingEnd:m.index!+m[0].length,heading:m[0]});
 }
 for(let i=points.length-1;i>=0;i--){const p=points[i];if(!p.heading)continue;const end=points[i+1]?.start??html.length;
  const headingStart=p.headingEnd-p.heading.length;
  html=html.slice(0,p.start)+'<details data-investigation><summary>'+p.heading+'</summary>'+html.slice(p.start,headingStart)+html.slice(p.headingEnd,end)+'</details>'+html.slice(end);
 }
 return html;
}
