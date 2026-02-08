import { NextRequest, NextResponse } from "next/server";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

interface CloudflareEnv {
	TODO_KV: KVNamespace;
}

// Helper to get KV from context
function getKV(request: NextRequest): KVNamespace | null {
	try {
		const env = (request as any).cf?.env || process.env;
		return env.TODO_KV as KVNamespace;
	} catch {
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
		const kv = getKV(request);
		if (!kv) {
			// Fallback for local development (in-memory storage)
			return NextResponse.json([]);
		}
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
		const kv = getKV(request);
		if (!kv) {
			// Fallback for local development
			return NextResponse.json({ success: true });
		}
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
