import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/nexconn_service.dart';
import 'groups_screen.dart';
import 'direct_chat_screen.dart';
import 'ai_tutor_screen.dart';
import 'notes_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    GroupsScreen(),
    DirectChatScreen(),
    AITutorScreen(),
    NotesScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final nexconn = context.watch<NexconnService>();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.school, color: Colors.indigo),
            const SizedBox(width: 8),
            const Text('StudySphere', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Chip(
              avatar: Icon(
                Icons.circle,
                size: 10,
                color: nexconn.isConnected ? Colors.green : Colors.amber,
              ),
              label: Text(
                nexconn.status.name.toUpperCase(),
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
              ),
              visualDensity: VisualDensity.compact,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () async {
              await context.read<ApiService>().logout();
              await context.read<NexconnService>().disconnect();
              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: _pages[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) {
          setState(() {
            _currentIndex = idx;
          });
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.group_outlined), selectedIcon: Icon(Icons.group), label: 'Groups'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: 'Chat'),
          NavigationDestination(icon: Icon(Icons.smart_toy_outlined), selectedIcon: Icon(Icons.smart_toy), label: 'AI Tutor'),
          NavigationDestination(icon: Icon(Icons.description_outlined), selectedIcon: Icon(Icons.description), label: 'Notes'),
        ],
      ),
    );
  }
}
