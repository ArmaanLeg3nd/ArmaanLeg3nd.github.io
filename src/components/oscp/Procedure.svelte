<script lang="ts">
  import { substitute, type CommandValues } from '../../lib/oscp-commands';
  let { html, values = {} }: { html: string; values?: CommandValues } = $props();
  let message = $state('');
  function commands(node: HTMLElement, input: { html: string; values: CommandValues }) {
    const originals = new WeakMap<HTMLElement, string>();
    function update(input: { html: string; values: CommandValues }) {
      // An action update runs after its markup update; defer to capture new code nodes.
      queueMicrotask(() => node.querySelectorAll<HTMLElement>('pre code').forEach(code => {
        if (!originals.has(code)) originals.set(code, code.textContent || '');
        code.textContent = substitute(originals.get(code)!, input.values);
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
<div class="procedure" use:commands={{ html, values }}>{@html html}</div>
<span class="sr-only" role="status">{message}</span>
