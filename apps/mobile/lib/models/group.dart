import 'user.dart';

class GroupMember {
  final String id;
  final String groupId;
  final String userId;
  final String role;
  final DateTime joinedAt;
  final User? user;

  GroupMember({
    required this.id,
    required this.groupId,
    required this.userId,
    required this.role,
    required this.joinedAt,
    this.user,
  });

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: json['id'] as String,
      groupId: json['group_id'] as String,
      userId: json['user_id'] as String,
      role: json['role'] as String,
      joinedAt: DateTime.parse(json['joined_at'] as String),
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }
}

class StudyGroup {
  final String id;
  final String ownerId;
  final String name;
  final String? description;
  final String? subject;
  final String visibility;
  final DateTime createdAt;
  final int memberCount;
  final bool isMember;
  final String? userRole;
  final String? nexconnChannelId;
  final List<GroupMember>? members;

  StudyGroup({
    required this.id,
    required this.ownerId,
    required this.name,
    this.description,
    this.subject,
    required this.visibility,
    required this.createdAt,
    required this.memberCount,
    required this.isMember,
    this.userRole,
    this.nexconnChannelId,
    this.members,
  });

  factory StudyGroup.fromJson(Map<String, dynamic> json) {
    return StudyGroup(
      id: json['id'] as String,
      ownerId: json['owner_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      subject: json['subject'] as String?,
      visibility: json['visibility'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      memberCount: json['member_count'] as int? ?? 0,
      isMember: json['is_member'] as bool? ?? false,
      userRole: json['user_role'] as String?,
      nexconnChannelId: json['nexconn_channel_id'] as String?,
      members: json['members'] != null
          ? (json['members'] as List)
              .map((m) => GroupMember.fromJson(m as Map<String, dynamic>))
              .toList()
          : null,
    );
  }
}
