// Prepare only the verified build in the existing clean GitHub Pages checkout.
// Commits and pushes remain explicit separate operations.
import { readdir, readFile, writeFile, mkdir, realpath, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = await realpath(fileURLToPath(new URL('../',import.meta.url)));
const source = await realpath(resolve(root,'dist'));
const target = await realpath(resolve(root,'.deploy'));
if (source !== resolve(root,'dist') || target !== resolve(root,'.deploy') || !target.startsWith(root+sep)) throw new Error('Unexpected source/deployment path.');
const git = (...args) => execFileSync('git',['-C',target,...args],{encoding:'utf8'}).trim();
if (git('status','--porcelain')) throw new Error('Deployment checkout has existing changes.');
if (git('rev-parse','HEAD') !== git('rev-parse','origin/active-ghub-page')) throw new Error('Fetch and fast-forward the deployment checkout to origin/active-ghub-page first.');
async function files(directory) {
  const result=[];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const path=resolve(directory,entry.name);
    if(entry.isSymbolicLink()) throw new Error('Symlinks are not deployment inputs.');
    if(entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}
const buildFiles=await files(source), wanted=new Set(buildFiles.map(path => relative(source,path).split(sep).join('/')));
wanted.add('.nojekyll');
let removed=0;
for(const file of git('ls-files','-z').split('\0').filter(Boolean)) {
  const path=resolve(target,file), rel=relative(target,path);
  if(rel.startsWith('..') || rel=== '.git' || rel.startsWith('.git'+sep)) throw new Error('Refusing an unsafe deployment path.');
  if(!wanted.has(file)) { await unlink(path); removed++; }
}
for(const path of buildFiles) {
  const output=resolve(target,relative(source,path));
  await mkdir(dirname(output),{recursive:true});await writeFile(output,await readFile(path));
}
await writeFile(resolve(target,'.nojekyll'),'');
console.log(`Prepared ${buildFiles.length} build files; removed ${removed} obsolete tracked files. Git metadata preserved.`);
