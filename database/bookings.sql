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


INSERT INTO bookings (booking_id, resource_id, booked_by, start_time, end_time, status) VALUES
(1, 7, 5, '2026-07-15 09:00:00', '2026-07-15 10:00:00', 'Upcoming'),   -- Room B2 booked by Kavya
(2, 8, 9, '2026-07-14 14:00:00', '2026-07-14 15:00:00', 'Completed'),  -- Room A1 past booking
(3, 5, 10,'2026-07-20 08:00:00', '2026-07-20 12:00:00', 'Upcoming');   -- Company car booked by Vikram