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


INSERT INTO assets (asset_id, asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition_status, location, qr_code, photo_url, is_bookable, current_status, department_id) VALUES
(1,  'AF-0001', 'Dell Latitude 5440 Laptop',  1, 'SN-DL5440-001', '2024-03-10', 68000.00, 'Good', 'IT Floor 2',        'QR-0001', 'https://placehold.co/200x200?text=Laptop',        FALSE, 'Available',        1),
(2,  'AF-0002', 'HP LaserJet Printer',        1, 'SN-HPLJ-002',   '2023-11-05', 22000.00, 'Good', 'IT Floor 1',        'QR-0002', 'https://placehold.co/200x200?text=Printer',       FALSE, 'Available',        1),
(3,  'AF-0003', 'Ergonomic Office Chair',     2, 'SN-CHAIR-003',  '2022-06-15', 9500.00,  'Fair', 'HR Floor 1',        'QR-0003', 'https://placehold.co/200x200?text=Chair',         FALSE, 'Available',        2),
(4,  'AF-0004', 'Conference Table (8-seat)',  2, 'SN-TABLE-004',  '2021-09-20', 45000.00, 'Good', 'Facilities Bldg A', 'QR-0004', 'https://placehold.co/200x200?text=Table',         FALSE, 'Available',        3),
(5,  'AF-0005', 'Toyota Innova (Company Car)',3, 'SN-VEH-005',    '2020-01-12', 1450000.00,'Good', 'Parking Lot B',    'QR-0005', 'https://placehold.co/200x200?text=Vehicle',       TRUE,  'Available',        3),
(6,  'AF-0006', 'Projector Epson EB-X500',    1, 'SN-PROJ-006',   '2023-02-18', 35000.00, 'Good', 'Room B2',           'QR-0006', 'https://placehold.co/200x200?text=Projector',     FALSE, 'Available',        1),
(7,  'AF-0007', 'Room B2 - Meeting Room',     4, 'SN-ROOM-007',   '2019-01-01', 0.00,     'Good', 'Building 1, 2F',    'QR-0007', 'https://placehold.co/200x200?text=Room+B2',       TRUE,  'Available',        3),
(8,  'AF-0008', 'Room A1 - Meeting Room',     4, 'SN-ROOM-008',   '2019-01-01', 0.00,     'Good', 'Building 1, 1F',    'QR-0008', 'https://placehold.co/200x200?text=Room+A1',       TRUE,  'Available',        3),
(9,  'AF-0009', 'MacBook Pro 14"',            1, 'SN-MBP-009',    '2024-05-01', 185000.00,'New',  'IT Floor 2',        'QR-0009', 'https://placehold.co/200x200?text=MacBook',       FALSE, 'Under Maintenance',1),
(10, 'AF-0010', 'Drill Machine (Bosch)',      5, 'SN-DRILL-010',  '2022-08-09', 6500.00,  'Fair', 'Facilities Store',  'QR-0010', 'https://placehold.co/200x200?text=Drill',         FALSE, 'Available',        3),
(11, 'AF-0011', 'Mahindra Bolero (Utility)',  3, 'SN-VEH-011',    '2019-04-22', 950000.00,'Fair', 'Parking Lot A',     'QR-0011', 'https://placehold.co/200x200?text=Utility+Van',   TRUE,  'Available',        3),
(12, 'AF-0012', 'Standing Desk',              2, 'SN-DESK-012',   '2023-07-30', 15000.00, 'Good', 'IT Floor 2',        'QR-0012', 'https://placehold.co/200x200?text=Desk',          FALSE, 'Available',        1),
(13, 'AF-0013', 'Old CRT Monitor (EOL)',      1, 'SN-CRT-013',    '2015-01-10', 8000.00,  'Poor', 'Storage',           'QR-0013', 'https://placehold.co/200x200?text=Monitor',       FALSE, 'Retired',           1),
(14, 'AF-0114', 'Laptop - Lenovo ThinkPad X1',1, 'SN-TP-114',     '2024-01-15', 92000.00, 'Good', 'IT Floor 2',        'QR-0114', 'https://placehold.co/200x200?text=ThinkPad',      FALSE, 'Allocated',        1);