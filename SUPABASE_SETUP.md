# 🔧 Supabase 연동 설정 가이드

## **1단계: Supabase 프로젝트 설정**

### **1.1 테이블 생성**
1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. 프로젝트 `smtqsqokgfxlmyldeeks` 선택
3. **SQL Editor** 메뉴 클릭
4. `supabase_tables.sql` 파일의 내용을 복사하여 실행

### **1.2 테이블 확인**
```sql
-- 생성된 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'tools_%';

-- 각 테이블의 레코드 수 확인
SELECT 'tools_categories' as table_name, COUNT(*) as record_count FROM tools_categories
UNION ALL
SELECT 'tools_products' as table_name, COUNT(*) as record_count FROM tools_products
UNION ALL
SELECT 'tools_export_history' as table_name, COUNT(*) as record_count FROM tools_export_history;
```

## **2단계: 기존 코드에 Supabase 연동**

### **2.1 HTML 파일에 Supabase 스크립트 추가**
```html
<!-- desktop.html, pda.html, index.html에 추가 -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase.js"></script>
```

### **2.2 기존 localStorage 코드를 Supabase로 변경**

#### **제품 추가 예시**
```javascript
// 기존 코드
function addProduct(productData) {
  const products = JSON.parse(localStorage.getItem('desktopProducts')) || [];
  products.push(productData);
  localStorage.setItem('desktopProducts', JSON.stringify(products));
}

// Supabase 연동 코드
async function addProduct(productData) {
  try {
    const result = await toolsDB.products.add(productData);
    if (result) {
      console.log('제품이 성공적으로 추가되었습니다:', result);
      return true;
    }
  } catch (error) {
    console.error('제품 추가 실패:', error);
    return false;
  }
}
```

#### **제품 목록 조회 예시**
```javascript
// 기존 코드
function getProducts() {
  return JSON.parse(localStorage.getItem('desktopProducts')) || [];
}

// Supabase 연동 코드
async function getProducts() {
  try {
    const products = await toolsDB.products.getAll();
    return products;
  } catch (error) {
    console.error('제품 조회 실패:', error);
    return [];
  }
}
```

## **3단계: 주요 기능별 Supabase 연동**

### **3.1 제품 관리**
```javascript
// 제품 추가
const newProduct = {
  name: '새 제품명',
  category: '전동공구',
  status: 'Available',
  serial_number: 'SN001',
  description: '제품 설명',
  purchase_date: '2024-01-01',
  barcode: 'P000006'
};

const result = await toolsDB.products.add(newProduct);

// 제품 수정
const updateData = { status: 'Exported' };
const updated = await toolsDB.products.update(productId, updateData);

// 제품 삭제
const deleted = await toolsDB.products.delete(productId);
```

### **3.2 카테고리 관리**
```javascript
// 카테고리 목록 조회
const categories = await toolsDB.categories.getAll();

// 새 카테고리 추가
const newCategory = await toolsDB.categories.add('새 카테고리명');

// 카테고리 삭제
const deleted = await toolsDB.categories.delete(categoryId);
```

### **3.3 반출/반납 관리**
```javascript
// 제품 반출
const exported = await toolsDB.exportHistory.export(
  productId, 
  '사용자명', 
  '현장작업'
);

// 제품 반납
const returned = await toolsDB.exportHistory.return(
  productId, 
  '반납자명'
);

// 현재 반출 중인 제품들
const currentExports = await toolsDB.exportHistory.getCurrentExports();
```

### **3.4 통계 조회**
```javascript
// 전체 통계
const overallStats = await toolsDB.stats.getOverallStats();
console.log('전체 제품:', overallStats.total);
console.log('사용 가능:', overallStats.available);
console.log('반출됨:', overallStats.exported);

// 카테고리별 통계
const categoryStats = await toolsDB.stats.getCategoryStats();
categoryStats.forEach(stat => {
  console.log(`${stat.category}: ${stat.total}개 (사용가능: ${stat.available}, 반출: ${stat.exported})`);
});
```

## **4단계: 에러 처리 및 사용자 경험**

### **4.1 로딩 상태 표시**
```javascript
async function loadProducts() {
  // 로딩 시작
  document.getElementById('loading').style.display = 'block';
  
  try {
    const products = await toolsDB.products.getAll();
    renderProducts(products);
  } catch (error) {
    showError('제품 목록을 불러오는데 실패했습니다.');
  } finally {
    // 로딩 종료
    document.getElementById('loading').style.display = 'none';
  }
}
```

### **4.2 성공/실패 메시지**
```javascript
async function addProduct(productData) {
  try {
    const result = await toolsDB.products.add(productData);
    if (result) {
      showSuccess('제품이 성공적으로 추가되었습니다.');
      loadProducts(); // 목록 새로고침
      return true;
    }
  } catch (error) {
    showError('제품 추가에 실패했습니다: ' + error.message);
    return false;
  }
}

function showSuccess(message) {
  // 성공 메시지 표시 로직
  alert('✅ ' + message);
}

function showError(message) {
  // 에러 메시지 표시 로직
  alert('❌ ' + message);
}
```

## **5단계: 테스트 및 검증**

### **5.1 기본 기능 테스트**
1. **제품 추가**: 새 제품을 추가하고 데이터베이스에 저장되는지 확인
2. **제품 조회**: 추가된 제품이 목록에 표시되는지 확인
3. **제품 수정**: 제품 정보를 수정하고 변경사항이 반영되는지 확인
4. **제품 삭제**: 제품을 삭제하고 목록에서 제거되는지 확인

### **5.2 반출/반납 기능 테스트**
1. **제품 반출**: 제품 상태가 'Exported'로 변경되고 이력이 기록되는지 확인
2. **제품 반납**: 제품 상태가 'Available'로 변경되고 반납 정보가 업데이트되는지 확인
3. **이력 조회**: 반출/반납 이력이 올바르게 표시되는지 확인

### **5.3 데이터 무결성 테스트**
1. **외래키 제약**: 존재하지 않는 제품 ID로 반출 이력을 생성할 수 없는지 확인
2. **고유값 제약**: 중복된 바코드나 시리얼 번호를 입력할 수 없는지 확인
3. **필수값 검증**: 필수 필드가 비어있을 때 오류가 발생하는지 확인

## **6단계: 성능 최적화**

### **6.1 쿼리 최적화**
- 필요한 컬럼만 선택하여 데이터 전송량 최소화
- 적절한 인덱스 사용으로 검색 성능 향상
- 페이지네이션을 통한 대용량 데이터 처리

### **6.2 캐싱 전략**
- 자주 사용되는 데이터는 메모리에 캐싱
- 변경이 적은 데이터는 주기적으로 새로고침
- 사용자 입력 데이터는 임시 저장 후 일괄 처리

## **문제 해결**

### **자주 발생하는 오류**
1. **CORS 오류**: Supabase 프로젝트 설정에서 도메인 허용
2. **인증 오류**: API 키가 올바른지 확인
3. **테이블 없음**: SQL 스크립트가 올바르게 실행되었는지 확인

### **디버깅 방법**
```javascript
// Supabase 클라이언트 상태 확인
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Supabase Key:', supabase.supabaseKey);

// 쿼리 결과 상세 확인
const { data, error, count } = await supabase
  .from('tools_products')
  .select('*', { count: 'exact' });

console.log('Data:', data);
console.log('Error:', error);
console.log('Count:', count);
```

이제 Supabase와 연동된 공구 관리 시스템을 사용할 수 있습니다! 🚀
