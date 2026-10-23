<script lang="ts">
  import { tick } from 'svelte';
  import InvestigationPanel from './InvestigationPanel.svelte';
  import { methodURL, type Catalog } from '../../lib/oscp-types';
  import { statuses, freshInvestigation, removeStep, uid, addStep, type Investigation, type InvestigationStep, type StepStatus } from '../../lib/investigation';
  import { layoutInvestigation, titleLines, NODE_WIDTH, NODE_HEIGHT } from '../../lib/attack-graph';
  let { catalog }: { catalog: Catalog } = $props();
  let document = $state<Investigation>(freshInvestigation(catalog.contentHash));
  let panel: InvestigationPanel;
  let selected = $state('');
  let filter = $state<StepStatus | 'all'>('all');
  let zoom = $state(1);
  let viewport: HTMLDivElement;
  let methodToAdd = $state('path-hosts');
  let connectFrom = $state('');
  let connectTo = $state('');
  let connectionLabel = $state('');
  let error = $state('');
  let deletePending = $state(false);
  let selectedEdge = $state('');
  let graph = $derived(layoutInvestigation(document,filter));
  let step = $derived(document.steps.find(s => s.id === selected));
  let known = $derived(catalog.methods.find(m => m.id === step?.methodId));
  let unknown = $derived(document.steps.filter(s => !catalog.methods.some(m => m.id === s.methodId)).length);
  const tones: Record<StepStatus,string> = {planned:'#777b7b',attempted:'#71d7cd',confirmed:'#91ad82','ruled-out':'#c96f5d',inconclusive:'#c5a46a'};
  function receive(next: Investigation) { document=next; if(!next.steps.some(s => s.id===selected)) selected=''; if(!next.edges.some(e => e.id===selectedEdge)) selectedEdge=''; }
  function commit(next: Investigation) {
    try { error=''; panel.replaceDocument({...next,updatedAt:new Date().toISOString()}); }
    catch(cause) { error=cause instanceof Error ? cause.message : 'Unable to update this path.'; }
  }
  function updateStep(key: keyof Pick<InvestigationStep,'status'|'host'|'identity'|'capability'|'observation'>,value: string) {
    if(!step) return;
    commit({...document,steps:document.steps.map(s => s.id===selected ? {...s,[key]:value} : s)});
  }
  function select(id: string) { selected=id; deletePending=false; selectedEdge=''; }
  function add() {
    const m=catalog.methods.find(m => m.id===methodToAdd);if(!m)return;
    const next={id:uid(),methodId:m.id,methodTitle:m.title,status:'planned' as const,host:'',identity:'',capability:'',observation:'',createdAt:new Date().toISOString()};
    try { commit(addStep(document,next));selected=next.id;filter='all'; } catch(cause) { error=cause instanceof Error ? cause.message : 'Unable to add a step.'; }
  }
  function connect() {
    if(!connectFrom || !connectTo) { error='Choose a source and destination step.';return; }
    commit({...document,edges:[...document.edges,{id:uid(),from:connectFrom,to:connectTo,label:connectionLabel || 'Recorded transition'}]});
    connectionLabel='';
  }
  async function changeZoom(next: number) {
    const previous=zoom,centerX=viewport.scrollLeft+viewport.clientWidth/2,centerY=viewport.scrollTop+viewport.clientHeight/2;
    zoom=Math.min(2,Math.max(.02,next));await tick();
    viewport.scrollLeft=centerX*zoom/previous-viewport.clientWidth/2;viewport.scrollTop=centerY*zoom/previous-viewport.clientHeight/2;
  }
  async function fit() { zoom=Math.min(1,(viewport.clientWidth-24)/graph.width,(viewport.clientHeight-24)/graph.height);await tick();viewport.scrollTo(0,0); }
  function pan(node: HTMLDivElement) {
    let origin: {x:number;y:number;left:number;top:number} | null=null;
    const down=(e: PointerEvent) => { if(e.button || (e.target as Element).closest('[data-node],button'))return;origin={x:e.clientX,y:e.clientY,left:node.scrollLeft,top:node.scrollTop};node.setPointerCapture(e.pointerId);node.classList.add('panning'); };
    const move=(e: PointerEvent) => {if(origin){node.scrollLeft=origin.left+origin.x-e.clientX;node.scrollTop=origin.top+origin.y-e.clientY;}};
    const up=() => {origin=null;node.classList.remove('panning');};
    node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',up);
    return {destroy(){node.removeEventListener('pointerdown',down);node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',up);}};
  }
</script>

<div class="path-workspace">
  <header class="path-header" data-reveal><div><p class="detail-kicker">TOOLS / EVIDENCE INTO A PATH</p><h1>Attack-path visualizer<span>.</span></h1><p>Connect explicit investigation records. Keep the evidence and the missing conditions attached to each step.</p></div><a href="/tools/oscp/">Open strategy workspace ↗</a></header>
  <InvestigationPanel bind:this={panel} {catalog} ondocumentchange={receive} />
  <div class="path-controls"><div class="path-stat"><strong>{document.title}</strong><span>{document.steps.length} steps · {document.edges.length} connections</span></div><label>Show<select bind:value={filter}><option value="all">All outcomes</option>{#each statuses as s}<option value={s}>{s}</option>{/each}</select></label><div class="zoom-controls"><button aria-label="Zoom out" onclick={() => changeZoom(zoom/1.25)}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom in" onclick={() => changeZoom(zoom*1.25)}>+</button><button onclick={fit}>Fit path</button></div></div>
  {#if error}<p class="state-error" role="alert">{error}</p>{/if}{#if unknown}<p class="state-notice">{unknown} imported steps refer to methods outside the current reference. Their labels and evidence are preserved; no current procedure is implied.</p>{/if}
  <div class="path-columns"><section class="path-graph-area" aria-label="Recorded attack path">
    <div class="graph-scroll" bind:this={viewport} use:pan tabindex="0" role="region" aria-label="Scrollable path canvas. Drag empty space or use the scrollbars to pan.">
      {#if document.steps.length}
        <svg width={graph.width*zoom} height={graph.height*zoom} viewBox={`0 0 ${graph.width} ${graph.height}`} role="group" aria-label="Investigation steps and recorded connections">
          <defs><marker id="path-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#777b7b" /></marker></defs>
          {#each graph.connections as edge}<g class="graph-edge" class:feedback={edge.backward}><path d={edge.path} marker-end="url(#path-arrow)" /><text x={edge.labelX} y={edge.labelY} text-anchor="middle">{edge.label.length>24 ? edge.label.slice(0,23)+'…' : edge.label}</text></g>{/each}
          {#each graph.nodes as node}<g data-node={node.step.id} class="graph-node" class:selected={selected===node.step.id} transform={`translate(${node.x},${node.y})`} role="button" tabindex="0" aria-label={`Step ${node.index+1}: ${node.step.methodTitle}, ${node.step.status}`} onclick={() => select(node.step.id)} onkeydown={e => {if(e.key==='Enter' || e.key===' '){e.preventDefault();select(node.step.id);}}}>
            <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx="5" /><rect class="status-stripe" width="3" height={NODE_HEIGHT-20} x="0" y="10" fill={tones[node.step.status]} /><text class="graph-node-index" x="16" y="24">{String(node.index+1).padStart(2,'0')}</text><text class="graph-node-status" x={NODE_WIDTH-16} y="24" fill={tones[node.step.status]} text-anchor="end">{node.step.status}</text>
            {#each titleLines(node.step.methodTitle) as line,i}<text class="graph-node-title" x="16" y={51+i*18}>{line}</text>{/each}
            <text class="graph-node-context" x="16" y="122">{(node.step.host || 'Host not recorded').slice(0,36)}</text><text class="graph-node-context" x="16" y="139">{(node.step.identity || 'Identity not recorded').slice(0,36)}</text>
          </g>{/each}
        </svg>
        {#if !graph.nodes.length}<div class="graph-empty"><h2>No steps match this outcome.</h2><p>Choose another filter to see the remaining records.</p></div>{/if}
      {:else}<div class="graph-empty"><span class="empty-mark">↗</span><h2>Bring the path into view.</h2><p>Import an investigation JSON, restore an opted-in local investigation, or add a planned step below. Browsing a technique never creates an edge.</p><a href="/tools/oscp/">Start from the strategy map ↗</a></div>{/if}
    </div>
    <div class="graph-legend">{#each statuses as s}<span><i style={`background:${tones[s]}`}></i>{s}</span>{/each}<span>┄ return / repeated investigation</span></div>
    <details class="graph-edit-tools"><summary>Add steps & connect the path</summary><div class="graph-add"><label>Method<select bind:value={methodToAdd}>{#each catalog.topics as topic}<optgroup label={topic.title}>{#each catalog.methods.filter(m => m.topic===topic.id) as m}<option value={m.id}>{m.title}</option>{/each}</optgroup>{/each}</select></label><button onclick={add}>Add planned step</button></div><div class="graph-connect"><label>From<select bind:value={connectFrom}><option value="">Select a step</option>{#each document.steps as s,i}<option value={s.id}>{i+1}. {s.methodTitle}</option>{/each}</select></label><label>To<select bind:value={connectTo}><option value="">Select a step</option>{#each document.steps as s,i}<option value={s.id}>{i+1}. {s.methodTitle}</option>{/each}</select></label><label>Transition label<input bind:value={connectionLabel} maxlength="300" placeholder="What enabled this transition?" /></label><button onclick={connect}>Connect steps</button></div></details>
    <details class="graph-record-list"><summary>Accessible step & connection list</summary><ol>{#each document.steps as s}<li><button onclick={() => select(s.id)}>{s.methodTitle} — {s.status}</button></li>{/each}</ol><ul>{#each document.edges as edge}<li><button onclick={() => {selectedEdge=edge.id;selected='';}}>{document.steps.find(s => s.id===edge.from)?.methodTitle} → {document.steps.find(s => s.id===edge.to)?.methodTitle}: {edge.label}</button></li>{/each}</ul></details>
  </section>
  <aside data-reveal class="path-inspector" aria-label="Selected record">
    {#if step}<div class="detail-kicker">RECORDED STEP / {document.steps.findIndex(s => s.id===selected)+1}</div><h2>{step.methodTitle}</h2><p class="inspector-note">Outcomes are your recorded assertions. Confirmed steps still need evidence of the exact host, identity and result.</p><label>Outcome<select value={step.status} onchange={e => updateStep('status',e.currentTarget.value)}>{#each statuses as s}<option value={s}>{s}</option>{/each}</select></label><label>Host label<input value={step.host} maxlength="200" oninput={e => updateStep('host',e.currentTarget.value)} /></label><label>Identity label<input value={step.identity} maxlength="200" oninput={e => updateStep('identity',e.currentTarget.value)} /></label><label>Capability or result<input value={step.capability} maxlength="500" oninput={e => updateStep('capability',e.currentTarget.value)} /></label><label>Observation<textarea rows="5" value={step.observation} maxlength="4000" oninput={e => updateStep('observation',e.currentTarget.value)}></textarea></label>
      {#if known}<div class="inspector-prerequisite"><span>RECHECK THE REQUIREMENTS</span><p>{known.conditions}</p><a href={methodURL(known)}>Open method & next decisions ↗</a></div>{/if}
      <button class="remove-record" onclick={() => deletePending=true}>Remove step</button>{#if deletePending}<div class="state-confirm"><p>Remove this step and its attached connections?</p><button onclick={() => {commit(removeStep(document,selected));selected='';deletePending=false;}}>Remove step and connections</button><button onclick={() => deletePending=false}>Keep step</button></div>{/if}
    {:else if selectedEdge}{@const edge=document.edges.find(e => e.id===selectedEdge)}{#if edge}<div class="detail-kicker">RECORDED CONNECTION</div><h2>What enabled the transition?</h2><label>Connection label<input maxlength="300" value={edge.label} oninput={e => commit({...document,edges:document.edges.map(x => x.id===edge.id ? {...x,label:e.currentTarget.value} : x)})} /></label><button class="remove-record" onclick={() => {commit({...document,edges:document.edges.filter(x => x.id!==selectedEdge)});selectedEdge='';}}>Remove connection</button>{/if}
    {:else}<div class="detail-kicker">EVIDENCE / CONTEXT / NEXT QUESTION</div><h2>Select a step.</h2><p class="inspector-note">Inspect its outcome, host, identity, capability and evidence. Connections are explicit records; proximity does not imply a successful attack.</p><div class="inspector-prerequisite"><span>BUILD FROM EVIDENCE</span><p>Observation → hypothesis → test → interpretation → action → next check.</p><p>New host, identity, privilege or route → re-enumerate.</p></div>{/if}
  </aside></div>
</div>
