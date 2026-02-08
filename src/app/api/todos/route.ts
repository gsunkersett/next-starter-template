import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

// Validation helper
function isValidTodo(todo: any): todo is Todo {
	return (
		typeof todo === 'object' &&
		typeof todo.id === 'number' &&
		typeof todo.text === 'string' &&
		typeof todo.completed === 'boolean'
	);
}

function isValidTodos(todos: any): todos is Todo[] {
	return Array.isArray(todos) && todos.every(isValidTodo);
}

// Safe JSON parse helper
function safeJsonParse(data: string | null): Todo[] | null {
	if (!data) return null;
	try {
		const parsed = JSON.parse(data);
		return isValidTodos(parsed) ? parsed : null;
	} catch (error) {
		console.error("[KV] Invalid JSON data:", error);
		return null;
	}
}

// In-memory storage fallback for local development
let inMemoryTodos: Todo[] = [];
let cachedKV: KVNamespace | null = null;
let kvInitialized = false;

// Helper to initialize and cache KV namespace
function initializeKV(): KVNamespace | null {
	if (kvInitialized) return cachedKV;
	
	try {
		console.log("Initializing KV namespace...");
		const { env } = getCloudflareContext();
		
		if (env?.TODO_KV) {
			console.log("[KV] Using KV storage");
			cachedKV = env.TODO_KV as KVNamespace;
		} else {
			console.log("[KV] KV binding not found");
			cachedKV = null;
		}
	} catch (error) {
		console.error("[KV] Error accessing binding:", error);
		cachedKV = null;
	}
	
	kvInitialized = true;
	return cachedKV;
}

// GET: Retrieve all todos
export async function GET() {
	try {
		const kv = initializeKV();
		console.log("[API] GET /api/todos");
		if (kv) {
			// KV is available, use it
			const data = await kv.get("todos");
			const todos = safeJsonParse(data);
			return NextResponse.json(todos || []);
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
		const body = await request.json();
		if (!isValidTodos(body)) {
			return NextResponse.json({ success: false, error: "Invalid todo data" }, { status: 400 });
		}
		const todos = body;
		const kv = initializeKV();
		
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
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
