export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: ((message: NotificationMessage) => void) | null = null;
  private reconnectInterval: number = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket接続が確立されました');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          if (this.onMessage) {
            this.onMessage(message);
          }
        } catch (error) {
          console.error('メッセージ解析エラー:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket接続が切断されました');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
      };
    } catch (error) {
      console.error('WebSocket接続エラー:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      console.log('WebSocket再接続を試行します...');
      this.connect();
    }, this.reconnectInterval);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  setMessageHandler(handler: (message: NotificationMessage) => void): void {
    this.onMessage = handler;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default WebSocketService;