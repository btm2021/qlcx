Hệ Thống Database Cầm Xe - Supabase (PostgreSQL)
Sơ đồ tổng quan
text

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PAWN SHOP DATABASE SCHEMA                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────────────┐  │
│  │  staff    │    │  customers   │    │ vehicle_      │    │  contract_types      │  │
│  │          │    │              │    │ categories    │    │                      │  │
│  └────┬─────┘    └──────┬───────┘    └───┬───────────┘    └──────────┬───────────┘  │
│       │                 │                │                           │              │
│       │                 │    ┌───────────┼───────────┐               │              │
│       │                 │    │           │           │               │              │
│       │                 │    ▼           │           ▼               │              │
│       │                 │  ┌─────────────┴──┐  ┌────────────────┐   │              │
│       │                 │  │ property_      │  │ category_      │   │              │
│       │                 │  │ definitions    │  │ properties     │   │              │
│       │                 │  └────────┬───────┘  │ (junction)     │   │              │
│       │                 │           │          └────────────────┘   │              │
│       │                 │           │                               │              │
│       ▼                 ▼           │                               ▼              │
│  ┌──────────────────────────────────┼───────────────────────────────────────┐       │
│  │                    contracts     │                                       │       │
│  │         (qr_code = CAR-RENTAL-20260206-01)                             │       │
│  └────┬─────────┬──────────┬───────┼────────┬──────────┬──────────────────┘       │
│       │         │          │       │        │          │                           │
│       ▼         ▼          ▼       ▼        ▼          ▼                           │
│  ┌────────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌──────────────┐              │
│  │vehicles│ │contract│ │inspect│ │activ.│ │status │ │  contract_   │              │
│  │        │ │_images │ │_logs  │ │_logs │ │history│ │  payments    │              │
│  └───┬────┘ └────────┘ └───────┘ └──────┘ └───────┘ └──────────────┘              │
│      │                                                                             │
│      ▼                              ┌─────────────────────────┐                    │
│  ┌─────────────────┐                │ daily_sequence_counters │                    │
│  │ vehicle_property│                └─────────────────────────┘                    │
│  │ _values (EAV)   │                                                               │
│  └─────────────────┘                                                               │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
SQL Schema đầy đủ
SQL

-- ================================================================
-- PAWN SHOP DATABASE SCHEMA - SUPABASE (PostgreSQL)
-- Version: 1.0
-- Mô tả: Hệ thống quản lý cầm đồ xe cơ giới
-- ================================================================

-- ================================================================
-- PHẦN 0: EXTENSIONS & ENUM TYPES
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Hỗ trợ tìm kiếm fuzzy

-- Trạng thái hợp đồng
CREATE TYPE contract_status_enum AS ENUM (
    'DRAFT',        -- Nháp, đang tạo
    'ACTIVE',       -- Đang hoạt động
    'EXTENDED',     -- Đã gia hạn
    'OVERDUE',      -- Quá hạn
    'REDEEMED',     -- Đã chuộc lại
    'LIQUIDATING',  -- Đang thanh lý
    'LIQUIDATED',   -- Đã thanh lý
    'CANCELLED'     -- Đã hủy
);

-- Kiểu dữ liệu thuộc tính
CREATE TYPE property_data_type_enum AS ENUM (
    'TEXT',        -- Chuỗi văn bản
    'INTEGER',     -- Số nguyên
    'DECIMAL',     -- Số thập phân
    'BOOLEAN',     -- Đúng/Sai
    'DATE',        -- Ngày tháng
    'SELECT',      -- Danh sách lựa chọn
    'MULTI_SELECT' -- Nhiều lựa chọn
);

-- Kết quả kiểm tra định kỳ
CREATE TYPE inspection_result_enum AS ENUM (
    'PRESENT',   -- Tài sản còn trong kho
    'MISSING'    -- Tài sản không tìm thấy
);

-- Loại hình ảnh
CREATE TYPE image_type_enum AS ENUM (
    'RECEIVING',   -- Khi nhận xe vào kho
    'INSPECTION',  -- Khi kiểm tra định kỳ
    'RETURNING',   -- Khi trả xe
    'DAMAGE',      -- Hình ảnh hư hỏng (nếu cần)
    'DOCUMENT',    -- Giấy tờ xe
    'OTHER'
);

-- Loại thanh toán
CREATE TYPE payment_type_enum AS ENUM (
    'INTEREST',      -- Trả lãi
    'PARTIAL',       -- Trả một phần gốc
    'FULL_REDEEM',   -- Chuộc toàn bộ
    'EXTENSION_FEE', -- Phí gia hạn
    'PENALTY',       -- Phí phạt
    'OTHER'
);

-- Phương thức thanh toán
CREATE TYPE payment_method_enum AS ENUM (
    'CASH',          -- Tiền mặt
    'BANK_TRANSFER', -- Chuyển khoản
    'OTHER'
);

-- ================================================================
-- PHẦN 1: BẢNG NHÂN VIÊN (STAFF)
-- ================================================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_code VARCHAR(20) UNIQUE NOT NULL,  -- Mã nhân viên: NV001, NV002...
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,                       -- Supabase Auth quản lý, hoặc hash riêng
    auth_user_id UUID UNIQUE,                -- Liên kết với Supabase Auth (auth.users.id)
    role VARCHAR(50) NOT NULL DEFAULT 'STAFF' 
        CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_code ON staff(staff_code);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_active ON staff(is_active);
CREATE INDEX idx_staff_auth_user ON staff(auth_user_id);

COMMENT ON TABLE staff IS 'Bảng nhân viên hệ thống cầm đồ';
COMMENT ON COLUMN staff.staff_code IS 'Mã định danh nhân viên duy nhất, dùng trong log: NV001';
COMMENT ON COLUMN staff.auth_user_id IS 'Liên kết với Supabase Auth để xác thực';

-- ================================================================
-- PHẦN 2: BẢNG KHÁCH HÀNG (CUSTOMERS)
-- ================================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    
    -- Giấy tờ tùy thân chính
    id_card_type VARCHAR(20) DEFAULT 'CCCD'
        CHECK (id_card_type IN ('CMND', 'CCCD', 'PASSPORT', 'OTHER')),
    id_card_number VARCHAR(30),
    id_card_issued_date DATE,
    id_card_issued_place VARCHAR(255),
    id_card_expiry_date DATE,
    
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    
    -- Ảnh giấy tờ
    id_card_front_image TEXT,   -- URL/path ảnh mặt trước
    id_card_back_image TEXT,    -- URL/path ảnh mặt sau
    portrait_image TEXT,        -- URL/path ảnh chân dung
    
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_id_card ON customers(id_card_number);
CREATE INDEX idx_customers_name ON customers USING gin(full_name gin_trgm_ops);

COMMENT ON TABLE customers IS 'Bảng khách hàng cầm đồ';
COMMENT ON COLUMN customers.id_card_number IS 'Số CMND/CCCD/Hộ chiếu';

-- ================================================================
-- PHẦN 3: DANH MỤC LOẠI XE (VEHICLE CATEGORIES)
-- ================================================================

CREATE TABLE vehicle_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,   -- CAR, MTR, TRK, VAN, BIK, SPE
    name VARCHAR(100) NOT NULL,         -- Ô tô con, Xe máy/mô tô, Xe tải...
    description TEXT,
    
    -- Cấu hình riêng cho từng loại
    icon VARCHAR(50),                   -- Icon hiển thị trên UI
    default_loan_ratio DECIMAL(5,2) DEFAULT 70.00,  -- % giá trị cho vay mặc định
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_categories_code ON vehicle_categories(code);
CREATE INDEX idx_vehicle_categories_active ON vehicle_categories(is_active);

COMMENT ON TABLE vehicle_categories IS 'Danh mục loại xe: CAR, MTR, TRK, VAN, BIK, SPE';
COMMENT ON COLUMN vehicle_categories.code IS 'Mã viết tắt 3-4 ký tự, dùng trong QR code';
COMMENT ON COLUMN vehicle_categories.default_loan_ratio IS 'Tỷ lệ % cho vay mặc định so với giá trị thẩm định';

-- ================================================================
-- PHẦN 4: ĐỊNH NGHĨA THUỘC TÍNH (PROPERTY DEFINITIONS)
-- Mỗi thuộc tính như: dung tích xi-lanh, số chỗ ngồi, loại hộp số...
-- ================================================================

CREATE TABLE property_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,       -- engine_capacity, num_seats, transmission...
    name VARCHAR(255) NOT NULL,             -- Dung tích xi-lanh, Số chỗ ngồi, Hộp số...
    data_type property_data_type_enum NOT NULL DEFAULT 'TEXT',
    unit VARCHAR(50),                       -- cc, kg, km, năm...
    description TEXT,
    
    -- Cho kiểu SELECT / MULTI_SELECT: danh sách tùy chọn
    -- Ví dụ: ["Số sàn", "Số tự động", "CVT"]
    select_options JSONB DEFAULT '[]'::jsonb,
    
    -- Quy tắc validation
    -- Ví dụ: {"min": 50, "max": 10000, "pattern": "^[A-Z0-9]+$"}
    validation_rules JSONB DEFAULT '{}'::jsonb,
    
    -- Nhóm hiển thị để UI phân nhóm
    display_group VARCHAR(100),             -- "Thông số kỹ thuật", "Giấy tờ", "Khác"
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_definitions_code ON property_definitions(code);
CREATE INDEX idx_property_definitions_group ON property_definitions(display_group);
CREATE INDEX idx_property_definitions_active ON property_definitions(is_active);

COMMENT ON TABLE property_definitions IS 'Bảng định nghĩa tất cả thuộc tính có thể có của xe';
COMMENT ON COLUMN property_definitions.code IS 'Mã thuộc tính duy nhất, dùng trong code: engine_capacity';
COMMENT ON COLUMN property_definitions.data_type IS 'Kiểu dữ liệu: TEXT, INTEGER, DECIMAL, BOOLEAN, DATE, SELECT, MULTI_SELECT';
COMMENT ON COLUMN property_definitions.select_options IS 'Mảng JSON chứa các lựa chọn cho SELECT/MULTI_SELECT';
COMMENT ON COLUMN property_definitions.validation_rules IS 'JSON chứa quy tắc validation: min, max, pattern, required_message...';

-- ================================================================
-- PHẦN 5: BẢNG TRUNG GIAN - THUỘC TÍNH THEO DANH MỤC XE
-- (CATEGORY_PROPERTIES - Junction Table)
-- Quy định mỗi loại xe có những thuộc tính nào
-- VD: CAR -> [engine_capacity, num_seats, transmission, fuel_type...]
--     MTR -> [engine_capacity, frame_type...]
-- ================================================================

CREATE TABLE category_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES property_definitions(id) ON DELETE CASCADE,
    
    is_required BOOLEAN NOT NULL DEFAULT FALSE,  -- Bắt buộc nhập hay không
    default_value TEXT,                          -- Giá trị mặc định cho loại xe này
    
    -- Override validation cho từng loại xe
    -- VD: engine_capacity cho CAR min=500, cho MTR min=50
    override_validation JSONB DEFAULT NULL,
    
    -- Override select_options cho từng loại xe  
    -- VD: fuel_type cho MTR chỉ có ["Xăng"], CAR có ["Xăng","Dầu","Điện","Hybrid"]
    override_select_options JSONB DEFAULT NULL,
    
    sort_order INTEGER NOT NULL DEFAULT 0,  -- Thứ tự hiển thị trong form
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_category_property UNIQUE(category_id, property_id)
);

CREATE INDEX idx_category_properties_cat ON category_properties(category_id);
CREATE INDEX idx_category_properties_prop ON category_properties(property_id);

COMMENT ON TABLE category_properties IS 'Bảng trung gian: quy định loại xe nào có thuộc tính nào';
COMMENT ON COLUMN category_properties.is_required IS 'Thuộc tính này bắt buộc phải nhập khi tạo xe thuộc danh mục này';
COMMENT ON COLUMN category_properties.override_validation IS 'Ghi đè validation_rules của property_definitions cho loại xe cụ thể';
COMMENT ON COLUMN category_properties.override_select_options IS 'Ghi đè select_options cho loại xe cụ thể';

-- ================================================================
-- PHẦN 6: LOẠI HỢP ĐỒNG (CONTRACT TYPES)
-- ================================================================

CREATE TABLE contract_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,       -- RENTAL, SALE, PAWN, LEASE, CONSIGN
    name VARCHAR(100) NOT NULL,             -- Cho thuê, Mua bán, Cầm đồ...
    description TEXT,
    
    -- Cấu hình mặc định
    default_duration_days INTEGER,           -- Thời hạn mặc định (ngày)
    default_interest_rate DECIMAL(5,2),      -- Lãi suất mặc định (%/tháng)
    allow_extension BOOLEAN DEFAULT TRUE,    -- Cho phép gia hạn
    max_extensions INTEGER DEFAULT 3,        -- Số lần gia hạn tối đa
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_types_code ON contract_types(code);
CREATE INDEX idx_contract_types_active ON contract_types(is_active);

COMMENT ON TABLE contract_types IS 'Danh mục loại hợp đồng: RENTAL, SALE, PAWN, LEASE, CONSIGN';
COMMENT ON COLUMN contract_types.code IS 'Mã loại hợp đồng, dùng trong QR code';

-- ================================================================
-- PHẦN 7: BỘ ĐẾM SỐ THỨ TỰ THEO NGÀY (DAILY SEQUENCE COUNTERS)
-- Reset về 0 mỗi đầu ngày, tăng dần khi tạo hợp đồng mới
-- Unique theo: ngày + mã loại xe + mã loại hợp đồng
-- ================================================================

CREATE TABLE daily_sequence_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counter_date DATE NOT NULL,                     -- Ngày đếm
    vehicle_category_code VARCHAR(10) NOT NULL,     -- CAR, MTR...
    contract_type_code VARCHAR(20) NOT NULL,        -- RENTAL, PAWN...
    current_sequence INTEGER NOT NULL DEFAULT 0,    -- Số thứ tự hiện tại
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_daily_counter UNIQUE(counter_date, vehicle_category_code, contract_type_code)
);

CREATE INDEX idx_daily_counter_date ON daily_sequence_counters(counter_date);

COMMENT ON TABLE daily_sequence_counters IS 'Bộ đếm số thứ tự hợp đồng, reset mỗi ngày. Đảm bảo QR code duy nhất';
COMMENT ON COLUMN daily_sequence_counters.current_sequence IS 'Số thứ tự hiện tại, tăng dần trong ngày';

-- ================================================================
-- PHẦN 8: HỢP ĐỒNG CẦM ĐỒ (CONTRACTS) - Bảng chính
-- ================================================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- ===== MÃ QR / MÃ HỢP ĐỒNG =====
    -- Format: {vehicle_category_code}-{contract_type_code}-{YYYYMMDD}-{sequence}
    -- Ví dụ: CAR-RENTAL-20260206-01
    qr_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- ===== LIÊN KẾT =====
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_category_id UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE RESTRICT,
    contract_type_id UUID NOT NULL REFERENCES contract_types(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    
    -- ===== TRẠNG THÁI =====
    status contract_status_enum NOT NULL DEFAULT 'DRAFT',
    
    -- ===== TÀI CHÍNH =====
    appraised_value DECIMAL(15,2),          -- Giá trị thẩm định tài sản
    loan_amount DECIMAL(15,2),              -- Số tiền cho vay thực tế
    interest_rate DECIMAL(5,2),             -- Lãi suất áp dụng (%/tháng)
    total_interest_paid DECIMAL(15,2) DEFAULT 0,  -- Tổng lãi đã trả
    total_amount_paid DECIMAL(15,2) DEFAULT 0,    -- Tổng tiền đã trả (gốc + lãi)
    outstanding_balance DECIMAL(15,2) DEFAULT 0,  -- Số dư còn lại
    
    -- ===== THỜI GIAN =====
    contract_date DATE NOT NULL,             -- Ngày ký hợp đồng (= ngày trong QR code)
    start_date DATE NOT NULL,                -- Ngày bắt đầu hiệu lực
    due_date DATE,                           -- Ngày đáo hạn
    actual_end_date DATE,                    -- Ngày kết thúc thực tế (chuộc/thanh lý)
    extension_count INTEGER NOT NULL DEFAULT 0,  -- Số lần đã gia hạn
    
    -- ===== SỐ THỨ TỰ =====
    sequence_number INTEGER NOT NULL,        -- Số thứ tự trong ngày (phần cuối QR code)
    
    -- ===== GHI CHÚ =====
    notes TEXT,
    
    -- ===== XÁC NHẬN TIẾP NHẬN =====
    is_asset_received BOOLEAN NOT NULL DEFAULT FALSE,  -- Đã tiếp nhận tài sản chưa
    received_at TIMESTAMPTZ,                            -- Thời điểm tiếp nhận
    received_by UUID REFERENCES staff(id),              -- Nhân viên tiếp nhận
    
    -- ===== TIMESTAMPS =====
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_qr_code ON contracts(qr_code);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_category ON contracts(vehicle_category_id);
CREATE INDEX idx_contracts_type ON contracts(contract_type_id);
CREATE INDEX idx_contracts_date ON contracts(contract_date);
CREATE INDEX idx_contracts_due_date ON contracts(due_date);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_contracts_active ON contracts(status) WHERE status IN ('ACTIVE', 'EXTENDED', 'OVERDUE');

COMMENT ON TABLE contracts IS 'Bảng hợp đồng cầm đồ - bảng trung tâm của hệ thống';
COMMENT ON COLUMN contracts.qr_code IS 'Mã QR duy nhất: CAR-RENTAL-20260206-01. Thay thế UUID làm mã định danh nghiệp vụ';
COMMENT ON COLUMN contracts.is_asset_received IS 'Xác nhận đã tiếp nhận tài sản và chụp ảnh (checkbox đơn giản)';

-- ================================================================
-- PHẦN 9: XE CẦM (VEHICLES) - Thông tin cơ bản chung
-- ================================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE RESTRICT,
    
    -- ===== THÔNG TIN CHUNG MỌI LOẠI XE =====
    brand VARCHAR(100),                -- Hãng xe: Toyota, Honda, Yamaha...
    model VARCHAR(100),                -- Dòng xe: Camry, Wave, Exciter...
    year_of_manufacture INTEGER,       -- Năm sản xuất
    color VARCHAR(50),                 -- Màu sắc chính
    
    -- ===== THÔNG TIN PHÁP LÝ =====
    license_plate VARCHAR(20),         -- Biển số xe: 51A-123.45
    registration_number VARCHAR(50),   -- Số đăng ký (trong giấy đăng ký xe)
    engine_number VARCHAR(100),        -- Số máy
    chassis_number VARCHAR(100),       -- Số khung/số VIN
    registration_date DATE,            -- Ngày đăng ký
    registration_expiry_date DATE,     -- Hạn đăng kiểm
    owner_name VARCHAR(255),           -- Tên chủ sở hữu trên giấy tờ
    
    -- ===== LƯU KHO =====
    storage_location VARCHAR(255),     -- Vị trí trong kho: "Kho A - Dãy 3 - Ô 15"
    key_count INTEGER DEFAULT 1,       -- Số lượng chìa khóa nhận được
    
    -- ===== GHI CHÚ =====
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vehicles_contract ON vehicles(contract_id);  -- 1 hợp đồng : 1 xe
CREATE INDEX idx_vehicles_category ON vehicles(category_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_engine_number ON vehicles(engine_number);
CREATE INDEX idx_vehicles_chassis_number ON vehicles(chassis_number);
CREATE INDEX idx_vehicles_brand_model ON vehicles(brand, model);

COMMENT ON TABLE vehicles IS 'Thông tin xe cầm. Chứa các trường chung, thuộc tính riêng lưu ở vehicle_property_values';
COMMENT ON COLUMN vehicles.license_plate IS 'Biển số xe, có index để tra cứu nhanh';

-- ================================================================
-- PHẦN 10: GIÁ TRỊ THUỘC TÍNH XE (VEHICLE PROPERTY VALUES - EAV Pattern)
-- Lưu các thuộc tính linh hoạt theo từng loại xe
-- VD: xe ô tô có num_seats=5, transmission=Số tự động
--     xe máy có frame_type=Số, engine_capacity=150
-- ================================================================

CREATE TABLE vehicle_property_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES property_definitions(id) ON DELETE RESTRICT,
    
    -- Giá trị lưu theo đúng kiểu dữ liệu, chỉ 1 cột có giá trị, còn lại NULL
    value_text TEXT,               -- Cho TEXT, SELECT, MULTI_SELECT
    value_integer BIGINT,          -- Cho INTEGER
    value_decimal DECIMAL(15,4),   -- Cho DECIMAL
    value_boolean BOOLEAN,         -- Cho BOOLEAN
    value_date DATE,               -- Cho DATE
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_vehicle_property UNIQUE(vehicle_id, property_id)
);

CREATE INDEX idx_vpv_vehicle ON vehicle_property_values(vehicle_id);
CREATE INDEX idx_vpv_property ON vehicle_property_values(property_id);
CREATE INDEX idx_vpv_text ON vehicle_property_values(value_text) WHERE value_text IS NOT NULL;
CREATE INDEX idx_vpv_integer ON vehicle_property_values(value_integer) WHERE value_integer IS NOT NULL;

COMMENT ON TABLE vehicle_property_values IS 'EAV pattern: lưu giá trị thuộc tính linh hoạt theo từng xe';
COMMENT ON COLUMN vehicle_property_values.value_text IS 'Giá trị text, dùng cho data_type TEXT/SELECT/MULTI_SELECT';
COMMENT ON COLUMN vehicle_property_values.value_integer IS 'Giá trị số nguyên, dùng cho data_type INTEGER';
COMMENT ON COLUMN vehicle_property_values.value_decimal IS 'Giá trị số thập phân, dùng cho data_type DECIMAL';

-- ================================================================
-- PHẦN 11: GIẤY TỜ XE (VEHICLE DOCUMENTS)
-- Lưu thông tin các giấy tờ đi kèm xe
-- ================================================================

CREATE TABLE vehicle_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL
        CHECK (document_type IN (
            'REGISTRATION',       -- Giấy đăng ký xe
            'INSURANCE',          -- Bảo hiểm
            'INSPECTION_CERT',    -- Giấy đăng kiểm
            'PURCHASE_INVOICE',   -- Hóa đơn mua xe
            'AUTHORIZATION',      -- Giấy ủy quyền
            'OTHER'
        )),
    document_name VARCHAR(255) NOT NULL,    -- Tên giấy tờ
    document_number VARCHAR(100),           -- Số giấy tờ
    issued_date DATE,
    expiry_date DATE,
    
    -- Ảnh scan/chụp giấy tờ
    file_path TEXT,              -- URL/path lưu trữ
    file_name VARCHAR(255),
    
    notes TEXT,
    is_returned BOOLEAN NOT NULL DEFAULT FALSE,  -- Đã trả lại cho khách chưa
    returned_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_docs_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX idx_vehicle_docs_type ON vehicle_documents(document_type);

COMMENT ON TABLE vehicle_documents IS 'Giấy tờ đi kèm xe cầm: đăng ký, bảo hiểm, đăng kiểm...';

-- ================================================================
-- PHẦN 12: HÌNH ẢNH HỢP ĐỒNG (CONTRACT IMAGES)
-- Bằng chứng trực quan - thay thế checklist chi tiết
-- ================================================================

CREATE TABLE contract_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    
    image_type image_type_enum NOT NULL DEFAULT 'RECEIVING',
    
    -- Thông tin file
    file_path TEXT NOT NULL,             -- URL Supabase Storage hoặc đường dẫn
    file_name VARCHAR(255) NOT NULL,     -- Tên file gốc hoặc đã đổi tên
    file_size INTEGER,                   -- Kích thước bytes
    mime_type VARCHAR(50) DEFAULT 'image/jpeg',
    
    -- Thông tin bổ sung
    caption TEXT,                        -- Mô tả ngắn (tùy chọn)
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Người upload
    uploaded_by UUID NOT NULL REFERENCES staff(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_images_contract ON contract_images(contract_id);
CREATE INDEX idx_contract_images_type ON contract_images(image_type);

COMMENT ON TABLE contract_images IS 'Hình ảnh tài sản: bằng chứng trực quan thay thế checklist chi tiết';
COMMENT ON COLUMN contract_images.file_path IS 'Đường dẫn: /storage/YYYY/MM/DD/{contract_qr_code}/{filename}.jpg';

-- ================================================================
-- PHẦN 13: LOG KIỂM TRA ĐỊNH KỲ (INSPECTION LOGS)
-- Chỉ xác nhận sự hiện diện, không đánh giá tình trạng
-- ================================================================

CREATE TABLE inspection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    
    -- Kết quả: PRESENT hoặc MISSING (2 trạng thái duy nhất)
    result inspection_result_enum NOT NULL,
    
    -- GPS Location (thu thập tự động từ thiết bị)
    gps_latitude DECIMAL(10,7),      -- Vĩ độ: 10.762622
    gps_longitude DECIMAL(10,7),     -- Kinh độ: 106.660172
    gps_accuracy DECIMAL(8,2),       -- Độ chính xác (mét): ±10m
    
    -- Ghi chú khi MISSING
    missing_note TEXT,               -- Chỉ dùng khi result = MISSING
    
    -- Thời điểm kiểm tra
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspection_contract ON inspection_logs(contract_id);
CREATE INDEX idx_inspection_staff ON inspection_logs(staff_id);
CREATE INDEX idx_inspection_date ON inspection_logs(inspected_at);
CREATE INDEX idx_inspection_result ON inspection_logs(result);
CREATE INDEX idx_inspection_missing ON inspection_logs(result) WHERE result = 'MISSING';

COMMENT ON TABLE inspection_logs IS 'Log kiểm tra định kỳ: chỉ xác nhận tài sản còn/mất, không đánh giá tình trạng';
COMMENT ON COLUMN inspection_logs.result IS 'Chỉ 2 trạng thái: PRESENT (còn) hoặc MISSING (mất)';
COMMENT ON COLUMN inspection_logs.gps_latitude IS 'Tọa độ GPS xác minh nhân viên có mặt tại kho';

-- ================================================================
-- PHẦN 14: LOG HOẠT ĐỘNG (ACTIVITY LOGS) - Tối thiểu
-- Chỉ 3 thông tin bắt buộc: timestamp, staff_id, contract_id
-- ================================================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 3 thông tin bắt buộc theo nghiệp vụ
    log_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- KHI NÀO
    staff_id UUID NOT NULL REFERENCES staff(id),        -- AI LÀM
    contract_id UUID REFERENCES contracts(id),          -- ĐỐI TƯỢNG NÀO
    
    -- Loại hành động
    action VARCHAR(50) NOT NULL
        CHECK (action IN (
            'CONTRACT_CREATED',     -- Tạo hợp đồng
            'ASSET_RECEIVED',       -- Tiếp nhận tài sản
            'PHOTO_UPLOADED',       -- Upload ảnh
            'INSPECTION_DONE',      -- Kiểm tra định kỳ
            'PAYMENT_RECEIVED',     -- Nhận thanh toán
            'CONTRACT_EXTENDED',    -- Gia hạn hợp đồng
            'CONTRACT_REDEEMED',    -- Chuộc tài sản
            'CONTRACT_LIQUIDATED',  -- Thanh lý
            'CONTRACT_CANCELLED',   -- Hủy hợp đồng
            'STATUS_CHANGED',       -- Đổi trạng thái
            'QR_SCANNED',           -- Quét QR code
            'OTHER'
        )),
    
    -- Ghi chú tùy chọn (tối thiểu)
    note TEXT
);

CREATE INDEX idx_activity_logs_timestamp ON activity_logs(log_timestamp);
CREATE INDEX idx_activity_logs_staff ON activity_logs(staff_id);
CREATE INDEX idx_activity_logs_contract ON activity_logs(contract_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

COMMENT ON TABLE activity_logs IS 'Log hoạt động tối thiểu: chỉ timestamp + staff_id + contract_id. Không metadata phức tạp';

-- ================================================================
-- PHẦN 15: LỊCH SỬ TRẠNG THÁI HỢP ĐỒNG (CONTRACT STATUS HISTORY)
-- ================================================================

CREATE TABLE contract_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    
    old_status contract_status_enum,
    new_status contract_status_enum NOT NULL,
    
    changed_by UUID NOT NULL REFERENCES staff(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX idx_status_history_contract ON contract_status_history(contract_id);
CREATE INDEX idx_status_history_date ON contract_status_history(changed_at);

COMMENT ON TABLE contract_status_history IS 'Lịch sử thay đổi trạng thái hợp đồng, hỗ trợ truy vết';

-- ================================================================
-- PHẦN 16: THANH TOÁN (CONTRACT PAYMENTS)
-- ================================================================

CREATE TABLE contract_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
    
    payment_type payment_type_enum NOT NULL,
    payment_method payment_method_enum NOT NULL DEFAULT 'CASH',
    
    amount DECIMAL(15,2) NOT NULL,         -- Số tiền thanh toán
    interest_amount DECIMAL(15,2) DEFAULT 0,  -- Phần lãi
    principal_amount DECIMAL(15,2) DEFAULT 0, -- Phần gốc
    penalty_amount DECIMAL(15,2) DEFAULT 0,   -- Phần phạt
    
    payment_date DATE NOT NULL,
    
    -- Nhân viên thu
    received_by UUID NOT NULL REFERENCES staff(id),
    
    notes TEXT,
    receipt_number VARCHAR(50),            -- Số biên lai/phiếu thu
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_contract ON contract_payments(contract_id);
CREATE INDEX idx_payments_date ON contract_payments(payment_date);
CREATE INDEX idx_payments_type ON contract_payments(payment_type);
CREATE INDEX idx_payments_received_by ON contract_payments(received_by);

COMMENT ON TABLE contract_payments IS 'Lịch sử thanh toán: lãi, gốc, phí gia hạn, phạt...';

-- ================================================================
-- PHẦN 17: CẤU HÌNH HỆ THỐNG (SYSTEM SETTINGS)
-- ================================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'TEXT'
        CHECK (data_type IN ('TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'JSON')),
    description TEXT,
    updated_by UUID REFERENCES staff(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'Cấu hình hệ thống: lãi suất mặc định, thời hạn, cấu hình QR...';


-- ================================================================
-- PHẦN 18: FUNCTIONS & TRIGGERS
-- ================================================================

-- ----- Function: Tự động cập nhật updated_at -----
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho tất cả bảng có updated_at
CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_vehicle_categories_updated_at
    BEFORE UPDATE ON vehicle_categories FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_property_definitions_updated_at
    BEFORE UPDATE ON property_definitions FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_contract_types_updated_at
    BEFORE UPDATE ON contract_types FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_contracts_updated_at
    BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_vehicle_property_values_updated_at
    BEFORE UPDATE ON vehicle_property_values FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_vehicle_documents_updated_at
    BEFORE UPDATE ON vehicle_documents FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_contract_payments_updated_at
    BEFORE UPDATE ON contract_payments FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ----- Function: Lấy số thứ tự tiếp theo (atomic) -----
CREATE OR REPLACE FUNCTION fn_get_next_sequence(
    p_vehicle_category_code VARCHAR,
    p_contract_type_code VARCHAR,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_next_seq INTEGER;
BEGIN
    -- Upsert: tạo mới hoặc tăng sequence
    INSERT INTO daily_sequence_counters (
        counter_date, 
        vehicle_category_code, 
        contract_type_code, 
        current_sequence,
        updated_at
    )
    VALUES (
        p_date, 
        p_vehicle_category_code, 
        p_contract_type_code, 
        1,
        NOW()
    )
    ON CONFLICT (counter_date, vehicle_category_code, contract_type_code) 
    DO UPDATE SET 
        current_sequence = daily_sequence_counters.current_sequence + 1,
        updated_at = NOW()
    RETURNING current_sequence INTO v_next_seq;
    
    RETURN v_next_seq;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_next_sequence IS 'Lấy số thứ tự tiếp theo cho QR code, atomic upsert đảm bảo không race condition';


-- ----- Function: Tạo mã QR code -----
CREATE OR REPLACE FUNCTION fn_generate_qr_code(
    p_vehicle_category_code VARCHAR,
    p_contract_type_code VARCHAR,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR AS $$
DECLARE
    v_sequence INTEGER;
    v_date_str VARCHAR;
    v_qr_code VARCHAR;
BEGIN
    -- Lấy số thứ tự tiếp theo
    v_sequence := fn_get_next_sequence(p_vehicle_category_code, p_contract_type_code, p_date);
    
    -- Format ngày: YYYYMMDD
    v_date_str := TO_CHAR(p_date, 'YYYYMMDD');
    
    -- Tạo QR code: CAR-RENTAL-20260206-01
    v_qr_code := p_vehicle_category_code || '-' || 
                 p_contract_type_code || '-' || 
                 v_date_str || '-' || 
                 LPAD(v_sequence::TEXT, 2, '0');
    
    RETURN v_qr_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_qr_code IS 'Tạo mã QR code theo cấu trúc: LOẠI_XE-LOẠI_HĐ-YYYYMMDD-SỐ_THỨ_TỰ';


-- ----- Function: Ghi log trạng thái hợp đồng tự động -----
CREATE OR REPLACE FUNCTION fn_log_contract_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO contract_status_history (
            contract_id, old_status, new_status, changed_by, reason
        ) VALUES (
            NEW.id, OLD.status, NEW.status, 
            COALESCE(NEW.updated_by_staff_id, NEW.created_by),
            NULL
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Lưu ý: trigger này cần thêm cột updated_by_staff_id vào contracts 
-- hoặc sử dụng cách khác để truyền staff_id. Xem giải pháp thay thế bên dưới.


-- ----- Function: Tạo hợp đồng hoàn chỉnh (wrapper) -----
CREATE OR REPLACE FUNCTION fn_create_contract(
    p_customer_id UUID,
    p_vehicle_category_code VARCHAR,
    p_contract_type_code VARCHAR,
    p_created_by UUID,
    p_appraised_value DECIMAL DEFAULT NULL,
    p_loan_amount DECIMAL DEFAULT NULL,
    p_interest_rate DECIMAL DEFAULT NULL,
    p_duration_days INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_contract_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    contract_id UUID,
    qr_code VARCHAR
) AS $$
DECLARE
    v_qr_code VARCHAR;
    v_contract_id UUID;
    v_category_id UUID;
    v_contract_type_id UUID;
    v_sequence INTEGER;
    v_due_date DATE;
    v_default_duration INTEGER;
    v_default_rate DECIMAL;
BEGIN
    -- Lấy category_id
    SELECT id INTO v_category_id 
    FROM vehicle_categories 
    WHERE code = p_vehicle_category_code AND is_active = TRUE;
    
    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Loại xe không hợp lệ: %', p_vehicle_category_code;
    END IF;
    
    -- Lấy contract_type_id và defaults
    SELECT id, default_duration_days, default_interest_rate 
    INTO v_contract_type_id, v_default_duration, v_default_rate
    FROM contract_types 
    WHERE code = p_contract_type_code AND is_active = TRUE;
    
    IF v_contract_type_id IS NULL THEN
        RAISE EXCEPTION 'Loại hợp đồng không hợp lệ: %', p_contract_type_code;
    END IF;
    
    -- Tạo QR code (atomic sequence)
    v_qr_code := fn_generate_qr_code(p_vehicle_category_code, p_contract_type_code, p_contract_date);
    
    -- Lấy sequence number từ QR code
    v_sequence := SPLIT_PART(v_qr_code, '-', 4)::INTEGER;
    
    -- Tính ngày đáo hạn
    v_due_date := p_contract_date + COALESCE(p_duration_days, v_default_duration, 30);
    
    -- Tạo hợp đồng
    INSERT INTO contracts (
        qr_code, customer_id, vehicle_category_id, contract_type_id,
        created_by, status, appraised_value, loan_amount, 
        interest_rate, outstanding_balance,
        contract_date, start_date, due_date, sequence_number, notes
    ) VALUES (
        v_qr_code, p_customer_id, v_category_id, v_contract_type_id,
        p_created_by, 'DRAFT', p_appraised_value, p_loan_amount,
        COALESCE(p_interest_rate, v_default_rate),
        COALESCE(p_loan_amount, 0),
        p_contract_date, p_contract_date, v_due_date, v_sequence, p_notes
    ) RETURNING id INTO v_contract_id;
    
    -- Ghi activity log
    INSERT INTO activity_logs (staff_id, contract_id, action, note)
    VALUES (p_created_by, v_contract_id, 'CONTRACT_CREATED', 'QR: ' || v_qr_code);
    
    RETURN QUERY SELECT v_contract_id, v_qr_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_create_contract IS 'Tạo hợp đồng mới: auto-generate QR code, tính due_date, ghi log';


-- ----- Function: Lấy thuộc tính theo loại xe (cho form nhập liệu) -----
CREATE OR REPLACE FUNCTION fn_get_category_properties(p_category_code VARCHAR)
RETURNS TABLE(
    property_id UUID,
    property_code VARCHAR,
    property_name VARCHAR,
    data_type property_data_type_enum,
    unit VARCHAR,
    is_required BOOLEAN,
    default_value TEXT,
    select_options JSONB,
    validation_rules JSONB,
    display_group VARCHAR,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.id AS property_id,
        pd.code::VARCHAR AS property_code,
        pd.name::VARCHAR AS property_name,
        pd.data_type,
        pd.unit::VARCHAR,
        cp.is_required,
        cp.default_value,
        COALESCE(cp.override_select_options, pd.select_options) AS select_options,
        COALESCE(cp.override_validation, pd.validation_rules) AS validation_rules,
        pd.display_group::VARCHAR,
        cp.sort_order
    FROM category_properties cp
    JOIN property_definitions pd ON pd.id = cp.property_id
    JOIN vehicle_categories vc ON vc.id = cp.category_id
    WHERE vc.code = p_category_code
      AND pd.is_active = TRUE
    ORDER BY cp.sort_order, pd.sort_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_category_properties IS 'Lấy danh sách thuộc tính cần nhập cho một loại xe, dùng để render form động';


-- ----- Function: Lấy thông tin đầy đủ xe kèm thuộc tính -----
CREATE OR REPLACE FUNCTION fn_get_vehicle_with_properties(p_vehicle_id UUID)
RETURNS TABLE(
    vehicle_id UUID,
    brand VARCHAR,
    model VARCHAR,
    year_of_manufacture INTEGER,
    color VARCHAR,
    license_plate VARCHAR,
    engine_number VARCHAR,
    chassis_number VARCHAR,
    property_code VARCHAR,
    property_name VARCHAR,
    property_value TEXT,
    property_unit VARCHAR,
    data_type property_data_type_enum
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id AS vehicle_id,
        v.brand::VARCHAR,
        v.model::VARCHAR,
        v.year_of_manufacture,
        v.color::VARCHAR,
        v.license_plate::VARCHAR,
        v.engine_number::VARCHAR,
        v.chassis_number::VARCHAR,
        pd.code::VARCHAR AS property_code,
        pd.name::VARCHAR AS property_name,
        COALESCE(
            vpv.value_text,
            vpv.value_integer::TEXT,
            vpv.value_decimal::TEXT,
            vpv.value_boolean::TEXT,
            vpv.value_date::TEXT
        ) AS property_value,
        pd.unit::VARCHAR AS property_unit,
        pd.data_type
    FROM vehicles v
    LEFT JOIN vehicle_property_values vpv ON vpv.vehicle_id = v.id
    LEFT JOIN property_definitions pd ON pd.id = vpv.property_id
    WHERE v.id = p_vehicle_id
    ORDER BY pd.sort_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_vehicle_with_properties IS 'Lấy thông tin xe kèm tất cả thuộc tính EAV đã flatten';


-- ================================================================
-- PHẦN 19: ROW LEVEL SECURITY (RLS) - Supabase
-- ================================================================

-- Bật RLS cho tất cả bảng
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sequence_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Nhân viên đã đăng nhập có thể đọc tất cả
-- (Tùy chỉnh theo vai trò cụ thể)

CREATE POLICY "Authenticated users can read all staff"
    ON staff FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage staff"
    ON staff FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s 
            WHERE s.auth_user_id = auth.uid() 
            AND s.role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

CREATE POLICY "Authenticated users can read customers"
    ON customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage customers"
    ON customers FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Everyone can read vehicle categories"
    ON vehicle_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Everyone can read property definitions"
    ON property_definitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Everyone can read category properties"
    ON category_properties FOR SELECT TO authenticated USING (true);

CREATE POLICY "Everyone can read contract types"
    ON contract_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage contracts"
    ON contracts FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Staff can manage vehicles"
    ON vehicles FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Staff can manage vehicle properties"
    ON vehicle_property_values FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Staff can manage images"
    ON contract_images FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Staff can manage inspections"
    ON inspection_logs FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Staff can read/write activity logs"
    ON activity_logs FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Staff can manage payments"
    ON contract_payments FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s WHERE s.auth_user_id = auth.uid() AND s.is_active = TRUE
        )
    );

CREATE POLICY "Admin can manage settings"
    ON system_settings FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff s 
            WHERE s.auth_user_id = auth.uid() 
            AND s.role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

CREATE POLICY "Authenticated can read settings"
    ON system_settings FOR SELECT TO authenticated USING (true);


-- ================================================================
-- PHẦN 20: SEED DATA - Dữ liệu khởi tạo
-- ================================================================

-- ----- 20.1: Danh mục loại xe -----
INSERT INTO vehicle_categories (code, name, description, sort_order) VALUES
('CAR',  'Ô tô con',           'Xe ô tô 4-7 chỗ, bán tải nhỏ',               1),
('MTR',  'Xe máy / Mô tô',     'Xe máy, xe số, tay ga, côn tay, mô tô phân khối lớn', 2),
('TRK',  'Xe tải',             'Xe tải trên 1 tấn, có giấy phép kinh doanh',    3),
('VAN',  'Xe van / Thương mại', 'Xe van, xe khách, xe chở hàng thương mại',     4),
('BIK',  'Xe đạp / Xe điện',   'Xe đạp, xe đạp điện, xe máy điện',             5),
('SPE',  'Phương tiện đặc biệt','Thuyền, máy móc, thiết bị đặc biệt',          6);


-- ----- 20.2: Loại hợp đồng -----
INSERT INTO contract_types (code, name, description, default_duration_days, default_interest_rate, allow_extension, max_extensions, sort_order) VALUES
('PAWN',    'Cầm đồ',              'Thế chấp tài sản, lãi suất cố định theo quy định',  30, 3.00, TRUE,  5, 1),
('RENTAL',  'Cho thuê / Cầm xe',   'Khách cầm xe lấy tiền, có thể chuộc lại',           60, 2.50, TRUE,  3, 2),
('SALE',    'Mua bán có điều kiện', 'Bán tài sản, không quyền chuộc lại',               NULL, NULL, FALSE, 0, 3),
('LEASE',   'Thuê dài hạn',        'Cho thuê tài sản, khách trả tiền định kỳ',          180, 2.00, TRUE,  2, 4),
('CONSIGN', 'Ký gửi bán',          'Chủ sở hữu giữ quyền, cửa hàng bán hộ',           NULL, NULL, FALSE, 0, 5);


-- ----- 20.3: Định nghĩa thuộc tính -----
INSERT INTO property_definitions (code, name, data_type, unit, description, select_options, validation_rules, display_group, sort_order) VALUES

-- Thông số kỹ thuật chung
('engine_capacity',     'Dung tích xi-lanh',     'INTEGER',  'cc',   'Dung tích động cơ',                          NULL, '{"min": 49, "max": 20000}',  'Thông số kỹ thuật', 1),
('horsepower',          'Công suất',             'DECIMAL',  'HP',   'Công suất động cơ',                          NULL, '{"min": 1, "max": 2000}',    'Thông số kỹ thuật', 2),
('transmission',        'Hộp số',                'SELECT',   NULL,   'Loại hộp số',                                '["Số sàn","Số tự động","CVT","DCT","AMT"]', NULL, 'Thông số kỹ thuật', 3),
('fuel_type',           'Loại nhiên liệu',       'SELECT',   NULL,   'Nhiên liệu sử dụng',                        '["Xăng","Dầu Diesel","Điện","Hybrid","LPG"]', NULL, 'Thông số kỹ thuật', 4),
('odometer',            'Số km đã đi',           'INTEGER',  'km',   'Số km trên đồng hồ ODO',                    NULL, '{"min": 0, "max": 9999999}', 'Thông số kỹ thuật', 5),
('num_seats',           'Số chỗ ngồi',           'INTEGER',  'chỗ',  'Số chỗ ngồi theo đăng ký',                  NULL, '{"min": 1, "max": 50}',      'Thông số kỹ thuật', 6),
('drive_type',          'Hệ dẫn động',           'SELECT',   NULL,   'Hệ thống dẫn động',                         '["FWD","RWD","AWD","4WD"]', NULL, 'Thông số kỹ thuật', 7),
('body_type',           'Kiểu thân xe',          'SELECT',   NULL,   'Kiểu dáng thân xe',                         '["Sedan","SUV","Hatchback","MPV","Pickup","Coupe","Convertible","Wagon"]', NULL, 'Thông số kỹ thuật', 8),

-- Xe máy specific
('frame_type',          'Loại xe máy',           'SELECT',   NULL,   'Phân loại xe máy',                          '["Xe số","Tay ga","Côn tay","Mô tô phân khối lớn","Xe điện"]', NULL, 'Phân loại xe máy', 10),
('wheel_size',          'Cỡ bánh xe',            'TEXT',     'inch', 'Kích thước vành/bánh xe',                    NULL, NULL, 'Thông số kỹ thuật', 11),

-- Xe tải specific
('payload_capacity',    'Tải trọng',             'DECIMAL',  'tấn',  'Tải trọng cho phép',                        NULL, '{"min": 0.5, "max": 100}',   'Thông số xe tải', 20),
('cargo_dimensions',    'Kích thước thùng hàng',  'TEXT',     'm',    'Dài x Rộng x Cao (m)',                      NULL, NULL, 'Thông số xe tải', 21),
('truck_type',          'Loại xe tải',           'SELECT',   NULL,   'Phân loại xe tải',                          '["Xe tải nhẹ","Xe tải trung","Xe tải nặng","Đầu kéo","Xe ben","Xe bồn"]', NULL, 'Thông số xe tải', 22),

-- Thông tin bổ sung
('insurance_company',   'Công ty bảo hiểm',      'TEXT',     NULL,   'Tên công ty bảo hiểm thân vỏ',             NULL, NULL, 'Bảo hiểm', 30),
('insurance_expiry',    'Hạn bảo hiểm',          'DATE',     NULL,   'Ngày hết hạn bảo hiểm',                    NULL, NULL, 'Bảo hiểm', 31),
('has_gps_tracker',     'Có thiết bị định vị',    'BOOLEAN',  NULL,   'Xe có lắp thiết bị định vị GPS không',     NULL, NULL, 'Thiết bị', 40),
('has_dashcam',         'Có camera hành trình',   'BOOLEAN',  NULL,   'Xe có lắp camera hành trình không',        NULL, NULL, 'Thiết bị', 41),
('accessories',         'Phụ kiện đi kèm',       'TEXT',     NULL,   'Liệt kê phụ kiện: bạt, thảm, bộ dụng cụ...', NULL, NULL, 'Phụ kiện', 50),
('spare_tire',          'Lốp dự phòng',          'BOOLEAN',  NULL,   'Có lốp dự phòng không',                    NULL, NULL, 'Phụ kiện', 51),

-- Xe đạp/xe điện specific
('battery_capacity',    'Dung lượng pin',         'DECIMAL',  'Ah',   'Dung lượng pin (xe điện)',                  NULL, '{"min": 1, "max": 500}',     'Xe điện', 60),
('motor_power',         'Công suất motor',        'INTEGER',  'W',    'Công suất motor điện',                      NULL, '{"min": 100, "max": 50000}', 'Xe điện', 61),
('bike_type',           'Loại xe đạp/điện',       'SELECT',   NULL,   'Phân loại',                                '["Xe đạp thường","Xe đạp điện","Xe máy điện","Xe đạp thể thao"]', NULL, 'Phân loại', 62),

-- Phương tiện đặc biệt
('special_type',        'Loại phương tiện',       'TEXT',     NULL,   'Mô tả loại phương tiện đặc biệt',         NULL, NULL, 'Đặc biệt', 70),
('serial_number',       'Số serial',             'TEXT',     NULL,   'Số serial của thiết bị/máy móc',            NULL, NULL, 'Đặc biệt', 71);


-- ----- 20.4: Mapping thuộc tính theo loại xe -----

-- === ÔTÔ (CAR) ===
INSERT INTO category_properties (category_id, property_id, is_required, sort_order, override_select_options)
SELECT vc.id, pd.id, 
    CASE pd.code 
        WHEN 'engine_capacity' THEN TRUE
        WHEN 'transmission' THEN TRUE
        WHEN 'fuel_type' THEN TRUE
        WHEN 'num_seats' THEN TRUE
        WHEN 'odometer' THEN FALSE
        ELSE FALSE
    END,
    CASE pd.code
        WHEN 'engine_capacity' THEN 1
        WHEN 'horsepower' THEN 2
        WHEN 'transmission' THEN 3
        WHEN 'fuel_type' THEN 4
        WHEN 'num_seats' THEN 5
        WHEN 'drive_type' THEN 6
        WHEN 'body_type' THEN 7
        WHEN 'odometer' THEN 8
        WHEN 'has_gps_tracker' THEN 9
        WHEN 'has_dashcam' THEN 10
        WHEN 'spare_tire' THEN 11
        WHEN 'accessories' THEN 12
        WHEN 'insurance_company' THEN 13
        WHEN 'insurance_expiry' THEN 14
        ELSE 99
    END,
    NULL
FROM vehicle_categories vc, property_definitions pd
WHERE vc.code = 'CAR'
AND pd.code IN (
    'engine_capacity', 'horsepower', 'transmission', 'fuel_type', 
    'num_seats', 'drive_type', 'body_type', 'odometer',
    'has_gps_tracker', 'has_dashcam', 'spare_tire', 'accessories',
    'insurance_company', 'insurance_expiry'
);

-- === XE MÁY (MTR) ===
INSERT INTO category_properties (category_id, property_id, is_required, sort_order, override_select_options, override_validation)
SELECT vc.id, pd.id,
    CASE pd.code 
        WHEN 'engine_capacity' THEN TRUE
        WHEN 'frame_type' THEN TRUE
        ELSE FALSE
    END,
    CASE pd.code
        WHEN 'engine_capacity' THEN 1
        WHEN 'frame_type' THEN 2
        WHEN 'fuel_type' THEN 3
        WHEN 'odometer' THEN 4
        WHEN 'wheel_size' THEN 5
        WHEN 'accessories' THEN 6
        WHEN 'insurance_company' THEN 7
        WHEN 'insurance_expiry' THEN 8
        ELSE 99
    END,
    CASE pd.code
        WHEN 'fuel_type' THEN '["Xăng","Điện"]'::jsonb
        ELSE NULL
    END,
    CASE pd.code
        WHEN 'engine_capacity' THEN '{"min": 49, "max": 2000}'::jsonb
        ELSE NULL
    END
FROM vehicle_categories vc, property_definitions pd
WHERE vc.code = 'MTR'
AND pd.code IN (
    'engine_capacity', 'frame_type', 'fuel_type', 'odometer',
    'wheel_size', 'accessories', 'insurance_company', 'insurance_expiry'
);

-- === XE TẢI (TRK) ===
INSERT INTO category_properties (category_id, property_id, is_required, sort_order)
SELECT vc.id, pd.id,
    CASE pd.code 
        WHEN 'engine_capacity' THEN TRUE
        WHEN 'payload_capacity' THEN TRUE
        WHEN 'truck_type' THEN TRUE
        ELSE FALSE
    END,
    CASE pd.code
        WHEN 'engine_capacity' THEN 1
        WHEN 'payload_capacity' THEN 2
        WHEN 'truck_type' THEN 3
        WHEN 'cargo_dimensions' THEN 4
        WHEN 'transmission' THEN 5
        WHEN 'fuel_type' THEN 6
        WHEN 'odometer' THEN 7
        WHEN 'horsepower' THEN 8
        WHEN 'has_gps_tracker' THEN 9
        WHEN 'insurance_company' THEN 10
        WHEN 'insurance_expiry' THEN 11
        ELSE 99
    END
FROM vehicle_categories vc, property_definitions pd
WHERE vc.code = 'TRK'
AND pd.code IN (
    'engine_capacity', 'payload_capacity', 'truck_type', 'cargo_dimensions',
    'transmission', 'fuel_type', 'odometer', 'horsepower',
    'has_gps_tracker', 'insurance_company', 'insurance_expiry'
);

-- === XE VAN (VAN) ===
INSERT INTO category_properties (category_id, property_id, is_required, sort_order)
SELECT vc.id, pd.id,
    CASE pd.code 
        WHEN 'engine_capacity' THEN TRUE
        WHEN 'num_seats' THEN TRUE
        ELSE FALSE
    END,
    CASE pd.code
        WHEN 'engine_capacity' THEN 1
        WHEN 'num_seats' THEN 2
        WHEN 'transmission' THEN 3
        WHEN 'fuel_type' THEN 4
        WHEN 'odometer' THEN 5
        WHEN 'horsepower' THEN 6
        WHEN 'has_gps_tracker' THEN 7
        WHEN 'insurance_company' THEN 8
        WHEN 'insurance_expiry' THEN 9
        ELSE 99
    END
FROM vehicle_categories vc, property_definitions pd
WHERE vc.code = 'VAN'
AND pd.code IN (
    'engine_capacity', 'num_seats', 'transmission', 'fuel_type',
    'odometer', 'horsepower', 'has_gps_tracker',
    'insurance_company', 'insurance_expiry'
);

-- === XE ĐẠP / XE ĐIỆN (BIK) ===
INSERT INTO category_properties (category_id, property_id, is_required, sort_order)
SELECT vc.id, pd.id,
    CASE pd.code 
        WHEN 'bike_type' THEN TRUE
        ELSE FALSE
    END,
    CASE pd.code
        WHEN 'bike_type' THEN 1
        WHEN 'battery_capacity' THEN 2
        WHEN 'motor_power' THEN 3
        WHEN 'wheel_size' THEN 4
        WHEN 'accessories' THEN 5
        ELSE 99
    END
FROM vehicle_categories vc, property_definitions pd
WHERE vc.code = 'BIK'
AND pd.code IN (
    'bike_type', 'battery_capacity', 'motor_power', 'wheel_size', 'accessories'
);

-- === PHƯƠNG TIỆN ĐẶC BIỆT (SPE) ===
INSERT INTO category_properties (category_id, property_id, is_required, sort_order)
SELECT vc.id, pd.id,
    CASE pd.code 
        WHEN 'special_type' THEN TRUE
        ELSE FALSE
    END,
    CASE pd.code
        WHEN 'special_type' THEN 1
        WHEN 'serial_number' THEN 2
        WHEN 'engine_capacity' THEN 3
        WHEN 'horsepower' THEN 4
        WHEN 'accessories' THEN 5
        ELSE 99
    END
FROM vehicle_categories vc, property_definitions pd
WHERE vc.code = 'SPE'
AND pd.code IN (
    'special_type', 'serial_number', 'engine_capacity', 'horsepower', 'accessories'
);


-- ----- 20.5: Cấu hình hệ thống mặc định -----
INSERT INTO system_settings (key, value, data_type, description) VALUES
('default_interest_rate',     '3.00',   'DECIMAL', 'Lãi suất mặc định (%/tháng)'),
('default_contract_duration', '30',     'INTEGER', 'Thời hạn hợp đồng mặc định (ngày)'),
('max_daily_sequence',        '99',     'INTEGER', 'Số thứ tự tối đa mỗi ngày (2 chữ số)'),
('image_max_size_kb',         '5120',   'INTEGER', 'Dung lượng ảnh tối đa (KB)'),
('image_quality',             '80',     'INTEGER', 'Chất lượng nén JPEG (%)'),
('storage_base_path',         '/storage', 'TEXT',  'Đường dẫn gốc lưu trữ file'),
('timezone',                  'Asia/Ho_Chi_Minh', 'TEXT', 'Múi giờ hệ thống'),
('gps_required_for_inspection','true',  'BOOLEAN', 'Yêu cầu GPS khi kiểm tra định kỳ'),
('inspection_frequency_days', '7',      'INTEGER', 'Tần suất kiểm tra định kỳ (ngày)');


-- ================================================================
-- PHẦN 21: VIEWS HỮU ÍCH
-- ================================================================

-- View: Danh sách hợp đồng đang hoạt động với thông tin tóm tắt
CREATE OR REPLACE VIEW v_active_contracts AS
SELECT 
    c.id,
    c.qr_code,
    c.status,
    cust.full_name AS customer_name,
    cust.phone AS customer_phone,
    vc.code AS vehicle_category_code,
    vc.name AS vehicle_category_name,
    ct.code AS contract_type_code,
    ct.name AS contract_type_name,
    v.brand,
    v.model,
    v.license_plate,
    c.loan_amount,
    c.interest_rate,
    c.contract_date,
    c.due_date,
    c.extension_count,
    c.outstanding_balance,
    (c.due_date - CURRENT_DATE) AS days_remaining,
    CASE 
        WHEN c.due_date < CURRENT_DATE THEN TRUE 
        ELSE FALSE 
    END AS is_overdue,
    s.full_name AS created_by_name,
    c.created_at
FROM contracts c
JOIN customers cust ON cust.id = c.customer_id
JOIN vehicle_categories vc ON vc.id = c.vehicle_category_id
JOIN contract_types ct ON ct.id = c.contract_type_id
LEFT JOIN vehicles v ON v.contract_id = c.id
LEFT JOIN staff s ON s.id = c.created_by
WHERE c.status IN ('ACTIVE', 'EXTENDED', 'OVERDUE')
ORDER BY c.due_date ASC;

COMMENT ON VIEW v_active_contracts IS 'View hợp đồng đang hoạt động, sắp xếp theo ngày đáo hạn';


-- View: Lịch sử kiểm tra gần nhất mỗi hợp đồng
CREATE OR REPLACE VIEW v_latest_inspections AS
SELECT DISTINCT ON (il.contract_id)
    il.contract_id,
    c.qr_code,
    il.result,
    il.inspected_at,
    il.staff_id,
    s.full_name AS inspector_name,
    il.gps_latitude,
    il.gps_longitude,
    (CURRENT_TIMESTAMP - il.inspected_at) AS time_since_last_inspection
FROM inspection_logs il
JOIN contracts c ON c.id = il.contract_id
JOIN staff s ON s.id = il.staff_id
WHERE c.status IN ('ACTIVE', 'EXTENDED', 'OVERDUE')
ORDER BY il.contract_id, il.inspected_at DESC;

COMMENT ON VIEW v_latest_inspections IS 'Lần kiểm tra gần nhất của mỗi hợp đồng đang hoạt động';


-- View: Hợp đồng cần kiểm tra (chưa kiểm tra hoặc quá hạn kiểm tra)
CREATE OR REPLACE VIEW v_contracts_need_inspection AS
SELECT 
    ac.*,
    li.inspected_at AS last_inspected_at,
    li.inspector_name AS last_inspector,
    COALESCE(
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - li.inspected_at)),
        999
    )::INTEGER AS days_since_last_inspection
FROM v_active_contracts ac
LEFT JOIN v_latest_inspections li ON li.contract_id = ac.id
WHERE li.inspected_at IS NULL 
   OR (CURRENT_TIMESTAMP - li.inspected_at) > INTERVAL '7 days'
ORDER BY days_since_last_inspection DESC;

COMMENT ON VIEW v_contracts_need_inspection IS 'Hợp đồng cần kiểm tra: chưa kiểm tra lần nào hoặc quá 7 ngày';


-- View: Thông tin xe đầy đủ (flatten EAV)
CREATE OR REPLACE VIEW v_vehicle_full_info AS
SELECT 
    v.id AS vehicle_id,
    v.contract_id,
    c.qr_code,
    vc.code AS category_code,
    vc.name AS category_name,
    v.brand,
    v.model,
    v.year_of_manufacture,
    v.color,
    v.license_plate,
    v.engine_number,
    v.chassis_number,
    v.registration_number,
    v.storage_location,
    v.key_count,
    -- Gộp tất cả thuộc tính EAV thành JSON object
    COALESCE(
        jsonb_object_agg(
            pd.code, 
            jsonb_build_object(
                'name', pd.name,
                'value', COALESCE(vpv.value_text, vpv.value_integer::text, vpv.value_decimal::text, vpv.value_boolean::text, vpv.value_date::text),
                'unit', pd.unit,
                'data_type', pd.data_type
            )
        ) FILTER (WHERE pd.code IS NOT NULL),
        '{}'::jsonb
    ) AS properties
FROM vehicles v
JOIN contracts c ON c.id = v.contract_id
JOIN vehicle_categories vc ON vc.id = v.category_id
LEFT JOIN vehicle_property_values vpv ON vpv.vehicle_id = v.id
LEFT JOIN property_definitions pd ON pd.id = vpv.property_id
GROUP BY v.id, v.contract_id, c.qr_code, vc.code, vc.name,
         v.brand, v.model, v.year_of_manufacture, v.color,
         v.license_plate, v.engine_number, v.chassis_number,
         v.registration_number, v.storage_location, v.key_count;

COMMENT ON VIEW v_vehicle_full_info IS 'Thông tin xe đầy đủ với thuộc tính EAV được flatten thành JSON';


-- ================================================================
-- PHẦN 22: SUPABASE STORAGE BUCKETS (chạy qua Dashboard hoặc API)
-- ================================================================

-- Lưu ý: Tạo Storage Buckets qua Supabase Dashboard hoặc API:
-- 
-- Bucket 1: contract-images
--   - Public: FALSE
--   - Allowed MIME types: image/jpeg, image/png, image/webp
--   - Max file size: 5MB
--   - Path pattern: {contract_qr_code}/{image_type}_{sequence}.jpg
--
-- Bucket 2: qr-codes
--   - Public: TRUE (để in/hiển thị)
--   - Allowed MIME types: image/png, image/svg+xml
--   - Max file size: 100KB
--   - Path pattern: {YYYY}/{MM}/{DD}/{contract_qr_code}.png
--
-- Bucket 3: customer-documents
--   - Public: FALSE
--   - Allowed MIME types: image/jpeg, image/png, application/pdf
--   - Max file size: 10MB
--   - Path pattern: {customer_id}/{document_type}_{filename}
--
-- Bucket 4: vehicle-documents
--   - Public: FALSE
--   - Allowed MIME types: image/jpeg, image/png, application/pdf
--   - Max file size: 10MB
--   - Path pattern: {vehicle_id}/{document_type}_{filename}
Sơ đồ quan hệ chi tiết
text

┌─────────────────────┐      ┌──────────────────────┐
│ vehicle_categories  │      │  property_definitions │
│─────────────────────│      │──────────────────────│
│ id (PK)             │      │ id (PK)              │
│ code: CAR,MTR...    │◄──┐  │ code: engine_cap...  │◄──┐
│ name                │   │  │ name                 │   │
│ default_loan_ratio  │   │  │ data_type (ENUM)     │   │
└────────┬────────────┘   │  │ unit                 │   │
         │                │  │ select_options (JSON) │   │
         │    ┌───────────┴──┤ validation_rules(JSON)│   │
         │    │              │ display_group         │   │
         │    │              └──────────────────────┘   │
         │    │                                         │
         │    │  ┌─────────────────────────────────┐    │
         │    │  │     category_properties          │    │
         │    │  │     (JUNCTION TABLE)             │    │
         │    │  │─────────────────────────────────│    │
         │    └──┤ category_id (FK) ──────────────►│    │
         │       │ property_id (FK) ──────────────►├────┘
         │       │ is_required                     │
         │       │ default_value                   │
         │       │ override_validation (JSON)      │
         │       │ override_select_options (JSON)   │
         │       └─────────────────────────────────┘
         │
    ┌────┴──────────┐        ┌──────────────────┐
    │               │        │  contract_types   │
    │               │        │──────────────────│
    │               │        │ id (PK)          │
    │               │        │ code: PAWN,RENTAL│
    │               │        │ name             │
    │               │        │ default_duration │
    │               │        │ default_rate     │
    │               │        └────────┬─────────┘
    │               │                 │
    │    ┌──────────┴─────────────────┴──────────────────────┐
    │    │                  contracts                         │
    │    │───────────────────────────────────────────────────│
    │    │ id (PK, UUID)                                     │
    │    │ qr_code (UNIQUE): CAR-RENTAL-20260206-01         │
    │    │ customer_id (FK) ─────────────► customers         │
    │    │ vehicle_category_id (FK) ──────► vehicle_categories│
    │    │ contract_type_id (FK) ──────────► contract_types   │
    │    │ created_by (FK) ──────────────► staff              │
    │    │ status (ENUM)                                     │
    │    │ appraised_value, loan_amount, interest_rate       │
    │    │ contract_date, start_date, due_date               │
    │    │ sequence_number                                   │
    │    │ is_asset_received                                 │
    │    └──┬──────┬────────┬────────┬────────┬──────────────┘
    │       │      │        │        │        │
    │       ▼      ▼        ▼        ▼        ▼
    │  ┌────────┐┌──────┐┌───────┐┌──────┐┌────────────┐
    │  │vehicles││images││inspec.││activ.││ payments   │
    │  │        ││      ││logs   ││logs  ││            │
    │  └───┬────┘└──────┘└───────┘└──────┘└────────────┘
    │      │
    │      ├──────────────────────────────┐
    │      ▼                              ▼
    │ ┌──────────────────────┐  ┌─────────────────────┐
    │ │vehicle_property_values│  │  vehicle_documents  │
    │ │  (EAV Pattern)       │  │                     │
    │ │──────────────────────│  │─────────────────────│
    │ │ vehicle_id (FK)      │  │ vehicle_id (FK)     │
    │ │ property_id (FK) ──►PD  │ document_type       │
    │ │ value_text           │  │ file_path           │
    │ │ value_integer        │  │ is_returned         │
    │ │ value_decimal        │  └─────────────────────┘
    │ │ value_boolean        │
    │ │ value_date           │
    │ └──────────────────────┘
    │
    │  ┌─────────────────────────────┐
    │  │  daily_sequence_counters    │
    │  │─────────────────────────────│
    │  │ counter_date                │
    │  │ vehicle_category_code       │
    │  │ contract_type_code          │
    │  │ current_sequence            │
    │  │ UNIQUE(date, cat, type)     │
    │  └─────────────────────────────┘
    │
┌───┴───────────┐    ┌──────────────┐
│   staff       │    │  customers   │
│───────────────│    │──────────────│
│ id (PK)       │    │ id (PK)      │
│ staff_code    │    │ full_name    │
│ full_name     │    │ phone        │
│ role          │    │ id_card_number│
│ auth_user_id  │    │ address      │
└───────────────┘    └──────────────┘
Tóm tắt thiết kế
#	Bảng	Mục đích	Số cột
1	staff	Nhân viên hệ thống	11
2	customers	Khách hàng cầm đồ	17
3	vehicle_categories	Danh mục loại xe (CAR, MTR...)	8
4	property_definitions	Định nghĩa thuộc tính xe	12
5	category_properties	Bảng trung gian: thuộc tính nào thuộc loại xe nào	8
6	contract_types	Danh mục loại hợp đồng	11
7	daily_sequence_counters	Bộ đếm số thứ tự theo ngày (cho QR)	6
8	contracts	Hợp đồng cầm đồ (Bảng trung tâm)	24
9	vehicles	Thông tin xe cơ bản	17
10	vehicle_property_values	Giá trị thuộc tính xe (EAV Model)	9
11	vehicle_documents	Giấy tờ pháp lý của xe	14
12	contract_images	Hình ảnh tài sản (Bằng chứng)	10
13	inspection_logs	Log kiểm tra định kỳ (GPS)	8
14	activity_logs	Log hoạt động (Tối thiểu hóa)	6
15	contract_status_history	Lịch sử thay đổi trạng thái	6
16	contract_payments	Giao dịch thanh toán	12
17	system_settings	Cấu hình hệ thống	7
