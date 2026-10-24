<script lang="ts">
  import Procedure from './Procedure.svelte';
  import NextRoutes from './NextRoutes.svelte';
  import { topicURL, type Method, type MethodSummary } from '../../lib/oscp-types';
  import { methodLabel } from '../../lib/oscp-navigation';
  import type { CommandValues } from '../../lib/oscp-commands';
  let { method, lookup, values, onselect, onrecord }: {
    method: Method; lookup: Map<string,MethodSummary>; values: CommandValues;
    onselect: (event: MouseEvent,id: string) => void; onrecord:(id:string) => void;
  } = $props();
  let notes: HTMLDetailsElement;
  function openNotes() { notes.open=true; }
</script>

<article class="task-reference compact-reference" id={method.id} data-method-id={method.id}>
  <header class="task-header"><h1>{methodLabel(method)}</h1></header>
  <nav class="task-section-nav" aria-label="On this page"><a href={`#execute-${method.id}`}>Commands</a><a href={`#next-${method.id}`}>If → then</a><a href={`#notes-${method.id}`} onclick={openNotes}>Explanation & examples</a><button class="record-technique" onclick={() => onrecord(method.id)}>Record step +</button></nav>
  <p class="reference-needs"><strong>Needs:</strong> {method.conditions}</p>
  <section class="command-reference" id={`execute-${method.id}`} aria-label="Commands and variants">
    <Procedure html={method.html.procedure} {values} commented />
    <div class="reference-result"><p><strong>Verify →</strong> {method.verify}</p><p><strong>If it fails →</strong> {method.failure} <a href={`#troubleshoot-${method.id}`} onclick={openNotes}>More detail ↓</a></p></div>
  </section>
  <NextRoutes {method} {lookup} {onselect}/>
  <section class="task-notes" id={`notes-${method.id}`}>
    <details bind:this={notes}><summary>Explanation & examples</summary>
      <h2>{method.title}</h2>
      <dl class="applicability"><div><dt>USE WHEN</dt><dd>{method.clue}</dd></div><div><dt>STARTING ACCESS</dt><dd>{method.access}</dd></div><div><dt>RESULT</dt><dd>{method.result}</dd></div></dl>
      <section class="reference-findings" id={`check-${method.id}`}>
        <h3>Recognize the clue</h3><p>{method.recognition.where}</p>
        <Procedure html={method.html.discovery} {values}/>
        <div class="reference-clue"><span class="finding-label">SYNTHETIC EXAMPLE OUTPUT</span><pre class="sample-output"><code>{method.recognition.sample}</code></pre><p><strong>Means:</strong> {method.recognition.spot}</p><p><strong>Confirm:</strong> {method.recognition.confirm}</p></div>
        <dl class="finding-interpretation"><div><dt>After validation</dt><dd>{method.recognition.enabled}</dd></div><div><dt>Ruled out in this context</dt><dd>{method.recognition.ruledout}</dd></div><div id={`troubleshoot-${method.id}`}><dt>Still inconclusive</dt><dd>{method.recognition.unknown}</dd></div></dl>
        <p><strong>Troubleshooting:</strong> {method.failure}</p>
      </section>
      {#if method.checks.trim()!==method.recognition.commands.trim()}<h3>Additional prerequisite checks</h3><Procedure html={method.html.checks} {values}/>{/if}
      <Procedure html={method.html.notes} {values}/>
      <h3>Why it works</h3><p>{method.mechanics}</p><h3>Worked example · hypothetical</h3><p>{method.example}</p>
    </details>
  </section>
  <p class="reference-return">New identity, privilege, host or route? <a href="/tools/oscp/discovery/">Re-enumerate →</a> <a href={topicURL(method.topic)}>All topic tasks →</a></p>
  <div class="reference-links"><a href={method.links.guide}>Study guide ↗</a><a href={method.links.procedure}>Full procedure ↗</a><a href={method.links.sheet}>Cheatsheet ↗</a></div>
</article>
