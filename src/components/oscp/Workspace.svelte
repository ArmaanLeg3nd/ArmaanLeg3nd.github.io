<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import InvestigationPanel from './InvestigationPanel.svelte';
  import MethodEntry from './MethodEntry.svelte';
  import { methodURL, topicURL, type Catalog, type Method } from '../../lib/oscp-types';
  import { topicLabel, methodLabel, startingGroups, investigationSteps } from '../../lib/oscp-navigation';
  import { connectionFields, validValue, getSessionCommandValues, setSessionCommandValues, type CommandValues, type ConnectionField } from '../../lib/oscp-commands';

  let { catalog, initialTopic = '', initialMethod = '', initialMethods = [] }: { catalog: Catalog; initialTopic?: string; initialMethod?: string; initialMethods?: Method[] } = $props();
  const topicId = untrack(() => initialTopic);
  const methods = untrack(() => initialMethods);
  const lookup = new Map(catalog.methods.map(method => [method.id,method]));
  const fullMethods = new Map(methods.map(method => [method.id,method]));
  const topic = catalog.topics.find(topic => topic.id === topicId);
  const stageIndex = catalog.stages.findIndex(stage => stage.topics.includes(topicId));
  let focusedMethod = $state(untrack(() => initialMethod));
  let openedMethods = $state<Record<string,boolean>>(initialMethod ? {[initialMethod]:true} : {});
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
  let destroyed = false;
  let results = $derived(query.trim() ? catalog.methods.filter(method => query.toLowerCase().trim().split(/\s+/).every(word => method.search.includes(word))) : []);
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
  async function openTechnique(id: string, scroll = true) {
    if(!topic) return;
    const family = topic.families.findIndex(family => family.methods.includes(id));
    if(family<0)return;
    openedMethods={...openedMethods,[id]:true};focusedMethod=id;
    query='';navigationOpen=false;
    await tick();
    if(destroyed || !scroll)return;
    const element=document.getElementById(id);
    element?.querySelector<HTMLElement>(':scope > summary')?.focus({preventScroll:true});
    element?.scrollIntoView({block:'start',behavior:'instant'});
  }
  async function selectMethod(event: MouseEvent,id: string) {
    if(event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    const method=lookup.get(id);if(!method)return;
    event.preventDefault();
    if(method.topic===topicId) { await openTechnique(id);return; }
    busy=true;error='';
    try { await navigate(methodURL(method)+'#'+id); }
    catch(cause) { error=cause instanceof Error ? cause.message : 'Unable to open this method.'; }
    finally { busy=false; }
  }
  function methodToggled(id: string,open: boolean) {
    if(openedMethods[id]!==open)openedMethods={...openedMethods,[id]:open};
    if(open)focusedMethod=id;
  }
  async function selectFamily(event: MouseEvent,index: number) {
    if(event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();await tick();
    document.getElementById(`family-${topicId}-${index}`)?.scrollIntoView({block:'start',behavior:'instant'});
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
      if(initialMethod && !location.hash)void openTechnique(initialMethod);
      else if(location.hash) {
        let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{}
        const element=document.getElementById(id);
        if(element?.closest('.method-browser')) {
          let parent: HTMLElement|null=element;
          while(parent && !parent.classList.contains('method-browser')) {if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}
          element.scrollIntoView({block:'start',behavior:'instant'});
        }
      }
    },0);
    const outside=(event:PointerEvent) => {if(controlsOpen && !controlDetails.contains(event.target as Node) && !(event.target as Element).closest('.record-technique'))controlsOpen=false;};
    document.addEventListener('pointerdown',outside);
    return () => {destroyed=true;clearTimeout(timer);document.removeEventListener('pointerdown',outside);};
  });
</script>

<div class="oscp-workspace navigator-workspace">
  <header class="navigator-toolbar">
    <a class="navigator-brand" href="/tools/oscp/" onclick={event => follow(event)}><span>O/</span> OSCP <small>strategy workspace</small></a>
    <div class="navigator-toolbar-actions"><button class="navigator-menu" aria-expanded={navigationOpen} aria-controls="topic-navigation" onclick={() => navigationOpen=!navigationOpen}>Browse topics</button>
      <details class="workspace-controls" bind:open={controlsOpen} bind:this={controlDetails} onkeydown={event => {if(event.key==='Escape'){controlsOpen=false;controlDetails.querySelector('summary')?.focus();}}}>
        <summary>Workspace controls <span class:saving={savingEnabled}>{savingEnabled ? 'Saving on' : 'Memory only'} · {stepCount} steps</span></summary>
        <div class="workspace-controls-panel">
          <InvestigationPanel bind:this={panel} {catalog} activeMethodId={focusedMethod} ondocumentchange={document => stepCount=document.steps.length} onstatuschange={saving => savingEnabled=saving} />
          <details class="connection-settings"><summary>Command values <span>{Object.keys(activeValues).length} filled</span></summary><p>Temporary connection values clear on reload. Passwords, hashes and tickets remain placeholders. Check address-family syntax in the selected command.</p><div class="value-fields">{#each connectionFields as field}<label>{field}<input autocomplete="off" spellcheck="false" value={values[field] || ''} oninput={event => setValue(field,event.currentTarget.value)} aria-invalid={!validValue(field,values[field] || '')} />{#if !validValue(field,values[field] || '')}<small>Use an identifier or valid port range; no spaces or shell operators.</small>{/if}</label>{/each}</div><button onclick={clearValues}>Clear values</button></details>
        </div>
      </details>
    </div>
  </header>
  <div class="navigator-columns">
    <aside class="navigator-sidebar" class:mobile-open={navigationOpen} id="topic-navigation" aria-label="Topics and objectives">
      <label class="navigator-search"><span>FIND A CLUE OR METHOD</span><input type="search" bind:value={query} placeholder="Service, clue, tool…" aria-label="Search all strategy methods" /></label>
      {#if query.trim()}
        <p class="navigator-result-count" role="status">{results.length} matching methods</p><div class="navigator-results">{#each results as result}<a href={methodURL(result)} onclick={event => selectMethod(event,result.id)}><strong>{result.title}</strong><span>{result.clue}</span></a>{/each}{#if !results.length}<p>Try a shorter clue or a service name.</p>{/if}</div>
      {:else}
        <a class="navigator-home" class:active={!topicId} href="/tools/oscp/" onclick={event => follow(event)}>Where should I start? ↗</a>
        <nav class="topic-links" aria-label="Browse by topic">{#each catalog.topics as item}<a class:active={item.id===topicId} aria-current={item.id===topicId ? 'page' : undefined} href={topicURL(item.id)} onclick={event => follow(event,item.id)}>{topicLabel(item)}<span>›</span></a>{/each}</nav>
      {/if}
      <div class="navigator-footer"><span>{catalog.methods.length} methods · 15 topics</span><a href="https://github.com/ArmaanLeg3nd/OSCP-Exploitation-Reference">Full reference on GitHub ↗</a><span>Study coverage ≠ practical mastery</span></div>
    </aside>
    <main class="workspace-detail topic-content" aria-busy={busy}>
      <nav class="compact-breadcrumb" aria-label="Workspace breadcrumb"><a href="/tools/">Tools</a><span>/</span><a href="/tools/oscp/" onclick={event => follow(event)}>OSCP</a>{#if topic}<span>/</span><span>{topicLabel(topic)}</span>{/if}</nav>
      {#if error}<p class="workspace-error" role="alert">{error}<button onclick={() => go(topicId)}>Retry topic</button></p>{/if}{#if busy}<span class="sr-only" role="status">Opening reference…</span>{/if}
      {#if topic}
        <header class="compact-topic-header" data-reveal><p class="detail-kicker">STAGE {String(stageIndex+1).padStart(2,'0')} / {topic.title}</p><h1>{topicLabel(topic)}</h1><p>{topic.intro}</p></header>
        <section class="topic-decision-guide" aria-label="Where to begin">
          <h2>Investigation sequence</h2><p class="sequence-intro">Follow the steps that match what you found. Open a technique for its check, clue and next action.</p>
          <ol class="investigation-sequence">{#each topic.workflow as step,index}<li><span class="step-number">{index+1}</span><div><h3>{investigationSteps[topic.id]?.[index] || step.label}</h3><div class="guide-method-links">{#each step.methods as id}{@const method=lookup.get(id)!}<a href={methodURL(method)} onclick={event => selectMethod(event,id)}>{methodLabel(method)} →</a>{/each}</div></div></li>{/each}</ol>
          <details class="sequence-context"><summary>Detailed scope & checks</summary><p><strong>Starting situation:</strong> {topic.start}</p><p><strong>Required access:</strong> {topic.access}</p><ol>{#each topic.workflow as step}<li>{step.label}</li>{/each}</ol><p>Study blocks: {topic.blocks}</p></details>
        </section>
        <nav class="family-index" aria-label="Method families">{#each topic.families as family,index}<a href={`#family-${topic.id}-${index}`} onclick={event => selectFamily(event,index)}>{family.title}<span>{family.methods.length}</span></a>{/each}</nav>
        <section class="method-browser" aria-label={`Methods for ${topic.title}`}>
          {#each topic.families as family,index}
            <section class="method-family" id={`family-${topic.id}-${index}`}>
              <header class="family-heading"><h2>{family.title}</h2><span>{family.methods.length} methods</span></header>
              <div class="family-methods">{#each family.methods as id}{@const method=fullMethods.get(id)!}<MethodEntry {method} {lookup} opened={!!openedMethods[id]} values={activeValues} onselect={selectMethod} onopen={methodToggled} onrecord={record} />{/each}</div>
            </section>
          {/each}
        </section>
      {:else}
        <header class="compact-topic-header" data-reveal><p class="detail-kicker">CHOOSE A STARTING POINT</p><h1>What do you have?</h1><p>Start from your current access. Open a topic, find its recognition clues, then follow the result into the next method.</p></header>
        <div class="compact-start-actions"><a href={topicURL('discovery')} onclick={event => follow(event,'discovery')}>Start with discovery →</a>{#if resume}<a href={resume}>Resume last location ↗</a>{/if}</div>
        <section class="starting-groups" aria-label="Choose your starting capability">{#each startingGroups as group}<article><h2>{group.title}</h2><div>{#each group.items as [label,id]}<a href={topicURL(id)} onclick={event => follow(event,id)}>{label}<span>→ {topicLabel(catalog.topics.find(topic=>topic.id===id)!)}</span></a>{/each}</div></article>{/each}</section>
        <details class="entire-map"><summary>Browse the entire end-to-end map <span>8 stages · 15 topics</span></summary><div class="compact-stage-map">{#each catalog.stages as stage,index}<article><span>{String(index+1).padStart(2,'0')}</span><div><h2>{stage.title}</h2>{#each stage.topics as id}{@const item=catalog.topics.find(topic=>topic.id===id)!}<a href={topicURL(id)} onclick={event => follow(event,id)}>{item.title} →</a>{/each}</div></article>{/each}</div><p>New identity, privilege, host or route → re-enumerate from that new position.</p></details>
        <details class="study-reference"><summary>Study order, scope & hypothetical chains</summary><p>Eight study units: discovery/services; web; credentials; public exploits/sessions; Linux/Windows escalation; pivoting/AD/movement; execution diagnostics; integration/evidence. Concept study and practical competence remain separate.</p>{#each Object.entries(catalog.chains) as [title,chain]}<h2>{title} <small>HYPOTHETICAL</small></h2><div class="chain-links">{#each chain as id}{@const method=lookup.get(id)!}<a href={methodURL(method)} onclick={event => selectMethod(event,id)}>{method.title}</a>{/each}</div>{/each}<p>Built from your reviewed exploitation reference. Dedicated buffer-overflow development is excluded by preparation choice. Existing-exploit adaptation remains covered. <a href="https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide">Check current exam rules ↗</a></p></details>
      {/if}
    </main>
  </div>
</div>
