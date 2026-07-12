CREATE TABLE maintenance_requests (
    request_id       INT AUTO_INCREMENT PRIMARY KEY,
    asset_id         INT NOT NULL,
    raised_by        INT NOT NULL,
    issue_description VARCHAR(500) NOT NULL,
    priority          ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
    photo_url          VARCHAR(255),
    status             ENUM('Pending','Approved','Rejected','Technician Assigned','In Progress','Resolved')
                        NOT NULL DEFAULT 'Pending',
    approved_by         INT NULL,
    technician_name      VARCHAR(100) NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at            TIMESTAMP NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    FOREIGN KEY (raised_by) REFERENCES employees(employee_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
);