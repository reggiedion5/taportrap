/**
 * Dev-only audit of global touch/pointer listeners.
 *
 * Purpose: catch any regression where a non-passive `touchmove` listener stays
 * registered on document/window while a navigation screen (e.g. Home) is on
 * screen — that is the classic cause of "finger scrolling does nothing" in a
 * native WebView. Never runs in production.
 */
type Tracked = {
  type: string;
  target: string;
  passive: boolean;
  capture: boolean;
};

const TRACKED_TYPES = new Set(["touchstart", "touchmove", "pointerdown", "pointermove"]);

const active = new Map<object, Tracked>();
let installed = false;

const isDev = () => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
};

function keyFor(target: object, type: string, handler: unknown, capture: boolean) {
  return { target, type, handler, capture } as unknown as object;
}

const keys: Array<{
  id: object;
  target: object;
  type: string;
  handler: unknown;
  capture: boolean;
}> = [];

function findKey(target: object, type: string, handler: unknown, capture: boolean) {
  return keys.find(
    (k) => k.target === target && k.type === type && k.handler === handler && k.capture === capture,
  );
}

/** Installs the patched addEventListener on document + window. Dev only. */
export function installListenerAudit(): () => void {
  if (installed || typeof window === "undefined" || !isDev()) return () => {};
  installed = true;

  const targets: Array<{ obj: EventTarget; name: string }> = [
    { obj: document, name: "document" },
    { obj: window, name: "window" },
  ];

  const restores: Array<() => void> = [];

  for (const { obj, name } of targets) {
    const add = obj.addEventListener.bind(obj);
    const remove = obj.removeEventListener.bind(obj);

    obj.addEventListener = function patchedAdd(
      type: string,
      handler: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (TRACKED_TYPES.has(type) && handler) {
        const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
        const passive = typeof options === "object" ? options.passive !== false : false;
        const id = keyFor(obj, type, handler, capture);
        keys.push({ id, target: obj, type, handler, capture });
        active.set(id, { type, target: name, passive, capture });
      }
      return add(type, handler, options as AddEventListenerOptions);
    } as typeof obj.addEventListener;

    obj.removeEventListener = function patchedRemove(
      type: string,
      handler: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) {
      if (TRACKED_TYPES.has(type) && handler) {
        const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
        const found = findKey(obj, type, handler, capture);
        if (found) {
          active.delete(found.id);
          keys.splice(keys.indexOf(found), 1);
        }
      }
      return remove(type, handler, options as EventListenerOptions);
    } as typeof obj.removeEventListener;

    restores.push(() => {
      obj.addEventListener = add;
      obj.removeEventListener = remove;
    });
  }

  return () => {
    installed = false;
    active.clear();
    keys.length = 0;
    restores.forEach((fn) => fn());
  };
}

/** Global touch/pointer listeners currently registered. */
export function listActiveGlobalTouchListeners(): Tracked[] {
  return Array.from(active.values());
}

/**
 * Warn when a blocking (non-passive) touchmove listener survives onto a
 * navigation screen where the finger must be able to scroll.
 */
export function auditScreenListeners(screen: string): void {
  if (!isDev()) return;
  const blocking = listActiveGlobalTouchListeners().filter(
    (l) => l.type === "touchmove" && !l.passive,
  );
  if (blocking.length > 0) {
    console.warn(
      `[listener-audit] non-passive touchmove listener active on "${screen}" — this cancels native scrolling`,
      blocking,
    );
  }
}
