import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/note.dart';
import '../services/api_service.dart';

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});

  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  List<Note> _notes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotes();
  }

  Future<void> _fetchNotes() async {
    setState(() => _loading = true);
    try {
      final list = await context.read<ApiService>().getNotes();
      setState(() => _notes = list);
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _fetchNotes,
      child: _notes.isEmpty
          ? const Center(
              child: Text('No notes available. Upload from the web client to view here!'),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _notes.length,
              itemBuilder: (ctx, i) {
                final n = _notes[i];
                return Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.redAccent,
                      child: Text('PDF', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                    title: Text(n.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${(n.fileSize / 1024).toStringAsFixed(1)} KB • By ${n.ownerName ?? "Peer"}'),
                    trailing: const Icon(Icons.download),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Downloading authorized document: ${n.title}')),
                      );
                    },
                  ),
                );
              },
            ),
    );
  }
}
