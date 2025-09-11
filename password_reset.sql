-- 비밀번호 재설정용 SQL 스크립트
-- 이 파일은 비밀번호를 잃어버렸을 때 사용하는 스크립트입니다.

-- ==============================================
-- 1. leehwa 계정 비밀번호를 '5678'로 재설정
-- ==============================================
UPDATE tools_users 
SET password_hash = crypt('5678', gen_salt('bf')),
    updated_at = NOW()
WHERE username = 'leehwa';

-- 결과 확인
SELECT username, full_name, updated_at 
FROM tools_users 
WHERE username = 'leehwa';

-- ==============================================
-- 2. 다른 비밀번호로 변경하고 싶은 경우
-- ==============================================
-- 아래 주석을 해제하고 원하는 비밀번호로 변경하세요

/*
UPDATE tools_users 
SET password_hash = crypt('새비밀번호', gen_salt('bf')),
    updated_at = NOW()
WHERE username = 'leehwa';
*/

-- ==============================================
-- 3. 함수를 사용한 비밀번호 재설정
-- ==============================================
-- reset_user_password 함수가 이미 생성되어 있다면 사용 가능

-- SELECT reset_user_password('leehwa', '5678');

-- ==============================================
-- 4. 비밀번호 확인 (해시값만 표시)
-- ==============================================
-- 현재 저장된 해시값 확인
SELECT username, password_hash, updated_at 
FROM tools_users 
WHERE username = 'leehwa';

-- ==============================================
-- 5. 사용자 계정 상태 확인
-- ==============================================
-- 계정이 활성화되어 있는지 확인
SELECT username, full_name, role, is_active, last_login, updated_at
FROM tools_users 
WHERE username = 'leehwa';

-- ==============================================
-- 사용 방법:
-- 1. Supabase 대시보드의 SQL Editor로 이동
-- 2. 이 스크립트를 복사하여 붙여넣기
-- 3. 원하는 비밀번호로 수정 (기본값: 5678)
-- 4. 실행 버튼 클릭
-- 5. 결과 확인
-- ==============================================
