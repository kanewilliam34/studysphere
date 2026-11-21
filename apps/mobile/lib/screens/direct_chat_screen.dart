import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user.dart';
import '../models/chat_message.dart';
import '../services/api_service.dart';
import '../services/nexconn_service.dart';

class DirectChatScreen extends StatefulWidget {
  const DirectChatScreen({super.key});

  @override
  State<DirectChatScreen> createState() => _DirectChatScreenState();
}

class _DirectChatScreenState extends State<DirectChatScreen> {
  List<User> _users = [];
  User? _selectedUser;
  bool _loading = true;
  final _msgCtrl = TextEditingController();
  final List<ChatMessage> _messages = [];

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    setState(() => _loading = true);
    try {
      final list = await context.read<ApiService>().getUsers();
      setState(() {
        _users = list;
        if (list.isNotEmpty) {
          _selectUser(list.first);
        }
      });
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _selectUser(User u) {
    setState(() {
      _selectedUser = u;
      _messages.clear();
      _messages.addAll(context.read<NexconnService>().getMessages(u.id));
    });
  }

  void _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _selectedUser == null) return;
    _msgCtrl.clear();

    final nexconn = context.read<NexconnService>();
    final msg = await nexconn.sendDirectMessage(_selectedUser!.id, text);
    setState(() {
      _messages.add(msg);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_users.isEmpty) {
      return const Center(child: Text('No other registered peers found.'));
    }

    return Column(
      children: [
        // Horizontal peer selector
        Container(
          height: 60,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
          ),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _users.length,
            itemBuilder: (ctx, i) {
              final u = _users[i];
              final isSelected = _selectedUser?.id == u.id;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(u.name),
                  selected: isSelected,
                  onSelected: (_) => _selectUser(u),
                ),
              );
            },
          ),
        ),

        // Message stream
        Expanded(
          child: _messages.isEmpty
              ? Center(child: Text('Start a 1:1 chat with ${_selectedUser?.name ?? ""}'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _messages.length,
                  itemBuilder: (ctx, i) {
                    final m = _messages[i];
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.indigo.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(m.content),
                      ),
                    );
                  },
                ),
        ),

        // Input
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Colors.grey.shade200)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _msgCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Type 1:1 direct message...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.send, color: Colors.indigo),
                onPressed: _sendMessage,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
