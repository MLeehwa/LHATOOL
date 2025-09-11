-- 사용자 테이블 생성 및 기본 데이터
-- 이 파일은 사용자 관리 시스템을 위한 테이블과 기본 데이터를 포함합니다.

-- 1. tools_users 테이블 (사용자)
CREATE TABLE tools_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,          -- 사용자명
    password_hash VARCHAR(255) NOT NULL,           -- 해시된 비밀번호
    master_password_hash VARCHAR(255),             -- 2차 비밀번호 해시
    full_name VARCHAR(100) NOT NULL,               -- 실명
    role VARCHAR(20) DEFAULT 'user',               -- 역할 (admin, user)
    is_active BOOLEAN DEFAULT true,                -- 활성 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- RLS 활성화 및 정책 설정
ALTER TABLE tools_users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 접근 허용 (개발용)
CREATE POLICY "Allow all access" ON tools_users FOR ALL USING (true);

-- 인덱스 생성
CREATE INDEX idx_users_username ON tools_users(username);
CREATE INDEX idx_users_role ON tools_users(role);
CREATE INDEX idx_users_active ON tools_users(is_active);

-- updated_at 자동 업데이트를 위한 트리거 함수 (이미 존재하는 경우 무시)
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- tools_users 테이블에 트리거 적용
CREATE TRIGGER update_tools_users_updated_at 
    BEFORE UPDATE ON tools_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at_column();

-- 기본 사용자 데이터 삽입
-- 비밀번호는 PostgreSQL crypt() 함수로 해시한 값입니다
-- 실제 운영에서는 더 강력한 비밀번호를 사용하세요

-- leehwa 계정 (일반 비밀번호 + 2차 비밀번호)
INSERT INTO tools_users (username, password_hash, master_password_hash, full_name, role) VALUES 
    ('leehwa', 
     crypt('5678', gen_salt('bf')),           -- 일반 비밀번호: 5678
     crypt('master123', gen_salt('bf')),      -- 2차 비밀번호: master123
     '이화아메리카 관리자', 
     'admin');

-- 사용자 관리 함수들
-- 2차 비밀번호 확인 함수
CREATE OR REPLACE FUNCTION verify_master_password(p_username VARCHAR(50), p_master_password VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    master_hash VARCHAR(255);
BEGIN
    -- 사용자의 2차 비밀번호 해시 조회
    SELECT master_password_hash INTO master_hash
    FROM tools_users 
    WHERE username = p_username;
    
    -- 2차 비밀번호가 설정되지 않았으면 false 반환
    IF master_hash IS NULL THEN
        RETURN false;
    END IF;
    
    -- 2차 비밀번호 확인
    RETURN master_hash = crypt(p_master_password, master_hash);
END;
$$ LANGUAGE plpgsql;

-- 비밀번호 변경 함수 (2차 비밀번호 보호)
CREATE OR REPLACE FUNCTION change_user_password(
    p_username VARCHAR(50),
    p_old_password VARCHAR(255),
    p_new_password VARCHAR(255),
    p_master_password VARCHAR(255) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    new_hash VARCHAR(255);
    is_master_valid BOOLEAN := false;
BEGIN
    -- 사용자 정보 조회
    SELECT * INTO user_record 
    FROM tools_users 
    WHERE tools_users.username = p_username AND tools_users.is_active = true;
    
    -- 사용자가 존재하지 않으면 false 반환
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- 2차 비밀번호 확인 (2차 비밀번호가 제공된 경우)
    IF p_master_password IS NOT NULL THEN
        SELECT verify_master_password(p_username, p_master_password) INTO is_master_valid;
        IF NOT is_master_valid THEN
            RETURN false; -- 2차 비밀번호가 틀림
        END IF;
    ELSE
        -- 2차 비밀번호가 제공되지 않으면 기존 비밀번호 확인
        IF user_record.password_hash != crypt(p_old_password, user_record.password_hash) THEN
            RETURN false;
        END IF;
    END IF;
    
    -- 새 비밀번호 해시 생성
    new_hash := crypt(p_new_password, gen_salt('bf'));
    
    -- 비밀번호 업데이트
    UPDATE tools_users 
    SET password_hash = new_hash, updated_at = NOW()
    WHERE tools_users.username = p_username;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 사용자 로그인 함수
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username VARCHAR(50),
    p_password VARCHAR(255)
)
RETURNS TABLE(
    user_id INTEGER,
    username VARCHAR(50),
    full_name VARCHAR(100),
    role VARCHAR(20)
) AS $$
BEGIN
    -- 로그인 시도 시 last_login 업데이트
    UPDATE tools_users 
    SET last_login = NOW()
    WHERE tools_users.username = p_username 
    AND tools_users.password_hash = crypt(p_password, tools_users.password_hash)
    AND tools_users.is_active = true;
    
    -- 사용자 정보 반환
    RETURN QUERY
    SELECT u.id, u.username, u.full_name, u.role
    FROM tools_users u
    WHERE u.username = p_username 
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 비밀번호 재설정 함수 (관리자용)
CREATE OR REPLACE FUNCTION reset_user_password(
    p_username VARCHAR(50),
    p_new_password VARCHAR(255)
)
RETURNS BOOLEAN AS $$
DECLARE
    new_hash VARCHAR(255);
BEGIN
    -- 새 비밀번호 해시 생성
    new_hash := crypt(p_new_password, gen_salt('bf'));
    
    -- 비밀번호 업데이트
    UPDATE tools_users 
    SET password_hash = new_hash, updated_at = NOW()
    WHERE tools_users.username = p_username;
    
    -- 업데이트된 행이 있으면 true 반환
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
