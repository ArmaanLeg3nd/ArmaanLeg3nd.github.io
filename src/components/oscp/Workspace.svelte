<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import InvestigationPanel from './InvestigationPanel.svelte';
  import MethodEntry from './MethodEntry.svelte';
  import TopicReference from './TopicReference.svelte';
  import FirstPass from './FirstPass.svelte';
  import {topicLead} from '../../lib/oscp-reference';
  import { stageGuides, stageURL } from '../../lib/oscp-stages';
  import { methodURL, topicURL, type Catalog, type Method, type FirstPassStep } from '../../lib/oscp-types';
  import { topicLabel, methodLabel } from '../../lib/oscp-navigation';
  import { searchMethods } from '../../lib/oscp-search';
  import { connectionFields, validValue, getSessionCommandValues, setSessionCommandValues, type CommandValues, type ConnectionField } from '../../lib/oscp-commands';

  let { catalog, initialTopic = '', initialStage = '', initialMethod = '', initialMethods = [], initialPlaybook = [] }: { catalog: Catalog; initialTopic?: string; initialStage?: string; initialMethod?: string; initialMethods?: Method[]; initialPlaybook?: FirstPassStep[] } = $props();
  const topicId = untrack(() => initialTopic);
  const methods = untrack(() => initialMethods);
  const lookup = new Map(catalog.methods.map(method => [method.id,method]));
  const activeMethod = methods.find(method => method.id === initialMethod);
  const topic = catalog.topics.find(topic => topic.id === topicId);
  const stage = catalog.stages.find(stage => stage.id === initialStage);
  const topicStage = catalog.stages.find(stage => stage.topics.includes(topicId));
  let focusedMethod = $state(untrack(() => initialMethod));
  let query = $state('');
  let navigationOpen = $state(false);
  let controlsOpen = $state(false);
  let values = $state<CommandValues>({});
  let savingEnabled = $state(false);
  let stepCount = $state(0);
  let busy = $state(false);
  let error = $state('');
  let resume = $state('');
  let panel: InvestigationPanel;
  let controlDetails: HTMLDetailsElement;
  let results = $derived(query.trim() ? searchMethods(catalog.methods,query) : []);
  let activeValues = $derived(Object.fromEntries(Object.entries(values).filter(([key,value]) => value && validValue(key as ConnectionField,value))) as CommandValues);

  async function go(topic = '') {
    busy=true; error='';
    try { await navigate(topic ? topicURL(topic) : '/tools/oscp/'); }
    catch(cause) { error=cause instanceof Error ? cause.message : 'Unable to open this topic.'; }
    finally { busy=false; }
  }
  function follow(event: MouseEvent, topic = '') {
    if(event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();void go(topic);
  }
  async function selectMethod(event: MouseEvent,id: string) {
    if(event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    const method=lookup.get(id);if(!method)return;
    event.preventDefault();
    busy=true;error='';
    try { await navigate(methodURL(method)); }
    catch(cause) { error=cause instanceof Error ? cause.message : 'Unable to open this method.'; }
    finally { busy=false; }
  }
  async function record(id: string) { focusedMethod=id;controlsOpen=true;await tick();panel.openPanel(); }
  function setValue(key: ConnectionField,value: string) {values={...values,[key]:value};setSessionCommandValues(values);}
  function clearValues(){values={};setSessionCommandValues(values);}
  onMount(() => {
    values=getSessionCommandValues();
    try {
      const saved=localStorage.getItem('oscp-navigation-v1');
      if(saved && saved!=='/tools/oscp/' && /^\/tools\/oscp\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)?$/.test(saved))resume=saved;
      localStorage.setItem('oscp-navigation-v1',location.pathname);
    }catch{}
    const timer=setTimeout(() => {
      if(!location.hash)return;
      let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{}
      // Preserve historical topic anchors by taking them to the canonical task page.
      if(!activeMethod) {
        const legacy=catalog.methods.find(method => method.topic===topicId && [method.id,`check-${method.id}`,`clue-${method.id}`,`execute-${method.id}`,`next-${method.id}`].includes(id));
        if(legacy) { void navigate(methodURL(legacy)+(id===legacy.id ? '' : '#'+(id.startsWith('clue-') ? 'check-'+legacy.id : id)));return; }
      }
      const element=document.getElementById(id);
      if(element) {
        element.querySelector<HTMLDetailsElement>(':scope > details')?.setAttribute('open','');
        let parent:HTMLElement|null=element;
        while(parent) {if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}
        element.scrollIntoView({block:'start',behavior:'instant'});
      }
    },0);
    const outside=(event:PointerEvent) => {if(controlsOpen && !controlDetails.contains(event.target as Node) && !(event.target as Element).closest('.record-technique'))controlsOpen=false;};
    document.addEventListener('pointerdown',outside);
    return () => {clearTimeout(timer);document.removeEventListener('pointerdown',outside);};
  });
</script>

<div class="oscp-workspace navigator-workspace">
  <header class="navigator-toolbar">
    <a class="navigator-brand" href="/tools/oscp/" onclick={event => follow(event)}><span>O/</span> OSCP <small>exploitation reference</small></a>
    <div class="quick-values" aria-label="Temporary command values">{#each ['TARGET','LHOST','PORT','LPORT'] as field}<label>{field === 'PORT' ? 'PORT · destination' : field === 'LPORT' ? 'LPORT · listener' : field}<input aria-label={`Quick ${field}`} autocomplete="off" spellcheck="false" placeholder={field} value={values[field as ConnectionField] || ''} aria-invalid={!validValue(field as ConnectionField,values[field as ConnectionField] || '')} oninput={event=>setValue(field as ConnectionField,event.currentTarget.value)} /></label>{/each}</div>
    <div class="navigator-toolbar-actions"><button class="navigator-menu" aria-expanded={navigationOpen} aria-controls="topic-navigation" onclick={() => navigationOpen=!navigationOpen}>Browse topics</button>
      <details class="workspace-controls" bind:open={controlsOpen} bind:this={controlDetails} onkeydown={event => {if(event.key==='Escape'){controlsOpen=false;controlDetails.querySelector('summary')?.focus();}}}>
        <summary>Workspace controls <span class:saving={savingEnabled}>{savingEnabled ? 'Saving on' : 'Memory only'} · {stepCount} steps</span></summary>
        <div class="workspace-controls-panel">
          <InvestigationPanel bind:this={panel} {catalog} activeMethodId={focusedMethod} ondocumentchange={document => stepCount=document.steps.length} onstatuschange={saving => savingEnabled=saving} />
          <details class="connection-settings"><summary>Command values <span>{Object.keys(activeValues).length} filled</span></summary><p>Temporary connection values clear on reload. Passwords, hashes and tickets remain placeholders. Check address-family syntax in the selected command.</p><div class="value-fields">{#each connectionFields as field}<label>{field === 'PORT' ? 'PORT · destination' : field === 'LPORT' ? 'LPORT · listener' : field}<input aria-label={field} autocomplete="off" spellcheck="false" value={values[field] || ''} oninput={event => setValue(field,event.currentTarget.value)} aria-invalid={!validValue(field,values[field] || '')} />{#if !validValue(field,values[field] || '')}<small>Use an identifier or valid port range; no spaces or shell operators.</small>{/if}</label>{/each}</div><button onclick={clearValues}>Clear values</button></details>
        </div>
      </details>
    </div>
  </header>
  <div class="navigator-columns">
    <aside class="navigator-sidebar" class:mobile-open={navigationOpen} id="topic-navigation" aria-label="Topics and objectives">
      <label class="navigator-search"><span>FIND A CLUE OR METHOD</span><input type="search" bind:value={query} placeholder="Service, clue, tool…" aria-label="Search exploitation reference" /></label>
      {#if query.trim()}
        <p class="navigator-result-count" role="status">{results.length} matching methods</p><div class="navigator-results">{#each results as result}<a href={methodURL(result)} onclick={event => selectMethod(event,result.id)}><strong>{methodLabel(result)}</strong><span>{topicLabel(catalog.topics.find(topic=>topic.id===result.topic)!)} · {result.clue}</span></a>{/each}{#if !results.length}<p>Try a shorter clue or a service name.</p>{/if}</div>
      {:else}
        <a class="navigator-home" class:active={!topicId && !stage} href="/tools/oscp/" onclick={event => follow(event)}>Reference index ↗</a>
        <nav class="stage-links" aria-label="Stages">{#each catalog.stages as item,index}<a href={stageURL(item.id)} class:active={stage?.id===item.id} aria-current={stage?.id===item.id ? 'page' : undefined}><span>{String(index+1).padStart(2,'0')}</span>{stageGuides[item.id].title}</a>{/each}</nav>
        <p class="navigator-section-label">QUICK REFERENCE</p>
        <nav class="topic-links" aria-label="Browse by topic">{#each catalog.topics as item}<a class:active={item.id===topicId} aria-current={item.id===topicId ? 'page' : undefined} href={topicURL(item.id)} onclick={event => follow(event,item.id)}>{topicLabel(item)}<span>›</span></a>{/each}</nav>
      {/if}
      <div class="navigator-footer"><span>{catalog.methods.length} methods · 15 topics</span><a href="https://github.com/ArmaanLeg3nd/OSCP-Exploitation-Reference">Full reference on GitHub ↗</a><span>Commands · scripts · next steps</span></div>
    </aside>
    <main class="workspace-detail topic-content" aria-busy={busy}>
      <nav class="compact-breadcrumb" aria-label="Workspace breadcrumb"><a href="/tools/">Tools</a><span>/</span><a href="/tools/oscp/" onclick={event => follow(event)}>OSCP</a>{#if topicStage}<span>/</span><a href={stageURL(topicStage.id)}>{stageGuides[topicStage.id].title}</a>{/if}{#if stage}<span>/</span><span>{stageGuides[stage.id].title}</span>{/if}{#if topic}<span>/</span><span>{topicLabel(topic)}</span>{/if}</nav>
      {#if error}<p class="workspace-error" role="alert">{error}<button onclick={() => go(topicId)}>Retry topic</button></p>{/if}{#if busy}<span class="sr-only" role="status">Opening reference…</span>{/if}
      {#if topic && activeMethod}
        <div class="task-browse-bar"><a href={topicURL(topic.id)} onclick={event=>follow(event,topic.id)}>← All {topicLabel(topic).toLowerCase()} tasks</a><label class="sr-only" for="task-jump">Jump to another task in this topic</label><select id="task-jump" value={activeMethod.id} onchange={event=>{const method=lookup.get(event.currentTarget.value);if(method)void navigate(methodURL(method));}}>{#each topic.families as family}<optgroup label={family.title}>{#each family.methods as id}{@const method=lookup.get(id)!}<option value={id}>{methodLabel(method)}</option>{/each}</optgroup>{/each}</select></div>
        <MethodEntry method={activeMethod} {lookup} values={activeValues} onselect={selectMethod} onrecord={record} />
      {:else if stage}
        <header class="compact-topic-header"><h1>{stageGuides[stage.id].title}</h1><p>{stageGuides[stage.id].prerequisite}</p></header>
        <ul class="stage-topic-index">{#each stage.topics as id}{@const item=catalog.topics.find(topic=>topic.id===id)!}<li><a href={topicURL(id)+'#contents'}>{topicLabel(item)} — commands & tools →</a><p>{item.access}</p></li>{/each}</ul>
        <p class="index-return"><a href="/tools/oscp/">← All stages and topics</a></p>
      {:else if topic}
        <header class="compact-topic-header" data-reveal><p class="detail-kicker">REFERENCE / {catalog.methods.filter(method=>method.topic===topicId).length} TASKS</p><h1>{topicLabel(topic)}</h1><p>{topicLead[topic.id]}</p></header>
        <nav class="reference-section-links" aria-label="Topic page sections"><a href="#contents">Contents ↓</a><a href="#tools-and-scripts">Tools & scripts ↓</a><a href="#topic-task-index">Commands ↓</a><a href="#first-pass">First-pass workflow ↓</a></nav>
        <span id="prerequisite-checks" class="legacy-anchor" aria-hidden="true"></span>
        <TopicReference {topic} {methods} {catalog} values={activeValues} onrecord={record}/>
        <FirstPass steps={initialPlaybook} {catalog} values={activeValues}/>
        <p class="reference-attribution">Additional organization and gap review informed by <a href={catalog.supplementarySource.url}>{catalog.supplementarySource.name} ↗</a>. Tool links open upstream sources.</p>
      {:else}
        <header class="compact-topic-header" data-reveal><h1>OSCP exploitation reference</h1><p>Choose a topic or search a tool. Jump to commands, read the result cue, then follow the matching technique.</p></header>
        <div class="compact-start-actions"><a href={topicURL('discovery')} onclick={event => follow(event,'discovery')}>Start with discovery →</a>{#if resume}<a href={resume}>Resume last location ↗</a>{/if}</div>
        <div class="reference-stage-index">{#each catalog.stages as item}<section data-stage-index={item.id}><h2><a href={stageURL(item.id)}>{stageGuides[item.id].title}</a></h2><ul>{#each item.topics as id}{@const entry=catalog.topics.find(topic=>topic.id===id)!}<li><a href={topicURL(id)}>{topicLabel(entry)} →</a><span>{entry.access}</span></li>{/each}</ul></section>{/each}</div>
        <details class="study-reference"><summary>Study order, scope & hypothetical chains</summary><p>Eight study units: discovery/services; web; credentials; public exploits/sessions; Linux/Windows escalation; pivoting/AD/movement; execution diagnostics; integration/evidence. Concept study and practical competence remain separate.</p>{#each Object.entries(catalog.chains) as [title,chain]}<h2>{title} <small>HYPOTHETICAL</small></h2><div class="chain-links">{#each chain as id}{@const method=lookup.get(id)!}<a href={methodURL(method)} onclick={event => selectMethod(event,id)}>{method.title}</a>{/each}</div>{/each}<p>Built from your reviewed exploitation reference. Dedicated buffer-overflow development is excluded by preparation choice. Existing-exploit adaptation remains covered. <a href="https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide">Check current exam rules ↗</a></p></details>
      {/if}
    </main>
  </div>
</div>
