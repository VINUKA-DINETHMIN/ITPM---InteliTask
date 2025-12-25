import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Feedback.css";

// FeedbackForm Component
const FeedbackForm = ({ onFeedbackSubmitted }) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [userId] = useState(localStorage.getItem("userId") || "Admin");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/auth/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, feedback_text: feedbackText }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");
      setFeedbackText("");
      onFeedbackSubmitted();
      toast.success("Feedback submitted successfully!");
    } catch (error) {
      toast.error(`Error submitting feedback: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <div className="form-group">
        <label htmlFor="user-id">User ID:</label>
        <input id="user-id" type="text" value={userId} readOnly aria-label="User ID" />
      </div>
      <div className="form-group">
        <label htmlFor="feedback-text">Feedback:</label>
        <textarea
          id="feedback-text"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          required
          aria-label="Feedback text"
        />
      </div>
      <button type="submit" aria-label="Submit feedback">Submit Feedback</button>
    </form>
  );
};

// FeedbackList Component
const FeedbackList = ({ onFeedbackUpdated, setFeedbacks }) => {
  const [feedbacks, setFeedbacksLocal] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch("http://localhost:5000/auth/api/feedback");
        if (!response.ok) throw new Error("Failed to fetch feedbacks");
        const data = await response.json();
        setFeedbacksLocal(data);
        setFeedbacks(data);
      } catch (error) {
        toast.error(`Error fetching feedbacks: ${error.message}`);
      }
    };
    fetchFeedbacks();
  }, [onFeedbackUpdated, setFeedbacks]);

  const handleEdit = async (id, feedbackText) => {
    const newFeedbackText = prompt("Edit feedback:", feedbackText);
    if (newFeedbackText) {
      try {
        const response = await fetch(`http://localhost:5000/auth/api/feedback/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback_text: newFeedbackText }),
        });
        if (!response.ok) throw new Error("Failed to update feedback");
        toast.success("Feedback updated successfully!");
        setFeedbacksLocal((prev) =>
          prev.map((fb) => (fb.id === id ? { ...fb, feedback_text: newFeedbackText } : fb))
        );
      } catch (error) {
        toast.error(`Error updating feedback: ${error.message}`);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      const response = await fetch(`http://localhost:5000/auth/api/feedback/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete feedback");
      toast.success("Feedback deleted successfully!");
      setFeedbacksLocal((prev) => prev.filter((fb) => fb.id !== id));
    } catch (error) {
      toast.error(`Error deleting feedback: ${error.message}`);
    }
  };

  // Filter feedbacks by user ID, safely converting user_id to string
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const userIdStr = feedback.user_id != null ? String(feedback.user_id) : "";
    return userIdStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="feedback-list">
      <h2>Feedback List</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by User ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-label="Search feedback by user ID"
        />
      </div>
      {filteredFeedbacks.length === 0 ? (
        <p>{searchTerm ? "No feedback found for this User ID." : "No feedback available."}</p>
      ) : (
        <ul>
          {filteredFeedbacks.map((feedback) => (
            <li key={feedback.id}>
              <p>User ID: {feedback.user_id}</p>
              <p>Feedback: {feedback.feedback_text}</p>
              <div className="feedback-actions">
                <button
                  onClick={() => handleEdit(feedback.id, feedback.feedback_text)}
                  aria-label={`Edit feedback ${feedback.id}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(feedback.id)}
                  aria-label={`Delete feedback ${feedback.id}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Combined Feedback Component
const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackUpdated, setFeedbackUpdated] = useState(false);
  const navigate = useNavigate();

  const handleFeedbackSubmitted = () => {
    setFeedbackUpdated((prev) => !prev);
  };

  const generatePDF = () => {
    if (feedbacks.length === 0) {
      toast.warn("No feedback to generate a report.");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("User Feedback Report", 14, 15);
    doc.autoTable({
      head: [["User ID", "Feedback"]],
      // Ensure user_id is treated as a string in the PDF
      body: feedbacks.map((feedback) => [String(feedback.user_id), feedback.feedback_text]),
      startY: 25,
      styles: { fontSize: 10, cellPadding: 5 },
      theme: "grid",
    });
    doc.save("user_feedback_report.pdf");
    toast.success("PDF generated successfully!");
  };

  return (
    <div className="page-wrapper">
      <div className="feedback-container">
        <nav className="navbar">
          <button onClick={() => navigate("/login")} aria-label="Logout">
            Logout
          </button>
        </nav>
        <h1>User Feedback</h1>
        <FeedbackForm onFeedbackSubmitted={handleFeedbackSubmitted} />
        <button onClick={generatePDF} className="pdf-button" aria-label="Generate PDF report">
          Generate PDF Report
        </button>
        <FeedbackList onFeedbackUpdated={feedbackUpdated} setFeedbacks={setFeedbacks} />
        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Feedback;