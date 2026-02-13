let activeRequestCount = 0;
const subscribers = new Set();

const emit = () => {
  const isLoading = activeRequestCount > 0;
  subscribers.forEach((listener) => {
    try {
      listener(isLoading, activeRequestCount);
    } catch {
      // Ignore subscriber errors so request lifecycle cannot break.
    }
  });
};

export const beginApiRequest = () => {
  activeRequestCount += 1;
  emit();
};

export const endApiRequest = () => {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  emit();
};

export const subscribeToApiLoading = (listener) => {
  subscribers.add(listener);
  listener(activeRequestCount > 0, activeRequestCount);
  return () => {
    subscribers.delete(listener);
  };
};

export const isApiLoading = () => activeRequestCount > 0;
