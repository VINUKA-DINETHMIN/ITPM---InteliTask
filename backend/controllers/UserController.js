const db = require("../db"); // Import the database connection

class UserController {
  static async login(req, res) {
    const { email, password } = req.body;

    try {
      // Find user by email
      db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const user = results[0];

        // Successful login (without password verification)
        return res.json({
          success: true,
          message: "Login successful",
          user: { id: user.id, username: user.username, email: user.email },
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  static async createAccount(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
      // Check if the email already exists
      db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Server error" });
        }

        if (results.length > 0) {
          return res.status(400).json({ success: false, message: "Email already in use" });
        }

        // Insert new user (without password hashing)
        db.query(
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
          [name, email, password], // Note: Password is stored in plain text (not recommended)
          (err, result) => {
            if (err) {
              return res.status(500).json({ success: false, message: "Error creating account" });
            }

            return res.status(201).json({ success: true, message: "Account created successfully" });
          }
        );
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  static async getUserDetails(req, res) {
    const userId = req.params.id;

    try {
      // Get user details
      db.query("SELECT id, username, email FROM users WHERE id = ?", [userId], (err, userResults) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Server error" });
        }

        if (userResults.length === 0) {
          return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get user tasks
        db.query("SELECT * FROM tasks WHERE user_id = ?", [userId], (err, taskResults) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Server error" });
          }

          return res.json({ 
            success: true, 
            user: userResults[0],
            tasks: taskResults
          });
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  static async updateUser (req, res) {
    const userId = req.params.id;
    const { username, email } = req.body;

    // Add validation for empty values
    if (!username || !email || username.trim() === '' || email.trim() === '') {
      return res.status(400).json({ success: false, message: "Username and email cannot be empty"});
    }

    try {
      db.query(
        "UPDATE users SET username = ?, email = ? WHERE id = ?",
        [username, email, userId],
        (err, result) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Error updating user" });
          }

          return res.json({ success: true, message: "User updated successfully" });
        }
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  static async deleteUser (req, res) {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    try {
      // First verify the password
      db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = results[0];
        
        // Verify password matches exactly
        if (password !== user.password) {
          return res.status(401).json({ 
            success: false, 
            message: "Incorrect password. Account deletion failed." 
          });
        }

        // If password is correct, proceed with deletion
        db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Error deleting user" });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ 
              success: false, 
              message: "User not found or already deleted" 
            });
          }

          return res.json({ 
            success: true, 
            message: "User account deleted successfully" 
          });
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
}

module.exports = UserController;