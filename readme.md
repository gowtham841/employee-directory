I have attached all the required details below
Step 1: Create Database and Table

Open MySQL Workbench (or MySQL command line) and run this SQL script:
```sql
CREATE DATABASE employee_directory;

USE employee_directory;

CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data (optional)
INSERT INTO employees (name, email, department, status) VALUES
('vignesh', 'vigneshw@company.com', 'Engineering', 'Active'),
('athira', 'athira@company.com', 'HR', 'Active'),
('sathish', 'sathish.j@company.com', 'Sales', 'Active'),
('Sarah', 'sarah.w@company.com', 'Marketing', 'Inactive'),
('Tom', 'tom@company.com', 'Engineering', 'Active'),
('Emily', 'emily.d@company.com', 'HR', 'Active'),
('Davi', 'david.w@company.com', 'Sales', 'Active'),
('Lisa', 'lisa.a@company.com', 'Marketing', 'Active');

Step 2: Configure Database Connection

1. Create a `.env` file in the root directory
2. Add your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=lolavocat
DB_NAME=employee_directory
PORT=3000

Installation Method : 
Step 1: Clone the Repository
```bash
git clone https://github.com/gowtham841/employee-directory.git
cd employee-directory
```

Step 2: Install Dependencies 
enter code: npm install

Step 3: Connect to the live server
enter code: npm start

Usage: 
1. Open your browser
2. Go to: **http://localhost:3000**
3. You should see the Employee Directory interface

## 🔌 API Endpoints

### GET /api/employees
Get all employees with optional filtering, sorting, and pagination.

**Query Parameters:**
- `search` - Search by name or email
- `department` - Filter by department
- `sort` - Sort by name (`asc` or `desc`)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 5)


