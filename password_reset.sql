-- 비밀번호 재설정용 SQL 스크립트 (2차 비밀번호 보호)
-- 이 파일은 비밀번호를 잃어버렸을 때 사용하는 스크립트입니다.
-- ⚠️ 2차 비밀번호를 알아야만 비밀번호를 변경할 수 있습니다.

-- ==============================================
-- 🔐 2차 비밀번호 시스템 사용
-- ==============================================
-- 2차 비밀번호는 'master123'입니다
-- 이 비밀번호를 안전한 곳에 보관하세요!
-- (마스터 계정은 users_table.sql에서 자동 생성됩니다)

-- ==============================================
-- 🔑 2차 비밀번호로 leehwa 계정 비밀번호 재설정
-- ==============================================
-- 2차 비밀번호 'master123'을 알고 있어야만 실행 가능

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

-- 2차 비밀번호로 leehwa 계정 비밀번호 재설정
DO $$
DECLARE
    master_password VARCHAR(255) := 'master123';  -- 2차 비밀번호
    new_password VARCHAR(255) := '5678';          -- 새 비밀번호
    is_master_valid BOOLEAN;
BEGIN
    -- 2차 비밀번호 확인
    SELECT verify_master_password('leehwa', master_password) INTO is_master_valid;
    
    IF is_master_valid THEN
        -- 2차 비밀번호가 맞으면 비밀번호 재설정
        UPDATE tools_users 
        SET password_hash = crypt(new_password, gen_salt('bf')),
            updated_at = NOW()
        WHERE username = 'leehwa';
        
        RAISE NOTICE '✅ 비밀번호가 성공적으로 재설정되었습니다.';
    ELSE
        RAISE EXCEPTION '❌ 2차 비밀번호가 올바르지 않습니다.';
    END IF;
END $$;

-- 결과 확인
SELECT username, full_name, updated_at 
FROM tools_users 
WHERE username = 'leehwa';

-- ==============================================
-- 🔑 다른 비밀번호로 변경하고 싶은 경우
-- ==============================================
-- 아래 스크립트에서 비밀번호를 수정하여 사용하세요

/*
DO $$
DECLARE
    master_password VARCHAR(255) := 'master123';  -- 2차 비밀번호 (변경 금지!)
    new_password VARCHAR(255) := '새비밀번호';      -- 여기에 원하는 비밀번호 입력
    is_master_valid BOOLEAN;
BEGIN
    -- 2차 비밀번호 확인
    SELECT verify_master_password('leehwa', master_password) INTO is_master_valid;
    
    IF is_master_valid THEN
        -- 2차 비밀번호가 맞으면 비밀번호 재설정
        UPDATE tools_users 
        SET password_hash = crypt(new_password, gen_salt('bf')),
            updated_at = NOW()
        WHERE username = 'leehwa';
        
        RAISE NOTICE '✅ 비밀번호가 성공적으로 변경되었습니다.';
    ELSE
        RAISE EXCEPTION '❌ 2차 비밀번호가 올바르지 않습니다.';
    END IF;
END $$;
*/

-- ==============================================
-- 🔐 2차 비밀번호 변경 (보안 강화)
-- ==============================================
-- 2차 비밀번호를 변경하고 싶다면 아래 스크립트 사용

/*
-- 현재 2차 비밀번호: 'master123'
-- 새 2차 비밀번호: 'newmaster456'

UPDATE tools_users 
SET password_hash = crypt('newmaster456', gen_salt('bf')),
    updated_at = NOW()
WHERE username = 'master';

-- 변경 후에는 위의 모든 스크립트에서 master_password 값을 새 비밀번호로 변경해야 합니다.
*/

-- ==============================================
-- 📊 계정 상태 확인
-- ==============================================
-- 모든 계정 상태 확인
SELECT username, full_name, role, is_active, last_login, updated_at
FROM tools_users 
ORDER BY username;

-- ==============================================
-- ⚠️ 보안 주의사항
-- ==============================================
-- 1. 2차 비밀번호 'master123'을 안전한 곳에 보관하세요
-- 2. 2차 비밀번호는 정기적으로 변경하는 것을 권장합니다
-- 3. 이 스크립트는 신뢰할 수 있는 사람만 사용하세요
-- 4. 2차 비밀번호를 잃어버리면 계정 복구가 매우 어려워집니다

-- ==============================================
-- 🚀 사용 방법:
-- 1. Supabase 대시보드의 SQL Editor로 이동
-- 2. 이 스크립트를 복사하여 붙여넣기
-- 3. 원하는 비밀번호로 수정 (기본값: 5678)
-- 4. 실행 버튼 클릭
-- 5. 결과 확인
-- ==============================================
