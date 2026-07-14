import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Pipeline phase → progress percentage. Backstops whatever the server sends
 * in `data.progress` so the UI never sits at 0% if an event arrives without
 * a progress field. Source of truth is still the server payload — this map
 * only fills in if `progress` is missing.
 */
export const SSE_PROGRESS_MAP = {
  processing_started: 5,
  audio_extraction_started: 10,
  audio_extracted: 25,
  transcribing: 50,
  transcription_completed: 55,
  generating_title: 60,
  generating_summary: 70,
  extracting_action_items: 80,
  extracting_decisions: 85,
  extracting_questions: 90,
  building_rag: 95,
  completed: 100,
};

/**
 * Robust hook to manage Server-Sent Events (SSE) subscriptions with automatic
 * reconnection, custom event listeners, exponential backoff, and connection
 * status tracking.
 *
 * Options:
 *   enabled        — connect immediately (default: true)
 *   maxRetries     — max reconnect attempts (default: 5)
 *   backoffBase    — starting backoff ms (default: 1000)
 *   eventListeners — { eventName: handler(payload) }
 *   onMessage      — fallback handler for unnamed messages
 *   onConnect      — connection opened callback
 *   onError        — connection error callback
 *   onComplete     — fires once when a `completed` event arrives; auto-disconnects
 */
export const useSSE = (url, options = {}) => {
  const [status, setStatus] = useState('DISCONNECTED'); // CONNECTING | CONNECTED | DISCONNECTED | ERROR
  const [error, setError] = useState(null);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const completedRef = useRef(false);

  const maxRetries = options.maxRetries ?? 5;
  const backoffBase = options.backoffBase ?? 1000;

  // Stash callbacks in refs so re-renders don't re-open the connection.
  const eventListenersRef = useRef(options.eventListeners);
  const onMessageRef = useRef(options.onMessage);
  const onConnectRef = useRef(options.onConnect);
  const onErrorRef = useRef(options.onError);
  const onCompleteRef = useRef(options.onComplete);

  useEffect(() => {
    eventListenersRef.current = options.eventListeners;
    onMessageRef.current = options.onMessage;
    onConnectRef.current = options.onConnect;
    onErrorRef.current = options.onError;
    onCompleteRef.current = options.onComplete;
  }, [options.eventListeners, options.onMessage, options.onConnect, options.onError, options.onComplete]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('DISCONNECTED');
  }, []);

  const connect = useCallback(() => {
    if (!url) return;
    if (eventSourceRef.current) eventSourceRef.current.close();

    completedRef.current = false;
    setStatus('CONNECTING');

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('CONNECTED');
      setError(null);
      retryCountRef.current = 0;
      onConnectRef.current?.();
    };

    es.onerror = (err) => {
      setStatus('ERROR');
      setError(err);
      onErrorRef.current?.(err);

      // If we've already received a completed event, an error is just the
      // server closing the stream — don't reconnect, don't retry.
      if (completedRef.current) {
        es.close();
        eventSourceRef.current = null;
        setStatus('DISCONNECTED');
        return;
      }

      es.close();
      if (retryCountRef.current < maxRetries) {
        const delay = backoffBase * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      } else {
        eventSourceRef.current = null;
        setStatus('DISCONNECTED');
      }
    };

    const dispatch = (eventName, raw) => {
      let payload = raw;
      try { payload = JSON.parse(raw); } catch { /* keep as string */ }
      if (eventName === 'completed') {
        completedRef.current = true;
        onCompleteRef.current?.(payload);
        // Honor the brief: gracefully terminate on completed.
        es.close();
        eventSourceRef.current = null;
        setStatus('DISCONNECTED');
      }
      eventListenersRef.current?.[eventName]?.(payload);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        // Server may emit a typed event via payload.event — fall through if so.
        if (parsed && typeof parsed === 'object' && parsed.event && eventListenersRef.current?.[parsed.event]) {
          dispatch(parsed.event, JSON.stringify(parsed.data ?? parsed));
        } else {
          onMessageRef.current?.(parsed);
        }
      } catch {
        onMessageRef.current?.(event.data);
      }
    };

    if (eventListenersRef.current) {
      Object.keys(eventListenersRef.current).forEach((eventName) => {
        es.addEventListener(eventName, (event) => dispatch(eventName, event.data));
      });
    }
  }, [url, maxRetries, backoffBase]);

  useEffect(() => {
    if (options.enabled !== false && url) connect();
    return () => disconnect();
  }, [url, connect, disconnect, options.enabled]);

  return { status, error, reconnect: connect, disconnect };
};
