# 🛠️ LHATOOL - 공구 관리 시스템

## 📋 프로젝트 개요
Supabase 기반의 현대적인 공구 관리 웹 애플리케이션입니다. 현장에서 공구의 반출/반납을 효율적으로 관리할 수 있는 시스템입니다.

## ✨ 주요 기능

### 🔐 **사용자 인증 시스템**
- **데이터베이스 기반 로그인**: 하드코딩된 로그인에서 DB 기반으로 업그레이드
- **비밀번호 변경**: leehwa 계정의 비밀번호를 직접 변경할 수 있는 기능
- **단일 사용자 시스템**: leehwa 계정 하나만 사용하는 간단한 인증 시스템
- **세션 관리**: 로그인 상태 유지 및 자동 로그아웃

### 🖥️ **Desktop 모드**
- **제품 등록/관리**: 메이커, 모델명, 규격, 바코드 등 상세 정보 관리
- **카테고리 관리**: 동적 카테고리 추가/삭제/수정
- **제품 상태 관리**: 사용 가능, 반출됨, 정비 중, 폐기됨
- **엑셀 다운로드**: 제품 목록 및 반출 현황 엑셀 파일 다운로드
- **상세 정보 표시**: 제품별 반출 이력 및 상세 정보

### 📱 **PDA/Tablet 모드**
- **바코드 스캔**: 제품 바코드 스캔을 통한 빠른 반출/반납
- **자동화된 반납**: 반출자 정보 자동 매칭으로 반납 처리
- **실시간 동기화**: Supabase를 통한 실시간 데이터베이스 연동
- **10인치 태블렛 최적화**: 현장 작업에 최적화된 UI/UX

## 🏗️ 기술 스택

### **Frontend**
- HTML5, CSS3, JavaScript (ES6+)
- 반응형 웹 디자인
- 모던 UI/UX 컴포넌트

### **Backend & Database**
- **Supabase**: PostgreSQL 기반 백엔드 서비스
- **Row Level Security (RLS)**: 데이터 보안
- **실시간 데이터 동기화**

### **라이브러리**
- **JsBarcode**: 바코드 생성 및 표시
- **SheetJS**: 엑셀 파일 생성 및 다운로드

## 🚀 설치 및 실행

### **1. 저장소 클론**
```bash
git clone https://github.com/MLeehwa/LHATOOL.git
cd LHATOOL
```

### **2. Supabase 프로젝트 설정**
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `supabase_tables.sql` 스크립트 실행 (기본 테이블)
3. `users_table.sql` 스크립트 실행 (사용자 테이블 및 함수)
4. `supabase.js`에 프로젝트 URL과 API 키 입력

### **3. 웹 서버 실행**
```bash
# Python HTTP 서버 (권장)
python -m http.server 8000

# 또는 Node.js http-server
npx http-server -p 8000

# 또는 Live Server (VS Code 확장)
```

### **4. 브라우저에서 접속**
```
http://localhost:8000
```

## 📁 프로젝트 구조

```
LHATOOL/
├── index.html          # 메인 페이지 (모드 선택)
├── desktop.html        # 데스크톱 모드 인터페이스
├── pda.html           # PDA/태블렛 모드 인터페이스
├── LOGIN.HTML         # 로그인 페이지
├── desktop.js         # 데스크톱 모드 JavaScript
├── pda.js            # PDA 모드 JavaScript
├── supabase.js       # Supabase 연동 설정
├── desktop.css       # 데스크톱 모드 스타일
├── supabase_tables.sql # 데이터베이스 스키마
└── README.md         # 프로젝트 문서
```

## 🗄️ 데이터베이스 스키마

### **주요 테이블**
- `tools_products`: 제품 정보 (메이커, 모델, 규격, 바코드 등)
- `tools_categories`: 제품 카테고리
- `tools_export_history`: 반출/반납 이력
- `tools_users`: 사용자 인증 (leehwa 계정만)

### **제품 상태**
- `Available`: 사용 가능
- `Exported`: 반출됨
- `Under Maintenance`: 정비 중
- `Retired`: 폐기됨

## 🔄 사용 워크플로우

### **반출 프로세스**
1. PDA 모드에서 "공구 반출" 선택
2. 반출자 이름 입력
3. 제품 바코드 스캔
4. 제품 정보 확인 후 반출 처리
5. 데이터베이스에 반출 기록 저장

### **반납 프로세스**
1. PDA 모드에서 "공구 반납" 선택
2. 제품 바코드 스캔
3. 반출자 정보 자동 표시
4. 반납 확인 후 처리
5. 제품 상태를 'Available'로 복원

## 🌐 지원 플랫폼

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Tablet**: 10인치 태블릿 최적화
- **Mobile**: 반응형 디자인 지원

## 🔧 개발 환경 설정

### **필수 요구사항**
- 웹 브라우저 (최신 버전)
- 로컬 웹 서버 또는 Supabase 프로젝트

### **권장 개발 도구**
- Visual Studio Code
- Live Server 확장
- Git

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 GitHub Issues를 통해 연락해 주세요.

---

**LHATOOL** - 현장의 공구 관리를 더욱 스마트하게! 🚀
