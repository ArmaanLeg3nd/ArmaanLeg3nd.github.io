import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {parse} from 'yaml';
const workflow=parse(readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8'));
test('publication is ordered, serialized and restricted to the built branch',()=>{
 assert.deepEqual(workflow.on.push.branches,['active-ghub-page']);
 assert.equal(workflow.concurrency['cancel-in-progress'],false);
 assert.ok(workflow.jobs.package.if.includes('refs/heads/active-ghub-page'));
 assert.equal(workflow.jobs.deploy.needs,'package');
 assert.equal(workflow.jobs.verify.needs,'deploy');
 assert.equal(workflow.jobs.deploy.permissions.pages,'write');
 assert.equal(workflow.jobs.deploy.permissions['id-token'],'write');
 assert.equal(workflow.jobs.deploy.steps[0].with.timeout,'1200000');
});
test('metadata and live-verification scripts are valid Python without executing them',()=>{
 for(const job of Object.values(workflow.jobs))for(const step of job.steps){
  if(!step.run)continue;
  const code=step.run.replace(/^python3 - <<'PY'\n/,'').replace(/\nPY\n?$/,'');
  const result=spawnSync('python',['-c','import ast,sys; ast.parse(sys.stdin.read())'],{input:code,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 }
});
