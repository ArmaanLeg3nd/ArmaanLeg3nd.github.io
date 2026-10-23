<script lang="ts">
  import { onMount } from 'svelte';
  import type { Catalog } from '../../lib/oscp-types';
  import { freshInvestigation, parseInvestigation, serializeInvestigation, validateInvestigation, addStep, statuses, uid, STATE_KEY, SAVE_KEY, MAX_IMPORT_BYTES, getSessionInvestigation, setSessionInvestigation, type Investigation, type StepStatus } from '../../lib/investigation';
  let { catalog, activeMethodId = '', ondocumentchange = (_document: Investigation) => {} }: { catalog: Catalog; activeMethodId?: string; ondocumentchange?: (document: Investigation) => void } = $props();
  let document = $state<Investigation>(freshInvestigation(catalog.contentHash));
  let saving = $state(false);
  let open = $state(false);
  let notice = $state('');
  let error = $state('');
  let status = $state<StepStatus>('planned');
  let host = $state('');
  let identity = $state('');
  let capability = $state('');
  let observation = $state('');
  let predecessor = $state('');
  let pendingImport = $state<Investigation | null>(null);
  let pendingSaved = $state<Investigation | null>(null);
  let clearPending = $state(false);
  let fileInput: HTMLInputElement;
  let selectedMethod = $derived(catalog.methods.find(m => m.id === activeMethodId));
  function publish(message = '') {
    setSessionInvestigation(document);
    if (saving) {
      try { localStorage.setItem(STATE_KEY,serializeInvestigation(document)); localStorage.setItem(SAVE_KEY,'true'); }
      catch { saving = false; try { localStorage.setItem(SAVE_KEY,'false'); } catch {} error = 'Local storage is unavailable or full. Your in-memory investigation can still be exported.'; }
    }
    ondocumentchange(document); if (message) notice = message;
  }
  export function replaceDocument(next: Investigation) {
    document = validateInvestigation(next); publish();
  }
  function toggleSaving() {
    error = '';
    if (!saving) {
      try {
        const raw = localStorage.getItem(STATE_KEY);
        const previous = raw ? parseInvestigation(raw) : null;
        if (previous && previous.id !== document.id && previous.steps.length) { pendingSaved=previous; open=true; return; }
      } catch { error='The previous saved copy could not be read. Export this investigation, then clear the saved copy before enabling saving.'; return; }
    }
    saving = !saving;
    if (saving) publish('Local saving enabled. Connection-value inputs are excluded.');
    else { try { localStorage.setItem(SAVE_KEY,'false'); } catch {} notice = 'Saving paused. The last saved copy is retained until you clear it.'; }
  }
  function record() {
    if (!selectedMethod) return;
    error = '';
    try {
      const step = {id:uid(),methodId:selectedMethod.id,methodTitle:selectedMethod.title,status,host,identity,capability,observation,createdAt:new Date().toISOString()};
      document = addStep(document,step,predecessor);
      predecessor = step.id; observation = ''; capability = ''; status = 'planned';
      publish('Step recorded. Navigation alone never records an attack step.');
    } catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to record step.'; }
  }
  function download() {
    const blob = new Blob([serializeInvestigation(document)],{type:'application/json'});
    const url = URL.createObjectURL(blob), link = window.document.createElement('a');
    link.href=url; link.download=`oscp-investigation-${document.id}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000); notice = 'Investigation exported as version 1 JSON.';
  }
  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement, file = input.files?.[0];
    error = ''; if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('JSON file exceeds 1 MB.');
      const imported = parseInvestigation(await file.text());
      if (document.steps.length) { pendingImport = imported; open = true; }
      else acceptImport(imported);
    } catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to import this file.'; }
    finally { input.value = ''; }
  }
  function acceptImport(imported: Investigation) {
    document = imported; predecessor = ''; pendingImport = null;
    publish('Investigation imported. Recorded outcomes remain user-supplied evidence labels.');
  }
  function clear() {
    try { localStorage.removeItem(STATE_KEY); localStorage.setItem(SAVE_KEY,'false'); } catch {}
    saving=false; document=freshInvestigation(catalog.contentHash); predecessor=''; clearPending=false;
    setSessionInvestigation(document); ondocumentchange(document); notice='Saved and in-memory investigation cleared.';
  }
  onMount(() => {
    const session = getSessionInvestigation();
    if (session) document=session;
    try {
      saving = localStorage.getItem(SAVE_KEY) === 'true';
      if (!session && saving) { const saved=localStorage.getItem(STATE_KEY); if (saved) document=parseInvestigation(saved); }
    } catch { saving=false; error='Saved data could not be read. Nothing was overwritten; import a valid export or clear the saved copy.'; }
    setSessionInvestigation(document); ondocumentchange(document);
  });
</script>

<section class="investigation-bar" aria-label="Investigation state">
  <div class="investigation-toolbar"><button class="save-toggle" role="switch" aria-checked={saving} onclick={toggleSaving}><span class:enabled={saving} class="toggle-light"></span>Save locally <strong>{saving ? 'ON' : 'OFF'}</strong></button><button aria-expanded={open} onclick={() => open=!open}>Investigation <span>{document.steps.length} steps</span></button>{#if selectedMethod}<button onclick={() => open=true}>Record this method +</button>{/if}<div class="investigation-transfer"><button onclick={download}>Export JSON ↓</button><button onclick={() => fileInput.click()}>Import JSON ↑</button><a href="/tools/attack-path/">Visualize path ↗</a></div><input hidden type="file" accept=".json,application/json" bind:this={fileInput} onchange={importFile} aria-label="Import investigation JSON" /></div>
  {#if notice}<p class="state-notice" role="status">{notice}</p>{/if}{#if error}<p class="state-error" role="alert">{error}</p>{/if}
  {#if document.contentHash !== catalog.contentHash}<p class="state-notice">This investigation uses a different reference revision. Check current method prerequisites before reusing a recorded path.</p>{/if}
  {#if open}
    <div class="investigation-body"><div class="investigation-heading"><div><h2>Your investigation</h2><p>Explicit records, not a completion checklist. Use non-sensitive host and identity labels; omit passwords, hashes, tickets and raw transcripts from notes.</p></div><button onclick={() => clearPending=true}>Clear saved data</button></div>
      <label class="state-field">Investigation title<input maxlength="200" value={document.title} oninput={e => { document={...document,title:e.currentTarget.value,updatedAt:new Date().toISOString()}; publish(); }} /></label>
      {#if selectedMethod}
        <div class="record-form"><h3>Record: {selectedMethod.title}</h3><div class="record-grid"><label>Outcome<select bind:value={status}>{#each statuses as s}<option value={s}>{s}</option>{/each}</select></label><label>Host label<input bind:value={host} maxlength="200" placeholder="e.g. external Linux host" /></label><label>Identity label<input bind:value={identity} maxlength="200" placeholder="e.g. application account" /></label><label>Connect from<select bind:value={predecessor}><option value="">Independent step / no connection</option>{#each document.steps as s,i}<option value={s.id}>{i+1}. {s.methodTitle}</option>{/each}</select></label></div><label class="state-field">Capability or result<input bind:value={capability} maxlength="500" placeholder="What changed, or what remains unproved?" /></label><label class="state-field">Observation<textarea bind:value={observation} maxlength="4000" rows="3" placeholder="Record your evidence and its limits. A hypothesis is not a confirmed result."></textarea></label><button class="record-button" onclick={record}>Add recorded step</button></div>
      {:else}<p class="state-notice">Open a method to record an investigation step. Use the visualizer to edit outcomes and connections.</p>{/if}
      {#if document.steps.length}<ol class="recorded-steps">{#each document.steps as s}<li><span class="status-dot" data-status={s.status}></span><strong>{s.methodTitle}</strong><span>{s.status}</span>{#if s.host}<small>{s.host}</small>{/if}</li>{/each}</ol>{/if}
      {#if pendingImport}<div class="state-confirm" role="alert"><p>Import “{pendingImport.title}” ({pendingImport.steps.length} steps) and replace the current investigation? Export the current one first if you need it.</p><button onclick={() => acceptImport(pendingImport!)}>Replace with imported investigation</button><button onclick={() => pendingImport=null}>Cancel import</button></div>{/if}
      {#if pendingSaved}<div class="state-confirm" role="alert"><p>A different saved investigation, “{pendingSaved.title}” ({pendingSaved.steps.length} steps), is retained in this browser. Restore it, or explicitly replace that saved copy with the current investigation.</p><button onclick={() => {document=pendingSaved!;pendingSaved=null;saving=true;predecessor='';publish('Saved investigation restored.');}}>Restore saved investigation</button><button onclick={() => {pendingSaved=null;saving=true;publish('Current investigation saved in place of the previous copy.');}}>Save current investigation instead</button><button onclick={() => pendingSaved=null}>Cancel saving</button></div>{/if}
      {#if clearPending}<div class="state-confirm" role="alert"><p>Clear the saved copy and the current in-memory investigation?</p><button onclick={clear}>Clear investigation</button><button onclick={() => clearPending=false}>Keep investigation</button></div>{/if}
    </div>
  {/if}
</section>
