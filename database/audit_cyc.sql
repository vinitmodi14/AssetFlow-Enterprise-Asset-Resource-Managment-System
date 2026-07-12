CREATE TABLE audit_cycles (
    cycle_id         INT AUTO_INCREMENT PRIMARY KEY,
    scope_department_id INT NULL,
    scope_location    VARCHAR(150) NULL,
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    status            ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
    created_by        INT NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scope_department_id) REFERENCES departments(department_id),
    FOREIGN KEY (created_by) REFERENCES employees(employee_id)
);
 
CREATE TABLE audit_assignments (
    assignment_id   INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id        INT NOT NULL,
    auditor_id      INT NOT NULL,
    FOREIGN KEY (cycle_id) REFERENCES audit_cycles(cycle_id),
    FOREIGN KEY (auditor_id) REFERENCES employees(employee_id)
);