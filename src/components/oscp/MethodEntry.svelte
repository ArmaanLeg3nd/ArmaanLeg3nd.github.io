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
</script>

<details class="technique" id={method.id} open={opened} ontoggle={event => onopen(method.id,event.currentTarget.open)} data-method-id={method.id}>
  <summary class="technique-summary">
    <span class="technique-heading"><strong>{methodLabel(method)}</strong><span class="technique-expand" aria-hidden="true">+</span></span>
    {#if methodLabel(method) !== method.title}<span class="technique-purpose">{method.title}</span>{/if}
    <span class="technique-clue"><b>RECOGNIZE</b> {method.clue}</span>
  </summary>
  <div class="technique-body">
    <dl class="applicability"><div><dt>START WITH</dt><dd>{method.access}</dd></div><div><dt>APPLIES WHEN</dt><dd>{method.conditions}</dd></div><div><dt>CAN PRODUCE</dt><dd>{method.result}</dd></div></dl>
    <nav class="technique-jumps" aria-label={`Sections in ${method.title}`}><a href={`#check-${method.id}`}>1. Check</a><a href={`#clue-${method.id}`}>2. Read the clue</a><a href={`#next-${method.id}`}>3. Next action</a><a href={`#execute-${method.id}`}>Commands & variants ↓</a></nav>
    <section class="first-check" id={`check-${method.id}`}>
      <h3><span class="step-number">1</span> Run the first check</h3><p>{method.recognition.where}</p><Procedure html={method.html.discovery} {values} />
      {#if method.checks !== method.recognition.commands}<div class="additional-checks"><h4>Also check the prerequisites</h4><Procedure html={method.html.checks} {values} /></div>{/if}
    </section>
    <section class="read-clue" id={`clue-${method.id}`}>
      <h3><span class="step-number">2</span> Read the clue</h3>
      <div class="clue-example"><span class="finding-label">EXAMPLE OUTPUT · SYNTHETIC</span><pre class="sample-output"><code>{method.recognition.sample}</code></pre><p><strong>Means:</strong> {method.recognition.spot}</p><p><strong>Check before acting:</strong> {method.recognition.confirm}</p></div>
      <dl class="finding-interpretation"><div><dt>Useful finding</dt><dd>{method.recognition.enabled}</dd></div><div><dt>Doesn't fit</dt><dd>{method.recognition.ruledout}</dd></div><div><dt>Still unclear</dt><dd>{method.recognition.unknown}</dd></div></dl>
      <p class="verify-cue"><strong>Verify the result:</strong> {method.verify}</p>
    </section>
    <NextRoutes {method} {lookup} {onselect} />
    <section class="command-reference execution-details" id={`execute-${method.id}`}>
      <h3>Commands & variants</h3><p>Choose the section matching your access and prerequisites. Comments separate alternatives; use the matching section rather than running the whole block. Different shells and client contexts stay separate.</p><Procedure html={method.html.procedure} {values} commented />
    </section>
    <p class="failure-cue"><strong>If it fails:</strong> {method.failure}</p>
    <details class="technique-detail mechanics"><summary>Why it works & worked example</summary><h3>Mechanics</h3><p>{method.mechanics}</p><h3>Hypothetical example</h3><p>{method.example}</p></details>
    <div class="changed-context"><strong>New identity, privilege, host or route?</strong><span>Re-enumerate from that new position.</span><a href="/tools/oscp/discovery/">Revisit discovery ↗</a><a href="/tools/oscp/credentials/">Classify new material ↗</a></div>
    <div class="technique-utilities"><button class="record-technique" onclick={() => onrecord(method.id)}>Record this technique +</button><a href={methodURL(method)}>Direct method link ↗</a></div>
    <div class="reference-links"><a href={method.links.guide}>Deeper method notes ↗</a><a href={method.links.procedure}>Owning procedure ↗</a><a href={method.links.sheet}>Quick sheet ↗</a></div>
  </div>
</details>
