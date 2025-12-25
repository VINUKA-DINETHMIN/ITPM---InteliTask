const connection = require('../db');

// Get all categories
exports.getAllCategories = (req, res) => {
    connection.query('SELECT * FROM categories;', (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results);
    });
};
// Create a new category
exports.createCategory = (req, res) => {
    const { name, description } = req.body;

    // Validate input
    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    connection.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description], (err, results) => {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ error: 'Database insert error' });
        }
        res.status(201).json({ id: results.insertId, name, description });
    });
};

// Update an existing category
exports.updateCategory = (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate input
    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    connection.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id], (err) => {
        if (err) {
            console.error('Error updating category:', err);
            return res.status(500).json({ error: 'Database update error' });
        }
        res.json({ id, name, description });
    });
};

// Delete a category
exports.deleteCategory = (req, res) => {
    const { id } = req.params;

    connection.query('DELETE FROM categories WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).json({ error: 'Database delete error' });
        }
        res.status(204).send();
    });
};