<script lang="ts">
  import type { Stage } from '../../lib/oscp-types';
  import { stageGuides, stageURL } from '../../lib/oscp-map';
  import MapLines from './MapLines.svelte';
  let { stages }: {stages:Stage[]} = $props();
  let selected = $state('enumeration');
  const primary=['discovery','enumeration','initial-access','usable-access'];
  const forks=['local-privilege','active-directory','internal-access'];
  const edges=[...primary.slice(1).map((id,i)=>({from:primary[i],to:id,label:`R${i+1}`})),...forks.map((id,i)=>({from:'usable-access',to:id,label:`R${i+4}`}))];
</script>

{#snippet node(id:string)}
  {@const index=stages.findIndex(stage=>stage.id===id)}
  <button type="button" class="strategy-node" class:selected={selected===id} aria-pressed={selected===id} data-map-node={id} data-stage-choice={id} onclick={()=>selected=id}>
    <span class="map-node-key">{String(index+1).padStart(2,'0')}</span><strong>{stageGuides[id].title}</strong><span>{stageGuides[id].summary}</span>
  </button>
{/snippet}

<section class="strategy-overview" aria-label="End-to-end stage map">
  <div class="strategy-canvas overview-tree" data-map-kind="overview">
    <MapLines {edges}/>
    <div class="map-primary">{#each primary as id}{@render node(id)}{/each}</div>
    <div class="map-forks">{#each forks as id}{@render node(id)}{/each}</div>
  </div>
  <p class="map-return"><a href={stageURL('enumeration')}>↺ New identity, privilege, host or route → re-enumerate</a></p>
  <button class="map-evidence" class:selected={selected==='evidence'} aria-pressed={selected==='evidence'} onclick={()=>selected='evidence'} data-stage-choice="evidence"><strong>08 · Evidence & reporting</strong><span>R7 · Throughout the path</span></button>
  <div class="map-legend"><span><b>R0–R7</b> prerequisite keys</span><span><b>Lines</b> possible handoffs</span><span>Select a stage to inspect its entry conditions.</span></div>
  <div class="map-selection" aria-live="polite"><div><h2>{stageGuides[selected].title}</h2><p>{stageGuides[selected].prerequisite}</p></div><a class="map-open" href={stageURL(selected)}>Open stage map →</a></div>
  <section class="map-prerequisites" aria-labelledby="stage-prerequisites"><h2 id="stage-prerequisites">Prerequisites behind the lines</h2>
    <div class="map-gate-table"><table><thead><tr><th scope="col">Key</th><th scope="col">What must be true</th><th scope="col">How to check</th></tr></thead><tbody>{#each stages as stage,index}<tr class:selected={selected===stage.id}><th scope="row">R{index}</th><td><strong>{stageGuides[stage.id].prerequisite}</strong><span>{stageGuides[stage.id].title}</span></td><td>{stageGuides[stage.id].check}</td></tr>{/each}</tbody></table></div>
  </section>
  <p class="map-footnote">Choose any stage matching your current access. Domain credentials can lead directly into AD; the lines show possible transitions, not mandatory lesson locks.</p>
</section>
