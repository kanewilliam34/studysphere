import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/group.dart';
import '../services/api_service.dart';
import 'group_detail_screen.dart';

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});

  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> {
  List<StudyGroup> _groups = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchGroups();
  }

  Future<void> _fetchGroups() async {
    setState(() => _loading = true);
    try {
      final list = await context.read<ApiService>().getGroups();
      setState(() => _groups = list);
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showCreateDialog() {
    final nameCtrl = TextEditingController();
    final subjectCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String visibility = 'public';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Study Group'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Group Name *'),
                ),
                TextField(
                  controller: subjectCtrl,
                  decoration: const InputDecoration(labelText: 'Subject'),
                ),
                TextField(
                  controller: descCtrl,
                  decoration: const InputDecoration(labelText: 'Description'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('Visibility: '),
                    DropdownButton<String>(
                      value: visibility,
                      items: const [
                        DropdownMenuItem(value: 'public', child: Text('Public')),
                        DropdownMenuItem(value: 'private', child: Text('Private')),
                      ],
                      onChanged: (v) {
                        if (v != null) setDialogState(() => visibility = v);
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty) return;
                try {
                  final group = await context.read<ApiService>().createGroup(
                        nameCtrl.text.trim(),
                        subjectCtrl.text.trim(),
                        descCtrl.text.trim(),
                        visibility,
                      );
                  Navigator.pop(ctx);
                  _fetchGroups();
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => GroupDetailScreen(groupId: group.id)),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        backgroundColor: Colors.indigo,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchGroups,
        child: _groups.isEmpty
            ? const Center(child: Text('No study groups found. Create one!'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _groups.length,
                itemBuilder: (ctx, i) {
                  final g = _groups[i];
                  return Card(
                    elevation: 1.5,
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: CircleAvatar(
                        backgroundColor: Colors.indigo.shade50,
                        child: const Icon(Icons.group, color: Colors.indigo),
                      ),
                      title: Text(g.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (g.description != null && g.description!.isNotEmpty)
                            Text(g.description!, maxLines: 1, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text('${g.memberCount} members', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(
                                  color: g.visibility == 'public' ? Colors.blue.shade50 : Colors.amber.shade50,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  g.visibility.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: g.visibility == 'public' ? Colors.blue.shade800 : Colors.amber.shade800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      trailing: g.isMember
                          ? const Icon(Icons.chat, color: Colors.indigo)
                          : ElevatedButton(
                              style: ElevatedButton.styleFrom(visualDensity: VisualDensity.compact),
                              onPressed: () async {
                                await context.read<ApiService>().joinGroup(g.id);
                                _fetchGroups();
                              },
                              child: const Text('Join'),
                            ),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => GroupDetailScreen(groupId: g.id)),
                        );
                      },
                    ),
                  );
                },
              ),
      ),
    );
  }
}
