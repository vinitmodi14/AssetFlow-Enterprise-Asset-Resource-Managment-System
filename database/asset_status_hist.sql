CREATE TABLE asset_status_history (
    history_id      INT AUTO_INCREMENT PRIMARY KEY,
    asset_id        INT NOT NULL,
    from_status     VARCHAR(30),
    to_status       VARCHAR(30) NOT NULL,
    changed_by      INT NOT NULL,                     -- employee_id who triggered it
    reason          VARCHAR(255),
    changed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    FOREIGN KEY (changed_by) REFERENCES employees(employee_id)
);

INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by, reason) VALUES
(9,  'Available', 'Under Maintenance', 2, 'Screen flickering issue reported'),
(14, 'Available', 'Allocated',         2, 'Allocated to Priya Nair on onboarding'),
(13, 'Good',       'Retired',          2, 'End of life, replaced by newer stock');