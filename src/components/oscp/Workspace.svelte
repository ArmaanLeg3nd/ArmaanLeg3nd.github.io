<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import Procedure from './Procedure.svelte';
  import InvestigationPanel from './InvestigationPanel.svelte';
  import { methodURL, topicURL, type Catalog, type Method } from '../../lib/oscp-types';
  import { connectionFields, validValue, getSessionCommandValues, setSessionCommandValues, type CommandValues, type ConnectionField } from '../../lib/oscp-commands';
  let { catalog, initialTopic = '', initialMethod = '', initialMethods = [] }: { catalog: Catalog; initialTopic?: string; initialMethod?: string; initialMethods?: Method[] } = $props();
  let topicId = $state(untrack(() => initialTopic));
  let methodId = $state(untrack(() => initialMethod));
  let methods = $state<Method[]>(untrack(() => initialMethods));
  let query = $state('');
  let treeOpen = $state(false);
  let valuesOpen = $state(false);
  let values = $state<CommandValues>({});
  let busy = $state(false);
  let error = $state('');
  let resume = $state('');
  let expanded = $state<Record<string,boolean>>({});
  let preferencesReady = false;
  let heading: HTMLHeadingElement;
  const byId = new Map(catalog.methods.map(m => [m.id,m]));
  let topic = $derived(catalog.topics.find(t => t.id === topicId));
  let method = $derived(methods.find(m => m.id === methodId));
  let stageIndex = $derived(catalog.stages.findIndex(s => s.topics.includes(topicId)));
  let results = $derived(query.trim() ? catalog.methods.filter(m => query.toLowerCase().trim().split(/\s+/).every(word => m.search.includes(word))) : []);
  let activeValues = $derived(Object.fromEntries(Object.entries(values).filter(([k,v]) => v && validValue(k as ConnectionField,v))) as CommandValues);
  const starts = [
    ['An address or uncertain reachability','discovery'], ['A reachable service','services'], ['A web application','web-mapping'],
    ['Suspicious application behavior','web-exploitation'], ['A password, key, hash or ticket','credentials'], ['A plausible public exploit','public-exploits'],
    ['Command execution or a limited session','sessions-transfers'], ['A Linux foothold','linux-privesc'], ['A Windows foothold','windows-privesc'],
    ['A domain identity','ad-mapping'], ['A useful domain right or credential source','ad-identities'], ['Credentials and another host','lateral-movement'],
    ['An internal service or a broken return path','pivoting'], ['A payload that does not behave as expected','execution'], ['Competing paths or reporting work','integration']
  ];
  function remember(key: string, open: boolean) {
    if (!preferencesReady) return;
    expanded = {...expanded,[key]:open};
    try { localStorage.setItem('oscp-tree-v1',JSON.stringify(expanded)); } catch {}
  }
  async function go(nextTopic = '', nextMethod = '') {
    error = ''; busy = true;
    try {
      const url = nextMethod ? methodURL(byId.get(nextMethod)!) : nextTopic ? topicURL(nextTopic) : '/tools/oscp/';
      // Share the site's history, metadata and page-motion lifecycle.
      await navigate(url);
    } catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to load this topic.'; }
    finally { busy = false; }
  }
  function follow(event: MouseEvent, t: string, m = '') {
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); void go(t,m);
  }
  function jump(event: MouseEvent, id: string) { const m = byId.get(id); if (m) follow(event,m.topic,id); }
  function setValue(key: ConnectionField, value: string) { values = {...values,[key]:value}; setSessionCommandValues(values); }
  function clearValues() { values = {}; setSessionCommandValues(values); }
  function restoreURL() {
    const match = location.pathname.match(/^\/tools\/oscp\/(?:([^/]+)\/)?(?:([^/]+)\/)?$/);
    if (match) void go(match[1] || '',match[2] || '');
  }
  onMount(() => {
    try { const saved = localStorage.getItem('oscp-navigation-v1'); if (saved && saved !== '/tools/oscp/' && /^\/tools\/oscp\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)?$/.test(saved)) resume = saved; } catch {}
    values = getSessionCommandValues();
    try { localStorage.setItem('oscp-navigation-v1',location.pathname); } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem('oscp-tree-v1') || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) expanded = Object.fromEntries(Object.entries(saved).slice(0,100).filter(([key,value]) => /^(stage|family):/.test(key) && key.length < 200 && typeof value === 'boolean')) as Record<string,boolean>;
      // An explicit method URL always reveals its ancestry, even if it was previously collapsed.
      const stage = catalog.stages.find(s => s.topics.includes(topicId));
      if (stage) expanded = {...expanded,[`stage:${stage.id}`]:true};
      const family = byId.get(methodId)?.family;
      if (family) expanded = {...expanded,[`family:${topicId}:${family}`]:true};
    } catch {}
    preferencesReady = true;
  });
</script>

<div class="oscp-workspace">
  <header class="workspace-top" data-reveal>
    <div class="workspace-brand"><span class="tool-mark">O/</span><div><a href="/tools/oscp/" onclick={e => follow(e,'')}>OSCP <span>strategy workspace</span></a><small>Investigate → recognize → validate → act → re-enumerate</small></div></div>
    <div class="workspace-actions"><button class="tree-toggle" aria-expanded={treeOpen} aria-controls="strategy-tree" onclick={() => treeOpen = !treeOpen}>Browse map</button><button class:chosen={valuesOpen} aria-expanded={valuesOpen} onclick={() => valuesOpen = !valuesOpen}>Command values <span>{Object.keys(activeValues).length || '+'}</span></button><a href="/tools/">All tools ↗</a></div>
  </header>
  <InvestigationPanel {catalog} activeMethodId={methodId} />
  {#if valuesOpen}
    <section data-reveal class="values-drawer" aria-label="Temporary command values">
      <div><h2>Fill connection placeholders</h2><p>Values apply to command blocks in this workspace and clear on reload. Secrets remain placeholders. Check address-family syntax in the selected command.</p></div>
      <div class="value-fields">{#each connectionFields as field}<label>{field}<input autocomplete="off" spellcheck="false" value={values[field] || ''} oninput={e => setValue(field,e.currentTarget.value)} aria-invalid={!validValue(field,values[field] || '')} />{#if !validValue(field,values[field] || '')}<small>Use a valid identifier or port range; no spaces or shell operators.</small>{/if}</label>{/each}</div>
      <button onclick={clearValues}>Clear values</button>
    </section>
  {/if}
  <div class="workspace-columns">
    <aside class="strategy-tree" class:mobile-open={treeOpen} id="strategy-tree" aria-label="Strategy navigation">
      <label class="search-label"><span>FIND A NEXT STEP</span><input type="search" bind:value={query} placeholder="Clue, service, method or tool…" aria-label="Search strategy methods" /></label>
      {#if query.trim()}
        <p class="tree-count" role="status">{results.length} matching methods</p>
        <div class="search-results">{#each results as result}<a href={methodURL(result)} onclick={e => jump(e,result.id)}><strong>{result.title}</strong><span>{result.family}</span><small>{result.clue}</small></a>{/each}{#if !results.length}<p>Try a service name, access context, or shorter clue.</p>{/if}</div>
      {:else}
        <a class="tree-overview" class:active={!topicId} href="/tools/oscp/" onclick={e => follow(e,'')}>↗ End-to-end overview</a>
        {#each catalog.stages as stage, i}
          <details class="stage-branch" open={expanded[`stage:${stage.id}`] ?? stage.topics.includes(topicId)} ontoggle={e => remember(`stage:${stage.id}`,e.currentTarget.open)}>
            <summary><span class="stage-number">{String(i+1).padStart(2,'0')}</span><span>{stage.title}</span><span class="chevron">+</span></summary>
            {#each stage.topics as id}
              {@const t = catalog.topics.find(t => t.id === id)!}
              <div class="topic-branch"><a class:active={topicId === id && !methodId} href={topicURL(id)} onclick={e => follow(e,id)}>{t.title}<small>First-pass workflow ↗</small></a>
              {#each t.families as family}
                <details class="family-branch" open={expanded[`family:${t.id}:${family.title}`] ?? family.methods.includes(methodId)} ontoggle={e => remember(`family:${t.id}:${family.title}`,e.currentTarget.open)}><summary>{family.title}<span>{family.methods.length}</span></summary>
                  {#each family.methods as id}{@const m = byId.get(id)!}<a class="method-link" class:active={id === methodId} aria-current={id === methodId ? 'page' : undefined} href={methodURL(m)} onclick={e => jump(e,id)}>{m.title}</a>{/each}
                </details>
              {/each}</div>
            {/each}
          </details>
        {/each}
      {/if}
      <div class="tree-bottom"><span>{catalog.methods.length} methods · 15 topics</span><a href="https://github.com/ArmaanLeg3nd/OSCP-Exploitation-Reference">Open reference ↗</a><span>Inventory ≠ practical mastery</span></div>
    </aside>

    <main class="workspace-detail" aria-busy={busy}>
      <nav class="workspace-breadcrumb" aria-label="Workspace breadcrumb"><a href="/tools/">Tools</a><span>/</span><a href="/tools/oscp/" onclick={e => follow(e,'')}>OSCP</a>{#if topic}<span>/</span><a href={topicURL(topic.id)} onclick={e => follow(e,topic.id)}>{topic.title}</a>{/if}{#if method}<span>/</span><span>Method</span>{/if}</nav>
      {#if error}<div class="workspace-error" role="alert">{error}<button onclick={() => restoreURL()}>Retry current page</button></div>{/if}
      {#if busy}<p class="loading" role="status">Loading reviewed procedures…</p>{/if}
      {#if method && topic}
        <div class="detail-kicker">STAGE {String(stageIndex+1).padStart(2,'0')} <span>/</span> {method.family}</div>
        <h1 data-reveal bind:this={heading} tabindex="-1">{method.title}</h1>
        <p class="detail-result" data-reveal>{method.result}</p>
        <div class="method-route"><span>01 Recognize</span><span>02 Check</span><span>03 Act</span><span>04 Interpret</span><span>05 Continue</span></div>
        <section data-reveal class="decision-card recognition-card"><div class="section-label"><span>01</span><h2>When to investigate</h2></div><p class="lead-clue">{method.clue}</p><dl class="condition-grid"><div><dt>STARTING ACCESS</dt><dd>{method.access}</dd></div><div><dt>LOOK HERE</dt><dd>{method.recognition.where}</dd></div></dl><Procedure html={method.html.discovery} values={activeValues} /></section>
        <section data-reveal class="decision-card"><div class="section-label"><span>02</span><h2>Check the enabling conditions</h2></div><p>{method.conditions}</p>{#if method.checks !== method.recognition.commands}<Procedure html={method.html.checks} values={activeValues} />{/if}<blockquote>{method.recognition.confirm}</blockquote>
          <details class="evidence-example"><summary>Recognize the clue in sample output <span>SYNTHETIC</span></summary><pre class="sample-output"><code>{method.recognition.sample}</code></pre><p>{method.recognition.spot}</p></details>
        </section>
        <section data-reveal class="decision-card"><div class="section-label"><span>03</span><h2>Take the next action</h2></div><p class="muted">Use the baseline when its conditions match. Expand the procedure for complete context-specific variants.</p><Procedure html={method.html.baseline} values={activeValues} /><details class="full-procedure"><summary>Complete procedure & meaningful variants <span>EXPAND</span></summary><Procedure html={method.html.procedure} values={activeValues} /></details></section>
        <section data-reveal class="decision-card"><div class="section-label"><span>04</span><h2>Interpret the result</h2></div><div class="verification"><span>VERIFY</span><p>{method.verify}</p></div><div class="failure-cue"><span>IF IT FAILS</span><p>{method.failure}</p></div><div class="outcome-grid"><details><summary>Enabled after validation</summary><p>{method.recognition.enabled}</p></details><details><summary>Ruled out in this context</summary><p>{method.recognition.ruledout}</p></details><details><summary>Still inconclusive</summary><p>{method.recognition.unknown}</p></details></div></section>
        <section data-reveal class="decision-card next-section"><div class="section-label"><span>05</span><h2>Continue from the evidence</h2></div><p class="muted">These are conditional routes. Check the receiving method’s requirements before following a link.</p>
          <div class="transition-list">{#each method.next.slice(0,3) as edge}{@const next = byId.get(edge.id)!}<a href={methodURL(next)} onclick={e => jump(e,next.id)}><strong>{next.title}<span>↗</span></strong><span><b>WHEN</b> {edge.when}</span><small><b>REQUIRES</b> {edge.requires}</small></a>{/each}</div>
          {#if method.next.length > 3}<details class="more-routes"><summary>{method.next.length-3} additional routes</summary><div class="transition-list">{#each method.next.slice(3) as edge}{@const next = byId.get(edge.id)!}<a href={methodURL(next)} onclick={e => jump(e,next.id)}><strong>{next.title} ↗</strong><span><b>WHEN</b> {edge.when}</span><small><b>REQUIRES</b> {edge.requires}</small></a>{/each}</div></details>{/if}
          <div class="return-cue"><strong>Something changed?</strong><p>New credentials, identity, privilege, host or route mean new enumeration. Recheck the exact host, account context and reachable services.</p><a href={topicURL('discovery')} onclick={e => follow(e,'discovery')}>Revisit discovery ↗</a> <a href={topicURL('credentials')} onclick={e => follow(e,'credentials')}>Classify new material ↗</a></div>
        </section>
        <details class="optional-depth"><summary>Mechanics & a worked example</summary><h2>Why it works</h2><p>{method.mechanics}</p><h2>Hypothetical worked example</h2><p>{method.example}</p></details>
        <div class="reference-links"><a href={method.links.guide}>Deeper method notes ↗</a><a href={method.links.procedure}>Owning procedure ↗</a><a href={method.links.sheet}>Quick sheet ↗</a></div>
      {:else if topic}
        <div class="detail-kicker">STAGE {String(stageIndex+1).padStart(2,'0')} <span>/</span> FIRST-PASS WORKFLOW</div><h1 data-reveal bind:this={heading} tabindex="-1">{topic.title}</h1><p class="detail-result" data-reveal>{topic.intro}</p><div class="starting-condition"><span>START WITH</span><p>{topic.start}</p></div>
        <section class="topic-workflow" data-reveal><h2>Find the clue before choosing a method.</h2>{#each topic.workflow as step,i}<article><span class="workflow-number">{String(i+1).padStart(2,'0')}</span><div><h3>{step.label}</h3><div class="workflow-links">{#each step.methods as id}{@const m = byId.get(id)!}<a href={methodURL(m)} onclick={e => jump(e,id)}>{m.title} ↗</a>{/each}</div></div></article>{/each}</section>
        <section class="topic-families" data-reveal><h2>Compare the approaches</h2>{#each topic.families as family}<div class="family-heading"><h3>{family.title}</h3><span>{family.methods.length} methods</span></div><div class="method-cards">{#each family.methods as id}{@const m = byId.get(id)!}<a href={methodURL(m)} onclick={e => jump(e,id)}><h3>{m.title} ↗</h3><p><b>RECOGNIZE</b> {m.clue}</p><small><b>REQUIRES</b> {m.conditions}</small></a>{/each}</div>{/each}</section>
      {:else}
        <div class="detail-kicker">THE WHOLE PROCESS <span>/</span> ONE DECISION AT A TIME</div><h1 data-reveal bind:this={heading} tabindex="-1">Know what to look for.<br /><em>Know what comes next.</em></h1><p class="detail-result" data-reveal>Start from what you have. Find the evidence, check the conditions, then choose a method. Keep the full path in view without opening every branch.</p>
        <div class="overview-actions"><a class="primary-action" href={topicURL('discovery')} onclick={e => follow(e,'discovery')}>Start with discovery <span>→</span></a>{#if resume}<a href={resume} onclick={e => { const parts = resume.split('/').filter(Boolean); follow(e,parts[2] || '',parts[3] || ''); }}>Resume last location ↗</a>{/if}</div>
        <section class="capability-starts" data-reveal><div class="section-heading"><h2>What do you have?</h2><span>ENTER AT YOUR CURRENT CAPABILITY</span></div><div class="capability-grid">{#each starts as [label,id]}<a href={topicURL(id)} onclick={e => follow(e,id)}>{label}<span>↗</span></a>{/each}</div></section>
        <section class="stage-spine" data-reveal><div class="section-heading"><h2>The end-to-end skeleton</h2><span>LOOPS, NOT A ONE-WAY CHECKLIST</span></div>{#each catalog.stages as stage,i}<article><span class="spine-number">{String(i+1).padStart(2,'0')}</span><div><h3>{stage.title}</h3><div>{#each stage.topics as id}{@const t = catalog.topics.find(t => t.id === id)!}<a href={topicURL(id)} onclick={e => follow(e,id)}>{t.title} ↗</a>{/each}</div></div></article>{/each}<p class="spine-loop">↶ New identity, privilege, host or route → re-enumerate from that new position.</p></section>
        <details class="optional-depth"><summary>Study navigation & example attack chains</summary><p>Eight study units: discovery/services; web; credentials; public exploits/sessions; Linux/Windows escalation; pivoting/AD/movement; execution diagnostics; integration/evidence. Concept study and practical competence remain separate.</p>{#each Object.entries(catalog.chains) as [title,chain]}<h3>{title} <small>HYPOTHETICAL</small></h3><div class="chain-links">{#each chain as id}{@const m = byId.get(id)!}<a href={methodURL(m)} onclick={e => jump(e,id)}>{m.title}</a>{/each}</div>{/each}</details>
        <p class="workspace-footnote">Built from your reviewed exploitation reference. Dedicated buffer-overflow development is excluded by preparation choice. Existing-exploit adaptation remains covered. <a href="https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide">Check current exam rules ↗</a></p>
      {/if}
    </main>
  </div>
</div>
