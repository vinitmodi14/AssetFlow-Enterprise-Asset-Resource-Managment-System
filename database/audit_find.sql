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

INSERT INTO audit_findings (cycle_id, asset_id, finding, notes, recorded_by) VALUES
(1, 1,  'Verified', 'Present and in good condition', 2),
(1, 9,  'Verified', 'Confirmed under maintenance, matches records', 2),
(1, 13, 'Missing',  'Could not locate in storage during audit', 2);
 
-- Closing cycle 1 would trigger: asset 13 status Retired -> Lost (app logic via changeAssetStatus)
UPDATE assets SET current_status = 'Lost' WHERE asset_id = 13;