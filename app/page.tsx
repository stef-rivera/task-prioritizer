 "use client";

import { FormEvent, useState } from "react";

type PrioritizedTask = {
  task: string;
  rank: number;
  priorityLabel: string;
  reason: string;
};

type PrioritizeResponse = {
  prioritizedTasks: PrioritizedTask[];
  summary: string;
};

export default function Home() {
  const [tasks, setTasks] = useState<string[]>([
    "Answer urgent emails from manager",
    "Finish project presentation slides",
    "Go to the gym",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrioritizeResponse | null>(null);

  const handleTaskChange = (index: number, value: string) => {
    setTasks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddTask = () => {
    setTasks((prev) => [...prev, ""]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const nonEmptyTasks = tasks.map((t) => t.trim()).filter((t) => t.length > 0);

    if (nonEmptyTasks.length === 0) {
      setError("Please enter at least one task to prioritize.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/prioritize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: nonEmptyTasks }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to prioritize tasks.");
      }

      const data = (await response.json()) as PrioritizeResponse;
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-8">
        <header className="mb-6 space-y-2 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Task Prioritizer
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Plan your day with AI
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            Drop in everything you&apos;re considering for today and let the AI
            sort your list from highest to lowest priority{" "}
            <span className="font-medium">
              with a clear reason for each ranking.
            </span>
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Today&apos;s tasks
              </h2>
              <button
                type="button"
                onClick={handleAddTask}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                + Add task
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700"
                >
                  <div className="mt-2 h-5 w-5 shrink-0 rounded-full border border-zinc-300 bg-white text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                    <span className="flex h-full items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <textarea
                    value={task}
                    onChange={(event) =>
                      handleTaskChange(index, event.target.value)
                    }
                    placeholder={
                      index === 0
                        ? "Draft tomorrow's status update"
                        : index === 1
                          ? "Prep slides for client meeting"
                          : index === 2
                            ? "Schedule focus block for deep work"
                            : "Describe the task you might do today"
                    }
                    rows={2}
                    className="mt-1.5 w-full resize-none border-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  />
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(index)}
                      className="mt-1.5 rounded-full px-2 py-1 text-[11px] font-medium text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Tip: Be specific (include deadlines, importance, or dependencies)
              so the AI can justify why something is ranked high or low.
            </p>
          </section>

          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              Your tasks are sent securely to OpenAI to compute the
              prioritization. No data is stored by this app.
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isLoading ? "Prioritizing..." : "Prioritize my day"}
            </button>
          </section>
        </form>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
            {error}
          </div>
        )}

        {isLoading && !error && (
          <div className="mt-6 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
            Thinking through your day and ranking tasks with reasons…
          </div>
        )}

        {result && (
          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Prioritized plan
              </h2>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {result.prioritizedTasks.length} tasks ranked
              </span>
            </div>

            <ol className="space-y-3">
              {result.prioritizedTasks
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((item) => (
                  <li
                    key={`${item.rank}-${item.task}`}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
                          {item.rank}
                        </span>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">
                            {item.task}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.priorityLabel.toLowerCase() === "high"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : item.priorityLabel.toLowerCase() === "medium"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {item.priorityLabel}
                      </span>
                    </div>
                  </li>
                ))}
            </ol>

            {result.summary && (
              <div className="mt-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Overall approach
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">
                  {result.summary}
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

