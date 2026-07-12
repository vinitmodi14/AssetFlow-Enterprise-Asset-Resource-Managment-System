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

INSERT INTO maintenance_requests (request_id, asset_id, raised_by, issue_description, priority, status, approved_by, technician_name, resolved_at) VALUES
(1, 9, 4, 'Screen flickers intermittently, needs display panel check', 'High', 'Approved', 2, 'Suresh (Vendor Tech)', NULL),
(2, 2, 6, 'Printer jams frequently on double-sided printing', 'Medium', 'Pending', NULL, NULL, NULL),
(3, 10, 8, 'Drill motor overheating after short use', 'Critical', 'Resolved', 2, 'Bosch Service Center', '2026-06-20 16:00:00');