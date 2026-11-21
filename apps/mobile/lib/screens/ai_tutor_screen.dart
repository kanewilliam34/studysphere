import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class AITutorScreen extends StatefulWidget {
  const AITutorScreen({super.key});

  @override
  State<AITutorScreen> createState() => _AITutorScreenState();
}

class _AITutorScreenState extends State<AITutorScreen> {
  final _questionCtrl = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _asking = false;
  String? _conversationId;

  void _ask() async {
    final q = _questionCtrl.text.trim();
    if (q.isEmpty || _asking) return;
    _questionCtrl.clear();

    setState(() {
      _messages.add({'role': 'user', 'content': q});
      _asking = true;
    });

    try {
      final res = await context.read<ApiService>().askTutor(q, conversationId: _conversationId);
      setState(() {
        _conversationId = res['conversation_id'];
        _messages.add({'role': 'assistant', 'content': res['answer']});
      });
    } catch (e) {
      setState(() {
        _messages.add({'role': 'assistant', 'content': 'Error: $e'});
      });
    } finally {
      setState(() {
        _asking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.purple.shade50,
          child: Row(
            children: const [
              Icon(Icons.smart_toy, color: Colors.purple, size: 18),
              SizedBox(width: 8),
              Text(
                'AI Tutor (Local Ollama Engine)',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.purple),
              ),
            ],
          ),
        ),
        Expanded(
          child: _messages.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Text(
                      'Ask questions on algorithms, math proofs, or system design concepts.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _messages.length,
                  itemBuilder: (ctx, i) {
                    final m = _messages[i];
                    final isUser = m['role'] == 'user';
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isUser ? Colors.indigo : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          m['content'] ?? '',
                          style: TextStyle(color: isUser ? Colors.white : Colors.black87),
                        ),
                      ),
                    );
                  },
                ),
        ),
        if (_asking)
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: LinearProgressIndicator(color: Colors.purple),
          ),
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
                  controller: _questionCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Ask AI Tutor a question...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.send, color: Colors.purple),
                onPressed: _ask,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
