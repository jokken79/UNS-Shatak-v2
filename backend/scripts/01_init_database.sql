-- ===========================================
-- UNS-Shatak Database Initialization
-- 社宅管理システム (Apartment Management System)
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUM Types
-- ===========================================

-- Status de apartamento
CREATE TYPE apartment_status AS ENUM (
    'available',      -- 空室 (disponible)
    'occupied',       -- 入居中 (ocupado)
    'maintenance',    -- 修繕中 (en mantenimiento)
    'reserved'        -- 予約済み (reservado)
);

-- Status de empleado
CREATE TYPE employee_status AS ENUM (
    'active',         -- 在籍中 (activo)
    'on_leave',       -- 休職中 (de licencia)
    'terminated',     -- 退職 (terminado)
    'pending'         -- 入社予定 (pendiente)
);

-- Tipo de contrato
CREATE TYPE contract_type AS ENUM (
    'dispatch',       -- 派遣社員
    'contract',       -- 契約社員
    'permanent',      -- 正社員
    'part_time'       -- パート
);

-- ===========================================
-- Tables
-- ===========================================

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Factories table (派遣先)
CREATE TABLE IF NOT EXISTS factories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factory_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_japanese VARCHAR(100),
    address VARCHAR(255),
    city VARCHAR(50),
    prefecture VARCHAR(50),
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apartments table (社宅)
CREATE TABLE IF NOT EXISTS apartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(50),
    prefecture VARCHAR(50),
    postal_code VARCHAR(10),
    building_name VARCHAR(100),
    room_number VARCHAR(20),
    floor INTEGER,
    area_sqm DECIMAL(8,2),
    num_rooms INTEGER DEFAULT 1,
    monthly_rent DECIMAL(10,2),
    deposit DECIMAL(10,2),
    key_money DECIMAL(10,2),
    management_fee DECIMAL(10,2),
    utilities_included BOOLEAN DEFAULT false,
    internet_included BOOLEAN DEFAULT false,
    parking_included BOOLEAN DEFAULT false,
    parking_fee DECIMAL(10,2),
    nearest_station VARCHAR(100),
    walking_minutes INTEGER,
    contract_start_date DATE,
    contract_end_date DATE,
    landlord_name VARCHAR(100),
    landlord_phone VARCHAR(20),
    landlord_company VARCHAR(100),
    status apartment_status DEFAULT 'available',
    capacity INTEGER DEFAULT 1,
    current_occupants INTEGER DEFAULT 0,
    notes TEXT,
    photos JSONB DEFAULT '[]',
    amenities JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employees table (従業員)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    full_name_roman VARCHAR(100) NOT NULL,
    full_name_kanji VARCHAR(100),
    full_name_furigana VARCHAR(100),
    nationality VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    visa_type VARCHAR(50),
    visa_expiry DATE,
    zairyu_card_number VARCHAR(20),
    passport_number VARCHAR(20),
    passport_expiry DATE,
    employment_start_date DATE,
    employment_end_date DATE,
    contract_type contract_type DEFAULT 'dispatch',
    hourly_rate DECIMAL(10,2),
    monthly_salary DECIMAL(12,2),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    bank_account_number VARCHAR(20),
    bank_account_holder VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,
    apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL,
    status employee_status DEFAULT 'active',
    photo_url VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apartment assignments history (入居履歴)
CREATE TABLE IF NOT EXISTS apartment_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    monthly_charge DECIMAL(10,2),
    deposit_paid DECIMAL(10,2),
    is_current BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(apartment_id, employee_id, move_in_date)
);

-- Import logs (インポート履歴)
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    total_rows INTEGER,
    successful_rows INTEGER,
    failed_rows INTEGER,
    errors JSONB DEFAULT '[]',
    imported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES users(id),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Indexes
-- ===========================================

CREATE INDEX idx_apartments_status ON apartments(status);
CREATE INDEX idx_apartments_city ON apartments(city);
CREATE INDEX idx_apartments_prefecture ON apartments(prefecture);
CREATE INDEX idx_apartments_is_active ON apartments(is_active);

CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_factory_id ON employees(factory_id);
CREATE INDEX idx_employees_apartment_id ON employees(apartment_id);
CREATE INDEX idx_employees_full_name_roman ON employees(full_name_roman);
CREATE INDEX idx_employees_is_active ON employees(is_active);

CREATE INDEX idx_factories_is_active ON factories(is_active);
CREATE INDEX idx_factories_name ON factories(name);

CREATE INDEX idx_apartment_assignments_apartment_id ON apartment_assignments(apartment_id);
CREATE INDEX idx_apartment_assignments_employee_id ON apartment_assignments(employee_id);
CREATE INDEX idx_apartment_assignments_is_current ON apartment_assignments(is_current);

CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ===========================================
-- Triggers for updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_factories_updated_at BEFORE UPDATE ON factories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartments_updated_at BEFORE UPDATE ON apartments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartment_assignments_updated_at BEFORE UPDATE ON apartment_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Default Admin User
-- Password: admin123 (bcrypt hash)
-- ===========================================

INSERT INTO users (username, email, hashed_password, full_name, role, is_active)
VALUES (
    'admin',
    'admin@uns-shatak.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4aw5E/Lv.Hg9ZJKG',
    'Administrator',
    'admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- ===========================================
-- Sample Data (Optional)
-- ===========================================

-- Sample Factory
INSERT INTO factories (factory_code, name, name_japanese, address, city, prefecture, postal_code, phone, contact_person)
VALUES 
    ('FAC001', 'Toyota Kariya Plant', 'トヨタ刈谷工場', '1 Toyota-cho', 'Kariya', 'Aichi', '448-8671', '0566-28-2121', 'Tanaka Taro'),
    ('FAC002', 'Honda Suzuka Factory', 'ホンダ鈴鹿製作所', '1907 Hirano-cho', 'Suzuka', 'Mie', '513-8543', '059-370-1111', 'Suzuki Hanako'),
    ('FAC003', 'Denso Anjo Plant', 'デンソー安城製作所', '1-1 Showa-cho', 'Anjo', 'Aichi', '446-8501', '0566-76-1511', 'Yamamoto Kenji')
ON CONFLICT (factory_code) DO NOTHING;

-- Sample Apartments
INSERT INTO apartments (apartment_code, name, address, city, prefecture, postal_code, building_name, room_number, floor, area_sqm, num_rooms, monthly_rent, nearest_station, walking_minutes, status, capacity)
VALUES 
    ('APT001', '社宅A-101', '1-2-3 Minami-cho', 'Kariya', 'Aichi', '448-0001', 'UNS Heights A', '101', 1, 25.5, 1, 45000, 'Kariya Station', 10, 'available', 2),
    ('APT002', '社宅A-201', '1-2-3 Minami-cho', 'Kariya', 'Aichi', '448-0001', 'UNS Heights A', '201', 2, 30.0, 1, 50000, 'Kariya Station', 10, 'available', 2),
    ('APT003', '社宅B-102', '4-5-6 Kita-machi', 'Suzuka', 'Mie', '513-0001', 'UNS Heights B', '102', 1, 28.0, 1, 42000, 'Shiroko Station', 15, 'available', 2),
    ('APT004', '社宅C-301', '7-8-9 Higashi', 'Anjo', 'Aichi', '446-0001', 'UNS Heights C', '301', 3, 35.0, 2, 55000, 'Anjo Station', 8, 'available', 3)
ON CONFLICT (apartment_code) DO NOTHING;

COMMIT;
