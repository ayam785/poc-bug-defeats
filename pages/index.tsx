"use client";

import { useState } from "react";

// =============================================
// BUG 1: L'appel API sur httpstat.us/500 retourne
// toujours une erreur 500 — la todo n'est jamais
// marquée comme done car on attend la confirmation
// =============================================
// BUG 2: Sur mobile, max-h coupe la liste après 2 items
// =============================================

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, title: "Acheter du pain", done: false },
    { id: 2, title: "Appeler le médecin", done: false },
  ]);
  const [input, setInput] = useState("");
  // Track loading & error state per todo id
  const [loadingIds, setLoadingIds] = useState({});
  const [errorIds, setErrorIds] = useState({});

  const handleAdd = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), title: input.trim(), done: false }]);
    setInput("");
  };

  // ❌ BUG 1 — L'API publique de test retourne toujours 500
  // On attend la confirmation avant de cocher → elle n'arrive jamais
  const handleCheck = async (id) => {
    // Set loading for this todo
    setLoadingIds((prev) => ({ ...prev, [id]: true }));
    setErrorIds((prev) => ({ ...prev, [id]: false }));

    try {
      // httpstat.us/500 is a public test API that always returns HTTP 500
      const res = await fetch("https://httpbin.org/status/500", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true }),
      });

      if (!res.ok) {
        // ❌ API responded with error — we never update the todo
        throw new Error(`API error: ${res.status}`);
      }


      // ✅ Would only reach here if API succeeded (never happens)
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: true } : t))
      );
    } catch (err) {
      // API failed → mark this todo as errored, leave it unchecked
      setErrorIds((prev) => ({ ...prev, [id]: true }));
    } finally {
      setLoadingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] font-['Georgia',serif] flex flex-col items-center py-16 px-4">

      {/* Title */}
      <div className="w-full max-w-md mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[#1a1a1a] mb-1">
          ✅ My Todos
        </h1>
        <p className="text-sm text-[#888] italic">Simple. Clean. Buggy.</p>
      </div>

      {/* Input */}
      <div className="w-full max-w-md flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nouvelle tâche..."
          className="flex-1 border border-[#ccc] rounded-xl px-4 py-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#a0c4ff] text-[#1a1a1a] placeholder-[#bbb]"
        />
        <button
          onClick={handleAdd}
          className="bg-[#1a1a1a] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#333] transition-colors shadow-sm"
        >
          Ajouter
        </button>
      </div>

      {/* 
        ❌ BUG 2 — intentionnellement cassé sur mobile :
        - max-h-[140px] coupe la liste après ~2 todos
        - overflow-hidden masque le reste
        - Ce comportement ne s'applique qu'en dessous de `sm:` (mobile)
      */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e8e2d9] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0ebe3] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#aaa]">
            Tâches actives
          </span>
          <span className="text-xs bg-[#f0ebe3] text-[#888] rounded-full px-2 py-0.5 font-mono">
            {todos.filter((t) => !t.done).length}
          </span>
        </div>

        {/* BUG 2: max-h on mobile truncates the list */}
        <ul className="divide-y divide-[#f5f0e8] max-h-[140px] overflow-hidden sm:max-h-none sm:overflow-visible">
          {todos
            .filter((t) => !t.done)
            .map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 px-5 py-4 group hover:bg-[#faf8f4] transition-colors"
              >
                {/* BUG 1: API call always fails → todo never gets checked */}
                <button
                  onClick={() => handleCheck(todo.id)}
                  disabled={loadingIds[todo.id]}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all disabled:cursor-wait
                    border-[#ccc] group-hover:border-[#1a1a1a]"
                  title="Cocher cette tâche"
                >
                  {loadingIds[todo.id] ? (
                    // Spinner while waiting for API
                    <span className="w-3 h-3 border-2 border-[#aaa] border-t-[#1a1a1a] rounded-full animate-spin block" />
                  ) : errorIds[todo.id] ? (
                    // Error state — API failed
                    <span className="text-red-500 text-[10px] font-bold leading-none">✕</span>
                  ) : null}
                </button>

                <span className="text-sm text-[#1a1a1a] leading-snug flex-1">
                  {todo.title}
                </span>

                {/* Inline API error message */}
                {errorIds[todo.id] && (
                  <span className="text-[11px] text-red-400 italic shrink-0">
                    Erreur 500
                  </span>
                )}
              </li>
            ))}

          {todos.filter((t) => !t.done).length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-[#bbb] italic">
              Aucune tâche active 🎉
            </li>
          )}
        </ul>
      </div>

      {/* Bug callouts — visible hints for QA */}
      <div className="w-full max-w-md mt-8 space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 leading-relaxed">
          <span className="font-bold">🐛 Bug #1 —</span> Le clic déclenche un appel
          API sur <code className="bg-red-100 px-1 rounded font-mono">httpstat.us/500</code> qui
          retourne toujours <strong>HTTP 500</strong>. La confirmation n'arrive jamais → la tâche reste non cochée.
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 sm:hidden">
          <span className="font-bold">🐛 Bug #2 —</span> Sur mobile, seules 2
          tâches sont visibles. Les suivantes sont masquées.
        </div>
        <div className="hidden sm:block rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <span className="font-bold">🐛 Bug #2 —</span> Réduisez la fenêtre en
          taille mobile pour voir le bug : seules 2 tâches sont visibles.
        </div>
      </div>
    </div>
  );
}