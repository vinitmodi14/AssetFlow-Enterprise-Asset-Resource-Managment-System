CREATE TABLE employees (
    employee_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    department_id   INT NULL,
    role            ENUM('Admin','Asset Manager','Department Head','Employee') NOT NULL DEFAULT 'Employee',
    status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);


INSERT INTO employees (employee_id, name, email, password_hash, department_id, role, status) VALUES
(1,  'Ananya Shah',    'admin@assetflow.com',    '$2b$10$placeholderhash1', 1, 'Admin',            'Active'),
(2,  'Rohan Mehta',    'rohan.mehta@assetflow.com', '$2b$10$placeholderhash2', 1, 'Asset Manager',   'Active'),
(3,  'Priya Nair',     'priya.nair@assetflow.com',  '$2b$10$placeholderhash3', 1, 'Employee',        'Active'),
(4,  'Raj Patel',      'raj.patel@assetflow.com',   '$2b$10$placeholderhash4', 1, 'Employee',        'Active'),
(5,  'Kavya Iyer',     'kavya.iyer@assetflow.com',  '$2b$10$placeholderhash5', 2, 'Department Head', 'Active'),
(6,  'Devansh Joshi',  'devansh.joshi@assetflow.com','$2b$10$placeholderhash6',2, 'Employee',        'Active'),
(7,  'Meera Desai',    'meera.desai@assetflow.com', '$2b$10$placeholderhash7', 3, 'Department Head', 'Active'),
(8,  'Aryan Chauhan',  'aryan.chauhan@assetflow.com','$2b$10$placeholderhash8',3, 'Employee',        'Active'),
(9,  'Simran Kaur',    'simran.kaur@assetflow.com', '$2b$10$placeholderhash9', 4, 'Employee',        'Active'),
(10, 'Vikram Rao',     'vikram.rao@assetflow.com',  '$2b$10$placeholderhash10',4, 'Employee',        'Active'),
(11, 'Neha Kapoor',    'neha.kapoor@assetflow.com', '$2b$10$placeholderhash11',5, 'Employee',        'Active'),
(12, 'Karan Malhotra', 'karan.malhotra@assetflow.com','$2b$10$placeholderhash12',5,'Employee',       'Active');