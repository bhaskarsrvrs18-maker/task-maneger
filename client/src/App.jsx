
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request("/api/tasks");
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function addTask(event) {
    event.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;

    setSaving(true);
    setError("");

    try {
      const task = await request("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: cleanTitle }),
      });

      setTasks((current) => [task, ...current]);
      setTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    setError("");

    try {
      const updated = await request(`/api/tasks/${task._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });

      setTasks((current) =>
        current.map((item) =>
          item._id === updated._id ? updated : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    setError("");

    try {
      await request(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((current) => current.filter((task) => task._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <main className="page">
      <section className="app">
        <header className="header">
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h1>Task Manager<span>.</span></h1>
          <p>Small steps. Meaningful progress.</p>
        </header>

        <section className="summary">
          <div>
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{tasks.length - completedCount}</strong>
          </div>
        </section>

        <form className="task-form" onSubmit={addTask}>
          <input
            aria-label="New task title"
            placeholder="What do you need to do?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
          />
          <button disabled={saving || !title.trim()}>
            {saving ? "Adding..." : "Add task +"}
          </button>
        </form>

        {error && (
          <div className="error" role="alert">
            {error}
            <button type="button" onClick={loadTasks}>
              Retry
            </button>
          </div>
        )}

        <section className="tasks">
          <div className="tasks-heading">
            <h2>Your tasks</h2>
            <span>{tasks.length} total</span>
          </div>

          {loading ? (
            <p className="empty">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty">
              No tasks yet. Add your first task above!
            </p>
          ) : (
            tasks.map((task) => (
              <article className="task" key={task._id}>
                <label className="task-label">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                  />
                  <span className={task.completed ? "done" : ""}>
                    {task.title}
                  </span>
                </label>

                <button
                  className="delete"
                  type="button"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => deleteTask(task._id)}
                >
                  Delete
                </button>
              </article>
            ))
          )}
        </section>

        <footer>
          Built with React, Express & MongoDB
        </footer>
      </section>
    </main>
  );
}

