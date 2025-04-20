import React, { useState, useEffect } from "react";
import './AddTask.css';

const AddTask = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    startDate: "",
    startTime: "",
    priority: "",
    status: "pending",
    categoryId: "",
    mood: "Energetic"
  });
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const userId = localStorage.getItem("userId");
  const today = new Date().toISOString().split("T")[0];
  const moodOptions = ["Energetic", "Focused", "Stressed", "Tired", "Unmotivated"];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.dueDate) {
      fetchTasksForDate(formData.dueDate);
    }
  }, [formData.dueDate]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      setError("Error fetching categories: " + error.message);
    }
  };

  const fetchTasksForDate = async (date) => {
    try {
      const response = await fetch(`http://localhost:5000/auth/api/tasks?due_date=${date}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError("Error fetching tasks: " + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeValidation = (name, value) => {
    const isDueTime = name === "dueTime";
    const timeField = isDueTime ? "due_date" : "start_date";
    const selectedDate = isDueTime ? formData.dueDate : formData.startDate;
    
    // Check if date is selected
    if (!selectedDate) {
      setToastMessage("❌ Please select a date first");
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const selectedDateTime = new Date(`${selectedDate}T${value}`);
    const currentTime = new Date();

    // Prevent past time selection for start time
    if (!isDueTime && selectedDateTime < currentTime) {
      setToastMessage("❌ Start time cannot be in the past");
      setTimeout(() => setToastMessage(null), 5000);
      setFormData(prev => ({ ...prev, [name]: "" }));
      return;
    }

    // Existing conflict checking
    const hasConflict = tasks.some(task => {
      const taskStart = new Date(task.start_date);
      const taskDue = new Date(task.due_date);
      return (
        (selectedDateTime >= taskStart && selectedDateTime <= taskDue) ||
        (taskStart >= selectedDateTime && taskStart <= selectedDateTime.setHours(selectedDateTime.getHours() + 1))
      );
    });

    if (hasConflict) {
      setToastMessage(`❌ Time Conflict: Another task is scheduled during this time`);
      setTimeout(() => setToastMessage(null), 5000);
      setFormData(prev => ({ ...prev, [name]: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const suggestAlternativeMood = () => {
    const alternatives = moodOptions.filter(mood => mood !== "Stressed");
    return alternatives[Math.floor(Math.random() * alternatives.length)];
  };

  const handleMoodChange = (e) => {
    const newMood = e.target.value;
    let validatedMood = newMood;

    if (newMood === "Stressed") {
      const stressedTasks = tasks.filter(task => task.mood === "Stressed");
      const currentTime = new Date();
      const canAddStressed = stressedTasks.every(task => {
        const lastTaskDate = new Date(task.due_date);
        return (currentTime - lastTaskDate) >= 2 * 60 * 60 * 1000; // 2 hours
      });

      if (!canAddStressed) {
        validatedMood = "Energetic";
        setToastMessage(
          `🚫 Too many stressed tasks today. Setting mood to "Energetic". Suggested: ${suggestAlternativeMood()}`
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    }

    setFormData(prev => ({ ...prev, mood: validatedMood }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("Please log in first");
      return;
    }

    if (submitCooldown || loading) {
      setToastMessage("⏳ Please wait until the current task is processed");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);

    if (dueDateTime <= startDateTime) {
      setToastMessage("❌ Due date must be after start date");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setLoading(true);
    setSubmitCooldown(true);

    const taskData = {
      user_id: userId,
      category_id: formData.categoryId,
      title: formData.title,
      description: formData.description,
      due_date: `${formData.dueDate}T${formData.dueTime}`,
      start_date: `${formData.startDate}T${formData.startTime}`,
      priority: formData.priority,
      status: formData.status,
      mood: formData.mood
    };

    try {
      const response = await fetch("http://localhost:5000/auth/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to add task");
      }

      setToastMessage("✅ Task added successfully");
      setFormData({
        title: "", description: "", dueDate: "", dueTime: "",
        startDate: "", startTime: "", priority: "", status: "pending",
        categoryId: "", mood: "Energetic"
      });
    } catch (error) {
      setToastMessage(`❌ ${error.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setLoading(false);
      setTimeout(() => setSubmitCooldown(false), 2000); // 2-second cooldown
    }
  };

  const startVoiceRecognition = (field) => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      setFormData(prev => ({ ...prev, [field]: event.results[0][0].transcript }));
    };
    recognition.onerror = (event) => setError("Voice recognition failed: " + event.error);
    recognition.start();
  };

  return (
    <div className="add-task-container">
      <h2>Create New Task</h2>
      {toastMessage && <div className="toast">{toastMessage}</div>}
      {loading && <p className="loading">Processing...</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label htmlFor="title">Task Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Task Title"
            required
          />
          <button type="button" onClick={() => startVoiceRecognition('title')}>🎙️</button>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            required
          />
          <button type="button" onClick={() => startVoiceRecognition('description')}>🎙️</button>
        </div>

        <div className="datetime-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            min={today}
            required
          />
          <label htmlFor="startTime">Start Time</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={(e) => handleTimeValidation("startTime", e.target.value)}
            required
          />
        </div>

        <div className="datetime-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            min={today}
            required
          />
          <label htmlFor="dueTime">Due Time</label>
          <input
            type="time"
            id="dueTime"
            name="dueTime"
            value={formData.dueTime}
            onChange={(e) => handleTimeValidation("dueTime", e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
          >
            <option value="">Priority Level</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="categoryId">Category</label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mood">Mood</label>
          <select
            id="mood"
            name="mood"
            value={formData.mood}
            onChange={handleMoodChange}
          >
            {moodOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading || submitCooldown}>Add Task</button>
      </form>
    </div>
  );
};

export default AddTask;