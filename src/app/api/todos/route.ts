import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

declare global {
	// eslint-disable-next-line no-var
	var TODO_KV: KVNamespace | undefined;
}

// Helper to get KV from Cloudflare bindings
function getKV(): KVNamespace | null {
	try {
		// Access KV binding through process.env
		const kv = (process.env as any).TODO_KV as KVNamespace | undefined;
		return kv || null;
	} catch (error) {
		console.error("Error getting KV:", error);
		return null;
	}
}

// Read todos from KV
async function readTodos(kv: KVNamespace): Promise<Todo[]> {
	try {
		const data = await kv.get("todos", "json");
		return (data as Todo[]) || [];
	} catch (error) {
		console.error("Error reading todos from KV:", error);
		return [];
	}
}

// Write todos to KV
async function writeTodos(kv: KVNamespace, todos: Todo[]): Promise<void> {
	try {
		await kv.put("todos", JSON.stringify(todos));
	} catch (error) {
		console.error("Error writing todos to KV:", error);
		throw error;
	}
}

// GET: Retrieve all todos
export async function GET(request: NextRequest) {
	try {
		const kv = getKV();
		if (!kv) {
			console.log("KV not available - using empty state");
			// Fallback for local development (in-memory storage)
			return NextResponse.json([]);
		}
		console.log("KV available, reading todos");
		const todos = await readTodos(kv);
		return NextResponse.json(todos);
	} catch (error) {
		console.error("Error reading todos:", error);
		return NextResponse.json(
			{ error: "Failed to read todos" },
			{ status: 500 }
		);
	}
}

// POST: Save todos
export async function POST(request: NextRequest) {
	try {
		const todos = (await request.json()) as Todo[];
		const kv = getKV();
		if (!kv) {
			console.log("KV not available - skipping save");
			// Fallback for local development
			return NextResponse.json({ success: true });
		}
		console.log("KV available, saving todos");
		await writeTodos(kv, todos);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving todos:", error);
		return NextResponse.json(
			{ error: "Failed to save todos" },
			{ status: 500 }
		);
	}
}
