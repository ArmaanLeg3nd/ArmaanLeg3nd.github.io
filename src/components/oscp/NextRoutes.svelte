<script lang="ts">
  import { methodURL, type Method, type MethodSummary } from '../../lib/oscp-types';
  let { method, lookup, onselect }: { method: Method; lookup: Map<string,MethodSummary>; onselect: (event: MouseEvent,id: string) => void } = $props();
</script>

<section class="next-routes" id={`next-${method.id}`} aria-label={`Possible next steps for ${method.title}`}>
  <h3><span class="step-number">3</span> Act on the finding</h3>
  <p class="route-instruction">Choose the row matching your evidence. Check its requirements before continuing.</p>
  <div class="finding-actions">
    {#each method.next as edge}
      {@const target = lookup.get(edge.id)!}
      <article class="finding-action" data-next-method={edge.id}>
        <div><span class="finding-label">IF YOU FIND</span><p>{edge.when}</p></div>
        <div><span class="finding-label">THEN</span><a href={methodURL(target)} onclick={event => onselect(event,target.id)}>{target.title} →</a><p class="requires"><strong>Needs:</strong> {edge.requires}</p></div>
      </article>
    {/each}
  </div>
</section>
