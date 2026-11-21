class Note {
  final String id;
  final String ownerId;
  final String title;
  final String? description;
  final String fileKey;
  final String mimeType;
  final int fileSize;
  final DateTime createdAt;
  final String? ownerName;

  Note({
    required this.id,
    required this.ownerId,
    required this.title,
    this.description,
    required this.fileKey,
    required this.mimeType,
    required this.fileSize,
    required this.createdAt,
    this.ownerName,
  });

  factory Note.fromJson(Map<String, dynamic> json) {
    return Note(
      id: json['id'] as String,
      ownerId: json['owner_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      fileKey: json['file_key'] as String,
      mimeType: json['mime_type'] as String,
      fileSize: json['file_size'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      ownerName: json['owner_name'] as String?,
    );
  }
}
