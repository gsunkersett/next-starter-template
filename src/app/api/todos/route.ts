import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

// Helper to safely get KV from environment
function getKV(): KVNamespace | null {
	try {
		// Try accessing through globalThis (some Cloudflare runtimes)
		if (typeof globalThis !== "undefined") {
			const kv = (globalThis as any).TODO_KV;
			if (kv && typeof kv.get === "function") {
				console.log("[KV] Found binding in globalThis");
				return kv;
			}
		}

		// Try accessing through environment variables
		if (typeof process !== "undefined" && process.env) {
			const kv = (process.env as any).TODO_KV;
			if (kv && typeof kv.get === "function") {
				console.log("[KV] Found binding in process.env");
				return kv;
			}
		}

		console.log("[KV] Binding not found - using in-memory fallback");
		return null;
	} catch (error) {
		console.error("[KV] Error accessing binding:", error);
		return null;
	}
}

// In-memory storage for local development (not persisted)
let inMemoryTodos: Todo[] = [];

// GET: Retrieve all todos
export async function GET(request: NextRequest) {
	try {
		console.log("[API] GET /api/todos");
		
		const kv = getKV();
		
		if (kv) {
			try {
				console.log("[API] Reading from KV");
				const data = await kv.get("todos");
				
				if (data) {
					const parsed = JSON.parse(data);
					console.log("[API] Retrieved from KV:", parsed);
					return NextResponse.json(parsed);
				}
				
				console.log("[API] KV is empty, returning []");
				return NextResponse.json([]);
			} catch (kvError) {
				console.error("[API] Error reading from KV:", kvError);
				return NextResponse.json([]);
			}
		} else {
			// Fallback to in-memory storage
			console.log("[API] Using in-memory storage, returning:", inMemoryTodos);
			return NextResponse.json(inMemoryTodos);
		}
	} catch (error) {
		console.error("[API] GET error:", error);
		return NextResponse.json([], { status: 200 });
	}
}

// POST: Save todos
export async function POST(request: NextRequest) {
	try {
		console.log("[API] POST /api/todos");
		
		const todos = (await request.json()) as Todo[];
		console.log("[API] Received todos:", todos);
		
		const kv = getKV();
		
		if (kv) {
			try {
				console.log("[API] Saving to KV");
				await kv.put("todos", JSON.stringify(todos));
				console.log("[API] Successfully saved to KV");
				return NextResponse.json({ success: true });
			} catch (kvError) {
				console.error("[API] Error writing to KV:", kvError);
				return NextResponse.json({ success: true });
			}
		} else {
			// Fallback to in-memory storage
			inMemoryTodos = todos;
			console.log("[API] Saved to in-memory storage");
			return NextResponse.json({ success: true });
		}
	} catch (error) {
		console.error("[API] POST error:", error);
		return NextResponse.json({ success: false }, { status: 400 });
	}
}
