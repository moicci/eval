import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import WebSocketService from './WebSocketService';

const BACKGROUND_FETCH_TASK = 'background-websocket-check';

class BackgroundTaskService {
  private webSocketService: WebSocketService;
  private appStateSubscription: any;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(webSocketService: WebSocketService) {
    this.webSocketService = webSocketService;
    this.setupBackgroundTask();
    this.setupAppStateHandler();
  }

  private setupBackgroundTask(): void {
    // バックグラウンドタスクを定義
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        // WebSocket接続状態をチェックし、切断されていれば再接続
        if (!this.webSocketService.isConnected()) {
          console.log('Background: WebSocket切断を検出、再接続を試行');
          this.webSocketService.connect();
        }
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background fetch error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  private setupAppStateHandler(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('AppState changed to:', nextAppState);
      
      if (nextAppState === 'background') {
        this.handleAppBackground();
      } else if (nextAppState === 'active') {
        this.handleAppForeground();
      }
    });
  }

  private handleAppBackground(): void {
    console.log('アプリがバックグラウンドに移行');
    
    // iOS: 定期的にWebSocket接続をチェック
    if (Platform.OS === 'ios') {
      this.startPeriodicReconnect();
    }
  }

  private handleAppForeground(): void {
    console.log('アプリがフォアグラウンドに復帰');
    
    // タイマーをクリア
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // フォアグラウンド復帰時にWebSocket接続を確認
    setTimeout(() => {
      if (!this.webSocketService.isConnected()) {
        console.log('フォアグラウンド復帰時にWebSocket再接続');
        this.webSocketService.connect();
      }
    }, 1000);
  }

  private startPeriodicReconnect(): void {
    // 30秒ごとにWebSocket状態をチェック（バックグラウンド時）
    this.reconnectTimer = setInterval(() => {
      if (!this.webSocketService.isConnected()) {
        console.log('Periodic check: WebSocket再接続を試行');
        this.webSocketService.connect();
      }
    }, 30000);
  }

  async registerBackgroundFetch(): Promise<void> {
    try {
      // BackgroundFetch.getStatusAsync で利用可能性をチェック
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
        console.log('⚠️ バックグラウンドフェッチが拒否されています');
        return;
      }

      if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
        console.log('⚠️ バックグラウンドフェッチが制限されています（Expo Go等）');
        return;
      }

      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      
      if (!isRegistered) {
        console.log('バックグラウンドフェッチを登録中...');
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15000, // 15秒（最小値）
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('✅ バックグラウンドフェッチ登録完了');
      } else {
        console.log('✅ バックグラウンドフェッチは既に登録済み');
      }
    } catch (error) {
      console.error('❌ バックグラウンドフェッチ登録失敗:', error);
      console.log('💡 Development Buildでのみ利用可能です');
    }
  }

  async unregisterBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('バックグラウンドフェッチ登録解除');
    } catch (error) {
      console.error('バックグラウンドフェッチ登録解除失敗:', error);
    }
  }

  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export default BackgroundTaskService;