CREATE TABLE departments (
    department_id       INT AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(100) NOT NULL,
    parent_department_id INT NULL,                       -- for hierarchy
    head_employee_id     INT NULL,                        -- FK added after employees table exists
    status               ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES departments(department_id)
);