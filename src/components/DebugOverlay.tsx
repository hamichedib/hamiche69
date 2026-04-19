import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface LogEntry {
  id: number;
  level: "error" | "warn" | "info";
  text: string;
  time: string;
}

const listeners: Array<(e: LogEntry) => void> = [];
let counter = 0;
const MAX_LOGS = 200;
const logs: LogEntry[] = [];

function push(level: LogEntry["level"], text: string) {
  const entry: LogEntry = {
    id: ++counter,
    level,
    text,
    time: new Date().toLocaleTimeString(),
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
  for (const l of listeners) l(entry);
}

function stringifyArg(a: unknown): string {
  if (a instanceof Error) return `${a.message}\n${a.stack ?? ""}`;
  if (typeof a === "string") return a;
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

let installed = false;
// eslint-disable-next-line react-refresh/only-export-components
export function installDebugCapture() {
  if (installed) return;
  installed = true;

  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...args: unknown[]) => {
    push("error", args.map(stringifyArg).join(" "));
    origError(...args);
  };
  console.warn = (...args: unknown[]) => {
    push("warn", args.map(stringifyArg).join(" "));
    origWarn(...args);
  };

  window.addEventListener("error", (e) => {
    push(
      "error",
      `uncaught: ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}\n${
        e.error instanceof Error ? (e.error.stack ?? "") : ""
      }`,
    );
  });
  window.addEventListener("unhandledrejection", (e) => {
    push("error", `unhandled rejection: ${stringifyArg(e.reason)}`);
  });
}

export function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LogEntry[]>([...logs]);

  useEffect(() => {
    const fn = (e: LogEntry) => setItems((prev) => [...prev.slice(-MAX_LOGS + 1), e]);
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  const errorCount = items.filter((i) => i.level === "error").length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "fixed bottom-3 left-3 h-10 px-3 rounded-full text-xs font-bold shadow-xl border border-white/20 " +
          (errorCount > 0
            ? "bg-red-600 text-white"
            : "bg-white/10 text-white backdrop-blur")
        }
        style={{ zIndex: 100000 }}
        title="سجل التشخيص"
      >
        {errorCount > 0 ? `⚠ ${errorCount} أخطاء` : "سجل"}
      </button>
      {open && (
        <div
          className="fixed inset-x-3 bottom-16 rounded-2xl border border-white/15 bg-black/90 p-3 shadow-2xl flex flex-col"
          style={{ zIndex: 100000, maxHeight: "55vh" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-bold text-sm">سجل التشخيص ({items.length})</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                onClick={() => {
                  const txt = items
                    .map((i) => `[${i.time}] [${i.level}] ${i.text}`)
                    .join("\n");
                  void navigator.clipboard?.writeText(txt);
                }}
              >
                نسخ الكل
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                onClick={() => {
                  logs.length = 0;
                  setItems([]);
                }}
              >
                مسح
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed" dir="ltr">
            {items.length === 0 && (
              <div className="text-white/50 p-2">لا توجد رسائل بعد.</div>
            )}
            {items.map((i) => (
              <div
                key={i.id}
                className={
                  "border-b border-white/5 py-1 whitespace-pre-wrap break-words " +
                  (i.level === "error"
                    ? "text-red-300"
                    : i.level === "warn"
                      ? "text-amber-300"
                      : "text-white/80")
                }
              >
                <span className="text-white/40 mr-2">[{i.time}]</span>
                <span className="font-bold mr-1">[{i.level}]</span>
                {i.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface EBState {
  err: Error | null;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { err: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { err: error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    push("error", `[ErrorBoundary] ${error.message}\n${error.stack ?? ""}\n${info.componentStack ?? ""}`);
  }

  render() {
    if (this.state.err) {
      return (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center p-6"
          style={{ zIndex: 100001 }}
        >
          <div className="max-w-2xl w-full rounded-2xl bg-ink-900 border border-red-500/40 p-5 text-white space-y-3">
            <h2 className="text-xl font-extrabold text-red-400">حدث خطأ في التطبيق</h2>
            <pre
              dir="ltr"
              className="text-xs bg-black/50 p-3 rounded-lg whitespace-pre-wrap break-words max-h-[50vh] overflow-auto"
            >
              {this.state.err.message}
              {"\n"}
              {this.state.err.stack}
            </pre>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  const txt = `${this.state.err?.message}\n${this.state.err?.stack ?? ""}`;
                  void navigator.clipboard?.writeText(txt);
                }}
              >
                نسخ
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => this.setState({ err: null })}
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
