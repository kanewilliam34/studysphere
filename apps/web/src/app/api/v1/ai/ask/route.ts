import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

function parseAuth(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    if (token.startsWith("ss_live_")) {
      const b64 = token.split(".")[0].replace("ss_live_", "");
      return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
    }
  } catch {}
  return null;
}

export async function POST(req: Request) {
  const auth = parseAuth(req);
  const currentUserId = auth?.sub || "d1d7e7a7-67f6-4d80-bde1-52991cf90244";

  try {
    const { question, conversation_id } = await req.json();
    if (!question) {
      return NextResponse.json({ detail: "Question is required" }, { status: 400 });
    }

    let convId = conversation_id;
    if (!convId) {
      convId = crypto.randomUUID();
      const title = question.slice(0, 40) + "...";
      await sql`
        INSERT INTO ai_conversations (id, user_id, title, created_at)
        VALUES (${convId}, ${currentUserId}, ${title}, NOW())
      `;
    }

    // Save user question to PostgreSQL
    await sql`
      INSERT INTO ai_messages (id, conversation_id, role, content, created_at)
      VALUES (${crypto.randomUUID()}, ${convId}, 'user', ${question}, NOW())
    `;

    // Socratic AI Tutor logic
    const q = question.toLowerCase();
    let answer = `You asked: "${question}". Let's examine this from first principles:\n\n1. What are the known variables and boundary constraints?\n2. What invariant property or conservation law governs this system?\n\nFormulate your hypothesis on the first step, and tell me where you'd like to begin!`;

    if (q.includes("quantum") || q.includes("qubit") || q.includes("superposition")) {
      answer = `In quantum mechanics, a qubit exists in a linear superposition of computational basis states |0⟩ and |1⟩: |ψ⟩ = α|0⟩ + β|1⟩, where |α|² + |β|² = 1.\n\nWhen we apply a Hadamard gate, what happens to the probability amplitudes of measuring state 0 versus state 1?`;
    } else if (q.includes("binary") || q.includes("bst") || q.includes("tree")) {
      answer = `A Binary Search Tree relies on the invariant that for every node X, all values in its left subtree are < X and all values in its right subtree are > X.\n\nIn the worst case where values are inserted in sorted order, the tree degenerates into a linked list of height n, yielding O(n) search time. How do self-balancing trees like AVL or Red-Black trees prevent this?`;
    } else if (q.includes("algorithm") || q.includes("complexity") || q.includes("big o")) {
      answer = `Asymptotic time complexity measures how the execution time scales as input size n grows toward infinity.\n\nConsider whether each step discards half the search space (logarithmic O(log n)), inspects every element once (linear O(n)), or compares every pair (quadratic O(n²)). Which category fits your algorithm?`;
    }

    // Save AI tutor response to PostgreSQL
    await sql`
      INSERT INTO ai_messages (id, conversation_id, role, content, created_at)
      VALUES (${crypto.randomUUID()}, ${convId}, 'assistant', ${answer}, NOW())
    `;

    return NextResponse.json({
      conversation_id: convId,
      question,
      answer,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
