CREATE TABLE allocations (
    allocation_id         INT AUTO_INCREMENT PRIMARY KEY,
    asset_id              INT NOT NULL,
    employee_id           INT NULL,                    -- allocated to employee...
    department_id         INT NULL,                    -- ...or to a department
    allocated_date         DATE NOT NULL,
    expected_return_date   DATE NULL,
    actual_return_date     DATE NULL,
    condition_checkin_notes VARCHAR(255) NULL,
    status                 ENUM('Active','Returned') NOT NULL DEFAULT 'Active',
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);