"use client";

import { useState } from "react";

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, title: "Acheter du pain", done: false },
    { id: 2, title: "Appeler le médecin", done: false },
  ]);
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), title: input.trim(), done: false }]);
    setInput("");
  };

  // ❌ BUG 1 — intentionnellement cassé : on ne fait rien avec l'id
  // La todo n'est jamais mise à jour comme "done"
  const handleCheck = (id) => {
    // BUG: setTodos is never called — the todo stays unchanged
    console.log("Check clicked for id:", id, "— but nothing happens (bug)");
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
                {/* BUG 1: onClick calls handleCheck which does nothing */}
                <button
                  onClick={() => handleCheck(todo.id)}
                  className="w-5 h-5 rounded-full border-2 border-[#ccc] group-hover:border-[#1a1a1a] transition-colors flex items-center justify-center flex-shrink-0"
                  title="Cocher cette tâche"
                >
                  {/* Circle never gets filled because done is never set to true */}
                  {todo.done && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
                  )}
                </button>
                <span className="text-sm text-[#1a1a1a] leading-snug flex-1">
                  {todo.title}
                </span>
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-bold">🐛 Bug #1 —</span> Cliquer sur le bouton
          rond ne coche pas la tâche. Elle reste visible indéfiniment.
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