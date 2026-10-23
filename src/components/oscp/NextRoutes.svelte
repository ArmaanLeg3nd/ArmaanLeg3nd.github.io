<script lang="ts">
  import { methodURL, type Method, type MethodSummary } from '../../lib/oscp-types';
  let { method, lookup, onselect }: { method: Method; lookup: Map<string,MethodSummary>; onselect: (event: MouseEvent,id: string) => void } = $props();
</script>

<section class="next-routes" id={`next-${method.id}`} aria-label={`Possible next steps for ${method.title}`}>
  <div class="technique-section-heading"><h3>Possible next steps</h3><span>{method.next.length} conditional routes</span></div>
  <p class="route-instruction">Follow a finding, then check the receiving method’s requirements.</p>
  <div class="result-branches">
    {#each method.next as edge}
      {@const target = lookup.get(edge.id)!}
      <details class="result-branch" data-next-method={edge.id}>
        <summary><span class="branch-trigger"><b>IF</b> {edge.when}</span><span class="branch-destination">↳ {target.title}<span aria-hidden="true">+</span></span></summary>
        <div class="branch-requirements"><p><strong>Still required:</strong> {edge.requires}</p><a href={methodURL(target)} onclick={event => onselect(event,target.id)}>Open this method →</a></div>
      </details>
    {/each}
  </div>
</section>
