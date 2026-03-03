import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import WebSocketService, { NotificationMessage } from './services/WebSocketService';
import NotificationService from './services/NotificationService';
import BackgroundTaskService from './services/BackgroundTaskService';

export default function App() {
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  //const [webSocketService] = useState(new WebSocketService('ws://localhost:8080/ws'));
  const [webSocketService] = useState(new WebSocketService('ws://192.168.39.51:8080/ws'));
  const [notificationService] = useState(new NotificationService());
  const [backgroundTaskService] = useState(new BackgroundTaskService(webSocketService));

  useEffect(() => {
    initializeServices();
    return () => {
      webSocketService.disconnect();
      backgroundTaskService.cleanup();
    };
  }, []);

  const initializeServices = async () => {
    // 通知権限を要求
    const hasPermissions = await notificationService.requestPermissions();
    if (!hasPermissions) {
      Alert.alert('権限エラー', '通知権限が必要です');
    }

    // WebSocket接続とメッセージハンドラーを設定
    webSocketService.setMessageHandler((message) => {
      console.log('新しいメッセージ受信:', message);
      setMessages(prev => [message, ...prev]);
      notificationService.showNotification(message);
    });

    webSocketService.connect();

    // バックグラウンドフェッチを登録
    await backgroundTaskService.registerBackgroundFetch();

    // 接続状態を監視
    const checkConnection = () => {
      setIsConnected(webSocketService.isConnected());
    };
    const intervalId = setInterval(checkConnection, 1000);

    return () => clearInterval(intervalId);
  };

  const connectWebSocket = () => {
    webSocketService.connect();
  };

  const disconnectWebSocket = () => {
    webSocketService.disconnect();
    setIsConnected(false);
  };

  const renderMessage = ({ item }: { item: NotificationMessage }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.messageTitle}>{item.title}</Text>
      <Text style={styles.messageBody}>{item.body}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通知アプリ</Text>
        <View style={[styles.statusIndicator, isConnected ? styles.connected : styles.disconnected]} />
        <Text style={styles.statusText}>
          {isConnected ? '接続中' : '切断中'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.connectButton]} 
          onPress={connectWebSocket}
          disabled={isConnected}
        >
          <Text style={styles.buttonText}>接続</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.disconnectButton]} 
          onPress={disconnectWebSocket}
          disabled={!isConnected}
        >
          <Text style={styles.buttonText}>切断</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.messagesContainer}>
        <Text style={styles.messagesHeader}>受信メッセージ ({messages.length})</Text>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 5,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#f44336',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  messageBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});
