import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  /**
   * When provided on a confirmOnly dialog, shows a "Don't ask me again" checkbox.
   * If the user previously opted out for this key, the dialog auto-confirms.
   */
  skipKey?: string;
};

type PendingState = PromptOpts & {
  resolve: (value: string | null) => void;
};

const SKIP_PREFIX = "dn-skip-confirm:";

function isSkipped(key?: string) {
  if (!key) return false;
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(SKIP_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function setSkipped(key: string) {
  try {
    window.localStorage.setItem(SKIP_PREFIX + key, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Themed replacement for `window.prompt` / `window.confirm`.
 * Returns the entered string, "" for confirm-only acceptance, or null when cancelled.
 */
export function usePromptDialog() {
  const [pending, setPending] = useState<PendingState | null>(null);
  const [value, setValue] = useState("");
  const [dontAsk, setDontAsk] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ask = useCallback((opts: PromptOpts): Promise<string | null> => {
    // Auto-confirm if user previously opted out for this skipKey.
    if (opts.confirmOnly && isSkipped(opts.skipKey)) {
      return Promise.resolve("");
    }
    setValue(opts.defaultValue ?? "");
    setDontAsk(false);
    return new Promise((resolve) => {
      setPending({ ...opts, resolve });
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }, []);

  const close = (result: string | null) => {
    if (result !== null && pending?.confirmOnly && pending?.skipKey && dontAsk) {
      setSkipped(pending.skipKey);
    }
    pending?.resolve(result);
    setPending(null);
    setValue("");
    setDontAsk(false);
  };

  const confirmOnly = !!pending?.confirmOnly;
  const showSkip = confirmOnly && !!pending?.skipKey;

  const node = (
    <Dialog
      open={!!pending}
      onOpenChange={(o) => {
        if (!o) close(null);
      }}
    >
      <DialogContent className="sm:max-w-md overflow-hidden border-primary/30 bg-popover/95 shadow-[var(--shadow-glow)] backdrop-blur-xl animate-scale-in">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" />
        <DialogHeader className="pt-1">
          <DialogTitle className="flex items-center gap-3 text-popover-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            {pending?.title}
          </DialogTitle>
          {pending?.description && (
            <DialogDescription className="pl-12 text-muted-foreground">
              {pending.description}
            </DialogDescription>
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
              className="w-full rounded-md border border-input bg-input/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-inner outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/35"
            />
          </form>
        )}

        {showSkip && (
          <label className="flex items-center gap-2 pl-12 pr-1 -mt-1 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition">
            <Checkbox
              checked={dontAsk}
              onCheckedChange={(v) => setDontAsk(v === true)}
            />
            <span>Don't ask me again</span>
          </label>
        )}

        <DialogFooter className="gap-2 sm:gap-2 border-t border-border/70 pt-4">
          <button
            type="button"
            onClick={() => close(null)}
            className="px-4 py-2 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted text-sm transition hover:-translate-y-0.5 active:scale-95"
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
            className={`px-4 py-2 rounded-md text-sm font-medium transition hover:-translate-y-0.5 active:scale-95 shadow-sm ${
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
