CREATE TABLE transfer_requests (
    transfer_id        INT AUTO_INCREMENT PRIMARY KEY,
    allocation_id       INT NOT NULL,                  -- the CURRENT allocation being contested
    requested_by        INT NOT NULL,                  -- employee requesting the transfer (e.g. Raj)
    requested_to        INT NOT NULL,                  -- employee it should transfer to (usually same as requested_by)
    status               ENUM('Requested','Approved','Rejected') NOT NULL DEFAULT 'Requested',
    approved_by          INT NULL,
    requested_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at            TIMESTAMP NULL,
    FOREIGN KEY (allocation_id) REFERENCES allocations(allocation_id),
    FOREIGN KEY (requested_by) REFERENCES employees(employee_id),
    FOREIGN KEY (requested_to) REFERENCES employees(employee_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
);

INSERT INTO transfer_requests (transfer_id, allocation_id, requested_by, requested_to, status) VALUES
(1, 1, 4, 4, 'Requested');