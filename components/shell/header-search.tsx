'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

/**
 * Visible header search input. Doesn't actually search inline — it opens the
 * cmd-K palette which has the proper fuzzy search across clients/tasks/etc.
 * The keyboard shortcut hint helps power users discover ⌘/Ctrl+K.
 */
export default function HeaderSearch() {
  const [shortcut, setShortcut] = useState('⌘K');
  useEffect(() => {
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    setShortcut(isMac ? '⌘K' : 'Ctrl K');
  }, []);

  function trigger() {
    // Synthesise the cmd-K shortcut so the existing CommandPalette picks it up.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  }

  return (
    <button
      onClick={trigger}
      data-testid="header-search"
      className="hidden md:flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 transition-colors min-w-[280px]"
      aria-label="Search"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">Search clients, tasks, anything…</span>
      <kbd className="font-mono text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{shortcut}</kbd>
    </button>
  );
}
