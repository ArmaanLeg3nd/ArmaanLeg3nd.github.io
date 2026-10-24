<script lang="ts">
  import Procedure from './Procedure.svelte';
  import NextRoutes from './NextRoutes.svelte';
  import { type Method, type MethodSummary } from '../../lib/oscp-types';
  import { methodLabel } from '../../lib/oscp-navigation';
  import type { CommandValues } from '../../lib/oscp-commands';
  let { method, lookup, values, onselect, onrecord }: {
    method: Method; lookup: Map<string,MethodSummary>; values: CommandValues;
    onselect: (event: MouseEvent,id: string) => void; onrecord:(id:string) => void;
  } = $props();
  let notes: HTMLDetailsElement;
  function openNotes() { notes.open=true; }
</script>

<article class="task-reference" id={method.id} data-method-id={method.id}>
  <header class="task-header" data-reveal><p class="detail-kicker">{method.family}</p><h1>{methodLabel(method)}</h1><p class="task-purpose">{method.title}</p></header>
  <nav class="task-section-nav" aria-label="On this page"><a href={`#execute-${method.id}`}>Commands</a><a href={`#check-${method.id}`}>Recognize a finding</a><a href={`#next-${method.id}`}>Next actions</a><a href={`#notes-${method.id}`} onclick={openNotes}>Full notes</a><button class="record-technique" onclick={() => onrecord(method.id)}>Record step +</button></nav>
  <div class="task-context"><p><strong>Use when</strong> {method.clue}</p><p><strong>Result</strong> {method.result}</p></div>
  <section class="command-reference" id={`execute-${method.id}`} aria-label="Commands and variants">
    <p class="command-use-cue">Baseline + variants · choose the matching section. <a href={`#notes-${method.id}`} onclick={openNotes}>Prerequisites & usage notes ↓</a></p>
    <Procedure html={method.html.procedure} {values} commented />
  </section>
  <section class="reference-findings" id={`check-${method.id}`}>
    <h2>Recognize a finding</h2><p>{method.recognition.where}</p>
    <Procedure html={method.html.discovery} {values} />
    <div class="reference-clue"><span class="finding-label">EXAMPLE OUTPUT · SYNTHETIC</span><pre class="sample-output"><code>{method.recognition.sample}</code></pre><p><strong>Means:</strong> {method.recognition.spot}</p><p><strong>Confirm:</strong> {method.recognition.confirm}</p></div>
    <dl class="finding-interpretation"><div><dt>Useful finding</dt><dd>{method.recognition.enabled}</dd></div><div><dt>Doesn't fit</dt><dd>{method.recognition.ruledout}</dd></div><div><dt>Still unclear</dt><dd>{method.recognition.unknown}</dd></div></dl>
    <p class="verify-cue"><strong>Verify:</strong> {method.verify}</p><p class="failure-cue"><strong>If it fails:</strong> {method.failure}</p>
  </section>
  <NextRoutes {method} {lookup} {onselect} />
  <section class="task-notes" id={`notes-${method.id}`}>
    <details bind:this={notes}><summary>Full usage notes & explanation</summary>
      <dl class="applicability"><div><dt>STARTING ACCESS</dt><dd>{method.access}</dd></div><div><dt>REQUIRES</dt><dd>{method.conditions}</dd></div></dl>
      <h3>Prerequisite checks</h3><Procedure html={method.html.checks} {values} />
      <Procedure html={method.html.notes} {values} />
      <h3>Why it works</h3><p>{method.mechanics}</p><h3>Worked example · hypothetical</h3><p>{method.example}</p>
    </details>
  </section>
  <p class="reference-return">New identity, privilege, host or route? <a href="/tools/oscp/discovery/">Re-enumerate</a> from the new position. <a href="/tools/oscp/credentials/">Classify new credential material →</a></p>
  <div class="reference-links"><a href={method.links.guide}>Study guide ↗</a><a href={method.links.procedure}>Full procedure ↗</a><a href={method.links.sheet}>Cheatsheet ↗</a></div>
</article>
