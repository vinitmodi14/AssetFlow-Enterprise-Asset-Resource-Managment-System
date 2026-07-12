CREATE TABLE departments (
    department_id       INT AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(100) NOT NULL,
    parent_department_id INT NULL,                       -- for hierarchy
    head_employee_id     INT NULL,                        -- FK added after employees table exists
    status               ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES departments(department_id)
);

INSERT INTO departments (department_id, name, parent_department_id, status) VALUES
(1, 'Information Technology', NULL, 'Active'),
(2, 'Human Resources', NULL, 'Active'),
(3, 'Facilities', NULL, 'Active'),
(4, 'Finance', NULL, 'Active'),
(5, 'IT Support', 1, 'Active');   -- child dept under IT, demonstrates hierarchy

UPDATE departments SET head_employee_id = 5 WHERE department_id = 2;   -- Kavya heads HR
UPDATE departments SET head_employee_id = 7 WHERE department_id = 3;   -- Meera heads Facilities