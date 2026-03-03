import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { NotificationMessage } from './WebSocketService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private soundObject: Audio.Sound | null = null;

  constructor() {
    this.initializeNotifications();
    this.initializeSound();
  }

  private async initializeNotifications(): Promise<void> {
    try {
      await Notifications.setNotificationChannelAsync('line-messages', {
        name: 'LINE風メッセージ通知',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    } catch (error) {
      console.error('通知チャンネル作成エラー:', error);
    }
  }

  private async initializeSound(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      // システムの通知音を使用
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/notification.mp3').default || 
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }
      );
      this.soundObject = sound;
    } catch (error) {
      console.log('サウンド初期化失敗:', error);
    }
  }

  async showNotification(message: NotificationMessage): Promise<void> {
    try {
      // ローカル通知を送信
      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // すぐに表示
      });

      // サウンドを再生
      await this.playNotificationSound();
    } catch (error) {
      console.error('通知表示エラー:', error);
    }
  }

  private async playNotificationSound(): Promise<void> {
    try {
      if (this.soundObject) {
        await this.soundObject.replayAsync();
      }
    } catch (error) {
      console.log('サウンド再生失敗:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('通知権限が拒否されました');
        return false;
      }

      return true;
    } catch (error) {
      console.error('権限要求エラー:', error);
      return false;
    }
  }
}

export default NotificationService;