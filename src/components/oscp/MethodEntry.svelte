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

<article class="task-reference" id={method.id} data-method-id={method.id}>
  <header class="task-header" data-reveal><p class="detail-kicker">{method.family}</p><h1>{methodLabel(method)}</h1><p class="task-purpose">{method.title}</p></header>
  <nav class="task-section-nav" aria-label="On this page"><a href={`#check-${method.id}`}>1 · Investigate</a><a href={`#execute-${method.id}`}>2 · Act & verify</a><a href={`#next-${method.id}`}>3 · Follow the result</a><a href={`#notes-${method.id}`} onclick={openNotes}>Full notes</a><button class="record-technique" onclick={() => onrecord(method.id)}>Record step +</button></nav>
  <div class="task-context"><p><strong>Use when</strong> {method.clue}</p><p><strong>Requires</strong> {method.conditions}</p></div>
  <section class="reference-findings walkthrough-step walkthrough-investigate" id={`check-${method.id}`} data-walkthrough="investigate">
    <div class="walkthrough-heading"><span aria-hidden="true">01</span><h2>Run the investigation check</h2></div>
    <p>{method.recognition.where}</p>
    <Procedure html={method.html.discovery} {values} />
    <div class="reference-clue"><span class="finding-label">LOOK FOR · SYNTHETIC EXAMPLE</span><pre class="sample-output"><code>{method.recognition.sample}</code></pre><p><strong>Read it as:</strong> {method.recognition.spot}</p></div>
    <div class="walkthrough-decisions">
      <div class="walkthrough-decision"><span class="finding-label">IF THE CLUE MATCHES</span><div><p><strong>Check first:</strong> {method.recognition.confirm}</p><a href={`#execute-${method.id}`}>Continue with prerequisite checks in step 2 ↓</a></div></div>
      <div class="walkthrough-decision"><span class="finding-label">IF THIS RULES OUT THE PATH</span><div><p>{method.recognition.ruledout}</p><a href={topicURL(method.topic)}>Choose another evidence-backed task in this topic →</a></div></div>
      <div class="walkthrough-decision"><span class="finding-label">IF THE CHECK FAILS / IS UNCLEAR</span><div><p>{method.recognition.unknown}</p><p><strong>Troubleshoot:</strong> {method.failure}</p><a href={`#check-${method.id}`}>Fix the failed check, then repeat step 1 ↑</a></div></div>
    </div>
  </section>
  <section class="command-reference walkthrough-step" id={`execute-${method.id}`} aria-label="Commands and variants" data-walkthrough="act">
    <div class="walkthrough-heading"><span aria-hidden="true">02</span><h2>Run the matching procedure</h2></div>
    <p class="walkthrough-condition"><strong>Before running:</strong> {method.access} {method.conditions}</p>
    {#if method.checks.trim()!==method.recognition.commands.trim()}<div class="walkthrough-prerequisite"><h3>Check the missing prerequisite first</h3><Procedure html={method.html.checks} {values}/></div>{/if}
    <p class="command-use-cue">Choose the matching variant, not every variant in sequence. Highlighted placeholders need replacement. <a href={`#notes-${method.id}`} onclick={openNotes}>Full usage notes ↓</a></p>
    <Procedure html={method.html.procedure} {values} commented />
    <div class="walkthrough-decisions walkthrough-result">
      <p class="walkthrough-enabled"><strong>Useful result after validation:</strong> {method.recognition.enabled}</p>
      <div class="walkthrough-decision"><span class="finding-label">CHECK THE RESULT</span><div><p>{method.verify}</p><a href={`#next-${method.id}`}>Verified a useful result? Match a branch in step 3 ↓</a></div></div>
      <div class="walkthrough-decision"><span class="finding-label">IF IT DOES NOT VERIFY</span><div><p>{method.failure}</p><a href={`#check-${method.id}`}>Return to the investigation check ↑</a><p>Record what failed. An error or missing output does not establish that the path is unavailable.</p></div></div>
    </div>
  </section>
  <NextRoutes {method} {lookup} {onselect} />
  <section class="task-notes" id={`notes-${method.id}`}>
    <details bind:this={notes}><summary>Full usage notes & explanation</summary>
      <dl class="applicability"><div><dt>STARTING ACCESS</dt><dd>{method.access}</dd></div><div><dt>RESULT</dt><dd>{method.result}</dd></div></dl>
      <p>Prerequisite commands are beside the <a href={`#execute-${method.id}`}>matching procedure in step 2 ↑</a>, or in <a href={`#check-${method.id}`}>step 1 ↑</a> when they are the same investigation check.</p>
      <Procedure html={method.html.notes} {values} />
      <h3>Why it works</h3><p>{method.mechanics}</p><h3>Worked example · hypothetical</h3><p>{method.example}</p>
    </details>
  </section>
  <p class="reference-return">New identity, privilege, host or route? <a href="/tools/oscp/discovery/">Re-enumerate</a> from the new position. <a href="/tools/oscp/credentials/">Classify new credential material →</a></p>
  <div class="reference-links"><a href={method.links.guide}>Study guide ↗</a><a href={method.links.procedure}>Full procedure ↗</a><a href={method.links.sheet}>Cheatsheet ↗</a></div>
</article>
