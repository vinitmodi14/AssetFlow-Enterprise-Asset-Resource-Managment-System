CREATE TABLE bookings (
    booking_id      INT AUTO_INCREMENT PRIMARY KEY,
    resource_id     INT NOT NULL,                      -- references assets.asset_id where is_bookable = TRUE
    booked_by       INT NOT NULL,
    start_time      DATETIME NOT NULL,
    end_time        DATETIME NOT NULL,
    status          ENUM('Upcoming','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Upcoming',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES assets(asset_id),
    FOREIGN KEY (booked_by) REFERENCES employees(employee_id)
);