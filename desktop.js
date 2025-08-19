// Desktop Tool Management System JavaScript
class DesktopToolManagement {
    constructor() {
        // 중복 실행 방지 플래그 초기화
        this.isProcessing = false;
        
        // 반출 이력 캐시 추가
        this.exportHistoryCache = new Map();
        
        // 기본 데이터 초기화
        this.products = this.getDefaultProducts();
        this.categories = this.getDefaultCategories();
        
        // 초기화
        this.init();
    }

    // Default product data
    getDefaultProducts() {
        return [
            {
                id: 1,
                name: '18V 임팩트 드릴',
                maker: '보쉬',
                model: 'GBH 2-26',
                specification: '26mm 해머드릴, 800W',
                category: '전동공구',
                status: 'Available',
                description: '18V 리튬이온 배터리 임팩트 드릴',
                serial_number: 'DR001-2024',
                purchase_date: '2024-01-15',
                barcode: 'P001'
            },
            {
                id: 2,
                name: '해머',
                maker: '스탠리',
                model: 'AntiVibe',
                specification: '1kg 철망치, 진동감소',
                category: '수동공구',
                status: 'Available',
                description: '1kg 철망치',
                serial_number: 'HM001-2024',
                purchase_date: '2024-02-01',
                barcode: 'P002'
            },
            {
                id: 3,
                name: '줄자',
                maker: '스탠리',
                model: 'PowerLock',
                specification: '5m 자동잠금, 25mm 폭',
                category: '측정도구',
                status: 'Exported',
                description: '5m 줄자',
                serial_number: 'TM001-2024',
                purchase_date: '2024-01-20',
                exported_by: '김철수',
                exported_date: new Date().toISOString(),
                export_purpose: '현장작업',
                barcode: 'P003'
            }
        ];
    }

    // Default categories
    getDefaultCategories() {
        return [
            { name: '전동공구', code: 'A' },
            { name: '수동공구', code: 'B' },
            { name: '측정도구', code: 'C' },
            { name: '안전장비', code: 'D' },
            { name: '기타', code: 'E' }
        ];
    }

    // Initialize
    init() {
        this.setupEventListeners();
        this.renderProducts();
        this.renderExportStatus();
        this.updateStats();
        this.renderCategories();
        this.loadCategoryOptions();
        this.loadExportCategoryFilterOptions();
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
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Check if clicked element is an action button
            if (target.matches('[data-action]')) {
                const action = target.getAttribute('data-action');
                const productId = parseInt(target.getAttribute('data-id'));
                
                if (productId && !isNaN(productId)) {
                    switch (action) {
                        case 'edit':
                            this.editProduct(productId);
                            break;
                        case 'delete':
                            this.deleteProduct(productId);
                            break;
                        case 'export':
                            this.changeProductStatus(productId, 'Exported');
                            break;
                        case 'return':
                            this.changeProductStatus(productId, 'Available');
                            break;
                        case 'maintenance':
                            this.changeProductStatus(productId, 'Under Maintenance');
                            break;
                    }
                }
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

        // Create filtered export status table
        const exportTable = this.createFilteredExportStatusTable(filteredProducts);
        container.appendChild(exportTable);
    }

    // Create filtered export status table
    createFilteredExportStatusTable(filteredProducts) {
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
        filteredProducts.forEach(product => {
            const row = this.createExportStatusRow(product);
            tbody.appendChild(row);
        });
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

        // Create export status table
        const exportTable = this.createExportStatusTable();
        container.appendChild(exportTable);
    }

    // Create export status table
    createExportStatusTable() {
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
        this.products.forEach(product => {
            const row = this.createExportStatusRow(product);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        return table;
    }

    // Create export status row
    createExportStatusRow(product) {
        const row = document.createElement('tr');
        
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
                daysInfo = `<span style="color: #dc3545; font-weight: 600;">${daysDiff}일 (장기)</span>`;
            } else if (daysDiff > 7) {
                daysInfo = `<span style="color: #ffc107; font-weight: 600;">${daysDiff}일 (연체)</span>`;
            } else {
                daysInfo = `<span style="color: #28a745; font-weight: 600;">${daysDiff}일</span>`;
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

    // Render categories
    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        if (!categoryList) return;
        
        categoryList.innerHTML = '';
        
        this.categories.forEach(category => {
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
    }

    // Load category options
    loadCategoryOptions() {
        const categorySelect = document.getElementById('productCategory');
        if (!categorySelect) return;
        
        categorySelect.innerHTML = '<option value="">카테고리 선택</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    // Load export category filter options
    loadExportCategoryFilterOptions() {
        const categoryFilter = document.getElementById('exportCategoryFilter');
        if (!categoryFilter) return;
        
        categoryFilter.innerHTML = '<option value="">전체 카테고리</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    // Add new category
    async addNewCategory() {
        const newCategoryInput = document.getElementById('newCategory');
        if (!newCategoryInput) return;
        
        const newCategoryName = newCategoryInput.value.trim();
        
        if (!newCategoryName) {
            this.showNotification('카테고리 이름을 입력해주세요.', 'warning');
            return;
        }
        
        if (this.categories.some(c => c.name === newCategoryName)) {
            this.showNotification('이미 존재하는 카테고리입니다.', 'warning');
            return;
        }
        
        try {
            const nextCode = this.getNextCategoryCode();
            
            const categoryData = {
                name: newCategoryName,
                code: nextCode,
                created_at: new Date().toISOString()
            };
            
            // 로컬 배열에 추가
            this.categories.push(categoryData);
            
            // 입력 필드 초기화
            newCategoryInput.value = '';
            
            // 카테고리 목록 새로고침
            this.renderCategories();
            
            // 제품 등록 폼의 카테고리 선택 옵션 새로고침
            this.loadCategoryOptions();
            
            this.showNotification(`새 카테고리 "${newCategoryName}"이(가) 코드 "${nextCode}"로 추가되었습니다.`, 'success');
        } catch (error) {
            console.error('카테고리 추가 실패:', error);
            this.showNotification('카테고리 추가 중 오류가 발생했습니다.', 'error');
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

    // Delete category
    async deleteCategory(categoryName) {
        // 해당 카테고리를 사용하는 제품이 있는지 확인
        const productsUsingCategory = this.products.filter(p => p.category === categoryName);
        
        if (productsUsingCategory.length > 0) {
            this.showNotification(`카테고리 "${categoryName}"를 사용하는 제품이 ${productsUsingCategory.length}개 있습니다. 먼저 제품의 카테고리를 변경해주세요.`, 'warning');
            return;
        }
        
        if (confirm(`카테고리 "${categoryName}"를 삭제하시겠습니까?`)) {
            try {
                // 로컬 배열에서 제거
                this.categories = this.categories.filter(c => c.name !== categoryName);
                
                // 카테고리 목록 새로고침
                this.renderCategories();
                
                // 제품 등록 폼의 카테고리 선택 옵션 새로고침
                this.loadCategoryOptions();
                
                this.showNotification(`카테고리 "${categoryName}"가 성공적으로 삭제되었습니다.`, 'success');
            } catch (error) {
                console.error('카테고리 삭제 실패:', error);
                this.showNotification('카테고리 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
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
                asset_code: this.generateAssetCode(document.getElementById('productCategory').value)
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
            // 새 제품 ID 생성
            const newId = Math.max(...this.products.map(p => p.id)) + 1;
            
            // 바코드 생성
            const barcode = `P${newId.toString().padStart(3, '0')}`;
            
            // 새 제품 객체 생성
            const newProduct = {
                ...productData,
                id: newId,
                barcode: barcode,
                created_at: new Date().toISOString()
            };
            
            // 로컬 배열에 추가
            this.products.push(newProduct);
            
            this.showNotification('제품이 성공적으로 추가되었습니다.', 'success');
            return true;
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
        
        const prefix = categoryPrefixes[category] || 'X';
        
        // 해당 카테고리의 기존 제품 수를 세어서 다음 번호 생성
        const categoryProducts = this.products.filter(p => p.category === category);
        const nextNumber = categoryProducts.length + 1;
        
        // 3자리 숫자로 패딩 (예: A001, A002, ..., A999)
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    }

    // Change product status
    async changeProductStatus(productId, newStatus) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            // 제품 상태 업데이트
            product.status = newStatus;
            product.last_modified = new Date().toISOString();

            if (newStatus === 'Exported') {
                // 반출 정보 추가
                const exportPurpose = prompt('반출 목적을 입력해주세요:');
                const exportedBy = prompt('반출자 이름을 입력해주세요:');
                
                if (exportPurpose && exportedBy) {
                    product.exported_by = exportedBy;
                    product.exported_date = new Date().toISOString();
                    product.export_purpose = exportPurpose;
                } else {
                    this.showNotification('반출 목적과 반출자 이름을 모두 입력해주세요.', 'warning');
                    return;
                }
            } else {
                // 반출 상태가 아닌 경우 반출 정보 초기화
                product.exported_by = null;
                product.exported_date = null;
                product.export_purpose = null;
            }

            // UI 새로고침
            this.renderProducts();
            this.updateStats();
            this.renderExportStatus();
            this.showNotification(`제품 상태가 '${newStatus}'로 변경되었습니다.`, 'success');
        } catch (error) {
            console.error('제품 상태 변경 실패:', error);
            this.showNotification('제품 상태 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    // Delete product
    async deleteProduct(productId) {
        try {
            if (confirm('정말로 이 제품을 삭제하시겠습니까?')) {
                // 로컬 배열에서 제거
                this.products = this.products.filter(p => p.id !== productId);
                
                // UI 새로고침
                this.renderProducts();
                this.updateStats();
                this.renderExportStatus();
                this.showNotification('제품이 성공적으로 삭제되었습니다.', 'success');
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

    // Update product
    async updateProduct(productData) {
        try {
            const productIndex = this.products.findIndex(p => p.id === this.editingProductId);
            if (productIndex === -1) {
                this.showNotification('수정할 제품을 찾을 수 없습니다.', 'error');
                return false;
            }

            // 제품 데이터 업데이트
            this.products[productIndex] = { ...this.products[productIndex], ...productData };
            
            // UI 새로고침
            this.renderProducts();
            this.updateStats();
            this.renderExportStatus();
            
            this.showNotification('제품이 성공적으로 수정되었습니다.', 'success');
            
            // 편집 모드 종료
            this.editingProductId = null;
            
            // 폼 초기화 및 버튼 텍스트 원래대로
            this.resetForm();
            return true;
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
                exportHistory.forEach((history, index) => {
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
            
            if (exportHistory && exportHistory.length > 0) {
                exportHistory.forEach((history, index) => {
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
            className += ' warranty-expired'; // 30일 이내 만료
        }
        
        const formattedDate = warranty.toLocaleDateString('ko-KR');
        const statusText = isExpired ? '만료됨' : (daysUntilExpiry <= 30 ? `${daysUntilExpiry}일 후 만료` : '유효');
        
        return `<span class="${className}" title="${statusText}">${formattedDate}</span>`;
    }

    // Render categories
    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';
        
        this.categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.style.cssText = 'display: inline-block; background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; margin: 2px; font-size: 0.9rem;';
            
            const categoryName = document.createElement('span');
            categoryName.textContent = category.name; // Assuming category is an object { name: "Category Name" }
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.style.cssText = 'background: none; border: none; color: white; margin-left: 8px; cursor: pointer; font-size: 1.2rem; font-weight: bold;';
            deleteBtn.onclick = () => this.deleteCategory(category.name);
            
            categoryItem.appendChild(categoryName);
            categoryItem.appendChild(deleteBtn);
            categoryList.appendChild(categoryItem);
        });
    }

    // Add new category
    async addNewCategory() {
        const newCategoryInput = document.getElementById('newCategory');
        const newCategoryName = newCategoryInput.value.trim();
        
        if (!newCategoryName) {
            this.showNotification('카테고리 이름을 입력해주세요.', 'warning');
            return;
        }
        
        if (this.categories.some(c => c.name === newCategoryName)) { // Check if category name already exists
            this.showNotification('이미 존재하는 카테고리입니다.', 'warning');
            return;
        }
        
        try {
            // 새 카테고리에 자동으로 다음 순서의 코드 부여
            const nextCode = this.getNextCategoryCode();
            
            // Supabase에 카테고리 추가
            const categoryData = {
                name: newCategoryName,
                code: nextCode,
                created_at: new Date().toISOString()
            };
            const result = await window.toolsDB.categories.add(categoryData);
            if (result && result.id) {
                // 로컬 배열에 추가 (ID 포함)
                this.categories.push(result);
                
                // 입력 필드 초기화
                newCategoryInput.value = '';
                
                // 카테고리 목록 새로고침
                this.renderCategories();
                
                // 제품 등록 폼의 카테고리 선택 옵션 새로고침
                this.loadCategoryOptions();
                
                this.showNotification(`새 카테고리 "${newCategoryName}"이(가) 코드 "${nextCode}"로 추가되었습니다.`, 'success');
            } else {
                this.showNotification('카테고리 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('카테고리 추가 실패:', error);
            this.showNotification('카테고리 추가 중 오류가 발생했습니다.', 'error');
        }
    }

    // Get next category code (A, B, C, D, E...)
    getNextCategoryCode() {
        const existingCodes = this.categories.map(c => c.code).filter(code => code);
        const usedCodes = new Set(existingCodes);
        
        // A부터 Z까지 순서대로 사용 가능한 코드 찾기
        for (let i = 65; i <= 90; i++) { // ASCII: A=65, Z=90
            const code = String.fromCharCode(i);
            if (!usedCodes.has(code)) {
                return code;
            }
        }
        
        // A-Z를 모두 사용한 경우 AA, AB, AC... 형태로 확장
        let counter = 1;
        while (true) {
            const code = `A${String.fromCharCode(64 + counter)}`; // A1, A2, A3...
            if (!usedCodes.has(code)) {
                return code;
            }
            counter++;
        }
    }

    // Delete category
    async deleteCategory(categoryName) {
        // 해당 카테고리를 사용하는 제품이 있는지 확인
        const productsUsingCategory = this.products.filter(p => p.category === categoryName);
        
        if (productsUsingCategory.length > 0) {
            this.showNotification(`카테고리 "${categoryName}"를 사용하는 제품이 ${productsUsingCategory.length}개 있습니다. 먼저 제품의 카테고리를 변경해주세요.`, 'warning');
            return;
        }
        
        if (confirm(`카테고리 "${categoryName}"를 삭제하시겠습니까?`)) {
            try {
                // 카테고리 ID 찾기
                const categoryToDelete = this.categories.find(c => c.name === categoryName);
                if (!categoryToDelete || !categoryToDelete.id) {
                    this.showNotification('카테고리 ID를 찾을 수 없습니다.', 'error');
                    return;
                }
                
                // ID를 정수로 변환
                const numericId = parseInt(categoryToDelete.id);
                
                if (isNaN(numericId)) {
                    this.showNotification('잘못된 카테고리 ID입니다.', 'error');
                    return;
                }
                
                console.log('카테고리 삭제 시도:', numericId, typeof numericId);
                
                // Supabase에서 카테고리 삭제 (ID 사용)
                const success = await window.toolsDB.categories.delete(numericId);
                if (success) {
                    // 로컬 배열에서 제거
                    this.categories = this.categories.filter(c => c.id !== categoryToDelete.id);
                    
                    // 카테고리 목록 새로고침
                    this.renderCategories();
                    
                    // 제품 등록 폼의 카테고리 선택 옵션 새로고침
                    this.loadCategoryOptions();
                    
                    this.showNotification(`카테고리 "${categoryName}"가 성공적으로 삭제되었습니다.`, 'success');
                } else {
                    this.showNotification('카테고리 삭제에 실패했습니다.', 'error');
                }
            } catch (error) {
                console.error('카테고리 삭제 실패:', error);
                this.showNotification('카테고리 삭제 중 오류가 발생했습니다.', 'error');
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
        // 캐시에 있으면 즉시 반환
        if (this.exportHistoryCache.has(productId)) {
            return this.exportHistoryCache.get(productId);
        }
        
        // 캐시에 없으면 Supabase에서 가져오기
        try {
            const exportHistory = await window.toolsDB.exportHistory.getByProductId(productId);
            // 캐시에 저장
            this.exportHistoryCache.set(productId, exportHistory);
            return exportHistory;
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
    window.desktopSystem = new DesktopToolManagement();
    
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

