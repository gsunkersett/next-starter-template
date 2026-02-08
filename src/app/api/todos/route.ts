import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

// Helper to get KV from Cloudflare bindings
function getKV(): KVNamespace | null {
	try {
		const kv = (globalThis as any).TODO_KV as KVNamespace | undefined;
		if (kv) {
			console.log("KV found in globalThis");
			return kv;
		}

		// Fallback to process.env
		const kvEnv = (process.env as any).TODO_KV as KVNamespace | undefined;
		if (kvEnv) {
			console.log("KV found in process.env");
			return kvEnv;
		}

		console.warn("TODO_KV binding not found");
		return null;
	} catch (error) {
		console.error("Error getting KV:", error);
		return null;
	}
}

// Read todos from KV
async function readTodos(kv: KVNamespace): Promise<Todo[]> {
	try {
		const data = await kv.get("todos", { type: "json" });
		if (!data) {
			return [];
		}
		return Array.isArray(data) ? data : [];
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
