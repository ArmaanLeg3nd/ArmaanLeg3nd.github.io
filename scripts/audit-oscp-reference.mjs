import fs from 'node:fs';
import {goalLabel} from '../src/lib/oscp-goals.ts';
import assert from 'node:assert/strict';
import {plainPages,renderPlain,plainURL} from '../src/lib/oscp-plain.ts';
import review from '../src/content/oscp-fold-review.json' with {type:'json'};
import methods from '../src/content/oscp.snapshot.json' with {type:'json'};
const rows=[], gaps=[];let choices=0, native=0, automatic=0;
assert.equal(Object.keys(review).length,plainPages.length,'Review coverage drift');
for(const page of plainPages){
 const {html,headings}=await renderPlain(page),policy=review[page.path];
 assert.ok(policy?.disposition,page.path+': missing review decision');
 const stack=[];
 for(const token of html.matchAll(/<details\b[^>]*>|<\/details>/g)){
  if(token[0].startsWith('</'))assert.ok(stack.pop(),page.path+': unmatched closer');else stack.push(token[0]);
 }
 assert.equal(stack.length,0,page.path+': unclosed disclosure');
 for(const choice of policy.choices){
  const found=headings.filter(h=>h.text.replace(/^\d+(?:\.\d+)*\s+/,'')===goalLabel(choice));
  if(!found.length){gaps.push(page.path+': missing '+choice);continue;}
  for(const h of found){
   const pos=html.indexOf('id="'+h.slug+'"'),parents=[];
   for(const t of html.slice(0,pos).matchAll(/<details\b[^>]*>|<\/details>/g))if(t[0].startsWith('</'))parents.pop();else parents.push(t[0]);
   if(!parents.length)gaps.push(page.path+': choice left unfolded '+choice);
  }
 }
 const folds=(html.match(/<details data-method-fold>/g)||[]).length;
 const approaches=(html.match(/<details data-study-approach=/g)||[]).length;
 const total=(html.match(/<details\b/g)||[]).length;
 automatic+=folds+approaches;native+=total-folds-approaches;choices+=policy.choices.length;
 rows.push({path:page.path,url:plainURL(page),disposition:policy.disposition,reviewedChoices:policy.choices.length,folds,approaches,native:total-folds-approaches});
}
for(const method of methods.methods){
 const path='notes/methods/'+method.topic+'.md';
 assert.match(review[path].methods?.[method.id]||'',/^(fold|visible):/,method.id+': missing review disposition');
}
const result={pages:rows.length,methodsReviewed:methods.methods.length,reviewedHeadingChoices:choices,automaticFolds:automatic,nativeDisclosures:native,gaps,rows};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,rows:undefined}));
assert.deepEqual(gaps,[],'Reviewed choices need repair');
