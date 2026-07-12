CREATE TABLE activity_logs (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    actor_id     INT NOT NULL,
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,     -- 'asset','booking','maintenance','audit', etc.
    entity_id    INT NOT NULL,
    details      VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES employees(employee_id)
);
 
INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, details) VALUES
(1, 'PROMOTED_EMPLOYEE', 'employee', 5, 'Promoted Kavya Iyer to Department Head'),
(1, 'PROMOTED_EMPLOYEE', 'employee', 2, 'Promoted Rohan Mehta to Asset Manager'),
(2, 'REGISTERED_ASSET',  'asset', 14, 'Registered AF-0114 Lenovo ThinkPad X1'),
(2, 'ALLOCATED_ASSET',   'allocation', 1, 'Allocated AF-0114 to Priya Nair'),
(4, 'REQUESTED_TRANSFER','transfer_request', 1, 'Raj Patel requested transfer of AF-0114'),
(5, 'BOOKED_RESOURCE',   'booking', 1, 'Booked Room B2 for 2026-07-15 09:00-10:00'),
(4, 'RAISED_MAINTENANCE','maintenance_request', 1, 'Raised issue for AF-0009 screen flicker'),
(2, 'APPROVED_MAINTENANCE','maintenance_request', 1, 'Approved maintenance for AF-0009'),
(2, 'CLOSED_AUDIT_CYCLE','audit_cycle', 1, 'Closed Audit Cycle #1, AF-0013 marked Lost');



SET FOREIGN_KEY_CHECKS = 1;