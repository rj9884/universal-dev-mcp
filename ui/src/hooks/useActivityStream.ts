import { useState, useEffect } from "react";
import { ActivityEventItem, fetchActivity } from "../api/client.js";

export function useActivityStream() {
  const [events, setEvents] = useState<ActivityEventItem[]>([]);
  const [status, setStatus] = useState<"connected" | "connecting" | "offline">("connecting");

  useEffect(() => {
    // Initial fetch of recent events
    fetchActivity().then((initial) => setEvents(initial)).catch(() => {});

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      setStatus("connecting");
      eventSource = new EventSource("/sse");

      eventSource.onopen = () => {
        setStatus("connected");
      };

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "heartbeat" || data.type === "connected") return;

          setEvents((prev) => [data, ...prev.slice(0, 99)]);
        } catch {
          /* ignore parse error */
        }
      };

      eventSource.onerror = () => {
        setStatus("offline");
        eventSource?.close();
        // Exponential or 3s retry
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const clear = () => setEvents([]);

  return { events, status, clear };
}
