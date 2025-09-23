# 🗄️ Supabase 데이터베이스 설정 가이드

이 가이드는 LHATOOL 공구 관리 시스템의 Supabase 데이터베이스 설정 방법을 안내합니다.

## 📋 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 테이블 생성](#2-데이터베이스-테이블-생성)
3. [Supabase 설정 정보 입력](#3-supabase-설정-정보-입력)
4. [보안 설정](#4-보안-설정)
5. [테스트 및 확인](#5-테스트-및-확인)

---

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 계정 생성
1. [Supabase 웹사이트](https://supabase.com)에 접속
2. **"Start your project"** 버튼 클릭
3. GitHub 계정으로 로그인 (권장)

### 1.2 새 프로젝트 생성
1. **"New Project"** 버튼 클릭
2. 프로젝트 정보 입력:
   - **Name**: `LHATOOL` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (기록해두세요!)
   - **Region**: 가장 가까운 지역 선택
3. **"Create new project"** 버튼 클릭
4. 프로젝트 생성 완료까지 2-3분 대기

---

## 2. 데이터베이스 테이블 생성

### 2.1 SQL Editor 접속
1. Supabase 대시보드에서 **"SQL Editor"** 메뉴 클릭
2. **"New query"** 버튼 클릭

### 2.2 기본 테이블 생성
1. `supabase_tables.sql` 파일 내용을 복사
2. SQL Editor에 붙여넣기
3. **"Run"** 버튼 클릭하여 실행
4. 성공 메시지 확인

### 2.3 사용자 테이블 생성
1. `users_table.sql` 파일 내용을 복사
2. SQL Editor에 붙여넣기
3. **"Run"** 버튼 클릭하여 실행
4. 성공 메시지 확인

### 2.4 생성된 테이블 확인
**Table Editor**에서 다음 테이블들이 생성되었는지 확인:
- `tools_products` (제품 정보)
- `tools_categories` (카테고리)
- `tools_export_history` (반출 이력)
- `tools_users` (사용자 정보)

---

## 3. Supabase 설정 정보 입력

### 3.1 프로젝트 설정 정보 확인
1. Supabase 대시보드에서 **"Settings"** → **"API"** 메뉴 클릭
2. 다음 정보를 복사:
   - **Project URL**
   - **anon public** 키

### 3.2 supabase.js 파일 수정
1. 프로젝트 폴더에서 `supabase.js` 파일 열기
2. 다음 부분을 수정:

```javascript
// Supabase 프로젝트 설정
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';        // ← 여기에 Project URL 입력
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE'; // ← 여기에 anon public 키 입력
```

**예시:**
```javascript
const supabaseUrl = 'https://abcdefghijklmnop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## 4. 보안 설정

### 4.1 Row Level Security (RLS) 확인
- 모든 테이블에 RLS가 활성화되어 있음
- 현재는 개발용으로 모든 접근이 허용됨
- 운영 환경에서는 적절한 정책 설정 필요

### 4.2 기본 계정 정보
시스템에 기본으로 생성되는 계정:
- **사용자명**: `leehwa`
- **비밀번호**: `5678`
- **2차 비밀번호**: `master123`

⚠️ **보안 주의사항**: 운영 환경에서는 반드시 비밀번호를 변경하세요!

---

## 5. 테스트 및 확인

### 5.1 웹 애플리케이션 실행
```bash
# Python HTTP 서버 실행
python -m http.server 8000

# 또는 Node.js http-server
npx http-server -p 8000
```

### 5.2 로그인 테스트
1. 브라우저에서 `http://localhost:8000` 접속
2. 다음 정보로 로그인:
   - **아이디**: `leehwa`
   - **비밀번호**: `5678`
3. 로그인 성공 확인

### 5.3 비밀번호 변경 테스트
1. 메인 메뉴에서 **"비밀번호 변경"** 버튼 클릭
2. 다음 정보 입력:
   - **현재 비밀번호**: `5678`
   - **새 비밀번호**: 원하는 비밀번호
   - **2차 비밀번호**: `master123`
3. 변경 성공 확인

---

## 🔧 문제 해결

### 자주 발생하는 문제들

#### 1. 로그인이 안 되는 경우
- Supabase URL과 API 키가 올바른지 확인
- `users_table.sql`이 정상적으로 실행되었는지 확인
- 브라우저 개발자 도구의 콘솔에서 오류 메시지 확인

#### 2. 데이터베이스 연결 오류
- Supabase 프로젝트가 정상적으로 생성되었는지 확인
- 네트워크 연결 상태 확인
- Supabase 서비스 상태 확인

#### 3. 테이블이 생성되지 않은 경우
- SQL 스크립트 실행 시 오류 메시지 확인
- Supabase 프로젝트의 데이터베이스 권한 확인
- 스크립트를 순서대로 실행했는지 확인

---

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:
1. GitHub Issues에 문제 보고
2. 프로젝트 문서 확인
3. Supabase 공식 문서 참조

---

## 🔐 보안 권장사항

### 운영 환경 배포 시
1. **비밀번호 변경**: 기본 비밀번호를 강력한 비밀번호로 변경
2. **2차 비밀번호 변경**: `master123`을 안전한 비밀번호로 변경
3. **RLS 정책 설정**: 적절한 Row Level Security 정책 적용
4. **API 키 보안**: API 키를 환경 변수로 관리
5. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용

### 비밀번호 변경 방법
1. Supabase SQL Editor에서 다음 쿼리 실행:
```sql
-- leehwa 계정 비밀번호 변경
UPDATE tools_users 
SET password_hash = crypt('새비밀번호', gen_salt('bf')),
    master_password_hash = crypt('새2차비밀번호', gen_salt('bf')),
    updated_at = NOW()
WHERE username = 'leehwa';
```

---

**LHATOOL** - 안전하고 효율적인 공구 관리 시스템! 🚀