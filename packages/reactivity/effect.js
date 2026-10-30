// The currently executing side effect.
// The getters in reactive/ref read this to decide whether they are inside
// an effect execution context, and therefore whether to track dependencies.
// It is a global singleton: set only while wrapped() is running, otherwise null.
export let activeEffect = null;

// Stack of executing side effects.
// Used to handle nested effects: when an inner effect finishes, activeEffect
// must be restored to the outer effect instead of being set to null.
const effectStack = [];

// Current nesting depth of effects.
let effectDepth = 0;

// Maximum nesting depth, used to stop infinite loops where effect A triggers
// effect B and effect B triggers effect A again.
const MAX_DEPTH = 100;

export function effect(fn) {

  // wrapped is a wrapper around the user-provided fn.
  // Dependency tracking collects wrapped (not fn), so that when the effect is
  // triggered, calling wrapped() re-establishes the activeEffect context.
  const wrapped = () => {

    // Self-recursion guard: if this effect is already on the stack, it was
    // triggered by itself. Return immediately to avoid infinite recursion.
    if (effectStack.includes(wrapped)) return;

    // Depth guard: when effects trigger each other in a cycle, depth keeps
    // growing. Throw once the limit is exceeded to expose the dependency cycle.
    if (effectDepth >= MAX_DEPTH) {
      throw new Error('[reactivity] effect triggered too deeply, check for dependency cycles');
    }

    try {
      // Push onto the stack and point activeEffect at this effect.
      // While fn() runs, every reactive/ref get() will collect this wrapped.
      effectStack.push(wrapped);
      activeEffect = wrapped;
      effectDepth++;

      // Run the user logic (e.g. component render).
      fn();
    } finally {

      // Restore state whether fn() throws or not.
      effectDepth--;
      effectStack.pop();

      // Important: do not set activeEffect to null directly.
      // If an outer effect exists, activeEffect must be restored to it;
      // otherwise subsequent reads in the outer effect would not be tracked.
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };

  // First run: establishes the initial dependency tracking.
  wrapped();

  // Return wrapped so it can be triggered manually or used for unmounting.
  return wrapped;
}