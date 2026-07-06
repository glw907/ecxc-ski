<script lang="ts">
  import { onMount } from 'svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();

  let initialized = false;

  // Only the options used at this call site (Pagefind UI accepts more).
  interface PagefindUIOptions {
    element: string;
    showSubResults?: boolean;
    placeholder?: string;
  }
  interface PagefindUIModule {
    PagefindUI: new (options: PagefindUIOptions) => unknown;
  }

  onMount(() => {
    function handleGlobalKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open = !open;
      }
    }
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  });

  async function initPagefind() {
    if (initialized) return;

    if (!document.querySelector('link[href*="pagefind-ui.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/pagefind/pagefind-ui.css';
      document.head.appendChild(link);
    }

    try {
      // pagefind UI bundle is generated post-build by `npx pagefind`; no module exists at compile time.
      // TypeScript resolves string-literal import paths at compile time (TS2307, "cannot find
      // module"); a variable path defeats that check, and the cast below supplies the real type.
      const pagefindUrl: string = '/pagefind/pagefind-ui.js';
      const { PagefindUI } = (await import(/* @vite-ignore */ pagefindUrl)) as unknown as PagefindUIModule;
      new PagefindUI({
        element: '#pagefind-search',
        showSubResults: true,
        placeholder: 'Search posts\u2026',
      });
      initialized = true;
    } catch {
      // dev mode; pagefind not built yet
    }
  }

  function close() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  $effect(() => {
    if (open) {
      initPagefind();
      setTimeout(() => {
        document.querySelector<HTMLInputElement>('.pagefind-ui__search-input')?.focus();
      }, 60);
    }
  });
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="search-overlay"
    role="presentation"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    onkeydown={handleKeydown}
  >
    <div class="search-panel">
      <button onclick={close} class="search-close" aria-label="Close search">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
      <div id="pagefind-search"></div>
    </div>
  </div>
{/if}

<style>
  .search-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 5rem 1rem 2rem;
    background: oklch(20% 0.012 175 / 0.25);
    backdrop-filter: blur(4px);
    animation: fade-in 0.3s ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .search-panel {
    position: relative;
    width: 100%;
    max-width: 34rem;
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    background: var(--color-base-100, #fff);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 1.75rem 2rem 1.5rem;
    box-shadow: var(--shadow-float);
  }

  .search-close {
    position: absolute;
    top: 0.85rem;
    right: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background: none;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    color: var(--color-faint);
    transition: color 0.2s ease;
  }
  .search-close:hover {
    color: var(--color-body);
  }

  .search-panel::-webkit-scrollbar { width: 5px; }
  .search-panel::-webkit-scrollbar-track { background: transparent; }
  .search-panel::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
</style>

<svelte:head>
  {#if open}
    {@html `<style id="pagefind-overrides">
      #pagefind-search {
        --pagefind-ui-scale: 0.75;
        --pagefind-ui-primary: var(--color-heading);
        --pagefind-ui-text: var(--color-body);
        --pagefind-ui-background: var(--color-base-100, #fff);
        --pagefind-ui-border: var(--color-border);
        --pagefind-ui-tag: var(--color-surface);
        --pagefind-ui-border-width: 1px;
        --pagefind-ui-border-radius: 4px;
        --pagefind-ui-image-border-radius: 3px;
        --pagefind-ui-font: var(--font-body);
      }

      /* Hide pagefind's built-in search icon */
      .pagefind-ui__form::before {
        display: none !important;
      }

      .pagefind-ui__search-input {
        font-family: var(--font-body) !important;
        font-size: 1.05rem !important;
        font-weight: 400 !important;
        height: auto !important;
        padding: 0.55rem 2.5rem 0.55rem 0.85rem !important;
        border: 1px solid var(--color-border) !important;
        border-radius: 5px !important;
        background: var(--color-surface) !important;
        transition: border-color 0.2s ease !important;
      }
      .pagefind-ui__search-input::placeholder {
        opacity: 0.35 !important;
      }
      .pagefind-ui__search-input:focus {
        border-color: var(--color-muted) !important;
        outline: none !important;
        box-shadow: none !important;
      }

      .pagefind-ui__search-clear {
        top: 50% !important;
        transform: translateY(-50%) !important;
        right: 0.25rem !important;
        height: auto !important;
        padding: 0.25rem 0.5rem !important;
        font-size: 0.7rem !important;
        color: var(--color-faint) !important;
        background: transparent !important;
      }

      .pagefind-ui__message {
        font-family: var(--font-display) !important;
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        color: var(--color-muted) !important;
        padding: 0.75rem 0 0.25rem !important;
        height: auto !important;
      }

      .pagefind-ui__results-area {
        margin-top: 0 !important;
      }

      .pagefind-ui__result {
        padding: 0.7rem 0 !important;
        border-top: 1px solid var(--color-border-subtle) !important;
      }
      .pagefind-ui__result:last-of-type {
        border-bottom: none !important;
      }

      .pagefind-ui__result-title {
        font-family: var(--font-display) !important;
        font-weight: 700 !important;
        letter-spacing: -0.01em !important;
      }
      .pagefind-ui__result-link {
        color: var(--color-heading) !important;
        text-decoration: none !important;
      }
      .pagefind-ui__result-link:hover {
        color: var(--color-link) !important;
      }

      .pagefind-ui__result-excerpt {
        font-family: var(--font-body) !important;
        font-size: 0.82rem !important;
        line-height: 1.5 !important;
        color: var(--color-muted) !important;
      }

      .pagefind-ui mark {
        background: var(--color-highlight) !important;
        color: inherit !important;
        border-radius: 2px;
        padding: 0.05em 0.12em;
      }

      .pagefind-ui__button {
        font-family: var(--font-display) !important;
        font-size: 0.72rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.04em !important;
        text-transform: uppercase !important;
        height: auto !important;
        padding: 0.5rem 0.75rem !important;
        border: 1px solid var(--color-border) !important;
        border-radius: 4px !important;
        background: var(--color-surface) !important;
        color: var(--color-muted) !important;
        transition: color 0.15s ease, border-color 0.15s ease !important;
      }
      .pagefind-ui__button:hover {
        color: var(--color-heading) !important;
        border-color: var(--color-muted) !important;
      }
    </style>`}
  {/if}
</svelte:head>
