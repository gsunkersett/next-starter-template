import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

const dataDir = path.join(process.cwd(), "data");
const todosFile = path.join(dataDir, "todos.json");

// Ensure data directory exists
async function ensureDataDir() {
	try {
		await fs.mkdir(dataDir, { recursive: true });
	} catch (error) {
		console.error("Error creating data directory:", error);
	}
}

// Read todos from JSON file
async function readTodos(): Promise<Todo[]> {
	try {
		await ensureDataDir();
		const data = await fs.readFile(todosFile, "utf-8");
		return JSON.parse(data);
	} catch (error) {
		// File doesn't exist yet, return empty array
		return [];
	}
}

// Write todos to JSON file
async function writeTodos(todos: Todo[]): Promise<void> {
	try {
		await ensureDataDir();
		await fs.writeFile(todosFile, JSON.stringify(todos, null, 2));
	} catch (error) {
		console.error("Error writing todos:", error);
		throw error;
	}
}

// GET: Retrieve all todos
export async function GET() {
	try {
		const todos = await readTodos();
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
		await writeTodos(todos);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving todos:", error);
		return NextResponse.json(
			{ error: "Failed to save todos" },
			{ status: 500 }
		);
	}
}
