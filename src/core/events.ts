import { EventEmitter } from "events";
import { ActivityEvent } from "./types.js";

class ActivityBus extends EventEmitter {
  private buffer: ActivityEvent[] = [];
  private readonly maxBufferSize = 100;

  public emitActivity(event: Omit<ActivityEvent, "id" | "timestamp">): ActivityEvent {
    const fullEvent: ActivityEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };

    this.buffer.unshift(fullEvent);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.pop();
    }

    this.emit("activity", fullEvent);
    return fullEvent;
  }

  public getRecentEvents(): ActivityEvent[] {
    return [...this.buffer];
  }

  public clear(): void {
    this.buffer = [];
  }
}

export const activityBus = new ActivityBus();
