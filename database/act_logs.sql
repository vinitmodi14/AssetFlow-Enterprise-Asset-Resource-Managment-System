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
 
SET FOREIGN_KEY_CHECKS = 1;