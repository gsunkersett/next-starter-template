import { NextResponse } from "next/server";

export const runtime = "edge";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

// In-memory storage fallback for local development
let inMemoryTodos: Todo[] = [];

// Helper to get KV namespace
function getKV(): KVNamespace | null {
	try {
		// In OpenNext/Cloudflare, bindings are available via process.env
		const env = process.env as any;
		if (env.TODO_KV) {
			return env.TODO_KV as KVNamespace;
		}
		return null;
	} catch (error) {
		console.error("[KV] Error accessing binding:", error);
		return null;
	}
}

// GET: Retrieve all todos
export async function GET() {
	try {
		const kv = getKV();
		
		if (kv) {
			// KV is available, use it
			const data = await kv.get("todos");
			if (data) {
				const todos = JSON.parse(data);
				return NextResponse.json(todos);
			}
			return NextResponse.json([]);
		} else {
			// Fallback to in-memory for local dev
			return NextResponse.json(inMemoryTodos);
		}
	} catch (error) {
		console.error("[API] GET error:", error);
		return NextResponse.json([]);
	}
}

// POST: Save todos
export async function POST(request: Request) {
	try {
		const todos = (await request.json()) as Todo[];
		const kv = getKV();
		
		if (kv) {
			// KV is available, use it
			await kv.put("todos", JSON.stringify(todos));
		} else {
			// Fallback to in-memory for local dev
			inMemoryTodos = todos;
		}
		
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] POST error:", error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
