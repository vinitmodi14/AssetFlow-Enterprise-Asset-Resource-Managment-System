CREATE TABLE asset_categories (
    category_id     INT  PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,          -- Electronics, Furniture, Vehicles, Rooms...
    custom_fields   JSON NULL                        -- e.g. {"warranty_period_months": 24}
);departments

INSERT INTO asset_categories (category_id, name, custom_fields) VALUES
(1, 'Electronics', JSON_OBJECT('warranty_period_months', 24)),
(2, 'Furniture',   JSON_OBJECT('material', 'Wood/Metal')),
(3, 'Vehicles',    JSON_OBJECT('registration_expiry', 'yearly')),
(4, 'Rooms',       JSON_OBJECT('capacity', 'variable')),
(5, 'Tools/Equipment', NULL);