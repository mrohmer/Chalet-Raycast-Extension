import EventEmitter from "events";
import EventSource from "eventsource";

type EventName = "open" | "error" | "message";
export class Websocket extends EventEmitter {
  private socket?: EventSource;

  constructor(private url: string) {
    super();
  }
  on(eventName: EventName, listener: (evt: MessageEvent) => void): this {
    if (!this.socket) {
      return this;
    }
    switch (eventName) {
      case "open":
        this.socket.onopen = listener;
        break;
      case "error":
        this.socket.onerror = listener;
        break;
      case "message":
        this.socket.onmessage = listener;
        break;
    }
    return this;
  }
  off(eventName: EventName, listener: (evt: MessageEvent) => void): this {
    if (!this.socket) {
      return this;
    }
    switch (eventName) {
      case "open":
        this.socket.onopen = () => undefined;
        break;
      case "error":
        this.socket.onerror = () => undefined;
        break;
      case "message":
        this.socket.onmessage = () => undefined;
        break;
    }
    return this;
  }

  connect(): this {
    this.disconnect();

    this.socket = new EventSource(this.url);
    return this;
  }
  disconnect(): this {
    this.socket?.close();
    this.socket = undefined;
    return this;
  }
}
