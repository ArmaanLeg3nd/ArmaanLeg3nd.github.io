<script lang="ts">
  import Procedure from './Procedure.svelte';
  import { methodURL, type Catalog, type Topic, type PrerequisiteCheck } from '../../lib/oscp-types';
  import { methodLabel } from '../../lib/oscp-navigation';
  import type { CommandValues } from '../../lib/oscp-commands';
  let {topic,checks,catalog,values}: {topic:Topic;checks:PrerequisiteCheck[];catalog:Catalog;values:CommandValues}=$props();
  const lookup=new Map(catalog.methods.map(method=>[method.id,method]));
  const checkLookup=new Map(checks.map(check=>[check.id,check]));
</script>

<section class="prerequisite-checks" id="prerequisite-checks" aria-label={`${topic.title} prerequisite checks`}>
  <h2>Technique checks</h2>
  <p class="check-intro">Use these checks for the candidate you found above.</p>
  <nav class="check-family-index" aria-label="Jump to a check section">{#each topic.families as family,index}<a href={`#check-family-${index}`}>{family.title} ↓</a>{/each}</nav>
  {#each topic.families as family,index}<section class="check-family" id={`check-family-${index}`}><h2>{family.title}</h2>
    <nav class="check-method-index" aria-label={`${family.title} checks`}>{#each family.methods as id}<a href={`#prerequisite-${id}`}>{methodLabel(lookup.get(id)!)}</a>{/each}</nav>
    {#each family.methods as id}{@const check=checkLookup.get(id)!}{@const method=lookup.get(id)!}
      <article class="prerequisite-check" id={`prerequisite-${id}`} data-prerequisite={id}>
        <h3>Check: {methodLabel(method)}</h3><p class="check-needs"><strong>Look for:</strong> {check.conditions}</p>
        <Procedure html={check.html} {values} commented/>
        {#if !check.inline}<div class="check-reading"><p><strong>Example output · synthetic</strong></p><pre class="sample-output"><code>{check.sample}</code></pre><p><strong>Meaning:</strong> {check.meaning}</p><p><strong>Confirm:</strong> {check.confirm}</p></div>{/if}
        {#if check.validationHtml}<p class="check-validation-label">Validate the missing condition</p><Procedure html={check.validationHtml} {values} commented/>{#if !check.validationInline}<p><strong>Confirm:</strong> {check.conditions}</p>{/if}{/if}
        <p class="check-continue"><strong>If confirmed →</strong> <a href={methodURL(method)} data-check-continue={id}>{methodLabel(method)} procedure</a></p>
        <p><strong>If absent:</strong> {check.ruledout} <a href="#first-pass">Choose another observed finding ↑</a></p>
        <p class="check-unclear"><strong>If unclear:</strong> {check.unknown} <a href={methodURL(method)+`#troubleshoot-${id}`}>Troubleshoot this check →</a></p>
      </article>
    {/each}
  </section>{/each}
</section>
