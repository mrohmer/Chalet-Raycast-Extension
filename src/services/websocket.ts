import EventEmitter from "events";
import EventSource from "eventsource";

type EventName = "open" | "error" | "message";
export class Websocket extends EventEmitter {
  private socket?: EventSource;

  private handlers: Record<EventName, ((evt: MessageEvent) => void)[]> = {
    open: [],
    error: [],
    message: [],
  };

  constructor(private url: string) {
    super();
  }

  private callListeners(eventName: EventName, evt: MessageEvent): void {
    this.handlers[eventName].forEach((listener) => {
      try {
        listener(evt);
      } catch (e) {
        console.error(e);
      }
    });
  }
  on(eventName: EventName, listener: (evt: MessageEvent) => void): this {
    if (eventName in this.handlers) {
      this.handlers[eventName].push(listener);
    }
    return this;
  }
  off(eventName: EventName, listener: (evt: MessageEvent) => void): this {
    if (eventName in this.handlers) {
      this.handlers[eventName] = this.handlers[eventName].filter(
        (l) => l === listener
      );
    }
    return this;
  }

  connect(): this {
    this.disconnect();

    this.socket = new EventSource(this.url);
    this.socket.onerror = (evt) => this.callListeners("error", evt);
    this.socket.onmessage = (evt) => this.callListeners("message", evt);
    this.socket.onopen = (evt) => this.callListeners("open", evt);
    return this;
  }
  disconnect(): this {
    this.socket?.close();
    this.socket = undefined;
    return this;
  }
}
