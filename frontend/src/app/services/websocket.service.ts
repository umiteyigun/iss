import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private trafficData = new Subject<any>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  constructor() {}

  // Connection status observable
  get connectionStatus$(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  // Traffic data observable
  get trafficData$(): Observable<any> {
    return this.trafficData.asObservable();
  }

  // Connect to WebSocket server
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect directly to backend WebSocket server
    const wsUrl = `${protocol}//localhost:3000/ws/traffic`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected successfully');
      this.connectionStatus.next(true);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('✅ WebSocket connection confirmed');
            break;
          case 'traffic_data':
            console.log('📊 Received traffic data:', data.timestamp);
            this.trafficData.next(data.data);
            break;
          case 'error':
            console.error('❌ WebSocket error:', data.message);
            break;
          case 'pong':
            // Keep-alive response
            break;
          default:
            console.log('📨 Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      this.connectionStatus.next(false);
      this.ws = null;
      
      // Attempt to reconnect if not intentionally closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.connectionStatus.next(false);
    };
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket');
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
      this.connectionStatus.next(false);
    }
  }

  // Start monitoring specific interface
  startMonitoring(deviceId: number, interfaceName: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    console.log(`📊 Starting monitoring: ${deviceId}:${interfaceName}`);
    
    this.send({
      type: 'start_monitoring',
      deviceId: deviceId,
      interfaceName: interfaceName
    });
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    console.log('⏹️ Stopping monitoring');
    
    this.send({
      type: 'stop_monitoring'
    });
  }

  // Send ping to keep connection alive
  ping(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.send({
      type: 'ping'
    });
  }

  // Send message to WebSocket
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  // Attempt to reconnect
  private reconnect(): void {
    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
