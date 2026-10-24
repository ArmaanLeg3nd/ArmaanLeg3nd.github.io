<script lang="ts">
  import Procedure from './Procedure.svelte';
  import {namespaceProcedure} from '../../lib/oscp-procedure';
  import {referenceFamilies} from '../../lib/oscp-reference';
  import {methodURL,type Catalog,type Topic,type Method} from '../../lib/oscp-types';
  import {methodLabel} from '../../lib/oscp-navigation';
  import type {CommandValues} from '../../lib/oscp-commands';
  let {topic,methods,catalog,values,onrecord}:{topic:Topic;methods:Method[];catalog:Catalog;values:CommandValues;onrecord:(id:string)=>void}=$props();
  const families=referenceFamilies(topic);
  const lookup=new Map(methods.map(method=>[method.id,method]));
  const summaries=new Map(catalog.methods.map(method=>[method.id,method]));
  const targetURL=(id:string)=>lookup.has(id) ? '#ref-'+id : methodURL(summaries.get(id)!);
</script>

<nav class="cheatsheet-contents" id="contents" aria-label={`${topic.title} contents`}>
  <h2>Contents</h2>
  <p>Jump to a task. Commands and variants are visible below; full checks and explanations stay on each technique page.</p>
  <ul>{#each families as family,index}<li><a class="contents-family" href={`#reference-family-${index}`}>{family.title}</a><ul>{#each family.methods as id}<li><a href={`#ref-${id}`} data-task-link={id}>{methodLabel(lookup.get(id)!)}</a></li>{/each}</ul></li>{/each}</ul>
</nav>
<section class="topic-toolbox" id="tools-and-scripts" aria-label="Tools and scripts">
  <h2>Tools & scripts</h2>
  <dl>{#each catalog.toolbox.filter(tool=>tool.topic===topic.id) as tool}<div><dt><a href={`#ref-${tool.method}`}>{tool.name}</a> <a class="upstream-link" href={tool.url} aria-label={`${tool.name} upstream source`}>upstream ↗</a></dt><dd>{tool.note}</dd></div>{/each}</dl>
</section>
<section class="topic-cheatsheet" id="topic-task-index" aria-label="Commands by task">
  {#each families as family,index}<section class="reference-family" id={`reference-family-${index}`}>
    <h2>{family.title}</h2>
    {#each family.methods as id}{@const method=lookup.get(id)!}
      <article class="inline-technique command-reference" id={`ref-${id}`} data-reference-method={id}>
        <header><h3>{methodLabel(method)}</h3><a href="#contents">Contents ↑</a></header>
        <p class="inline-use"><strong>Use when:</strong> {method.clue}</p>
        <p class="inline-needs"><strong>Needs:</strong> {method.conditions}</p>
        <Procedure html={namespaceProcedure(method.html.procedure,id)} {values} commented/>
        <p class="inline-result"><strong>Read / verify →</strong> {method.verify}</p>
        <p class="inline-failure"><strong>If it fails →</strong> {method.failure}</p>
        <ul class="inline-next">{#each method.next as edge}{@const target=summaries.get(edge.id)!}<li><span>{edge.when}</span> → <a href={targetURL(edge.id)}>{methodLabel(target)}</a></li>{/each}</ul>
        <p class="inline-actions"><a href={methodURL(method)+`#check-${id}`} data-full-checks={id}>Prerequisite checks & examples →</a><a href={methodURL(method)}>Full technique →</a><button class="record-technique" onclick={()=>onrecord(id)}>Record step +</button></p>
      </article>
    {/each}
  </section>{/each}
</section>
