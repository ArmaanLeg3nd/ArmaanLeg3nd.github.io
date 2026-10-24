<script lang="ts">
  import Procedure from './Procedure.svelte';
  import {methodURL,type Catalog,type FirstPassStep} from '../../lib/oscp-types';
  import {methodLabel} from '../../lib/oscp-navigation';
  import type {CommandValues} from '../../lib/oscp-commands';
  let {steps,catalog,values}:{steps:FirstPassStep[];catalog:Catalog;values:CommandValues}=$props();
  const lookup=new Map(catalog.methods.map(method=>[method.id,method]));
</script>

<section class="first-pass command-reference" id="first-pass" aria-label="First pass: tools and findings">
  <h2>First pass: tools and findings</h2>
  <p>Use the steps matching your current access. Follow a concrete finding instead of completing every technique in order.</p>
  {#each steps as step,index}{@const fallback=lookup.get(step.fallback.target)!}<section class="first-pass-step" id={`first-pass-${index}`} data-first-pass-method={step.method}>
    <h3>{step.title}</h3><p>{step.note}</p>
    <Procedure html={step.html} {values} commented/>
    <ul class="first-pass-findings">{#each step.findings as finding}{@const target=lookup.get(finding.target)!}<li><p><strong>If {finding.finding}</strong> → <a href={methodURL(target)} data-first-pass-target={target.id}>{methodLabel(target)}</a></p><p>{finding.check}</p></li>{/each}</ul>
    <p class="first-pass-fallback"><strong>Otherwise:</strong> {step.fallback.reason} <a href={methodURL(fallback)}>Open {methodLabel(fallback)} →</a></p>
    <p class="first-pass-reference"><a href={methodURL(lookup.get(step.method)!)}>Full commands & alternatives →</a>{#if ['linux-enumerators','windows-enumerators'].includes(step.method)} <a href={methodURL(lookup.get('transfer-http')!)}>Transfer/setup →</a>{/if}</p>
  </section>{/each}
</section>
