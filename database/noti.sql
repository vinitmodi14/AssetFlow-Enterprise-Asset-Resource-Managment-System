CREATE TABLE notifications (
    notification_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    type             VARCHAR(50) NOT NULL,   -- Asset Assigned, Maintenance Approved, Booking Confirmed, etc.
    message          VARCHAR(255) NOT NULL,
    is_read          BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employees(employee_id)
);


INSERT INTO notifications (user_id, type, message, is_read) VALUES
(3, 'Transfer Requested',        'Raj Patel has requested a transfer of asset AF-0114 currently held by you.', FALSE),
(4, 'Transfer Requested',        'Your transfer request for AF-0114 is pending Asset Manager approval.', FALSE),
(4, 'Maintenance Approved',      'Your maintenance request for AF-0009 (MacBook Pro) has been approved.', TRUE),
(6, 'Maintenance Pending',       'Your maintenance request for AF-0002 (Printer) is awaiting approval.', FALSE),
(5, 'Booking Confirmed',         'Your booking for Room B2 on 2026-07-15 09:00-10:00 is confirmed.', TRUE),
(1, 'Audit Discrepancy Flagged', 'Asset AF-0013 marked Missing during Audit Cycle #1.', FALSE),
(2, 'Overdue Return Alert',      'No overdue allocations currently — system nominal.', TRUE);