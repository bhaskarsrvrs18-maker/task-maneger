
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());

// Define the structure of a task
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// Check whether the API is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Task API is running" });
});

// Get all tasks
app.get("/api/tasks", async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Create a task
app.post("/api/tasks", async (req, res, next) => {
  try {
    const title =
      typeof req.body.title === "string"
        ? req.body.title.trim()
        : "";

    if (!title || title.length > 200) {
      return res.status(400).json({
        message: "Enter a task title of 1–200 characters."
      });
    }

    const task = await Task.create({ title });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Update a task's completion status
app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    if (typeof req.body.completed !== "boolean") {
      return res.status(400).json({
        message: "A boolean completed value is required."
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: req.body.completed },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// Handle unexpected errors
app.use((error, req, res, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  res.status(500).json({ message: "An unexpected server error occurred." });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from environment variables.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    if (error.name === "MongooseServerSelectionError") {
      console.error("\n💡 Solution: Your IP is not whitelisted in MongoDB Atlas.");
      console.error("1. Go to MongoDB Atlas: https://cloud.mongodb.com");
      console.error("2. Navigate to 'Network Access' -> 'IP Access List'");
      console.error("3. Click 'Add IP Address'");
      console.error("4. Click 'Add Current IP Address' or enter '0.0.0.0/0' (Allow access from anywhere)");
      console.error("5. Click 'Confirm' and restart npm start once active.\n");
    }
    process.exit(1);
  }
}

startServer();
