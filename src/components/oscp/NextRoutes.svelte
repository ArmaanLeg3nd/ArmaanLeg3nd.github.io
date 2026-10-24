<script lang="ts">
  import { methodURL, type Method, type MethodSummary } from '../../lib/oscp-types';
  import { methodLabel } from '../../lib/oscp-navigation';
  let { method, lookup, onselect }: { method: Method; lookup: Map<string,MethodSummary>; onselect: (event: MouseEvent,id: string) => void } = $props();
</script>

<section class="next-routes" id={`next-${method.id}`} aria-label={`Possible next steps for ${method.title}`}>
  <div class="walkthrough-heading"><span aria-hidden="true">03</span><h2>Follow the result</h2></div>
  <p class="route-instruction">If you observe the finding, check the receiving prerequisite, then open that task. These are alternative paths; do not run every row.</p>
  <div class="finding-actions">
    {#each method.next as edge}
      {@const target = lookup.get(edge.id)!}
      <article class="finding-action" data-next-method={edge.id}>
        <div><span class="finding-label">IF YOU FIND</span><p>{edge.when}</p></div>
        <div><span class="finding-label">THEN</span><a href={methodURL(target)} onclick={event => onselect(event,target.id)}>{methodLabel(target)} →</a><p class="requires"><strong>Needs:</strong> {edge.requires}</p></div>
      </article>
    {/each}
  </div>
  <p class="walkthrough-no-branch">No branch matches? <a href={`/tools/oscp/${method.topic}/`}>Return to this topic’s task map</a> and investigate another clue. Keep unverified results marked as inconclusive.</p>
</section>
