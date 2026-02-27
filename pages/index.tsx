"use client";

import { useState } from "react";

// =============================================
// BUG 1: L'appel API sur httpbin.org/status/500 retourne
// toujours une erreur 500 — la todo n'est jamais
// marquée comme done car on attend la confirmation
// =============================================
// BUG 2: Sur mobile, max-h coupe la liste après 2 items
// =============================================
// BUG 3: handleDelete throw une erreur ET n'a pas de finally
// → le loading de suppression reste à true indéfiniment
// =============================================

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

type LoadingMap = Record<number, boolean>;
type ErrorMap = Record<number, boolean>;

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, title: "Acheter du pain", done: false },
    { id: 2, title: "Appeler le médecin", done: false },
  ]);
  const [input, setInput] = useState<string>("");
  const [loadingIds, setLoadingIds] = useState<LoadingMap>({});
  const [errorIds, setErrorIds] = useState<ErrorMap>({});
  // ❌ BUG 3 — ce loading ne sera jamais remis à false
  const [deletingIds, setDeletingIds] = useState<LoadingMap>({});

  const handleAdd = (): void => {
    if (!input.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), title: input.trim(), done: false },
    ]);
    setInput("");
  };

  // ❌ BUG 1 — L'API publique retourne toujours 500
  // On attend la confirmation avant de cocher → elle n'arrive jamais
  const handleCheck = async (id: number): Promise<void> => {
    setLoadingIds((prev) => ({ ...prev, [id]: true }));
    setErrorIds((prev) => ({ ...prev, [id]: false }));

    try {
      const res = await fetch("https://httpbin.org/status/500", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      // ✅ Jamais atteint — l'API échoue toujours
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: true } : t))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error(`[TodoApp] handleCheck failed for id=${id}:`, message);
      setErrorIds((prev) => ({ ...prev, [id]: true }));
    } finally {
      setLoadingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  // ❌ BUG 3 — throw est appelé AVANT que setDeletingIds(false) soit atteint
  // Il n'y a pas de finally → deletingIds[id] reste true pour toujours
  const handleDelete = async (id: number): Promise<void> => {
    setDeletingIds((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch("https://httpbin.org/status/500", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        // ❌ On throw ici — sans finally, le loading ne se reset jamais
        throw new Error(`Delete API error: ${res.status}`);
      }

      // Jamais atteint
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setDeletingIds((prev) => ({ ...prev, [id]: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error(`[TodoApp] handleDelete failed for id=${id}:`, message);
      // ❌ BUG: setDeletingIds(false) oublié dans le catch
      // Le spinner de suppression tourne indéfiniment
    }
    // ❌ Pas de finally — le loading reste bloqué à true
  };

  const activeTodos = todos.filter((t): t is Todo => !t.done);

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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && handleAdd()
          }
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
      */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e8e2d9] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0ebe3] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#aaa]">
            Tâches actives
          </span>
          <span className="text-xs bg-[#f0ebe3] text-[#888] rounded-full px-2 py-0.5 font-mono">
            {activeTodos.length}
          </span>
        </div>

        {/* BUG 2: max-h on mobile truncates the list */}
        <ul className="divide-y divide-[#f5f0e8] max-h-[140px] overflow-hidden sm:max-h-none sm:overflow-visible">
          {activeTodos.map((todo: Todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 px-5 py-4 group hover:bg-[#faf8f4] transition-colors"
            >
              {/* BUG 1: API call always fails → todo never gets checked */}
              <button
                onClick={() => handleCheck(todo.id)}
                disabled={loadingIds[todo.id] ?? false}
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all disabled:cursor-wait border-[#ccc] group-hover:border-[#1a1a1a]"
                title="Cocher cette tâche"
              >
                {loadingIds[todo.id] ? (
                  <span className="w-3 h-3 border-2 border-[#aaa] border-t-[#1a1a1a] rounded-full animate-spin block" />
                ) : errorIds[todo.id] ? (
                  <span className="text-red-500 text-[10px] font-bold leading-none">✕</span>
                ) : null}
              </button>

              <span className="text-sm text-[#1a1a1a] leading-snug flex-1">
                {todo.title}
              </span>

              {errorIds[todo.id] && (
                <span className="text-[11px] text-red-400 italic shrink-0">
                  Erreur 500
                </span>
              )}

              {/* BUG 3: croix de suppression — spinner infini après le clic */}
              <button
                onClick={() => handleDelete(todo.id)}
                disabled={deletingIds[todo.id] ?? false}
                className="ml-1 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all
                  text-[#bbb] hover:text-red-400 hover:bg-red-50 disabled:cursor-not-allowed"
                title="Supprimer cette tâche"
              >
                {deletingIds[todo.id] ? (
                  // ❌ Ce spinner ne s'arrêtera jamais (pas de finally dans handleDelete)
                  <span className="w-3 h-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin block" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </button>
            </li>
          ))}

          {activeTodos.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-[#bbb] italic">
              Aucune tâche active 🎉
            </li>
          )}
        </ul>
      </div>

      {/* Bug callouts */}
      <div className="w-full max-w-md mt-8 space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 leading-relaxed">
          <span className="font-bold">🐛 Bug #1 —</span> Le clic déclenche un appel
          API sur{" "}
          <code className="bg-red-100 px-1 rounded font-mono">
            httpbin.org/status/500
          </code>{" "}
          qui retourne toujours <strong>HTTP 500</strong>. La confirmation
          n&apos;arrive jamais → la tâche reste non cochée.
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 sm:hidden">
          <span className="font-bold">🐛 Bug #2 —</span> Sur mobile, seules 2
          tâches sont visibles. Les suivantes sont masquées.
        </div>
        <div className="hidden sm:block rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <span className="font-bold">🐛 Bug #2 —</span> Réduisez la fenêtre en
          taille mobile pour voir le bug : seules 2 tâches sont visibles.
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 leading-relaxed">
          <span className="font-bold">🐛 Bug #3 —</span> Cliquer sur la croix
          déclenche un appel DELETE qui throw une erreur. Sans{" "}
          <code className="bg-yellow-100 px-1 rounded font-mono">finally</code>,{" "}
          <code className="bg-yellow-100 px-1 rounded font-mono">deletingIds</code>{" "}
          n&apos;est jamais remis à <strong>false</strong> → le spinner tourne indéfiniment.
        </div>
      </div>
    </div>
  );
}