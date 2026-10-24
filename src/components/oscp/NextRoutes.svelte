<script lang="ts">
  import { methodURL, type Method, type MethodSummary } from '../../lib/oscp-types';
  import { methodLabel } from '../../lib/oscp-navigation';
  let { method, lookup, onselect }: { method: Method; lookup: Map<string,MethodSummary>; onselect: (event: MouseEvent,id: string) => void } = $props();
</script>

<section class="next-routes" id={`next-${method.id}`} aria-label={`Possible next steps for ${method.title}`}>
  <h2>If → then</h2>
  <ul class="reference-branches">
    {#each method.next as edge}
      {@const target = lookup.get(edge.id)!}
      <li data-next-method={edge.id}><p><span>{edge.when}</span> → <a href={methodURL(target)} onclick={event => onselect(event,target.id)}>{methodLabel(target)}</a></p><p class="requires"><strong>Needs:</strong> {edge.requires}</p></li>
    {/each}
  </ul>
  <p class="reference-no-match">No useful finding → <a href={`/tools/oscp/${method.topic}/`}>another task in this topic</a>. Failed check → resolve the failure before ruling out the path.</p>
</section>
