CREATE TABLE assets (
    asset_id            INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag           VARCHAR(20) NOT NULL UNIQUE,     -- AF-0001 style
    name                VARCHAR(150) NOT NULL,
    category_id         INT NOT NULL,
    serial_number       VARCHAR(100),
    acquisition_date    DATE,
    acquisition_cost    DECIMAL(12,2),                   -- reporting only, not linked to accounting
    condition_status    ENUM('New','Good','Fair','Poor','Damaged') DEFAULT 'Good',
    location            VARCHAR(150),
    qr_code             VARCHAR(150),
    photo_url            VARCHAR(255),
    is_bookable          BOOLEAN DEFAULT FALSE,           -- shared/bookable flag
    current_status       ENUM('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed')
                          NOT NULL DEFAULT 'Available',
    department_id        INT NULL,                        -- assets can belong to a department
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES asset_categories(category_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);