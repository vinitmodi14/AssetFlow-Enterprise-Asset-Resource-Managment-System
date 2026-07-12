CREATE TABLE asset_categories (
    category_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,          -- Electronics, Furniture, Vehicles, Rooms...
    custom_fields   JSON NULL                        -- e.g. {"warranty_period_months": 24}
);departments