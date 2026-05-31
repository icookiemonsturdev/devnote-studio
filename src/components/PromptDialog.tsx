import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

type PromptOpts = {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** When set, dialog becomes a yes/no confirmation (no input). */
  confirmOnly?: boolean;
};

type PendingState = PromptOpts & {
  resolve: (value: string | null) => void;
};

/**
 * Themed replacement for `window.prompt` / `window.confirm`.
 * Returns the entered string, "" for confirm-only acceptance, or null when cancelled.
 */
export function usePromptDialog() {
  const [pending, setPending] = useState<PendingState | null>(null);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ask = useCallback((opts: PromptOpts): Promise<string | null> => {
    setValue(opts.defaultValue ?? "");
    return new Promise((resolve) => {
      setPending({ ...opts, resolve });
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }, []);

  const close = (result: string | null) => {
    pending?.resolve(result);
    setPending(null);
    setValue("");
  };

  const confirmOnly = !!pending?.confirmOnly;

  const node = (
    <Dialog open={!!pending} onOpenChange={(o) => { if (!o) close(null); }}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {pending?.title}
          </DialogTitle>
          {pending?.description && (
            <DialogDescription>{pending.description}</DialogDescription>
          )}
        </DialogHeader>

        {!confirmOnly && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = value.trim();
              if (v.length === 0) return;
              close(v);
            }}
          >
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={pending?.placeholder ?? ""}
              maxLength={200}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </form>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => close(null)}
            className="px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-sm transition active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmOnly) return close("");
              const v = value.trim();
              if (v.length === 0) return;
              close(v);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition active:scale-95 shadow-sm ${
              pending?.destructive
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90 hover:shadow-glow"
            }`}
          >
            {pending?.confirmLabel ?? (confirmOnly ? "Confirm" : "Create")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { ask, node };
}
