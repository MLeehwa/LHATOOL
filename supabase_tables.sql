-- 기존 테이블 완전 삭제
DROP TABLE IF EXISTS tools_export_history;
DROP TABLE IF EXISTS tools_products;
DROP TABLE IF EXISTS tools_categories;

-- 기존 테이블에 code 컬럼 추가 (기존 데이터가 있는 경우)
-- ALTER TABLE tools_categories ADD COLUMN IF NOT EXISTS code VARCHAR(10) UNIQUE;

-- 1. tools_categories 테이블 (카테고리)
CREATE TABLE tools_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE,                       -- 카테고리 코드 (A, B, C, D, E...)
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
    warranty_date DATE,                            -- 워런티 만료일 (선택사항)
    asset_code VARCHAR(50),                        -- 자산코드 (카테고리별 관리코드)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 수정일 (코드에서 사용)
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exported_by VARCHAR(100),                      -- 반출자
    exported_date TIMESTAMP WITH TIME ZONE,        -- 반출일
    export_purpose TEXT,                           -- 반출 목적
    barcode VARCHAR(50),                           -- 바코드 (UNIQUE 제약 제거)
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

-- 기본 카테고리 데이터만 유지 (제품 데이터는 제거)
INSERT INTO tools_categories (name, code) VALUES 
    ('전동공구', 'A'),
    ('수동공구', 'B'),
    ('측정도구', 'C'),
    ('안전장비', 'D'),
    ('기타', 'E');

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

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- tools_products 테이블에 트리거 적용
CREATE TRIGGER update_tools_products_updated_at 
    BEFORE UPDATE ON tools_products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();