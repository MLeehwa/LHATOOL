-- 기존 테이블 완전 삭제
DROP TABLE IF EXISTS tools_export_history;
DROP TABLE IF EXISTS tools_products;
DROP TABLE IF EXISTS tools_categories;

-- 1. tools_categories 테이블 (카테고리)
CREATE TABLE tools_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. tools_products 테이블 (제품 - 메이커, 모델, 규격 추가)
CREATE TABLE tools_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                    -- 제품명
    maker VARCHAR(100) NOT NULL,                   -- 메이커
    model VARCHAR(100) NOT NULL,                   -- 모델명
    specification TEXT,                            -- 규격
    category VARCHAR(100) NOT NULL,                -- 카테고리
    status VARCHAR(50) DEFAULT 'Available',        -- 상태
    description TEXT,                              -- 추가 설명
    serial_number VARCHAR(100),                    -- 시리얼 번호
    purchase_date DATE,                            -- 구매일
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exported_by VARCHAR(100),                      -- 반출자
    exported_date TIMESTAMP WITH TIME ZONE,        -- 반출일
    export_purpose TEXT,                           -- 반출 목적
    barcode VARCHAR(50) UNIQUE,                    -- 바코드
    item_number INTEGER DEFAULT 1                  -- 동일 제품 내 번호 (1, 2, 3...)
);

-- 3. tools_export_history 테이블 (반출 이력)
CREATE TABLE tools_export_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES tools_products(id),
    exported_by VARCHAR(100) NOT NULL,
    export_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    export_purpose VARCHAR(200) DEFAULT '현장작업',
    return_date TIMESTAMP WITH TIME ZONE,
    returned_by VARCHAR(100),
    notes TEXT
);

-- 기본 카테고리 데이터
INSERT INTO tools_categories (name) VALUES 
    ('전동공구'),
    ('수동공구'),
    ('측정도구'),
    ('안전장비'),
    ('기타');

-- 기본 제품 데이터 (메이커, 모델, 규격 포함)
INSERT INTO tools_products (name, maker, model, specification, category, status, description, serial_number, purchase_date, barcode, item_number) VALUES 
    ('임팩트 드릴', '보쉬', 'GBH 2-26', '26mm 해머드릴, 800W', '전동공구', 'Available', '26mm 해머드릴, 800W', 'DR001-2024', '2024-01-15', 'P001', 1),
    ('임팩트 드릴', '보쉬', 'GBH 2-26', '26mm 해머드릴, 800W', '전동공구', 'Available', '26mm 해머드릴, 800W', 'DR002-2024', '2024-01-15', 'P002', 2),
    ('해머', '스탠리', 'AntiVibe', '1kg 철망치, 진동감소', '수동공구', 'Available', '1kg 철망치, 진동감소', 'HM001-2024', '2024-02-01', 'P003', 1),
    ('줄자', '스탠리', 'PowerLock', '5m 자동잠금, 25mm 폭', '측정도구', 'Exported', '5m 자동잠금, 25mm 폭', 'TM001-2024', '2024-01-20', 'P004', 1);

-- RLS 활성화 및 정책 설정
ALTER TABLE tools_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_export_history ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 접근 허용 (개발용)
CREATE POLICY "Allow all access" ON tools_categories FOR ALL USING (true);
CREATE POLICY "Allow all access" ON tools_products FOR ALL USING (true);
CREATE POLICY "Allow all access" ON tools_export_history FOR ALL USING (true);

-- 인덱스 생성
CREATE INDEX idx_products_maker_model ON tools_products(maker, model);
CREATE INDEX idx_products_category ON tools_products(category);
CREATE INDEX idx_products_status ON tools_products(status);
CREATE INDEX idx_products_barcode ON tools_products(barcode);