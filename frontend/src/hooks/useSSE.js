import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Robust hook to manage Server-Sent Events (SSE) subscriptions with automatic
 * reconnection, custom event listeners, exponential backoff, and connection status tracking.
 * 
 * @param {string} url - SSE endpoint URL
 * @param {object} options - custom options
 * @param {boolean} options.enabled - whether to connect immediately (default: true)
 * @param {number} options.maxRetries - maximum reconnection attempts (default: 5)
 * @param {number} options.backoffBase - starting backoff milliseconds (default: 1000)
 * @param {object} options.eventListeners - dict of custom events to handler functions
 * @param {function} options.onMessage - standard message callback
 * @param {function} options.onConnect - connection opened callback
 * @param {function} options.onError - connection error callback
 */
export const useSSE = (url, options = {}) => {
  const [status, setStatus] = useState('DISCONNECTED'); // CONNECTING, CONNECTED, DISCONNECTED, ERROR
  const [error, setError] = useState(null);
  
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 5;
  const backoffBase = options.backoffBase !== undefined ? options.backoffBase : 1000;
  
  // Wrap callbacks in refs to avoid re-triggering connection on parent render
  const eventListenersRef = useRef(options.eventListeners);
  const onMessageRef = useRef(options.onMessage);
  const onConnectRef = useRef(options.onConnect);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    eventListenersRef.current = options.eventListeners;
    onMessageRef.current = options.onMessage;
    onConnectRef.current = options.onConnect;
    onErrorRef.current = options.onError;
  }, [options.eventListeners, options.onMessage, options.onConnect, options.onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log(`SSE connection closed: ${url}`);
    }
    setStatus('DISCONNECTED');
  }, [url]);

  const connect = useCallback(() => {
    if (!url) return;

    // Clean up previous connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('CONNECTING');
    console.log(`SSE connecting to: ${url}`);
    
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('CONNECTED');
      setError(null);
      retryCountRef.current = 0;
      if (onConnectRef.current) onConnectRef.current();
    };

    es.onerror = (err) => {
      console.error(`SSE connection error: ${url}`, err);
      es.close();
      setStatus('ERROR');
      setError(err);
      
      if (onErrorRef.current) onErrorRef.current(err);

      // Trigger reconnect with exponential backoff
      if (retryCountRef.current < maxRetries) {
        const delay = backoffBase * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;
        console.log(`Reconnecting SSE in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        setStatus('DISCONNECTED');
        console.error('SSE maximum reconnection attempts reached');
      }
    };

    // Generic messages listener
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (onMessageRef.current) onMessageRef.current(parsed);
      } catch (e) {
        if (onMessageRef.current) onMessageRef.current(event.data);
      }
    };

    // Custom named events listeners (e.g., 'generating_summary', 'completed')
    if (eventListenersRef.current) {
      Object.keys(eventListenersRef.current).forEach((eventName) => {
        es.addEventListener(eventName, (event) => {
          const currentHandler = eventListenersRef.current?.[eventName];
          if (currentHandler) {
            try {
              const parsed = JSON.parse(event.data);
              currentHandler(parsed);
            } catch (e) {
              currentHandler(event.data);
            }
          }
        });
      });
    }
  }, [url, maxRetries, backoffBase]);

  useEffect(() => {
    if (options.enabled !== false && url) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect, options.enabled]);

  return {
    status,
    error,
    reconnect: connect,
    disconnect
  };
};
