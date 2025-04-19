import React, { useState, useEffect } from 'react';

const UpdateTask = ({ taskId, onClose }) => {
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Optionally fetch the current status of the task if needed
    const fetchTask = async () => {
      const response = await fetch(`http://localhost:5000/auth/api/tasks/${taskId}`);
      const data = await response.json();
      setStatus(data.status); // Set the current status
    };

    fetchTask();
  }, [taskId]);

  const handleUpdate = async () => {
    const response = await fetch(`http://localhost:5000/auth/api/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      alert('Task updated successfully');
      onClose(); // Close the update form
    } else {
      alert('Failed to update task');
    }
  };

  return (
    <div>
      <h2>Update Task Status</h2>
      <select value={status} onChange={(e) => setStatus(e.target.value)} required>
        <option value="">Select Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      <button onClick={handleUpdate}>Update</button>
      <button onClick={onClose}>Cancel</button> {/* Button to close the update form */}
    </div>
  );
};

export default UpdateTask;