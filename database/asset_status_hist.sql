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
 