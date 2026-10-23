<script lang="ts">
  import Procedure from './Procedure.svelte';
  import NextRoutes from './NextRoutes.svelte';
  import { methodURL, type Method, type MethodSummary } from '../../lib/oscp-types';
  import { methodLabel } from '../../lib/oscp-navigation';
  import type { CommandValues } from '../../lib/oscp-commands';
  let { method, lookup, opened = false, values, onselect, onopen, onrecord }: {
    method: Method; lookup: Map<string,MethodSummary>; opened?: boolean; values: CommandValues;
    onselect: (event: MouseEvent,id: string) => void; onopen: (id:string,open:boolean) => void; onrecord:(id:string) => void;
  } = $props();
  let element: HTMLDetailsElement;
  function expandDetails(open: boolean) { element.querySelectorAll<HTMLDetailsElement>('details').forEach(detail => detail.open=open); }
</script>

<details class="technique" id={method.id} open={opened} bind:this={element} ontoggle={event => onopen(method.id,event.currentTarget.open)} data-method-id={method.id}>
  <summary class="technique-summary">
    <span class="technique-heading"><strong>{methodLabel(method)}</strong><span class="technique-expand" aria-hidden="true">+</span></span>
    {#if methodLabel(method) !== method.title}<span class="technique-purpose">{method.title}</span>{/if}
    <span class="technique-clue"><b>RECOGNIZE</b> {method.clue}</span>
  </summary>
  <div class="technique-body">
    <dl class="applicability"><div><dt>START WITH</dt><dd>{method.access}</dd></div><div><dt>APPLIES WHEN</dt><dd>{method.conditions}</dd></div><div><dt>CAN PRODUCE</dt><dd>{method.result}</dd></div></dl>
    <nav class="technique-jumps" aria-label={`Sections in ${method.title}`}><a href={`#check-${method.id}`}>First check</a><a href={`#execute-${method.id}`} onclick={() => { const detail=element.querySelector<HTMLDetailsElement>('.execution-details');if(detail)detail.open=true; }}>Commands & variants</a><a href={`#next-${method.id}`}>Next steps ({method.next.length}) ↓</a></nav>
    <section class="first-check" id={`check-${method.id}`}>
      <h3>Investigate this first</h3><p>{method.recognition.where}</p><Procedure html={method.html.discovery} {values} />
      <p class="prerequisite-cue"><strong>Confirm:</strong> {method.recognition.confirm}</p>
      {#if method.checks !== method.recognition.commands}<details class="technique-detail"><summary>Additional prerequisite checks</summary><Procedure html={method.html.checks} {values} /></details>{/if}
      <details class="technique-detail recognition-example"><summary>What the clue looks like <span>SYNTHETIC OUTPUT</span></summary><pre class="sample-output"><code>{method.recognition.sample}</code></pre><p>{method.recognition.spot}</p></details>
      <p class="verify-cue"><strong>Verify:</strong> {method.verify}</p>
    </section>
    <section class="interpretation"><h3>What did you find?</h3><div class="compact-outcomes">
      <details><summary>Useful finding</summary><p>{method.recognition.enabled}</p></details>
      <details><summary>Ruled out here</summary><p>{method.recognition.ruledout}</p></details>
      <details><summary>Inconclusive</summary><p>{method.recognition.unknown}</p></details>
    </div></section>
    <div class="technique-reference">
      <details class="technique-detail execution-details" id={`execute-${method.id}`}><summary>Execution procedure & complete variants <span>COMMANDS</span></summary><p>Use the baseline when the conditions above match. Choose variants by their access, credentials and transport requirements.</p><Procedure html={method.html.procedure} {values} /></details>
      <details class="technique-detail troubleshooting"><summary>Failure signals & fallback checks</summary><p>{method.failure}</p></details>
      <details class="technique-detail mechanics"><summary>Mechanics & hypothetical worked example</summary><h3>Why it works</h3><p>{method.mechanics}</p><h3>Worked example — hypothetical</h3><p>{method.example}</p></details>
    </div>
    <NextRoutes {method} {lookup} {onselect} />
    <div class="changed-context"><strong>New identity, privilege, host or route?</strong><span>Re-enumerate from that new position.</span><a href="/tools/oscp/discovery/">Revisit discovery ↗</a><a href="/tools/oscp/credentials/">Classify new material ↗</a></div>
    <div class="technique-utilities"><button class="record-technique" onclick={() => onrecord(method.id)}>Record this technique +</button><a href={methodURL(method)}>Direct method link ↗</a><button onclick={() => expandDetails(true)}>Expand details</button><button onclick={() => expandDetails(false)}>Collapse details</button></div>
    <div class="reference-links"><a href={method.links.guide}>Deeper method notes ↗</a><a href={method.links.procedure}>Owning procedure ↗</a><a href={method.links.sheet}>Quick sheet ↗</a></div>
  </div>
</details>
