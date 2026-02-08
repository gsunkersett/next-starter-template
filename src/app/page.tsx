"use client";

import { useState } from "react";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

export default function Home() {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [inputValue, setInputValue] = useState("");

	const addTodo = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputValue.trim()) {
			setTodos([
				...todos,
				{ id: Date.now(), text: inputValue, completed: false },
			]);
			setInputValue("");
		}
	};

	const toggleTodo = (id: number) => {
		setTodos(
			todos.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo
			)
		);
	};

	const deleteTodo = (id: number) => {
		setTodos(todos.filter((todo) => todo.id !== id));
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
			<main className="max-w-2xl mx-auto">
				<h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
					ToDo App
				</h1>

				<form onSubmit={addTodo} className="mb-8">
					<div className="flex gap-2">
						<input
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							placeholder="Add a new task..."
							className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
						/>
						<button
							type="submit"
							className="px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2"
						>
							Add
						</button>
					</div>
				</form>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
					{todos.length === 0 ? (
						<p className="text-center text-gray-500 dark:text-gray-400 py-8">
							No tasks yet. Add one above!
						</p>
					) : (
						<ul className="space-y-2">
							{todos.map((todo) => (
								<li
									key={todo.id}
									className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									<input
										type="checkbox"
										checked={todo.completed}
										onChange={() => toggleTodo(todo.id)}
										className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
									/>
									<span
										className={`flex-1 ${
											todo.completed
												? "line-through text-gray-400 dark:text-gray-500"
												: "text-gray-800 dark:text-gray-200"
										}`}
									>
										{todo.text}
									</span>
									<button
										onClick={() => deleteTodo(todo.id)}
										className="px-3 py-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors font-medium"
									>
										Delete
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				{todos.length > 0 && (
					<div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
						{todos.filter((t) => !t.completed).length} of {todos.length} tasks
						remaining
					</div>
				)}
			</main>
		</div>
	);
}
