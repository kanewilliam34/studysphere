class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String targetId;
  final String channelType; // 'group' or 'direct'
  final String content;
  final int timestamp;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.targetId,
    required this.channelType,
    required this.content,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      targetId: json['targetId'] as String,
      channelType: json['channelType'] as String,
      content: json['content'] as String,
      timestamp: json['timestamp'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'senderName': senderName,
      'targetId': targetId,
      'channelType': channelType,
      'content': content,
      'timestamp': timestamp,
    };
  }
}
