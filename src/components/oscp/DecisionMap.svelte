<script lang="ts">
  import { untrack } from 'svelte';
  import { methodURL, type Catalog, type Topic } from '../../lib/oscp-types';
  import { methodLabel } from '../../lib/oscp-navigation';
  import { topicGuides, smbGuide, entryGates, methodGates } from '../../lib/oscp-map';
  import MapLines from './MapLines.svelte';
  let { catalog, topic }: {catalog:Catalog;topic:Topic} = $props();
  let smb=$state(false), branchIndex=$state(0);
  let selectedId=$state(untrack(()=>topicGuides[topic.id].branches[0].methods[0]));
  let checked=$state<string[]>([]);
  const lookup=new Map(catalog.methods.map(method=>[method.id,method]));
  let guide=$derived(smb ? smbGuide : topicGuides[topic.id]);
  let current=$derived(guide.branches[branchIndex]);
  let selected=$derived(lookup.get(selectedId)!);
  let gates=$derived([...(guide.entry || entryGates(topic)).map(gate=>({...gate,key:'S0'})),...current.gates.map(gate=>({...gate,key:`S${branchIndex+1}`})),...methodGates(selected).map(gate=>({...gate,key:`S${branchIndex+1}`}))]);
  function choose(index:number,id?:string){branchIndex=index;selectedId=id || guide.branches[index].methods[0];checked=[];}
  function setMode(value:boolean){smb=value;branchIndex=0;selectedId=(value?smbGuide:topicGuides[topic.id]).branches[0].methods[0];checked=[];}
</script>

<section class="decision-map" aria-label={`${topic.title} decision map`} data-decision-topic={topic.id}>
  {#if topic.id==='services'}<div class="map-view-switch" aria-label="Service map focus"><button aria-pressed={!smb} onclick={()=>setMode(false)}>Service triage</button><button aria-pressed={smb} onclick={()=>setMode(true)}>SMB findings</button></div>{/if}
  {#key `${topic.id}-${smb}`}
    <div class="strategy-canvas decision-tree" data-map-kind="branches">
      <MapLines edges={guide.branches.map((_,index)=>({from:'entry',to:`branch-${index}`}))}/>
      <div class="map-entry" data-map-node="entry"><span class="map-node-key">S0 · ENTRY CHECK</span><strong>{guide.root}</strong><a href={methodURL(lookup.get(guide.start)!)}>Start: {methodLabel(lookup.get(guide.start)!)} →</a></div>
      <div class="map-branches">{#each guide.branches as branch,index}<div class="map-branch" class:branch-selected={branchIndex===index}>
        <button class="strategy-node map-clue" class:selected={branchIndex===index} aria-pressed={branchIndex===index} data-map-node={`branch-${index}`} data-branch-choice={index} onclick={()=>choose(index)}><span class="map-node-key">IF OBSERVED</span><strong>{branch.clue}</strong></button>
        <span class="map-branch-gate">S{index+1} · check conditions ↓</span>
        <button class="map-actions map-action-choice" aria-pressed={branchIndex===index} onclick={()=>choose(index)}><strong>{branch.action} →</strong><span>{methodLabel(lookup.get(branch.methods[0])!)}{branch.methods.length>1 ? ` · ${branch.methods.length} related tasks` : ''}</span></button>
      </div>{/each}</div>
    </div>
  {/key}
  <p class="map-no-match">No matching evidence? Revisit <a href={methodURL(lookup.get(guide.start)!)}>{methodLabel(lookup.get(guide.start)!)}</a>, check another branch, or <a href="/tools/oscp/">return to the stage overview</a>.</p>
  <div class="map-legend"><span><b>S0</b> shared entry prerequisites</span><span><b>S1–S3</b> branch prerequisites</span><span>Checks aid planning; they do not confirm a result.</span></div>
  <section class="map-prerequisites" aria-labelledby={`prerequisites-${topic.id}`}>
    {#if current.methods.length>1}<div class="map-task-choices"><p>For this finding</p><div aria-label="Choose a task for the selected finding">{#each current.methods as id}<button aria-pressed={selectedId===id} data-map-method={id} onclick={()=>choose(branchIndex,id)}>{methodLabel(lookup.get(id)!)}</button>{/each}</div></div>{/if}
    <div class="map-check-header"><h2 id={`prerequisites-${topic.id}`}>Before: {methodLabel(selected)}</h2><span aria-live="polite">{checked.length}/{gates.length} checks marked</span></div>
    <div class="map-check-list">{#each gates as gate,index}{@const key=`${selectedId}-${index}`}<label><input type="checkbox" value={key} bind:group={checked}/><span class="map-node-key">{gate.key}</span><span><strong>{gate.label}</strong><span>{gate.check}</span></span></label>{/each}</div>
    <div class="map-selection"><p aria-live="polite">{selected.clue}</p><a class="map-open" href={methodURL(selected)} data-map-open={selected.id}>Open task notes →</a></div>
    <p class="map-footnote">Checks reset when you choose another task or leave this page. Record actual findings separately in Workspace controls.</p>
  </section>
</section>
