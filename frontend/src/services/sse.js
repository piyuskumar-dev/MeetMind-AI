/**
 * Service to manage vanilla EventSource connections. Useful for manual subscriptions
 * outside of standard React lifecycle if needed.
 */
export const sseService = {
  /**
   * Establishes a raw Server-Sent Event stream
   * @param {string} url - SSE target URL
   * @param {Object} listeners - Named events dictionary and their handler functions
   * @param {Function} onOpen - EventSource connection opened handler
   * @param {Function} onError - EventSource connection error handler
   * @returns {EventSource} - Connection instance
   */
  createConnection: (url, listeners = {}, onOpen = null, onError = null) => {
    const es = new EventSource(url);

    if (onOpen) {
      es.onopen = onOpen;
    }

    if (onError) {
      es.onerror = onError;
    }

    Object.entries(listeners).forEach(([eventName, handler]) => {
      es.addEventListener(eventName, (e) => {
        try {
          const data = JSON.parse(e.data);
          handler(data);
        } catch (err) {
          handler(e.data);
        }
      });
    });

    return es;
  }
};
