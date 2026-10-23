<script lang="ts">
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";

  export interface ArchiveItem {
    slug: string;
    href: string;
    kicker: string;
    title: string;
    summary: string;
    category: string;
    status: string;
    date: string;
    meta?: string;
    tags: string[];
  }

  export let items: ArchiveItem[] = [];
  export let variant: "grid" | "list" | "table" = "grid";
  export let searchLabel = "Search archive";

  let query = "";
  let active = "All";

  $: categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  $: filtered = items.filter((item) => {
    const categoryMatch = active === "All" || item.category === active;
    const haystack = `${item.title} ${item.summary} ${item.category} ${item.meta ?? ""} ${item.tags.join(" ")} ${item.status}`.toLowerCase();
    return categoryMatch && haystack.includes(query.toLowerCase().trim());
  });

  const tone = (status: string) => status.toLowerCase().replaceAll(" ", "-");
</script>

<div class="archive-control" data-reveal>
  <label>
    <input bind:value={query} type="search" placeholder={searchLabel} aria-label={searchLabel} />
  </label>
  <div class="filter-row" aria-label="Filter by category">
    {#each categories as category}
      <button
        type="button"
        class:active={active === category}
        aria-pressed={active === category}
        on:click={() => active = category}
      >
        {category}
      </button>
    {/each}
  </div>
  <p class="results" aria-live="polite">Showing {filtered.length.toString().padStart(2, "0")} of {items.length.toString().padStart(2, "0")}</p>
</div>

<div class:archive-grid={variant === "grid"} class:archive-list={variant === "list"} class:archive-table={variant === "table"}>
  {#each filtered as item (item.slug)}
    <article
      animate:flip={{ duration: 260 }}
      in:fly={{ y: 10, duration: 220 }}
      out:fade={{ duration: 120 }}
      class="archive-entry record-card"
    >
      <a href={item.href}>
        <div class="entry-ref">
          <span>{item.kicker}</span>
          <span class="status-chip" data-tone={tone(item.status)}>{item.status}</span>
        </div>
        <div class="entry-main">
          <h2>{item.title}</h2>
          <p>{item.summary}</p>
        </div>
        <div class="entry-meta">
          <span>{item.date}</span>
          {#if item.meta}<span>{item.meta}</span>{/if}
          <div>{#each item.tags.slice(0, 3) as tag}<span class="tag">{tag}</span>{/each}</div>
        </div>
      </a>
    </article>
  {:else}
    <div class="empty" transition:fade>
      <span>No matches</span>
      <p>No archive entries match this query.</p>
    </div>
  {/each}
</div>

<style>
  .archive-control {
    position: relative;
    margin: 2.5rem 0 1.4rem;
  }

  label {
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    max-width: 54rem;
    height: 3rem;
    padding: 0 0.85rem;
    border: 1px solid var(--line);
    background: rgba(16, 22, 29, 0.74);
    color: var(--muted);
    font-family: var(--mono);
  }

  input {
    width: 100%;
    height: 100%;
    padding: 0 0.65rem;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font-family: var(--sans);
    font-size: 0.78rem;
  }

  input::placeholder { color: var(--quiet); }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  button {
    min-height: 1.75rem;
    padding: 0.35rem 0.62rem;
    border: 1px solid rgba(167, 176, 185, 0.18);
    background: var(--surface-low);
    color: var(--muted);
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
  }

  button:hover,
  button:focus-visible,
  button.active {
    border-color: rgba(231, 225, 214, 0.32);
    background: rgba(231, 225, 214, 0.048);
    color: var(--text);
    outline: 0;
  }

  .results {
    margin: 0.8rem 0 0;
    color: var(--quiet);
    font-family: var(--mono);
    font-size: 0.6rem;
  }

  .archive-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .archive-list,
  .archive-table {
    display: grid;
    gap: 0;
    border-top: 1px solid var(--line);
  }

  .archive-entry {
    position: relative;
    min-width: 0;
    border: 1px solid var(--line);
    background: rgba(25, 28, 28, 0.82);
    transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
  }

  .archive-entry:hover,
  .archive-entry:focus-within {
    z-index: 2;
    border-color: rgba(231, 225, 214, 0.32);
    background: rgba(30, 33, 33, 0.94);
    transform: translateY(-1px);
  }

  .archive-entry a {
    position: relative;
    z-index: 1;
    display: grid;
    min-height: 100%;
    padding: 1.2rem;
    outline: 0;
  }

  .entry-ref,
  .entry-meta,
  .entry-meta div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .entry-ref {
    justify-content: space-between;
    color: var(--quiet);
    font-family: var(--mono);
    font-size: 0.62rem;
  }

  h2 {
    margin: 1rem 0 0.55rem;
    color: var(--text);
    font-family: var(--sans);
    font-size: 1.04rem;
    font-weight: 600;
    line-height: 1.35;
    transition: color 180ms ease;
  }

  .archive-entry:hover h2,
  .archive-entry:focus-within h2 { color: var(--text); }

  .entry-main p {
    margin: 0;
    color: var(--muted);
    font-size: 0.85rem;
    line-height: 1.55;
  }

  .entry-meta {
    flex-wrap: wrap;
    justify-content: space-between;
    align-self: end;
    margin-top: 1.25rem;
    color: var(--quiet);
    font-family: var(--mono);
    font-size: 0.58rem;
  }

  .entry-meta div { flex-wrap: wrap; }

  .archive-list .archive-entry,
  .archive-table .archive-entry {
    border-top: 0;
  }

  .archive-list .archive-entry a,
  .archive-table .archive-entry a {
    grid-template-columns: minmax(8rem, 0.8fr) minmax(16rem, 2.4fr) minmax(12rem, 1.2fr);
    gap: 1.5rem;
    align-items: center;
  }

  .archive-list h2,
  .archive-table h2 { margin-top: 0; }
  .archive-list .entry-meta,
  .archive-table .entry-meta { margin-top: 0; }

  .empty {
    grid-column: 1 / -1;
    padding: 3rem;
    border: 1px solid var(--line);
    text-align: center;
  }

  .empty span {
    color: var(--ember);
    font-family: var(--mono);
    font-size: 0.75rem;
  }

  .empty p { color: var(--muted); }

  @media (max-width: 980px) {
    .archive-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    .archive-list .archive-entry a,
    .archive-table .archive-entry a {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
  }

  @media (max-width: 620px) {
    .archive-grid { grid-template-columns: 1fr; }
  }

</style>
