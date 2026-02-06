require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// GET all employees
app.get('/api/employees', (req, res) => {
  const { search, department, sort, page = 1, limit = 5 } = req.query;
  
  let query = 'SELECT * FROM employees WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (department && department !== 'All') {
    query += ' AND department = ?';
    params.push(department);
  }

  if (sort === 'asc') {
    query += ' ORDER BY name ASC';
  } else if (sort === 'desc') {
    query += ' ORDER BY name DESC';
  } else {
    query += ' ORDER BY id DESC';
  }

  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  let countQuery = 'SELECT COUNT(*) as total FROM employees WHERE 1=1';
  const countParams = [];

  if (search) {
    countQuery += ' AND (name LIKE ? OR email LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }

  if (department && department !== 'All') {
    countQuery += ' AND department = ?';
    countParams.push(department);
  }

  db.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        employees: results,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// POST new employee
app.post('/api/employees', (req, res) => {
  const { name, email, department, status } = req.body;

  if (!name || !email || !department || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = 'INSERT INTO employees (name, email, department, status) VALUES (?, ?, ?, ?)';
  
  db.query(query, [name, email, department, status], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      message: 'Employee added successfully',
      id: result.insertId 
    });
  });
});

// PUT update employee
app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, department, status } = req.body;

  if (!name || !email || !department || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = 'UPDATE employees SET name = ?, email = ?, department = ?, status = ? WHERE id = ?';
  
  db.query(query, [name, email, department, status, id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee updated successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});