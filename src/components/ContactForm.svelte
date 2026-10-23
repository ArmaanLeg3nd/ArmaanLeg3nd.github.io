<script lang="ts">
  export let email: string;

  let name = "";
  let sender = "";
  let subject = "";
  let payload = "";
  let prepared = false;

  function transmit() {
    const body = `From: ${name}\nReply-to: ${sender}\n\n${payload}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject || "Technical inquiry")}&body=${encodeURIComponent(body)}`;
    prepared = true;
  }
</script>

<form on:submit|preventDefault={transmit} class="contact-card panel" data-reveal>
  <header>
    <p class="label">Contact form</p>
    <h2>Prepare an email draft</h2>
  </header>
  <div class="fields">
    <label>
      <span>Name</span>
      <input bind:value={name} required autocomplete="name" placeholder="Name or handle" />
    </label>
    <label>
      <span>Email</span>
      <input bind:value={sender} required type="email" autocomplete="email" placeholder="user@domain.tld" />
    </label>
    <label>
      <span>Subject</span>
      <input bind:value={subject} required placeholder="Report, project, research, or review" />
    </label>
    <label>
      <span>Message</span>
      <textarea bind:value={payload} required rows="8" placeholder="Evidence, scope, constraints, and required details."></textarea>
    </label>
    <div class="form-footer">
      <p>Opens your mail client.</p>
      <button class="button button--solid" type="submit">Prepare email</button>
    </div>
    {#if prepared}<p class="prepared" aria-live="polite">Email draft opened.</p>{/if}
  </div>
</form>

<style>
  .contact-card { background: rgba(25, 28, 28, 0.84); }
  header {
    padding: 1.2rem 1.2rem 0;
  }
  h2 {
    margin: .35rem 0 0;
    color: var(--text);
    font-family: var(--sans);
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: -.015em;
  }
  .fields { display: grid; gap: 1rem; padding: 1.2rem; }
  label { display: grid; gap: 0.45rem; }
  label span {
    color: var(--quiet);
    font-family: var(--mono);
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  input, textarea {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 0;
    outline: 0;
    background: rgba(16, 18, 18, 0.88);
    color: var(--text);
    font-family: var(--sans);
    font-size: 0.86rem;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }
  input { height: 2.5rem; padding: 0 0.75rem; }
  textarea { resize: vertical; min-height: 10rem; padding: 0.75rem; }
  input:focus, textarea:focus {
    border-color: rgba(231, 225, 214, 0.4);
    box-shadow: inset 2px 0 0 var(--ember);
  }
  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .form-footer p, .prepared {
    margin: 0;
    color: var(--quiet);
    font-family: var(--mono);
    font-size: 0.62rem;
  }
  .prepared { color: var(--green); }
  @media (max-width: 520px) {
    .form-footer { align-items: stretch; flex-direction: column; }
  }
</style>
