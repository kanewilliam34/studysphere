import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/chat_message.dart';

enum NexconnStatus { disconnected, connecting, connected, error }

class NexconnService extends ChangeNotifier {
  NexconnStatus _status = NexconnStatus.disconnected;
  String? _currentUserId;
  String? _currentUserName;
  final Map<String, List<ChatMessage>> _messages = {};
  final List<void Function(ChatMessage)> _listeners = [];

  NexconnStatus get status => _status;
  bool get isConnected => _status == NexconnStatus.connected;

  Future<void> initialize(String appKey) async {
    debugPrint('[Nexconn Flutter] Initializing with AppKey: $appKey');
    // Native plugin NCEngine.initialize(InitParams(appKey: appKey));
  }

  Future<bool> connect({
    required String token,
    required String userId,
    required String userName,
  }) async {
    _currentUserId = userId;
    _currentUserName = userName;
    _status = NexconnStatus.connecting;
    notifyListeners();

    debugPrint('[Nexconn Flutter] Connecting user $userId with token: $token');
    
    // Simulate slight network handshaking
    await Future.delayed(const Duration(milliseconds: 300));
    _status = NexconnStatus.connected;
    notifyListeners();
    return true;
  }

  Future<ChatMessage> sendGroupMessage(String channelId, String text) async {
    final msg = ChatMessage(
      id: 'm_${DateTime.now().millisecondsSinceEpoch}',
      senderId: _currentUserId ?? 'unknown',
      senderName: _currentUserName ?? 'Student',
      targetId: channelId,
      channelType: 'group',
      content: text,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _addMessage(msg);
    return msg;
  }

  Future<ChatMessage> sendDirectMessage(String recipientId, String text) async {
    final msg = ChatMessage(
      id: 'm_${DateTime.now().millisecondsSinceEpoch}',
      senderId: _currentUserId ?? 'unknown',
      senderName: _currentUserName ?? 'Student',
      targetId: recipientId,
      channelType: 'direct',
      content: text,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _addMessage(msg);
    return msg;
  }

  List<ChatMessage> getMessages(String targetId) {
    return _messages[targetId] ?? [];
  }

  void addMessageListener(void Function(ChatMessage) listener) {
    _listeners.add(listener);
  }

  void removeMessageListener(void Function(ChatMessage) listener) {
    _listeners.remove(listener);
  }

  void _addMessage(ChatMessage msg) {
    final list = _messages.putIfAbsent(msg.targetId, () => []);
    list.add(msg);
    notifyListeners();
    for (final l in _listeners) {
      l(msg);
    }
  }

  Future<void> disconnect() async {
    _status = NexconnStatus.disconnected;
    _currentUserId = null;
    notifyListeners();
  }
}
