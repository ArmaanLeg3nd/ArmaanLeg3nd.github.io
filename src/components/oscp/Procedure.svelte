<script lang="ts">
  import { substitute, type CommandValues } from '../../lib/oscp-commands';
  let { html, values = {}, commented = false }: { html: string; values?: CommandValues; commented?: boolean } = $props();
  let message = $state('');
  function commands(node: HTMLElement, input: { html: string; values: CommandValues; commented: boolean }) {
    const originals = new WeakMap<HTMLElement, string>();
    function update(input: { html: string; values: CommandValues; commented: boolean }) {
      // An action update runs after its markup update; defer to capture new code nodes.
      queueMicrotask(() => node.querySelectorAll<HTMLElement>('pre code').forEach(code => {
        if (!originals.has(code)) originals.set(code, code.textContent || '');
        const text = substitute(originals.get(code)!, input.values);
        if (!input.commented) { code.textContent = text; return; }
        const fragment = document.createDocumentFragment();
        const language = code.className.replace('language-', '');
        text.split('\n').forEach((line,index) => {
          if (index) fragment.append(document.createTextNode('\n'));
          const isComment = language === 'cmd' ? /^REM\s/i.test(line) : language === 'sql' ? /^--\s/.test(line) : ['c','javascript'].includes(language) ? /^\/\/\s/.test(line) : language === 'vb' ? /^'\s/.test(line) : ['html','xml','markdown'].includes(language) ? /^<!-- /.test(line) : /^#\s/.test(line);
          if (isComment) { const span=document.createElement('span');span.className='command-comment';span.textContent=line;fragment.append(span); }
          else fragment.append(document.createTextNode(line));
        });
        code.replaceChildren(fragment);
      }));
    }
    async function copy(event: Event) {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
      if (!button || !node.contains(button)) return;
      const code = button.closest('pre')?.querySelector('code');
      if (!code) return;
      try { await navigator.clipboard.writeText(code.textContent || ''); message = 'Command copied.'; }
      catch { message = 'Clipboard unavailable. Select the command and copy it manually.'; }
    }
    node.addEventListener('click', copy); update(input);
    return { update, destroy() { node.removeEventListener('click', copy); } };
  }
</script>
<div class="procedure" use:commands={{ html, values, commented }}>{@html html}</div>
<span class="sr-only" role="status">{message}</span>
