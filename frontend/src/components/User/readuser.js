import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDetail.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const UserDetail = () => {
  const userId = localStorage.getItem("userId");
  const [user, setUser] = useState({ username: "", email: "" });
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/auth/api/user/${userId}`);
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setTasks(data.tasks || []);
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert("Error fetching user details");
      }
    };

    if (userId) fetchUserDetails();
  }, [userId]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('User Profile Report', 14, 15);
    doc.setFontSize(12);

    // Add user details
    doc.setFontSize(14);
    doc.text('User Information', 14, 30);
    doc.setFontSize(12);
    doc.text(`Username: ${user.username}`, 14, 40);
    doc.text(`Email: ${user.email}`, 14, 50);

    // Add tasks table
    doc.setFontSize(14);
    doc.text('Tasks', 14, 70);
    doc.setFontSize(12);

    // Prepare table data with proper status handling
    const tableData = tasks.map(task => {
      // Format the status to be more readable
      let status = task.status || 'Not Started';
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      
      return [
        task.title || 'No Title',
        task.description || 'No Description',
        status, // Properly formatted status
        task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'
      ];
    });

    // Add table with better styling
    doc.autoTable({
      startY: 80,
      head: [['Title', 'Description', 'Status', 'Due Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Title
        1: { cellWidth: 60 }, // Description
        2: { cellWidth: 30 }, // Status
        3: { cellWidth: 30 }  // Due Date
      }
    });

    // Save the PDF
    doc.save(`user-profile-${user.username}.pdf`);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Prompt for password
      const password = prompt("Please enter your password to confirm account deletion:");
      
      if (!password) {
        alert("Password is required to delete account");
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/auth/api/user/${userId}`, { 
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        });
        const data = await response.json();
        
        if (data.success) {
          alert("Account successfully deleted. You will be redirected to the login page.");
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          navigate("/login");
        } else {
          // Show specific error message from server
          alert(data.message || "Failed to delete account. Please try again.");
        }
      } catch (error) {
        console.error(error);
        alert("Error occurred while trying to delete account. Please try again later.");
      }
    }
  };

  const handleUpdate = async () => {
    if (!user.username.trim() || !user.email.trim()) {
      alert("Username and email cannot be empty");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/auth/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setIsEditing(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error updating user details");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">User Details</h2>
        <nav className="navbar">
          <button onClick={() => navigate(`/user/${userId}`)}>Profile</button>
          <button onClick={() => navigate(`/tasks`)}>Tasks</button>
          <button onClick={() => navigate("/Reminders")}>Reminders</button>
          <button onClick={() => navigate("/feedback")}>Feedback</button>
          <button onClick={() => navigate("/login")}>Logout</button>
        </nav>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="button-group">
            <button 
              className="action-button primary"
              onClick={isEditing ? handleUpdate : () => setIsEditing(true)}
            >
              {isEditing ? "Save" : "Edit"}
            </button>
            <button 
              className="action-button delete"
              onClick={handleDelete}
            >
              Delete
            </button>
            <button 
              className="action-button primary"
              onClick={generatePDF}
            >
              Download Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDetail;