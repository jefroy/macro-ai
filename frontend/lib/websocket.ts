type WSMessage = {
  type: string;
  content?: string;
  session_id?: string;
  title?: string;
  error?: string;
  code?: string;
};

type WSHandler = {
  onToken: (content: string, sessionId: string) => void;
  onDone: (sessionId: string) => void;
  onError: (error: string, code?: string) => void;
  onSessionCreated: (sessionId: string, title: string) => void;
  onStatusChange: (status: "connecting" | "connected" | "disconnected") => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace(/^http/, "ws");

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private handlers: WSHandler;
  private token: string = "";

  constructor(handlers: WSHandler) {
    this.handlers = handlers;
  }

  connect(token: string) {
    this.token = token;
    this.handlers.onStatusChange("connecting");

    this.ws = new WebSocket(`${WS_URL}/api/v1/chat/ws?token=${token}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.handlers.onStatusChange("connected");
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);

      switch (msg.type) {
        case "chat.token":
          this.handlers.onToken(msg.content!, msg.session_id!);
          break;
        case "chat.done":
          this.handlers.onDone(msg.session_id!);
          break;
        case "chat.error":
          this.handlers.onError(msg.error!, msg.code);
          break;
        case "chat.session_created":
          this.handlers.onSessionCreated(msg.session_id!, msg.title!);
          break;
        case "pong":
          break;
      }
    };

    this.ws.onclose = () => {
      this.stopPingInterval();
      this.handlers.onStatusChange("disconnected");
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  send(content: string, sessionId?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "chat.message",
          content,
          session_id: sessionId,
        })
      );
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
      this.reconnectAttempts++;
      setTimeout(() => this.connect(this.token), delay);
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect() {
    this.stopPingInterval();
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
    this.ws?.close();
    this.ws = null;
  }
}
