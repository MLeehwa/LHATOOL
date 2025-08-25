// Desktop Tool Management System JavaScript
class DesktopToolManagement {
    constructor() {
        // 중복 실행 방지 플래그 초기화
        this.isProcessing = false;
        
        // 반출 이력 캐시 추가
        this.exportHistoryCache = new Map();
        
        // Netlify 환경에서의 안정성을 위한 설정
        this.isNetlify = window.location.hostname.includes('netlify.app') || 
                         window.location.hostname.includes('netlify.com');
        
        console.log('DesktopToolManagement 초기화 시작');
        console.log('Netlify 환경:', this.isNetlify);
        
        // 데이터 초기화 (Supabase에서 로드)
        this.products = [];
        this.categories = [];
        
        // Handsontable 관련 속성
        this.batchTable = null;
        this.batchData = [];
        
        // 초기화
        this.init();
    }

    // Supabase에서 제품 데이터 로드
    async loadProductsFromDatabase() {
        try {
            console.log('Supabase에서 제품 데이터 로딩 시작...');
            
            if (window.toolsDB && window.toolsDB.products) {
                const products = await window.toolsDB.products.getAll();
                console.log('로드된 제품 수:', products.length);
                
                // 데이터 형식 변환 (Supabase 형식에 맞춤)
                this.products = products.map(product => ({
                    id: product.id,
                    name: product.name || '',
                    maker: product.maker || '',
                    model: product.model || '',
                    specification: product.specification || '',
                    category: product.category || '',
                    status: product.status || 'Available',
                    description: product.description || '',
                    serial_number: product.serial_number || '',
                    purchase_date: product.purchase_date || '',
                    barcode: product.barcode || '',
                    asset_code: product.asset_code || '',
                    exported_by: product.exported_by || '',
                    exported_date: product.exported_date || '',
                    export_purpose: product.export_purpose || '',
                    created_at: product.created_at || '',
                    updated_at: product.updated_at || ''
                }));
                
                console.log('제품 데이터 로딩 완료');
                return true;
            } else {
                console.warn('toolsDB가 아직 로드되지 않음, 빈 배열 사용');
                this.products = this.getEmptyProducts();
                return false;
            }
        } catch (error) {
            console.error('제품 데이터 로딩 중 오류:', error);
            console.warn('빈 배열 사용');
            this.products = this.getEmptyProducts();
            return false;
        }
    }

    // Supabase에서 카테고리 데이터 로드
    async loadCategoriesFromDatabase() {
        try {
            console.log('Supabase에서 카테고리 데이터 로딩 시작...');
            
            if (window.toolsDB && window.toolsDB.categories) {
                const categories = await window.toolsDB.categories.getAll();
                console.log('로드된 카테고리 수:', categories.length);
                console.log('카테고리 데이터:', categories);
                
                this.categories = categories.map(category => ({
                    id: category.id,
                    name: category.name || '',
                    code: category.code || category.name?.charAt(0) || 'X',
                    created_at: category.created_at
                }));
                
                console.log('변환된 카테고리 데이터:', this.categories);
                console.log('카테고리 데이터 로딩 완료');
                return true;
            } else {
                console.warn('toolsDB가 아직 로드되지 않음, 빈 배열 사용');
                this.categories = this.getEmptyCategories();
                return false;
            }
        } catch (error) {
            console.error('카테고리 데이터 로딩 중 오류:', error);
            console.warn('빈 배열 사용');
            this.categories = this.getEmptyCategories();
            return false;
        }
    }

    // 데이터베이스에 제품 추가
    async addProductToDatabase(productData) {
        try {
            if (window.toolsDB && window.toolsDB.products) {
                console.log('Supabase에 제품 추가:', productData);
                
                // 바코드가 있는 경우 중복 검사
                if (productData.barcode && productData.barcode.trim()) {
                    const existingProduct = await window.toolsDB.products.getByBarcode(productData.barcode.trim());
                    if (existingProduct) {
                        console.warn('바코드가 이미 존재합니다:', productData.barcode);
                        alert('이미 존재하는 바코드입니다. 다른 바코드를 사용해주세요.');
                        return null;
                    }
                }
                
                const newProduct = await window.toolsDB.products.add({
                    name: productData.name,
                    maker: productData.maker,
                    model: productData.model,
                    specification: productData.specification,
                    category: productData.category,
                    status: productData.status || 'Available',
                    description: productData.description,
                    serial_number: productData.serial_number,
                    purchase_date: productData.purchase_date,
                    barcode: productData.barcode && productData.barcode.trim() ? productData.barcode.trim() : null,
                    asset_code: productData.asset_code
                });
                
                if (newProduct) {
                    console.log('제품 추가 성공:', newProduct);
                    return newProduct;
                } else {
                    console.error('제품 추가 실패');
                    alert('제품 추가에 실패했습니다. 다시 시도해주세요.');
                    return null;
                }
            } else {
                console.warn('toolsDB를 사용할 수 없음, 로컬에만 추가');
                alert('데이터베이스 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                return null;
            }
        } catch (error) {
            console.error('제품 추가 중 오류:', error);
            alert('제품 추가 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
            return null;
        }
    }

    // 데이터베이스에서 제품 업데이트
    async updateProductInDatabase(productId, updateData) {
        try {
            if (window.toolsDB && window.toolsDB.products) {
                console.log('Supabase에서 제품 업데이트:', productId, updateData);
                
                // 바코드가 변경된 경우 중복 검사
                if (updateData.barcode && updateData.barcode.trim()) {
                    const existingProduct = await window.toolsDB.products.getByBarcode(updateData.barcode.trim());
                    if (existingProduct && existingProduct.id !== productId) {
                        console.warn('바코드가 이미 다른 제품에 존재합니다:', updateData.barcode);
                        alert('이미 존재하는 바코드입니다. 다른 바코드를 사용해주세요.');
                        return null;
                    }
                }
                
                const updatedProduct = await window.toolsDB.products.update(productId, {
                    name: updateData.name,
                    maker: updateData.maker,
                    model: updateData.model,
                    specification: updateData.specification,
                    category: updateData.category,
                    status: updateData.status,
                    description: updateData.description,
                    serial_number: updateData.serial_number,
                    purchase_date: updateData.purchase_date,
                    barcode: updateData.barcode ? updateData.barcode.trim() : null,
                    asset_code: updateData.asset_code
                    // updated_at은 트리거가 자동으로 처리
                });
                
                if (updatedProduct) {
                    console.log('제품 업데이트 성공:', updatedProduct);
                    return updatedProduct;
                } else {
                    console.error('제품 업데이트 실패');
                    alert('제품 수정에 실패했습니다. 다시 시도해주세요.');
                    return null;
                }
            } else {
                console.warn('toolsDB를 사용할 수 없음, 로컬에만 업데이트');
                alert('데이터베이스 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                return null;
            }
        } catch (error) {
            console.error('제품 업데이트 중 오류:', error);
            alert('제품 수정 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
            return null;
        }
    }

    // 데이터베이스에서 제품 삭제
    async deleteProductFromDatabase(productId) {
        try {
            if (window.toolsDB && window.toolsDB.products) {
                console.log('Supabase에서 제품 삭제:', productId);
                
                // 제품이 반출 이력에 있는지 확인
                if (window.toolsDB.exportHistory) {
                    const exportHistory = await window.toolsDB.exportHistory.getByProductId(productId);
                    if (exportHistory && exportHistory.length > 0) {
                        console.warn('반출 이력이 있는 제품은 삭제할 수 없습니다:', productId);
                        alert('반출 이력이 있는 제품은 삭제할 수 없습니다. 먼저 반출 이력을 정리해주세요.');
                        return false;
                    }
                }
                
                const success = await window.toolsDB.products.delete(productId);
                
                if (success) {
                    console.log('제품 삭제 성공');
                    return true;
                } else {
                    console.error('제품 삭제 실패');
                    alert('제품 삭제에 실패했습니다. 다시 시도해주세요.');
                    return false;
                }
            } else {
                console.warn('toolsDB를 사용할 수 없음, 로컬에서만 삭제');
                alert('데이터베이스 연결에 실패했습니다. 페이지를 새로고침해주세요.');
                return false;
            }
        } catch (error) {
            console.error('제품 삭제 중 오류:', error);
            alert('제품 삭제 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
            return false;
        }
    }

    // 데이터베이스에서 제품 상태 변경
    async changeProductStatusInDatabase(productId, newStatus, additionalData = {}) {
        try {
            if (window.toolsDB && window.toolsDB.products) {
                console.log('Supabase에서 제품 상태 변경:', productId, newStatus);
                
                const updateData = {
                    status: newStatus,
                    updated_at: new Date().toISOString()
                };
                
                // 반출 관련 추가 정보
                if (newStatus === 'Exported' && additionalData.exported_by) {
                    updateData.exported_by = additionalData.exported_by;
                    updateData.exported_date = new Date().toISOString();
                    updateData.export_purpose = additionalData.export_purpose || '현장작업';
                }
                
                const updatedProduct = await window.toolsDB.products.update(productId, updateData);
                
                if (updatedProduct) {
                    console.log('제품 상태 변경 성공:', updatedProduct);
                    return updatedProduct;
                } else {
                    console.error('제품 상태 변경 실패');
                    return null;
                }
            } else {
                console.warn('toolsDB를 사용할 수 없음, 로컬에서만 상태 변경');
                return null;
            }
        } catch (error) {
            console.error('제품 상태 변경 중 오류:', error);
            return null;
        }
    }

    // Supabase 연결 실패 시 빈 배열 반환 (기본 데이터 없음)
    getEmptyProducts() {
        return [];
    }

    // Supabase 연결 실패 시 빈 배열 반환 (기본 데이터 없음)
    getEmptyCategories() {
        console.log('기본 카테고리 배열 반환');
        return [];
    }

    // Initialize
    init() {
        try {
            console.log('초기화 시작...');
            
            // DOM이 완전히 로드될 때까지 대기
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', async () => {
                    await this.initializeSystem();
                });
            } else {
                this.initializeSystem();
            }
        } catch (error) {
            console.error('초기화 중 오류 발생:', error);
            // 재시도 로직
            setTimeout(() => this.init(), 1000);
        }
    }
    
    // 실제 초기화 로직
    async initializeSystem() {
        try {
            console.log('시스템 초기화 시작...');
            
            // 초기 데이터 상태 설정
            this.updateDataStatus('loading', '시스템 초기화 중...');
            
            // Supabase에서 데이터 로드
            await this.loadDataFromDatabase();
            
            this.setupEventListeners();
            this.renderProducts();
            this.renderExportStatus();
            this.updateStats();
            this.renderCategories();
            this.loadCategoryOptions();
            this.loadExportCategoryFilterOptions();
            
            // UI 렌더링
            this.renderProducts();
            this.renderCategories();
            this.updateStats();
            this.renderExportStatus();
            
            // Handsontable 초기화
            this.initializeBatchTable();
            
            console.log('시스템 초기화 완료');
            
            // Netlify 환경에서 추가 검증
            if (this.isNetlify) {
                this.validateNetlifySetup();
            }
        } catch (error) {
            console.error('시스템 초기화 중 오류:', error);
            this.updateDataStatus('error', '시스템 초기화 실패');
        }
    }

    // 데이터 상태 UI 업데이트
    updateDataStatus(status, message) {
        const dataStatus = document.getElementById('dataStatus');
        if (dataStatus) {
            // 기존 클래스 제거
            dataStatus.className = 'data-status';
            
            // 상태에 따른 클래스와 메시지 설정
            switch (status) {
                case 'loading':
                    dataStatus.classList.add('loading');
                    dataStatus.innerHTML = '<span class="spinner"></span><span>' + (message || '데이터 로딩 중...') + '</span>';
                    break;
                case 'success':
                    dataStatus.classList.add('success');
                    dataStatus.innerHTML = '<span>✅ ' + (message || '데이터 로딩 완료') + '</span>';
                    break;
                case 'warning':
                    dataStatus.classList.add('warning');
                    dataStatus.innerHTML = '<span>⚠️ ' + (message || '일부 데이터 로딩 실패') + '</span>';
                    break;
                case 'error':
                    dataStatus.classList.add('error');
                    dataStatus.innerHTML = '<span>❌ ' + (message || '데이터 로딩 실패') + '</span>';
                    break;
            }
        }
    }

    // Supabase에서 데이터 로드
    async loadDataFromDatabase() {
        try {
            console.log('데이터베이스에서 데이터 로딩 시작...');
            this.updateDataStatus('loading', 'Supabase 연결 중...');
            
            // Supabase가 로드될 때까지 대기
            let retryCount = 0;
            const maxRetries = 10;
            
            while (!window.toolsDB && retryCount < maxRetries) {
                console.log(`Supabase 로딩 대기 중... (${retryCount + 1}/${maxRetries})`);
                this.updateDataStatus('loading', `Supabase 로딩 대기 중... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
            }
            
            if (window.toolsDB) {
                console.log('Supabase 로딩 완료, 데이터 로딩 시작');
                this.updateDataStatus('loading', '데이터 로딩 중...');
                
                // 제품과 카테고리 데이터를 병렬로 로드
                const [productsLoaded, categoriesLoaded] = await Promise.allSettled([
                    this.loadProductsFromDatabase(),
                    this.loadCategoriesFromDatabase()
                ]);
                
                let successCount = 0;
                let totalCount = 2;
                
                if (productsLoaded.status === 'fulfilled' && productsLoaded.value) {
                    console.log('제품 데이터 로딩 성공');
                    successCount++;
                } else {
                    console.warn('제품 데이터 로딩 실패');
                }
                
                if (categoriesLoaded.status === 'fulfilled' && categoriesLoaded.value) {
                    console.log('카테고리 데이터 로딩 성공');
                    successCount++;
                } else {
                    console.warn('카테고리 데이터 로딩 실패');
                }
                
                // 결과에 따른 상태 업데이트
                if (successCount === totalCount) {
                    this.updateDataStatus('success', `데이터 로딩 완료 (${this.products.length}개 제품, ${this.categories.length}개 카테고리)`);
                } else if (successCount > 0) {
                    this.updateDataStatus('warning', `일부 데이터 로딩 실패 (${successCount}/${totalCount})`);
                } else {
                    this.updateDataStatus('error', '모든 데이터 로딩 실패');
                }
            } else {
                console.warn('Supabase 로딩 실패, 빈 배열 사용');
                this.products = this.getEmptyProducts();
                this.categories = this.getEmptyCategories();
                this.updateDataStatus('error', 'Supabase 연결 실패 - 빈 데이터 사용');
            }
        } catch (error) {
            console.error('데이터 로딩 중 오류:', error);
            console.warn('빈 배열 사용');
            this.products = this.getEmptyProducts();
            this.categories = this.getEmptyCategories();
            this.updateDataStatus('error', '데이터 로딩 오류 - 빈 데이터 사용');
        }
    }
    
    // Netlify 환경 검증
    validateNetlifySetup() {
        console.log('Netlify 환경 검증 시작...');
        
        // 이벤트 리스너가 제대로 설정되었는지 확인
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            console.log('폼 이벤트 리스너 설정 확인됨');
        } else {
            console.error('폼을 찾을 수 없음');
        }
        
        // 수정/삭제 버튼 이벤트 위임 확인
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn') || 
                e.target.classList.contains('delete-btn') ||
                e.target.classList.contains('export-btn') ||
                e.target.classList.contains('return-btn') ||
                e.target.classList.contains('maintenance-btn')) {
                console.log('버튼 클릭 이벤트 감지됨:', e.target.className);
            }
        });
        
        console.log('Netlify 환경 검증 완료');
    }

    // Event listeners setup
    setupEventListeners() {
        // Form submission
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddProduct();
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Export search input
        const exportSearchInput = document.getElementById('exportSearchInput');
        if (exportSearchInput) {
            exportSearchInput.addEventListener('input', (e) => {
                this.filterExportStatus(e.target.value);
            });
        }

        // Add event delegation for action buttons
        document.addEventListener('click', async (e) => {
            try {
                const target = e.target;
                console.log('클릭된 요소:', target.className, target.getAttribute('data-action'));
                
                // Check if clicked element is an action button
                if (target.matches('[data-action]')) {
                    const action = target.getAttribute('data-action');
                    const productId = parseInt(target.getAttribute('data-id'));
                    
                    console.log('액션:', action, '제품 ID:', productId);
                    
                    if (productId && !isNaN(productId)) {
                        switch (action) {
                            case 'edit':
                                console.log('수정 시작:', productId);
                                await this.editProduct(productId);
                                break;
                            case 'delete':
                                console.log('삭제 시작:', productId);
                                await this.deleteProduct(productId);
                                break;
                            case 'export':
                                console.log('반출 시작:', productId);
                                await this.changeProductStatus(productId, 'Exported');
                                break;
                            case 'return':
                                console.log('반납 시작:', productId);
                                await this.changeProductStatus(productId, 'Available');
                                break;
                            case 'maintenance':
                                console.log('정비 시작:', productId);
                                await this.changeProductStatus(productId, 'Under Maintenance');
                                break;
                        }
                    } else {
                        console.error('유효하지 않은 제품 ID:', productId);
                    }
                }
            } catch (error) {
                console.error('버튼 클릭 이벤트 처리 중 오류:', error);
                this.showNotification('작업 처리 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // Download products as Excel
    downloadProductsExcel() {
        try {
            // SheetJS가 로드되었는지 확인
            if (typeof XLSX === 'undefined') {
                this.showNotification('엑셀 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.', 'error');
                return;
            }
            
            // 간단한 SheetJS 방식으로 엑셀 생성
            this.createSimpleExcelWithSheetJS('제품_등록_목록', this.createProductsWorksheet());
            this.showNotification('제품 등록 목록이 엑셀로 다운로드되었습니다.', 'success');
        } catch (error) {
            console.error('엑셀 다운로드 실패:', error);
            this.showNotification('엑셀 다운로드 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // Download export status as Excel
    downloadExportStatusExcel() {
        try {
            // SheetJS가 로드되었는지 확인
            if (typeof XLSX === 'undefined') {
                this.showNotification('엑셀 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.', 'error');
                return;
            }
            
            // 간단한 SheetJS 방식으로 엑셀 생성
            this.createSimpleExcelWithSheetJS('반출_현황_목록', this.createExportStatusWorksheet());
            this.showNotification('반출 현황 목록이 엑셀로 다운로드되었습니다.', 'success');
        } catch (error) {
            console.error('엑셀 다운로드 실패:', error);
            this.showNotification('엑셀 다운로드 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // Create products worksheet data
    createProductsWorksheet() {
        const headers = [
            '제품명', '메이커', '모델명', '규격', '카테고리', '상태', 
            '자산코드', '시리얼 번호', '설명', '구매일', '워런티', '등록일', '바코드', '반출 정보'
        ];
        
        const data = this.products.map(product => [
            product.name || '',
            product.maker || '',
            product.model || '',
            product.specification || '',
            product.category || '',
            this.getStatusText(product.status) || '',
            product.asset_code || '-',
            product.serial_number || '',
            product.description || '',
            product.purchase_date ? new Date(product.purchase_date).toLocaleDateString('ko-KR') : '',
            product.warranty_date ? new Date(product.warranty_date).toLocaleDateString('ko-KR') : '',
            product.created_at ? new Date(product.created_at).toLocaleDateString('ko-KR') : '',
            product.barcode || '',
            this.getExportInfoText(product)
        ]);
        
        return [headers, ...data];
    }
    
    // Create export status worksheet data
    createExportStatusWorksheet() {
        const headers = [
            '제품명', '메이커', '모델명', '규격', '카테고리', '현재 상태', 
            '자산코드', '시리얼 번호', '설명', '구매일', '워런티', '등록일', '반출자', '반출일', '반출 목적', '반출 기간'
        ];
        
        const data = this.products.map(product => {
            let exportUser = '-';
            let exportDate = '-';
            let exportPurpose = '-';
            let daysInfo = '-';
            
            if (product.status === 'Exported' && product.exported_date) {
                const exportDateObj = new Date(product.exported_date);
                const now = new Date();
                const diffTime = Math.abs(now - exportDateObj);
                const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                exportUser = product.exported_by || '지정되지 않음';
                exportDate = exportDateObj.toLocaleDateString('ko-KR');
                exportPurpose = product.export_purpose || '지정되지 않음';
                
                if (daysDiff > 30) {
                    daysInfo = `${daysDiff}일 (장기)`;
                } else if (daysDiff > 7) {
                    daysInfo = `${daysDiff}일 (연체)`;
                } else {
                    daysInfo = `${daysDiff}일`;
                }
            }
            
            const registrationDate = product.created_at || product.added_date;
            const displayDate = registrationDate ? new Date(registrationDate).toLocaleDateString('ko-KR') : '-';
            
            return [
                product.name || '',
                product.maker || '',
                product.model || '',
                product.specification || '',
                product.category || '',
                this.getStatusText(product.status) || '',
                product.asset_code || '-',
                product.serial_number || '-',
                product.description || '-',
                product.purchase_date ? new Date(product.purchase_date).toLocaleDateString('ko-KR') : '-',
                product.warranty_date ? new Date(product.warranty_date).toLocaleDateString('ko-KR') : '-',
                displayDate,
                exportUser,
                exportDate,
                exportPurpose,
                daysInfo
            ];
        });
        
        return [headers, ...data];
    }
    
    // Get export info text for products
    getExportInfoText(product) {
        if (product.exported_by && product.exported_date) {
            return `사용자: ${product.exported_by}, 날짜: ${new Date(product.exported_date).toLocaleDateString('ko-KR')}, 목적: ${product.export_purpose || '지정되지 않음'}`;
        }
        return '반출되지 않음';
    }
    
    // 간단한 SheetJS를 사용한 엑셀 생성 (한글 깨짐 방지)
    createSimpleExcelWithSheetJS(filename, worksheet) {
        try {
            // 워크북 생성
            const workbook = XLSX.utils.book_new();
            
            // 워크시트 데이터 준비 (한글 깨짐 방지)
            const wsData = worksheet.map(row => 
                row.map(cell => {
                    // null, undefined 처리
                    if (cell === null || cell === undefined) return '';
                    // 한글 깨짐 방지를 위해 문자열로 변환
                    return String(cell);
                })
            );
            
            // 워크시트 생성
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // 컬럼 너비 자동 조정
            const colWidths = [];
            wsData.forEach(row => {
                row.forEach((cell, colIndex) => {
                    const cellLength = String(cell).length;
                    if (!colWidths[colIndex] || cellLength > colWidths[colIndex]) {
                        colWidths[colIndex] = cellLength;
                    }
                });
            });
            
            // 컬럼 너비 적용 (최소 10, 최대 50)
            ws['!cols'] = colWidths.map(width => ({
                width: Math.min(Math.max(width + 2, 10), 50)
            }));
            
            // 워크북에 워크시트 추가
            XLSX.utils.book_append_sheet(workbook, ws, '제품목록');
            
            // 엑셀 파일 다운로드 (한글 깨짐 방지)
            XLSX.writeFile(workbook, filename + '.xlsx', {
                bookType: 'xlsx',
                bookSST: false,
                type: 'binary'
            });
            
            console.log('엑셀 파일 다운로드 완료:', filename + '.xlsx');
            
        } catch (error) {
            console.error('SheetJS 엑셀 생성 실패:', error);
            this.showNotification('엑셀 파일 생성에 실패했습니다.', 'error');
            throw error;
        }
    }

    // Get status text in Korean
    getStatusText(status) {
        const statusMap = {
            'Available': '사용 가능',
            'Exported': '반출됨',
            'Under Maintenance': '정비 중',
            'Retired': '폐기됨'
        };
        return statusMap[status] || status;
    }

    // Show notification
    showNotification(message, type = 'info') {
        alert(message);
    }

    // Render products
    renderProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">아직 등록된 제품이 없습니다.</p>';
            return;
        }

        const productsTable = this.createProductsTable();
        container.appendChild(productsTable);
    }

    // Create products table
    createProductsTable() {
        const table = document.createElement('table');
        table.className = 'products-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>제품명</th>
                <th>메이커</th>
                <th>모델명</th>
                <th>규격</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>자산코드</th>
                <th>시리얼 번호</th>
                <th>설명</th>
                <th>구매일</th>
                <th>워런티</th>
                <th>등록일</th>
                <th>바코드</th>
                <th>반출 정보</th>
                <th>작업</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        this.products.forEach(product => {
            const row = this.createProductRow(product);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        return table;
    }

    // Create product row
    createProductRow(product) {
        const row = document.createElement('tr');
        
        const exportInfo = product.exported_by ? 
            `사용자: ${product.exported_by}<br>날짜: ${new Date(product.exported_date).toLocaleDateString('ko-KR')}<br>목적: ${product.export_purpose}` : 
            '반출되지 않음';
        
        // 날짜 처리 - created_at 또는 added_date 사용
        const registrationDate = product.created_at || product.added_date;
        const displayDate = registrationDate ? new Date(registrationDate).toLocaleDateString('ko-KR') : '-';
        
        row.innerHTML = `
            <td><strong>${product.name}</strong></td>
            <td>${product.maker || '-'}</td>
            <td>${product.model || '-'}</td>
            <td>${product.specification || '-'}</td>
            <td>${product.category}</td>
            <td><span class="status-badge status-${product.status.toLowerCase().replace(' ', '-')}">${this.getStatusText(product.status)}</span></td>
            <td><span class="asset-code">${product.asset_code || '-'}</span></td>
            <td>${product.serial_number || '-'}</td>
            <td>${product.description || '-'}</td>
            <td>${product.purchase_date ? new Date(product.purchase_date).toLocaleDateString('ko-KR') : '-'}</td>
            <td>${this.formatWarrantyDate(product.warranty_date)}</td>
            <td>${displayDate}</td>
            <td>${product.barcode || '-'}</td>
            <td style="font-size: 0.9rem;">${exportInfo}</td>
            <td>${this.getActionButtons(product)}</td>
        `;
        
        return row;
    }

    // Get action buttons
    getActionButtons(product) {
        let buttons = '';
        
        buttons += `
            <button class="btn btn-sm btn-primary" data-action="edit" data-id="${product.id}">수정</button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${product.id}">삭제</button>
        `;
        
        return buttons;
    }

    // Filter products
    filterProducts(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderProducts();
            return;
        }

        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.maker && product.maker.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.model && product.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.specification && product.specification.toLowerCase().includes(searchTerm.toLowerCase())) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.serial_number && product.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        this.renderFilteredProducts(filteredProducts);
    }

    // Filter export status
    filterExportStatus(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderExportStatus();
            return;
        }

        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.maker && product.maker.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.model && product.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.specification && product.specification.toLowerCase().includes(searchTerm.toLowerCase())) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.serial_number && product.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.exported_by && product.exported_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.export_purpose && product.export_purpose.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        this.renderFilteredExportStatus(filteredProducts);
    }

    // Render filtered products
    renderFilteredProducts(filteredProducts) {
        const container = document.getElementById('productsContainer');
        if (!container) return;
        
        container.innerHTML = '';

        if (filteredProducts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">검색된 제품이 없습니다.</p>';
            return;
        }

        const productsTable = this.createFilteredProductsTable(filteredProducts);
        container.appendChild(productsTable);
    }

    // Create filtered products table
    createFilteredProductsTable(filteredProducts) {
        const table = document.createElement('table');
        table.className = 'products-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>제품명</th>
                <th>메이커</th>
                <th>모델명</th>
                <th>규격</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>자산코드</th>
                <th>시리얼 번호</th>
                <th>설명</th>
                <th>구매일</th>
                <th>워런티</th>
                <th>등록일</th>
                <th>바코드</th>
                <th>반출 정보</th>
                <th>작업</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        filteredProducts.forEach(product => {
            const row = this.createProductRow(product);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        return table;
    }

    // Render filtered export status
    renderFilteredExportStatus(filteredProducts) {
        const container = document.getElementById('exportStatusContainer');
        if (!container) return;
        
        container.innerHTML = '';

        if (filteredProducts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">검색된 제품이 없습니다.</p>';
            return;
        }

        // Create filtered export status table with latest history
        this.createFilteredExportStatusTable(filteredProducts).then(exportTable => {
            container.appendChild(exportTable);
        }).catch(error => {
            console.error('Filtered export status table 생성 중 오류:', error);
            // 오류 발생 시 기본 테이블 생성
            const fallbackTable = this.createBasicExportStatusTable(filteredProducts);
            container.appendChild(fallbackTable);
        });
    }

    // Create filtered export status table
    async createFilteredExportStatusTable(filteredProducts) {
        const table = document.createElement('table');
        table.className = 'products-table export-status-table';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>제품명</th>
                <th>메이커</th>
                <th>모델명</th>
                <th>규격</th>
                <th>카테고리</th>
                <th>현재 상태</th>
                <th>자산코드</th>
                <th>시리얼 번호</th>
                <th>설명</th>
                <th>구매일</th>
                <th>워런티</th>
                <th>등록일</th>
                <th>반출자</th>
                <th>반출일</th>
                <th>반출 목적</th>
                <th>반출 기간</th>
                <th>작업</th>
            </tr>
        `;
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        
        // 각 제품의 최신 반출 이력을 가져와서 행 생성
        for (const product of filteredProducts) {
            const row = await this.createExportStatusRowWithLatestHistory(product);
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        return table;
    }

    // Update statistics
    updateStats() {
        const total = this.products.length;
        const available = this.products.filter(p => p.status === 'Available').length;
        const exported = this.products.filter(p => p.status === 'Exported').length;
        const maintenance = this.products.filter(p => p.status === 'Under Maintenance').length;

        const totalElement = document.getElementById('totalProducts');
        const availableElement = document.getElementById('availableProducts');
        const exportedElement = document.getElementById('exportedProducts');
        const maintenanceElement = document.getElementById('maintenanceProducts');

        if (totalElement) totalElement.textContent = total;
        if (availableElement) availableElement.textContent = available;
        if (exportedElement) exportedElement.textContent = exported;
        if (maintenanceElement) maintenanceElement.textContent = maintenance;
    }

    // Render export status
    renderExportStatus() {
        const container = document.getElementById('exportStatusContainer');
        if (!container) return;
        
        container.innerHTML = '';

        if (this.products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">등록된 제품이 없습니다.</p>';
            return;
        }

        // 제품을 상태별로 정렬: 현재 반출 중인 제품을 최우선으로 표시
        const sortedProducts = [...this.products].sort((a, b) => {
            // 1순위: 현재 반출 중인 제품 (Exported)
            if (a.status === 'Exported' && b.status !== 'Exported') return -1;
            if (a.status !== 'Exported' && b.status === 'Exported') return 1;
            
            // 2순위: 사용 가능한 제품 (Available)
            if (a.status === 'Available' && b.status !== 'Available') return -1;
            if (a.status !== 'Available' && b.status === 'Available') return 1;
            
            // 3순위: 정비 중인 제품 (Under Maintenance)
            if (a.status === 'Under Maintenance' && b.status !== 'Under Maintenance') return -1;
            if (a.status !== 'Under Maintenance' && b.status === 'Under Maintenance') return 1;
            
            // 4순위: 폐기된 제품 (Retired)
            if (a.status === 'Retired' && b.status !== 'Retired') return -1;
            if (a.status !== 'Retired' && b.status === 'Retired') return 1;
            
            // 같은 상태 내에서는 최근 등록된 제품을 먼저 표시
            const aDate = new Date(a.created_at || a.added_date || 0);
            const bDate = new Date(b.created_at || b.added_date || 0);
            return bDate - aDate;
        });

        // 각 제품의 최신 반출 이력을 가져와서 테이블 생성
        this.createExportStatusTableWithLatestHistory(sortedProducts).then(exportTable => {
            container.appendChild(exportTable);
        }).catch(error => {
            console.error('Export status table 생성 중 오류:', error);
            // 오류 발생 시 기본 테이블 생성
            const fallbackTable = this.createBasicExportStatusTable(sortedProducts);
            container.appendChild(fallbackTable);
        });
    }

    // Create export status table with latest export history
    async createExportStatusTableWithLatestHistory(sortedProducts) {
        const table = document.createElement('table');
        table.className = 'products-table export-status-table';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>제품명</th>
                <th>메이커</th>
                <th>모델명</th>
                <th>규격</th>
                <th>카테고리</th>
                <th>현재 상태</th>
                <th>자산코드</th>
                <th>시리얼 번호</th>
                <th>설명</th>
                <th>구매일</th>
                <th>워런티</th>
                <th>등록일</th>
                <th>반출자</th>
                <th>반출일</th>
                <th>반출 목적</th>
                <th>반출 기간</th>
                <th>작업</th>
            </tr>
        `;
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        // 각 제품의 최신 반출 이력을 가져와서 행 생성
        for (const product of sortedProducts) {
            const row = await this.createExportStatusRowWithLatestHistory(product);
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        return table;
    }

    // Create export status row with latest export history
    async createExportStatusRowWithLatestHistory(product) {
        const row = document.createElement('tr');
        
        let exportUser = '-';
        let exportDate = '-';
        let exportPurpose = '-';
        let daysInfo = '-';
        
        // 현재 반출 중인 제품의 경우 최신 반출 이력에서 정보 가져오기
        if (product.status === 'Exported') {
            try {
                // Supabase에서 해당 제품의 최신 반출 이력 조회
                const exportHistory = await window.toolsDB.exportHistory.getByProductId(product.id);
                if (exportHistory && exportHistory.length > 0) {
                    // export_date 기준으로 정렬하여 최신 기록 가져오기
                    const sortedHistory = exportHistory.sort((a, b) => {
                        const dateA = new Date(a.export_date || 0);
                        const dateB = new Date(b.export_date || 0);
                        return dateB - dateA; // 최신 날짜가 먼저 오도록 내림차순
                    });
                    
                    const latestExport = sortedHistory[0]; // 가장 최근 반출 기록
                    
                    if (latestExport) {
                        exportUser = latestExport.exported_by || '지정되지 않음';
                        exportDate = latestExport.export_date ? new Date(latestExport.export_date).toLocaleDateString('ko-KR') : '-';
                        exportPurpose = latestExport.export_purpose || '지정되지 않음';
                        
                        // 반출 기간 계산
                        const exportDateObj = new Date(latestExport.export_date);
                        const now = new Date();
                        const diffTime = Math.abs(now - exportDateObj);
                        const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (daysDiff > 30) {
                            daysInfo = `<span style="color: #dc3545; font-weight: 600;">${daysDiff}일 (장기)</span>`;
                        } else if (daysDiff > 7) {
                            daysInfo = `<span style="color: #ffc107; font-weight: 600;">${daysDiff}일 (연체)</span>`;
                        } else {
                            daysInfo = `<span style="color: #28a745; font-weight: 600;">${daysDiff}일</span>`;
                        }
                    }
                }
            } catch (error) {
                console.error(`제품 ${product.id}의 반출 이력 조회 실패:`, error);
                // 오류 발생 시 기본 정보 사용
                exportUser = product.exported_by || '지정되지 않음';
                exportDate = product.exported_date ? new Date(product.exported_date).toLocaleDateString('ko-KR') : '-';
                exportPurpose = product.export_purpose || '지정되지 않음';
            }
        }

        // 날짜 처리 - created_at 또는 added_date 사용
        const registrationDate = product.created_at || product.added_date;
        const displayDate = registrationDate ? new Date(registrationDate).toLocaleDateString('ko-KR') : '-';

        row.innerHTML = `
            <td><strong style="cursor: pointer; color: #007bff;" onclick="showProductDetail(${product.id})" title="클릭하여 상세 정보 보기">${product.name}</strong></td>
            <td>${product.maker || '-'}</td>
            <td>${product.model || '-'}</td>
            <td>${product.specification || '-'}</td>
            <td>${product.category}</td>
            <td><span class="status-badge status-${product.status.toLowerCase().replace(' ', '-')}">${this.getStatusText(product.status)}</span></td>
            <td><span class="asset-code">${product.asset_code || '-'}</span></td>
            <td>${product.serial_number || '-'}</td>
            <td class="description-cell">${product.description || '-'}</td>
            <td>${product.purchase_date ? new Date(product.purchase_date).toLocaleDateString('ko-KR') : '-'}</td>
            <td>${this.formatWarrantyDate(product.warranty_date)}</td>
            <td>${displayDate}</td>
            <td>${exportUser}</td>
            <td>${exportDate}</td>
            <td class="purpose-cell">${exportPurpose}</td>
            <td>${daysInfo}</td>
            <td>${this.getExportStatusActionButtons(product)}</td>
        `;

        return row;
    }

    // Create basic export status table (fallback function)
    createBasicExportStatusTable(sortedProducts) {
        const table = document.createElement('table');
        table.className = 'products-table export-status-table';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>제품명</th>
                <th>메이커</th>
                <th>모델명</th>
                <th>규격</th>
                <th>카테고리</th>
                <th>현재 상태</th>
                <th>자산코드</th>
                <th>시리얼 번호</th>
                <th>설명</th>
                <th>구매일</th>
                <th>워런티</th>
                <th>등록일</th>
                <th>반출자</th>
                <th>반출일</th>
                <th>반출 목적</th>
                <th>반출 기간</th>
                <th>작업</th>
            </tr>
        `;
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        // 각 제품의 기본 정보로 행 생성
        for (const product of sortedProducts) {
            const row = this.createBasicExportStatusRow(product);
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        return table;
    }

    // Create basic export status row (fallback function)
    createBasicExportStatusRow(product) {
        const row = document.createElement('tr');
        
        // 기본 정보만 표시 (반출 이력 조회 없이)
        const exportUser = product.exported_by || '-';
        const exportDate = product.exported_date ? new Date(product.exported_date).toLocaleDateString('ko-KR') : '-';
        const exportPurpose = product.export_purpose || '-';
        const daysInfo = '-';
        
        // 날짜 처리 - created_at 또는 added_date 사용
        const registrationDate = product.created_at || product.added_date;
        const displayDate = registrationDate ? new Date(registrationDate).toLocaleDateString('ko-KR') : '-';
        
        row.innerHTML = `
            <td><strong style="cursor: pointer; color: #007bff;" onclick="showProductDetail(${product.id})" title="클릭하여 상세 정보 보기">${product.name}</strong></td>
            <td>${product.maker || '-'}</td>
            <td>${product.model || '-'}</td>
            <td>${product.specification || '-'}</td>
            <td>${product.category}</td>
            <td><span class="status-badge status-${product.status.toLowerCase().replace(' ', '-')}">${this.getStatusText(product.status)}</span></td>
            <td><span class="asset-code">${product.asset_code || '-'}</span></td>
            <td>${product.serial_number || '-'}</td>
            <td class="description-cell">${product.description || '-'}</td>
            <td>${product.purchase_date ? new Date(product.purchase_date).toLocaleDateString('ko-KR') : '-'}</td>
            <td>${this.formatWarrantyDate(product.warranty_date)}</td>
            <td>${displayDate}</td>
            <td>${exportUser}</td>
            <td>${exportDate}</td>
            <td class="purpose-cell">${exportPurpose}</td>
            <td>${daysInfo}</td>
            <td>${this.getExportStatusActionButtons(product)}</td>
        `;
        
        return row;
    }

    // Get export status action buttons
    getExportStatusActionButtons(product) {
        let buttons = '';

        if (product.status === 'Available') {
            buttons += `<button class="btn btn-sm btn-info" data-action="export" data-id="${product.id}">반출</button>`;
        } else if (product.status === 'Exported') {
            buttons += `<button class="btn btn-sm btn-warning" data-action="return" data-id="${product.id}">반납</button>`;
        }

        if (product.status !== 'Retired') {
            buttons += `<button class="btn btn-sm btn-warning" data-action="maintenance" data-id="${product.id}">정비</button>`;
        }

        return buttons;
    }

    // Load category options
    loadCategoryOptions() {
        const categorySelect = document.getElementById('productCategory');
        if (!categorySelect) {
            console.warn('productCategory select element not found');
            return;
        }
        
        categorySelect.innerHTML = '<option value="">카테고리 선택</option>';
        
        if (!this.categories || this.categories.length === 0) {
            console.log('카테고리가 없어서 옵션을 추가할 수 없습니다.');
            return;
        }
        
        this.categories.forEach(category => {
            if (!category || !category.name) {
                console.warn('Invalid category object in loadCategoryOptions:', category);
                return;
            }
            
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        console.log('카테고리 옵션 로드 완료:', this.categories.length, '개');
    }

    // Load export category filter options
    loadExportCategoryFilterOptions() {
        const categoryFilter = document.getElementById('exportCategoryFilter');
        if (!categoryFilter) {
            console.warn('exportCategoryFilter element not found');
            return;
        }
        
        categoryFilter.innerHTML = '<option value="">전체 카테고리</option>';
        
        if (!this.categories || this.categories.length === 0) {
            console.log('카테고리가 없어서 필터 옵션을 추가할 수 없습니다.');
            return;
        }
        
        this.categories.forEach(category => {
            if (!category || !category.name) {
                console.warn('Invalid category object in loadExportCategoryFilterOptions:', category);
                return;
            }
            
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        console.log('내보내기 카테고리 필터 옵션 로드 완료:', this.categories.length, '개');
    }

    // Add new category
    async addNewCategory() {
        console.log('addNewCategory 함수 호출됨');
        
        const newCategoryInput = document.getElementById('newCategory');
        if (!newCategoryInput) {
            console.error('newCategory input element not found');
            this.showNotification('카테고리 입력 필드를 찾을 수 없습니다.', 'error');
            return;
        }
        
        const newCategoryName = newCategoryInput.value.trim();
        console.log('입력된 카테고리 이름:', newCategoryName);
        
        if (!newCategoryName) {
            this.showNotification('카테고리 이름을 입력해주세요.', 'warning');
            return;
        }
        
        if (this.categories.some(c => c.name === newCategoryName)) {
            this.showNotification('이미 존재하는 카테고리입니다.', 'warning');
            return;
        }
        
        try {
            console.log('Supabase 연결 확인 중...');
            if (!window.toolsDB || !window.toolsDB.categories) {
                console.error('toolsDB.categories not available');
                this.showNotification('데이터베이스 연결을 확인할 수 없습니다.', 'error');
                return;
            }
            
            // 새 카테고리에 자동으로 다음 순서의 코드 부여
            const nextCode = this.getNextCategoryCode();
            console.log('생성된 카테고리 코드:', nextCode);
            
            // Supabase에 카테고리 추가
            const categoryData = {
                name: newCategoryName,
                code: nextCode,
                created_at: new Date().toISOString()
            };
            console.log('카테고리 데이터:', categoryData);
            
            const result = await window.toolsDB.categories.add(categoryData);
            console.log('Supabase 응답:', result);
            
            if (result && result.id) {
                // 로컬 배열에 추가 (ID 포함)
                this.categories.push(result);
                console.log('로컬 카테고리 배열 업데이트됨:', this.categories);
                
                // 입력 필드 초기화
                newCategoryInput.value = '';
                
                // 카테고리 목록 새로고침
                this.renderCategories();
                
                // 제품 등록 폼의 카테고리 선택 옵션 새로고침
                this.loadCategoryOptions();
                
                this.showNotification(`새 카테고리 "${newCategoryName}"이(가) 코드 "${nextCode}"로 추가되었습니다.`, 'success');
            } else {
                console.error('카테고리 추가 실패: result is null or missing id');
                this.showNotification('카테고리 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('카테고리 추가 실패:', error);
            this.showNotification(`카테고리 추가 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    // Get next category code
    getNextCategoryCode() {
        const existingCodes = this.categories.map(c => c.code).filter(code => code);
        const usedCodes = new Set(existingCodes);
        
        // A부터 Z까지 순서대로 사용 가능한 코드 찾기
        for (let i = 65; i <= 90; i++) {
            const code = String.fromCharCode(i);
            if (!usedCodes.has(code)) {
                return code;
            }
        }
        
        // A-Z를 모두 사용한 경우 AA, AB, AC... 형태로 확장
        let counter = 1;
        while (true) {
            const code = `A${String.fromCharCode(64 + counter)}`;
            if (!usedCodes.has(code)) {
                return code;
            }
            counter++;
        }
    }

    // Filter export status by status
    filterExportStatusByStatus() {
        const statusFilter = document.getElementById('exportStatusFilter');
        if (!statusFilter) return;
        
        const selectedStatus = statusFilter.value;
        
        if (!selectedStatus) {
            this.renderExportStatus();
            return;
        }

        const filteredProducts = this.products.filter(product => product.status === selectedStatus);
        this.renderFilteredExportStatus(filteredProducts);
    }

    // Filter export status by category
    filterExportStatusByCategory() {
        const categoryFilter = document.getElementById('exportCategoryFilter');
        if (!categoryFilter) return;
        
        const selectedCategory = categoryFilter.value;
        
        if (!selectedCategory) {
            this.renderExportStatus();
            return;
        }

        const filteredProducts = this.products.filter(product => product.category === selectedCategory);
        this.renderFilteredExportStatus(filteredProducts);
    }



    // Format warranty date with styling
    formatWarrantyDate(warrantyDate) {
        if (!warrantyDate) return '-';
        
        const warranty = new Date(warrantyDate);
        const today = new Date();
        const isExpired = warranty < today;
        const daysUntilExpiry = Math.ceil((warranty - today) / (1000 * 60 * 60 * 24));
        
        let className = 'warranty-date';
        if (isExpired) {
            className += ' warranty-expired';
        } else if (daysUntilExpiry <= 30) {
            className += ' warranty-expired';
        }
        
        const formattedDate = warranty.toLocaleDateString('ko-KR');
        const statusText = isExpired ? '만료됨' : (daysUntilExpiry <= 30 ? `${daysUntilExpiry}일 후 만료` : '유효');
        
        return `<span class="${className}" title="${statusText}">${formattedDate}</span>`;
    }

    // Handle form submission
    async handleAddProduct() {
        // 중복 실행 방지
        if (this.isProcessing) {
            console.log('이미 처리 중입니다. 중복 실행을 방지합니다.');
            return;
        }
        
        this.isProcessing = true;
        
        try {
            const form = document.getElementById('addProductForm');
            
            // 제품 데이터 준비
            const productData = {
                name: document.getElementById('productName').value,
                maker: document.getElementById('productMaker').value,
                model: document.getElementById('productModel').value,
                specification: document.getElementById('productSpecification').value || '',
                category: document.getElementById('productCategory').value,
                status: document.getElementById('productStatus').value,
                description: document.getElementById('productDescription').value || '',
                serial_number: document.getElementById('productSerial').value || '',
                purchase_date: document.getElementById('productPurchaseDate').value || null,
                warranty_date: document.getElementById('productWarrantyDate').value || null,
                asset_code: this.generateAssetCode(document.getElementById('productCategory').value),
                barcode: this.generateBarcode() // 바코드 자동 생성
            };

            // 편집 모드인지 확인
            if (this.editingProductId) {
                // 기존 제품 수정
                await this.updateProduct(productData);
            } else {
                // 새 제품 추가
                await this.addProduct(productData);
            }

            // Reset form
            form.reset();
            
            // UI 새로고침
            this.renderProducts();
            this.updateStats();
            this.renderExportStatus();
            
        } finally {
            // 처리 완료 후 플래그 해제
            this.isProcessing = false;
        }
    }

    // Add new product
    async addProduct(productData) {
        try {
            // 새 제품 객체 생성 (바코드와 asset_code는 이미 productData에 포함됨)
            const newProduct = {
                ...productData,
                created_at: new Date().toISOString()
            };
            
            // Supabase에 제품 추가
            const addedProduct = await this.addProductToDatabase(newProduct);
            
            if (addedProduct) {
                // 데이터베이스에서 반환된 ID 사용
                newProduct.id = addedProduct.id;
                this.products.push(newProduct);
                this.showNotification('제품이 성공적으로 추가되었습니다.', 'success');
                return true;
            } else {
                // 데이터베이스 추가 실패 시 로컬에만 추가
                const newId = Math.max(...this.products.map(p => p.id), 0) + 1;
                newProduct.id = newId;
                this.products.push(newProduct);
                this.showNotification('제품이 로컬에만 추가되었습니다. (데이터베이스 연결 실패)', 'warning');
                return false;
            }
        } catch (error) {
            console.error('제품 추가 실패:', error);
            this.showNotification('제품 추가 중 오류가 발생했습니다.', 'error');
            return false;
        }
    }

    // Generate asset code based on category
    generateAssetCode(category) {
        if (!category) return null;
        
        // 카테고리별 접두사 매핑
        const categoryPrefixes = {
            '전동공구': 'A',
            '수동공구': 'B', 
            '측정도구': 'C',
            '안전장비': 'D',
            '기타': 'E'
        };
        
        const prefix = categoryPrefixes[category];
        if (!prefix) return null;
        
        // 해당 카테고리의 제품 수를 세어서 다음 번호 생성
        const categoryProducts = this.products.filter(p => p.category === category);
        const nextNumber = categoryProducts.length + 1;
        
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    }

    // Generate unique barcode
    generateBarcode() {
        // 현재 제품 수를 기반으로 다음 바코드 번호 생성
        const nextNumber = this.products.length + 1;
        return `P${nextNumber.toString().padStart(3, '0')}`;
    }

    // Generate unique asset code for batch (with offset)
    generateAssetCodeForBatch(category, offset = 0) {
        if (!category) return null;
        
        // 카테고리별 접두사 매핑
        const categoryPrefixes = {
            '전동공구': 'A',
            '수동공구': 'B', 
            '측정도구': 'C',
            '안전장비': 'D',
            '기타': 'E'
        };
        
        const prefix = categoryPrefixes[category];
        if (!prefix) return null;
        
        // 해당 카테고리의 제품 수 + 오프셋을 기반으로 다음 번호 생성
        const categoryProducts = this.products.filter(p => p.category === category);
        const nextNumber = categoryProducts.length + 1 + offset;
        
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    }

    // Generate unique barcode for batch (with offset)
    generateBarcodeForBatch(offset = 0) {
        // 현재 제품 수 + 오프셋을 기반으로 다음 바코드 번호 생성
        const nextNumber = this.products.length + 1 + offset;
        return `P${nextNumber.toString().padStart(3, '0')}`;
    }

    // Change product status
    async changeProductStatus(productId, newStatus) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            let additionalData = {};
            
            if (newStatus === 'Exported') {
                // 반출 정보 추가
                const exportPurpose = prompt('반출 목적을 입력해주세요:');
                const exportedBy = prompt('반출자 이름을 입력해주세요:');
                
                if (exportPurpose && exportedBy) {
                    additionalData = {
                        exported_by: exportedBy,
                        export_purpose: exportPurpose
                    };
                } else {
                    this.showNotification('반출 목적과 반출자 이름을 모두 입력해주세요.', 'warning');
                    return;
                }
            }

            // Supabase에서 제품 상태 변경
            const updatedProduct = await this.changeProductStatusInDatabase(productId, newStatus, additionalData);
            
            if (updatedProduct) {
                // 데이터베이스 업데이트 성공 시 로컬 배열도 업데이트
                product.status = newStatus;
                product.last_modified = new Date().toISOString();
                
                if (newStatus === 'Exported') {
                    product.exported_by = additionalData.exported_by;
                    product.exported_date = new Date().toISOString();
                    product.export_purpose = additionalData.export_purpose;
                } else {
                    // 반출 상태가 아닌 경우 반출 정보 초기화
                    product.exported_by = null;
                    product.exported_date = null;
                    product.export_purpose = null;
                }
                
                this.showNotification(`제품 상태가 '${newStatus}'로 변경되었습니다.`, 'success');
            } else {
                // 데이터베이스 업데이트 실패 시 로컬에만 업데이트
                product.status = newStatus;
                product.last_modified = new Date().toISOString();
                
                if (newStatus === 'Exported') {
                    product.exported_by = additionalData.exported_by;
                    product.exported_date = new Date().toISOString();
                    product.export_purpose = additionalData.export_purpose;
                } else {
                    product.exported_by = null;
                    product.exported_date = null;
                    product.export_purpose = null;
                }
                
                this.showNotification(`제품 상태가 로컬에서만 '${newStatus}'로 변경되었습니다. (데이터베이스 연결 실패)`, 'warning');
            }

            // UI 새로고침
            this.renderProducts();
            this.updateStats();
            this.renderExportStatus();
        } catch (error) {
            console.error('제품 상태 변경 실패:', error);
            this.showNotification('제품 상태 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    // Delete product
    async deleteProduct(productId) {
        try {
            if (confirm('정말로 이 제품을 삭제하시겠습니까?')) {
                // Supabase에서 제품 삭제
                const deleteSuccess = await this.deleteProductFromDatabase(productId);
                
                if (deleteSuccess) {
                    // 데이터베이스 삭제 성공 시 로컬 배열에서도 제거
                    this.products = this.products.filter(p => p.id !== productId);
                    this.showNotification('제품이 성공적으로 삭제되었습니다.', 'success');
                } else {
                    // 데이터베이스 삭제 실패 시 로컬에서만 제거
                    this.products = this.products.filter(p => p.id !== productId);
                    this.showNotification('제품이 로컬에서만 삭제되었습니다. (데이터베이스 연결 실패)', 'warning');
                }
                
                // UI 새로고침
                this.renderProducts();
                this.updateStats();
                this.renderExportStatus();
                return true;
            }
            return false;
        } catch (error) {
            console.error('제품 삭제 실패:', error);
            this.showNotification('제품 삭제 중 오류가 발생했습니다.', 'error');
            return false;
        }
    }

    // Edit product
    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // 폼에 기존 데이터 채우기
        const form = document.getElementById('addProductForm');
        if (form) {
            document.getElementById('productName').value = product.name;
            document.getElementById('productMaker').value = product.maker || '';
            document.getElementById('productModel').value = product.model || '';
            document.getElementById('productSpecification').value = product.specification || '';
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productStatus').value = product.status;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productSerial').value = product.serial_number || '';
            document.getElementById('productPurchaseDate').value = product.purchase_date || '';
            document.getElementById('productWarrantyDate').value = product.warranty_date || '';

            // 편집 모드 설정
            this.editingProductId = productId;
            
            // 버튼 텍스트 변경
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '제품 수정';
            }
            
            // 폼을 제품 등록 탭으로 이동
            this.showTab('product-registration');
            
            // 제품 등록 섹션으로 스크롤
            const formSection = document.querySelector('.form-section');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    // Update existing product
    async updateProduct(productData) {
        try {
            // 기존 제품 정보 가져오기
            const existingProduct = this.products.find(p => p.id === this.editingProductId);
            if (!existingProduct) {
                this.showNotification('수정할 제품을 찾을 수 없습니다.', 'error');
                return false;
            }

            // 업데이트할 데이터 준비 (바코드와 asset_code는 기존 값 유지)
            const updateData = {
                ...productData,
                barcode: existingProduct.barcode, // 기존 바코드 유지
                asset_code: existingProduct.asset_code, // 기존 asset_code 유지
                updated_at: new Date().toISOString()
            };

            // Supabase에서 제품 업데이트
            const updatedProduct = await this.updateProductInDatabase(this.editingProductId, updateData);
            
            if (updatedProduct) {
                // 로컬 배열 업데이트
                const index = this.products.findIndex(p => p.id === this.editingProductId);
                if (index !== -1) {
                    this.products[index] = { ...this.products[index], ...updateData };
                }
                
                this.showNotification('제품이 성공적으로 수정되었습니다.', 'success');
                this.editingProductId = null; // 편집 모드 해제
                return true;
            } else {
                this.showNotification('제품 수정에 실패했습니다.', 'error');
                return false;
            }
        } catch (error) {
            console.error('제품 수정 실패:', error);
            this.showNotification('제품 수정 중 오류가 발생했습니다.', 'error');
            return false;
        }
    }

    // Reset form
    resetForm() {
        const form = document.getElementById('addProductForm');
        if (form) {
            form.reset();
            
            // 버튼 텍스트 원래대로
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '제품 추가';
            }
        }
        
        // 편집 모드 종료
        this.editingProductId = null;
        
        // 제품 등록 탭으로 이동
        this.showTab('product-registration');
    }

    // Show tab
    showTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => tab.classList.remove('active'));
        
        // Remove active class from all tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => tab.classList.remove('active'));
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
    }

    // Save data to Supabase
    async saveData() {
        try {
            // 제품 데이터는 이미 Supabase에 저장되어 있으므로 로컬 상태만 동기화
            // 카테고리 데이터도 이미 Supabase에 저장되어 있음
            console.log('데이터가 Supabase에 저장되어 있습니다.');
        } catch (error) {
            console.error('데이터 저장 실패:', error);
        }
    }
    
    // Load category options
    loadCategoryOptions() {
        const categorySelect = document.getElementById('productCategory');
        categorySelect.innerHTML = '<option value="">카테고리 선택</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name; // Assuming category is an object { name: "Category Name" }
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
    
    // Show product detail modal
    async showProductDetail(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                this.showNotification('제품을 찾을 수 없습니다.', 'error');
                return;
            }
            
            // 먼저 기본 정보를 빠르게 표시
            this.displayBasicProductInfo(product);
            
            // 상세 정보 섹션을 즉시 표시
            document.getElementById('productDetailSection').style.display = 'block';
            
            // 상세 정보 섹션으로 스크롤
            document.getElementById('productDetailSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // 반출 이력을 백그라운드에서 로드 (사용자 경험 개선)
            this.loadExportHistoryInBackground(product);
            
        } catch (error) {
            console.error('제품 상세 정보 표시 실패:', error);
            this.showNotification('제품 상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 기본 제품 정보를 빠르게 표시
    displayBasicProductInfo(product) {
        // 제품 기본 정보 표시
        document.getElementById('detailProductName').textContent = product.name;
        document.getElementById('detailMaker').textContent = product.maker || '-';
        document.getElementById('detailModel').textContent = product.model || '-';
        document.getElementById('detailSpecification').textContent = product.specification || '-';
        document.getElementById('detailCategory').textContent = product.category;
        document.getElementById('detailAssetCode').textContent = product.asset_code || '-';
        document.getElementById('detailSerialNumber').textContent = product.serial_number || '-';
        document.getElementById('detailPurchaseDate').textContent = product.purchase_date ? new Date(product.purchase_date).toLocaleDateString('ko-KR') : '-';
        document.getElementById('detailWarrantyDate').textContent = product.warranty_date ? new Date(product.warranty_date).toLocaleDateString('ko-KR') : '-';
        
        const registrationDate = product.created_at || product.added_date;
        document.getElementById('detailRegistrationDate').textContent = registrationDate ? new Date(registrationDate).toLocaleDateString('ko-KR') : '-';
        
        // 현재 상태 표시
        const statusText = this.getStatusText(product.status);
        document.getElementById('detailCurrentStatus').textContent = statusText;
        
        // 반출 이력 컨테이너에 로딩 표시
        const container = document.getElementById('exportHistoryContainer');
        container.innerHTML = '<div class="loading-history">반출 이력을 불러오는 중...</div>';
    }
    
    // 백그라운드에서 반출 이력 로드
    async loadExportHistoryInBackground(product) {
        try {
            const container = document.getElementById('exportHistoryContainer');
            
            // 캐시된 반출 이력 가져오기
            const exportHistory = await this.getCachedExportHistory(product.id);
            
            // 로딩 상태 제거
            container.innerHTML = '';
            
            if (exportHistory && exportHistory.length > 0) {
                // 반출 이력을 export_date 기준으로 정렬하여 최신 기록 확보
                const sortedHistory = exportHistory.sort((a, b) => {
                    const dateA = new Date(a.export_date || 0);
                    const dateB = new Date(b.export_date || 0);
                    return dateB - dateA; // 최신 날짜가 먼저 오도록 내림차순
                });
                
                console.log('📅 백그라운드 정렬된 반출 이력:', sortedHistory);
                
                sortedHistory.forEach((history, index) => {
                    const historyItem = this.createExportHistoryItem(history, index === 0 && product.status === 'Exported');
                    container.appendChild(historyItem);
                });
            } else {
                // 현재 반출 상태가 있는 경우 기본 이력 표시
                if (product.status === 'Exported' && product.exported_date) {
                    const currentExport = {
                        export_date: product.exported_date,
                        exported_by: product.exported_by,
                        export_purpose: product.export_purpose,
                        return_date: null,
                        returned_by: null,
                        notes: '현재 반출 중'
                    };
                    
                    const historyItem = this.createExportHistoryItem(currentExport, true);
                    container.appendChild(historyItem);
                } else {
                    container.innerHTML = '<div class="no-export-history">아직 반출 이력이 없습니다.</div>';
                }
            }
            
        } catch (error) {
            console.error('반출 이력 로드 실패:', error);
            const container = document.getElementById('exportHistoryContainer');
            container.innerHTML = '<div class="no-export-history">반출 이력을 불러오는 중 오류가 발생했습니다.</div>';
        }
    }
    
    // Close product detail
    closeProductDetail() {
        document.getElementById('productDetailSection').style.display = 'none';
    }
    
    // Get status text in Korean
    getStatusText(status) {
        const statusMap = {
            'Available': '사용 가능',
            'Exported': '반출됨',
            'Under Maintenance': '정비 중',
            'Retired': '폐기됨'
        };
        return statusMap[status] || status;
    }
    
    // Render export history
    async renderExportHistory(product) {
        const container = document.getElementById('exportHistoryContainer');
        container.innerHTML = '';
        
        try {
            // Supabase에서 반출 이력 조회
            const exportHistory = await window.toolsDB.exportHistory.getByProductId(product.id);
            console.log('🔍 반출 이력 조회 결과:', exportHistory);
            
            if (exportHistory && exportHistory.length > 0) {
                // 반출 이력을 export_date 기준으로 다시 정렬하여 최신 기록 확보
                const sortedHistory = exportHistory.sort((a, b) => {
                    const dateA = new Date(a.export_date || 0);
                    const dateB = new Date(b.export_date || 0);
                    return dateB - dateA; // 최신 날짜가 먼저 오도록 내림차순
                });
                
                console.log('📅 정렬된 반출 이력:', sortedHistory);
                
                // 반출 현황에는 최신 반출 정보만 표시 (현재 상태)
                const latestExport = sortedHistory[0]; // 가장 최근 반출
                console.log('✅ 최신 반출 기록:', latestExport);
                
                // 현재 반출 중인 경우 최신 정보 표시
                if (product.status === 'Exported') {
                    const currentExportItem = this.createExportHistoryItem(latestExport, true);
                    container.appendChild(currentExportItem);
                    
                    // 추가로 "현재 반출 중" 표시
                    const currentStatusDiv = document.createElement('div');
                    currentStatusDiv.className = 'current-export-status';
                    currentStatusDiv.innerHTML = `
                        <div class="export-status-badge current">현재 반출 중</div>
                        <div class="export-history-details">
                            <div class="export-detail-item">
                                <label>반출자</label>
                                <span>${latestExport.exported_by || '-'}</span>
                            </div>
                            <div class="export-detail-item">
                                <label>반출일</label>
                                <span>${latestExport.export_date ? new Date(latestExport.export_date).toLocaleDateString('ko-KR') : '-'}</span>
                            </div>
                            <div class="export-detail-item">
                                <label>반출 목적</label>
                                <span>${latestExport.export_purpose || '-'}</span>
                            </div>
                        </div>
                    `;
                    container.appendChild(currentStatusDiv);
                }
                
                // 과거 이력은 별도로 표시 (상세 이력)
                if (sortedHistory.length > 1) {
                    const historyHeader = document.createElement('h4');
                    historyHeader.textContent = '📋 과거 반출 이력';
                    historyHeader.style.marginTop = '20px';
                    historyHeader.style.marginBottom = '15px';
                    historyHeader.style.color = '#495057';
                    container.appendChild(historyHeader);
                    
                    // 과거 이력들 표시 (최신 제외)
                    sortedHistory.slice(1).forEach((history, index) => {
                        const historyItem = this.createExportHistoryItem(history, false);
                        container.appendChild(historyItem);
                    });
                }
            } else {
                // 반출 이력이 없는 경우
                if (product.status === 'Available') {
                    container.innerHTML = '<div class="no-export-history">아직 반출 이력이 없습니다. (현재 사용 가능 상태)</div>';
                } else if (product.status === 'Exported') {
                    // 상태는 Exported인데 이력이 없는 경우 (데이터 불일치)
                    container.innerHTML = '<div class="no-export-history">반출 상태이지만 이력 정보를 찾을 수 없습니다.</div>';
                } else {
                    container.innerHTML = '<div class="no-export-history">아직 반출 이력이 없습니다.</div>';
                }
            }
            
        } catch (error) {
            console.error('반출 이력 로드 실패:', error);
            container.innerHTML = '<div class="no-export-history">반출 이력을 불러오는 중 오류가 발생했습니다.</div>';
        }
    }
    
    // Create export history item
    createExportHistoryItem(history, isCurrent = false) {
        const historyDiv = document.createElement('div');
        historyDiv.className = `export-history-item ${isCurrent ? 'current' : 'returned'}`;
        
        const isReturned = history.return_date && history.returned_by;
        const statusBadge = isCurrent ? 'current' : (isReturned ? 'returned' : 'exported');
        const statusText = isCurrent ? '현재 반출 중' : (isReturned ? '반납됨' : '반출됨');
        
        const exportDate = history.export_date ? new Date(history.export_date).toLocaleDateString('ko-KR') : '-';
        const returnDate = history.return_date ? new Date(history.return_date).toLocaleDateString('ko-KR') : '-';
        
        historyDiv.innerHTML = `
            <div class="export-history-header">
                <h5>반출 이력 #${history.id || 'N/A'}</h5>
                <span class="export-status-badge ${statusBadge}">${statusText}</span>
            </div>
            <div class="export-history-details">
                <div class="export-detail-item">
                    <label>반출자:</label>
                    <span>${history.exported_by || '-'}</span>
                </div>
                <div class="export-detail-item">
                    <label>반출일:</label>
                    <span>${exportDate}</span>
                </div>
                <div class="export-detail-item">
                    <label>반출 목적:</label>
                    <span>${history.export_purpose || '-'}</span>
                </div>
                <div class="export-detail-item">
                    <label>반납일:</label>
                    <span>${returnDate}</span>
                </div>
                <div class="export-detail-item">
                    <label>반납자:</label>
                    <span>${history.returned_by || '-'}</span>
                </div>
                <div class="export-detail-item">
                    <label>비고:</label>
                    <span>${history.notes || '-'}</span>
                </div>
            </div>
        `;
        
        return historyDiv;
    }

    // Format warranty date with styling
    formatWarrantyDate(warrantyDate) {
        if (!warrantyDate) return '-';
        
        const warranty = new Date(warrantyDate);
        const today = new Date();
        const isExpired = warranty < today;
        const daysUntilExpiry = Math.ceil((warranty - today) / (1000 * 60 * 60 * 24));
        
        let className = 'warranty-date';
        if (isExpired) {
            className += ' warranty-expired';
        } else if (daysUntilExpiry <= 30) {
            className += ' warranty-expired';
        }
        
        const formattedDate = warranty.toLocaleDateString('ko-KR');
        const statusText = isExpired ? '만료됨' : (daysUntilExpiry <= 30 ? `${daysUntilExpiry}일 후 만료` : '유효');
        
        return `<span class="${className}" title="${statusText}">${formattedDate}</span>`;
    }

    // Render categories
    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        if (!categoryList) {
            console.warn('categoryList element not found');
            return;
        }
        
        categoryList.innerHTML = '';
        
        if (!this.categories || this.categories.length === 0) {
            categoryList.innerHTML = '<p style="color: #666; font-style: italic;">등록된 카테고리가 없습니다.</p>';
            return;
        }
        
        this.categories.forEach(category => {
            if (!category || !category.name) {
                console.warn('Invalid category object:', category);
                return;
            }
            
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.style.cssText = 'display: inline-block; background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; margin: 2px; font-size: 0.9rem;';
            
            const categoryName = document.createElement('span');
            categoryName.textContent = category.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.style.cssText = 'background: none; border: none; color: white; margin-left: 8px; cursor: pointer; font-size: 1.2rem; font-weight: bold;';
            deleteBtn.onclick = () => this.deleteCategory(category.name);
            
            categoryItem.appendChild(categoryName);
            categoryItem.appendChild(deleteBtn);
            categoryList.appendChild(categoryItem);
        });
        
        console.log('카테고리 렌더링 완료:', this.categories.length, '개');
    }





    // Delete category
    async deleteCategory(categoryName) {
        console.log('deleteCategory 함수 호출됨:', categoryName);
        
        // 해당 카테고리를 사용하는 제품이 있는지 확인
        const productsUsingCategory = this.products.filter(p => p.category === categoryName);
        
        if (productsUsingCategory.length > 0) {
            this.showNotification(`카테고리 "${categoryName}"를 사용하는 제품이 ${productsUsingCategory.length}개 있습니다. 먼저 제품의 카테고리를 변경해주세요.`, 'warning');
            return;
        }
        
        if (confirm(`카테고리 "${categoryName}"를 삭제하시겠습니까?`)) {
            try {
                console.log('Supabase 연결 확인 중...');
                if (!window.toolsDB || !window.toolsDB.categories) {
                    console.error('toolsDB.categories not available');
                    this.showNotification('데이터베이스 연결을 확인할 수 없습니다.', 'error');
                    return;
                }
                
                // 카테고리 ID 찾기
                const categoryToDelete = this.categories.find(c => c.name === categoryName);
                if (!categoryToDelete || !categoryToDelete.id) {
                    console.error('카테고리를 찾을 수 없음:', categoryName);
                    this.showNotification('카테고리 ID를 찾을 수 없습니다.', 'error');
                    return;
                }
                
                // ID를 정수로 변환
                const numericId = parseInt(categoryToDelete.id);
                
                if (isNaN(numericId)) {
                    console.error('잘못된 카테고리 ID:', categoryToDelete.id);
                    this.showNotification('잘못된 카테고리 ID입니다.', 'error');
                    return;
                }
                
                console.log('카테고리 삭제 시도:', numericId, typeof numericId);
                
                // Supabase에서 카테고리 삭제 (ID 사용)
                const success = await window.toolsDB.categories.delete(numericId);
                console.log('삭제 결과:', success);
                
                if (success) {
                    // 로컬 배열에서 제거
                    this.categories = this.categories.filter(c => c.id !== categoryToDelete.id);
                    console.log('로컬 카테고리 배열에서 제거됨:', this.categories);
                    
                    // 카테고리 목록 새로고침
                    this.renderCategories();
                    
                    // 제품 등록 폼의 카테고리 선택 옵션 새로고침
                    this.loadCategoryOptions();
                    
                    this.showNotification(`카테고리 "${categoryName}"가 성공적으로 삭제되었습니다.`, 'success');
                } else {
                    console.error('Supabase에서 카테고리 삭제 실패');
                    this.showNotification('카테고리 삭제에 실패했습니다.', 'error');
                }
            } catch (error) {
                console.error('카테고리 삭제 실패:', error);
                this.showNotification(`카테고리 삭제 중 오류가 발생했습니다: ${error.message}`, 'error');
            }
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        alert(message);
    }

    // Export data
    exportData() {
        const dataStr = JSON.stringify(this.products, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'desktop-products-data.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import data
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedProducts = JSON.parse(e.target.result);
                if (Array.isArray(importedProducts)) {
                    this.products = importedProducts;
                    this.saveData();
                    this.renderProducts();
                    this.updateStats();
                    this.renderExportStatus();
                    this.showNotification('데이터가 성공적으로 가져와졌습니다!', 'success');
                } else {
                    this.showNotification('잘못된 데이터 형식입니다', 'error');
                }
            } catch (error) {
                this.showNotification('데이터 파싱 오류', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 캐시된 반출 이력 가져오기
    async getCachedExportHistory(productId) {
        // 캐시에 있으면 즉시 반환 (정렬된 상태로)
        if (this.exportHistoryCache.has(productId)) {
            const cachedHistory = this.exportHistoryCache.get(productId);
            // 캐시된 데이터도 정렬하여 반환
            return cachedHistory.sort((a, b) => {
                const dateA = new Date(a.export_date || 0);
                const dateB = new Date(b.export_date || 0);
                return dateB - dateA; // 최신 날짜가 먼저 오도록 내림차순
            });
        }
        
        // 캐시에 없으면 Supabase에서 가져오기
        try {
            const exportHistory = await window.toolsDB.exportHistory.getByProductId(productId);
            // 정렬된 상태로 캐시에 저장
            const sortedHistory = exportHistory.sort((a, b) => {
                const dateA = new Date(a.export_date || 0);
                const dateB = new Date(b.export_date || 0);
                return dateB - dateA; // 최신 날짜가 먼저 오도록 내림차순
            });
            this.exportHistoryCache.set(productId, sortedHistory);
            return sortedHistory;
        } catch (error) {
            console.error('반출 이력 조회 실패:', error);
            return null;
        }
    }
    
    // 캐시 무효화 (제품 상태 변경 시)
    invalidateExportHistoryCache(productId) {
        if (productId) {
            this.exportHistoryCache.delete(productId);
        } else {
            // 전체 캐시 클리어
            this.exportHistoryCache.clear();
        }
    }

    // Initialize Handsontable for batch editing
    initializeBatchTable() {
        const container = document.getElementById('batchTableContainer');
        if (!container) return;

        // 초기 데이터 (빈 행 10개로 시작)
        this.batchData = Array(10).fill().map(() => ({
            name: '',
            maker: '',
            model: '',
            specification: '',
            category: '',
            description: '',
            serial_number: '',
            purchase_date: '',
            warranty_date: ''
        }));

        // Handsontable 생성
        this.batchTable = new Handsontable(container, {
            data: this.batchData,
            colHeaders: [
                '제품명 *', '메이커 *', '모델명 *', '규격', '카테고리 *', 
                '설명', '시리얼번호', '구매일', '워런티'
            ],
            columns: [
                { data: 'name', type: 'text', allowInvalid: false },
                { data: 'maker', type: 'text', allowInvalid: false },
                { data: 'model', type: 'text', allowInvalid: false },
                { data: 'specification', type: 'text' },
                { 
                    data: 'category', 
                    type: 'dropdown', 
                    source: this.categories.map(c => c.name),
                    allowInvalid: false 
                },
                { data: 'description', type: 'text' },
                { data: 'serial_number', type: 'text' },
                { data: 'purchase_date', type: 'text', placeholder: 'YYYY-MM-DD 또는 2024/01/01' },
                { data: 'warranty_date', type: 'text', placeholder: 'YYYY-MM-DD 또는 2024/01/01' }
            ],
            width: '100%',
            height: 'auto',
            rowHeaders: true,
            colWidths: [150, 120, 120, 100, 120, 150, 120, 100, 100],
            stretchH: 'all',
            licenseKey: 'non-commercial-and-evaluation',
            contextMenu: true,
            manualRowResize: true,
            manualColumnResize: true,
            filters: true,
            dropdownMenu: true,
            afterChange: (changes, source) => {
                if (source === 'loadData') return;
                this.validateBatchData();
            },
            afterCreateRow: null, // 자동 행 생성 비활성화
            afterRemoveRow: null  // 자동 행 삭제 비활성화
        });

        // 테이블 스타일링
        container.style.border = '2px solid #e9ecef';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';
        
        // 행 카운터 초기화
        this.updateRowCounter();
    }

    // Add new row to batch table
    addNewRow() {
        if (this.batchTable) {
            this.batchTable.alter('insert_row');
        }
    }

    // Clear batch table
    clearBatchTable() {
        if (confirm('테이블의 모든 데이터를 지우시겠습니까?')) {
            this.batchData = Array(10).fill().map(() => ({
                name: '', maker: '', model: '', specification: '', category: '',
                description: '', serial_number: '', 
                purchase_date: '', warranty_date: ''
            }));
            if (this.batchTable) {
                this.batchTable.loadData(this.batchData);
                this.updateRowCounter(); // 행 카운터 업데이트
            }
        }
    }

    // Import data from Excel
    importFromExcel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.readExcelFile(file);
            }
        };
        input.click();
    }

    // Read Excel file
    async readExcelFile(file) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length > 1) {
                    const headers = jsonData[0];
                    const rows = jsonData.slice(1);
                    
                    // 데이터 변환
                    const convertedData = rows.map(row => {
                        const item = {};
                        headers.forEach((header, index) => {
                            if (row[index] !== undefined) {
                                const key = this.mapExcelHeaderToField(header);
                                if (key) {
                                    item[key] = row[index];
                                }
                            }
                        });
                        return item;
                    });
                    
                    // 필수 필드 검증
                    const validData = convertedData.filter(item => 
                        item.name && item.maker && item.model && item.category
                    );
                    
                    if (validData.length > 0) {
                        this.batchData = validData;
                        if (this.batchTable) {
                            this.batchTable.loadData(this.batchData);
                        }
                        this.showNotification(`${validData.length}개 제품 데이터를 가져왔습니다.`, 'success');
                    } else {
                        this.showNotification('유효한 제품 데이터를 찾을 수 없습니다.', 'error');
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Excel 파일 읽기 오류:', error);
            this.showNotification('Excel 파일 읽기에 실패했습니다.', 'error');
        }
    }

    // Map Excel header to field name
    mapExcelHeaderToField(header) {
        const mapping = {
            '제품명': 'name',
            '메이커': 'maker',
            '모델명': 'model',
            '규격': 'specification',
            '카테고리': 'category',
            '상태': 'status',
            '설명': 'description',
            '시리얼번호': 'serial_number',
            '구매일': 'purchase_date',
            '워런티': 'warranty_date'
        };
        return mapping[header] || null;
    }

    // Validate batch data
    validateBatchData() {
        if (!this.batchTable) return false;
        
        const data = this.batchTable.getData();
        let hasErrors = false;
        
        data.forEach((row, index) => {
            if (row[0] || row[1] || row[2] || row[4]) { // 제품명, 메이커, 모델명, 카테고리 중 하나라도 있으면 검증
                if (!row[0] || !row[1] || !row[2] || !row[4]) {
                    hasErrors = true;
                    this.batchTable.setCellMeta(index, 0, 'className', 'htInvalid');
                } else {
                    this.batchTable.setCellMeta(index, 0, 'className', 'htValid');
                }
            }
        });
        
        return !hasErrors;
    }

    // Save batch products
    async saveBatchProducts() {
        if (!this.batchTable) return;
        
        const data = this.batchTable.getData();
        const productsToSave = [];
        
        // 데이터 검증 및 변환
        data.forEach((row, index) => {
            if (row[0] && row[1] && row[2] && row[4]) { // 제품명, 메이커, 모델명, 카테고리 확인
                const product = {
                    name: row[0],
                    maker: row[1],
                    model: row[2],
                    specification: row[3] || '',
                    category: row[4],
                    status: 'Available', // 자동으로 Available 설정
                    description: row[5] || '',
                    serial_number: row[6] || '',
                    purchase_date: this.parseDate(row[7]), // 날짜 파싱
                    warranty_date: this.parseDate(row[8]), // 날짜 파싱
                    asset_code: this.generateAssetCodeForBatch(row[4], index), // 각 행마다 고유한 자산코드 생성
                    barcode: this.generateBarcodeForBatch(index) // 각 행마다 고유한 바코드 생성
                };
                productsToSave.push(product);
            }
        });
        
        if (productsToSave.length === 0) {
            this.showNotification('저장할 제품이 없습니다.', 'warning');
            return;
        }
        
        if (!this.validateBatchData()) {
            this.showNotification('필수 필드를 모두 입력해주세요.', 'error');
            return false;
        }
        
        try {
            this.isProcessing = true;
            let successCount = 0;
            
            // 제품들을 하나씩 저장
            for (const product of productsToSave) {
                const savedProduct = await this.addProductToDatabase(product);
                if (savedProduct) {
                    successCount++;
                    this.products.push(savedProduct);
                }
            }
            
            if (successCount > 0) {
                this.showNotification(`${successCount}개 제품이 성공적으로 저장되었습니다.`, 'success');
                this.renderProducts();
                this.updateStats();
                
                // 테이블 초기화
                this.batchData = Array(10).fill().map(() => ({
                    name: '', maker: '', model: '', specification: '', category: '',
                    description: '', serial_number: '', 
                    purchase_date: '', warranty_date: ''
                }));
                this.batchTable.loadData(this.batchData);
                this.updateRowCounter(); // 행 카운터 업데이트
            }
        } catch (error) {
            console.error('배치 저장 오류:', error);
            this.showNotification('제품 저장 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    // Open batch modal
    openBatchModal() {
        const modal = document.getElementById('batchModal');
        if (modal) {
            modal.style.display = 'flex';
            // 모달이 열릴 때 테이블 초기화
            if (this.batchTable) {
                this.batchTable.render();
            }
        }
    }

    // Close batch modal
    closeBatchModal() {
        const modal = document.getElementById('batchModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Add new row to batch table
    addNewRowToBatchTable() {
        if (this.batchTable) {
            // 새 빈 행 5개씩 추가 (더 효율적)
            for (let i = 0; i < 5; i++) {
                const newRow = {
                    name: '', maker: '', model: '', specification: '', category: '',
                    description: '', serial_number: '', 
                    purchase_date: '', warranty_date: ''
                };
                this.batchData.push(newRow);
            }
            this.batchTable.loadData(this.batchData);
            this.updateRowCounter();
        }
    }

    // Add single row to batch table
    addSingleRowToBatchTable() {
        if (this.batchTable) {
            // 새 빈 행 1개 추가
            const newRow = {
                name: '', maker: '', model: '', specification: '', category: '',
                description: '', serial_number: '', 
                purchase_date: '', warranty_date: ''
            };
            this.batchData.push(newRow);
            this.batchTable.loadData(this.batchData);
        }
    }

    // Import from Excel to batch table
    importFromExcelToBatchTable() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.readExcelFile(file);
            }
        };
        input.click();
    }

    // Download batch template
    downloadBatchTemplate() {
        const templateData = [
            ['제품명', '메이커', '모델명', '규격', '카테고리', '설명', '시리얼번호', '구매일', '워런티'],
            ['예시 제품', '예시 메이커', '예시 모델', '예시 규격', '전동공구', '예시 설명', 'SN001', '2024-01-01', '2027-01-01']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '제품 등록 템플릿');
        
        XLSX.writeFile(wb, '제품_등록_템플릿.xlsx');
    }

    // Parse date from various formats
    parseDate(dateString) {
        if (!dateString || typeof dateString !== 'string') return null;
        
        // 공백 제거
        dateString = dateString.trim();
        if (!dateString) return null;
        
        // 이미 ISO 형식인 경우
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // 다양한 날짜 형식 지원
        const dateFormats = [
            // YYYY/MM/DD
            /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
            // YYYY-MM-DD
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
            // YYYY.MM.DD
            /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,
            // MM/DD/YYYY (미국 형식)
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
            // DD/MM/YYYY (유럽 형식)
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
            // YYYY년 MM월 DD일 (한국 형식)
            /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일$/,
            // YYYYMMDD (숫자 형식)
            /^(\d{4})(\d{2})(\d{2})$/
        ];
        
        for (let i = 0; i < dateFormats.length; i++) {
            const match = dateString.match(dateFormats[i]);
            if (match) {
                let year, month, day;
                
                if (i === 3) {
                    // MM/DD/YYYY 형식
                    month = parseInt(match[1]);
                    day = parseInt(match[2]);
                    year = parseInt(match[3]);
                } else if (i === 4) {
                    // DD/MM/YYYY 형식 (MM/DD/YYYY와 구분이 어려우므로 사용자가 명시해야 함)
                    day = parseInt(match[1]);
                    month = parseInt(match[2]);
                    year = parseInt(match[3]);
                } else if (i === 5) {
                    // 한국어 형식
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                } else if (i === 6) {
                    // YYYYMMDD 형식
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                } else {
                    // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD 형식
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                }
                
                // 유효한 날짜인지 확인
                if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    // ISO 형식으로 변환 (YYYY-MM-DD)
                    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                }
            }
        }
        
        // 파싱 실패 시 null 반환
        console.warn('날짜 형식을 인식할 수 없습니다:', dateString);
        return null;
    }

    // Update row counter display
    updateRowCounter() {
        const rowCounter = document.getElementById('rowCounter');
        if (rowCounter && this.batchData) {
            rowCounter.textContent = `총 ${this.batchData.length}행`;
        }
    }
}

// Global functions
function showTab(tabName) {
    if (window.desktopSystem) {
        window.desktopSystem.showTab(tabName);
    }
}

function goBack() {
    window.location.href = 'index.html';
}

function resetForm() {
    if (window.desktopSystem) {
        window.desktopSystem.resetForm();
    }
}

function addNewCategory() {
    if (window.desktopSystem) {
        window.desktopSystem.addNewCategory();
    }
}

function filterExportStatusByStatus() {
    if (window.desktopSystem) {
        window.desktopSystem.filterExportStatusByStatus();
    }
}

function filterExportStatusByCategory() {
    if (window.desktopSystem) {
        window.desktopSystem.filterExportStatusByCategory();
    }
}

function closeProductDetail() {
    if (window.desktopSystem) {
        window.desktopSystem.closeProductDetail();
    }
}

function downloadProductsExcel() {
    if (window.desktopSystem) {
        window.desktopSystem.downloadProductsExcel();
    }
}

function downloadExportStatusExcel() {
    if (window.desktopSystem) {
        window.desktopSystem.downloadExportStatusExcel();
    }
}

// Initialize system when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로딩 완료, 시스템 초기화 시작...');
    
    try {
        window.desktopSystem = new DesktopToolManagement();
        console.log('desktopSystem 객체 생성 완료');
        
        // Netlify 환경에서 추가 검증
        if (window.location.hostname.includes('netlify.app') || 
            window.location.hostname.includes('netlify.com')) {
            console.log('Netlify 환경 감지됨');
            
            // 시스템이 제대로 초기화되었는지 확인
            setTimeout(() => {
                if (window.desktopSystem && window.desktopSystem.products) {
                    console.log('Netlify 환경에서 시스템 초기화 성공');
                    console.log('제품 수:', window.desktopSystem.products.length);
                } else {
                    console.error('Netlify 환경에서 시스템 초기화 실패');
                }
            }, 2000);
        }
    } catch (error) {
        console.error('시스템 초기화 중 오류:', error);
        
        // 재시도 로직
        setTimeout(() => {
            try {
                window.desktopSystem = new DesktopToolManagement();
                console.log('재시도로 시스템 초기화 성공');
            } catch (retryError) {
                console.error('재시도 실패:', retryError);
            }
        }, 1000);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (window.desktopSystem && window.desktopSystem.exportData) {
                window.desktopSystem.exportData();
            }
        }
    });
    
    // Drag and drop support
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/json') {
            if (window.desktopSystem && window.desktopSystem.importData) {
                window.desktopSystem.importData(files[0]);
            }
        }
    });
});

// Netlify 환경에서 페이지 로딩 완료 후 추가 검증
window.addEventListener('load', () => {
    console.log('페이지 완전 로딩 완료');
    
    if (window.desktopSystem) {
        console.log('desktopSystem 객체 상태 확인:', {
            products: window.desktopSystem.products?.length || 0,
            categories: window.desktopSystem.categories?.length || 0,
            isProcessing: window.desktopSystem.isProcessing
        });
    } else {
        console.error('desktopSystem 객체가 존재하지 않음');
    }
});

