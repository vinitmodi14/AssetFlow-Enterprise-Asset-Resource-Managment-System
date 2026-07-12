CREATE TABLE audit_findings (
    finding_id      INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id        INT NOT NULL,
    asset_id        INT NOT NULL,
    finding         ENUM('Verified','Missing','Damaged') NOT NULL,
    notes           VARCHAR(255),
    recorded_by     INT NOT NULL,
    recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES audit_cycles(cycle_id),
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    FOREIGN KEY (recorded_by) REFERENCES employees(employee_id)
);