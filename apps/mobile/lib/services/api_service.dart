import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/group.dart';
import '../models/note.dart';

class ApiService {
  // Configurable base URL: 10.0.2.2 for Android emulator, localhost for iOS simulator/desktop
  static String baseUrl = 'http://10.0.2.2:8000/api/v1';
  String? _accessToken;

  void setToken(String? token) {
    _accessToken = token;
  }

  Map<String, String> _headers() {
    final map = {'Content-Type': 'application/json'};
    if (_accessToken != null) {
      map['Authorization'] = 'Bearer $_accessToken';
    }
    return map;
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _headers(),
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      _accessToken = data['access_token'];
      return data;
    }
    final err = jsonDecode(response.body);
    throw Exception(err['detail'] ?? 'Registration failed');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _accessToken = data['access_token'];
      return data;
    }
    final err = jsonDecode(response.body);
    throw Exception(err['detail'] ?? 'Login failed');
  }

  Future<void> logout() async {
    try {
      await http.post(Uri.parse('$baseUrl/auth/logout'), headers: _headers());
    } finally {
      _accessToken = null;
    }
  }

  Future<User> getMe() async {
    final response = await http.get(Uri.parse('$baseUrl/users/me'), headers: _headers());
    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to load profile');
  }

  Future<List<User>> getUsers() async {
    final response = await http.get(Uri.parse('$baseUrl/users/'), headers: _headers());
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((u) => User.fromJson(u)).toList();
    }
    throw Exception('Failed to list users');
  }

  Future<List<StudyGroup>> getGroups() async {
    final response = await http.get(Uri.parse('$baseUrl/groups/'), headers: _headers());
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((g) => StudyGroup.fromJson(g)).toList();
    }
    throw Exception('Failed to load study groups');
  }

  Future<StudyGroup> getGroup(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/groups/$id'), headers: _headers());
    if (response.statusCode == 200) {
      return StudyGroup.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to load group details');
  }

  Future<StudyGroup> createGroup(String name, String subject, String description, String visibility) async {
    final response = await http.post(
      Uri.parse('$baseUrl/groups/'),
      headers: _headers(),
      body: jsonEncode({
        'name': name,
        'subject': subject,
        'description': description,
        'visibility': visibility,
      }),
    );
    if (response.statusCode == 201) {
      return StudyGroup.fromJson(jsonDecode(response.body));
    }
    final err = jsonDecode(response.body);
    throw Exception(err['detail'] ?? 'Failed to create group');
  }

  Future<StudyGroup> joinGroup(String id) async {
    final response = await http.post(Uri.parse('$baseUrl/groups/$id/join'), headers: _headers());
    if (response.statusCode == 200) {
      return StudyGroup.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to join group');
  }

  Future<void> leaveGroup(String id) async {
    final response = await http.post(Uri.parse('$baseUrl/groups/$id/leave'), headers: _headers());
    if (response.statusCode != 200) {
      final err = jsonDecode(response.body);
      throw Exception(err['detail'] ?? 'Failed to leave group');
    }
  }

  Future<Map<String, dynamic>> getNexconnToken() async {
    final response = await http.post(Uri.parse('$baseUrl/nexconn/token'), headers: _headers());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to obtain Nexconn token');
  }

  Future<List<Note>> getNotes() async {
    final response = await http.get(Uri.parse('$baseUrl/notes/'), headers: _headers());
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((n) => Note.fromJson(n)).toList();
    }
    throw Exception('Failed to load notes');
  }

  Future<Map<String, dynamic>> askTutor(String question, {String? conversationId}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/ask'),
      headers: _headers(),
      body: jsonEncode({'question': question, 'conversation_id': conversationId}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    final err = jsonDecode(response.body);
    throw Exception(err['detail'] ?? 'Failed to query AI Tutor');
  }
}
