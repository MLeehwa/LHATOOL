// Desktop Tool Management System JavaScript
class DesktopToolManagement {
    constructor() {
        // 중복 실행 방지 플래그 초기화
        this.isProcessing = false;
        
        // Supabase에서 데이터 로드
        this.loadDataFromSupabase().then(() => {
            this.init();
        });
    }

    // Supabase에서 데이터 로드
    async loadDataFromSupabase() {
        try {
            console.log('Supabase 데이터 로딩 시작...');
            
            // toolsDB 객체 확인
            if (!window.toolsDB) {
                console.error('toolsDB가 로드되지 않았습니다!');
                throw new Error('toolsDB not loaded');
            }
            
            console.log('toolsDB 객체 확인됨:', window.toolsDB);
            
            // 제품 데이터 로드
            console.log('제품 데이터 로딩 중...');
            const products = await window.toolsDB.products.getAll();
            console.log('로드된 제품:', products);
            
            this.products = products.length > 0 ? products : this.getDefaultProducts();
            
            // 카테고리 데이터 로드
            console.log('카테고리 데이터 로딩 중...');
            const categories = await window.toolsDB.categories.getAll();
            console.log('로드된 카테고리:', categories);
            
            if (categories.length > 0) {
                // 카테고리가 객체 형태로 저장되어 있는 경우
                this.categories = categories.map(cat => 
                    typeof cat === 'string' ? { name: cat, created_at: new Date().toISOString() } : cat
                );
            } else {
                this.categories = this.getDefaultCategories().map(name => ({ name, created_at: new Date().toISOString() }));
            }
            
            // 데이터가 없으면 기본 데이터를 Supabase에 저장
            if (products.length === 0) {
                console.log('기본 제품 데이터를 Supabase에 저장 중...');
                await this.saveDefaultProductsToSupabase();
            }
            if (categories.length === 0) {
                console.log('기본 카테고리 데이터를 Supabase에 저장 중...');
                await this.saveDefaultCategoriesToSupabase();
            }
            
            console.log('Supabase에서 데이터 로드 완료');
        } catch (error) {
            console.error('Supabase 데이터 로드 실패:', error);
            // 실패 시 기본 데이터 사용
            this.products = this.getDefaultProducts();
            this.categories = this.getDefaultCategories().map(name => ({ name, created_at: new Date().toISOString() }));
        }
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
        return ['전동공구', '수동공구', '측정도구', '안전장비', '기타'];
    }

    // 기본 제품 데이터를 Supabase에 저장
    async saveDefaultProductsToSupabase() {
        try {
            console.log('기본 제품 데이터 저장 시작...');
            const defaultProducts = this.getDefaultProducts();
            for (const product of defaultProducts) {
                const result = await window.toolsDB.products.add(product);
                console.log('제품 저장 결과:', result);
            }
            console.log('기본 제품 데이터를 Supabase에 저장했습니다.');
        } catch (error) {
            console.error('기본 제품 데이터 저장 실패:', error);
        }
    }

    // 기본 카테고리 데이터를 Supabase에 저장
    async saveDefaultCategoriesToSupabase() {
        try {
            console.log('기본 카테고리 데이터 저장 시작...');
            const defaultCategories = this.getDefaultCategories();
            for (const categoryName of defaultCategories) {
                const categoryData = {
                    name: categoryName,
                    created_at: new Date().toISOString()
                };
                const result = await window.toolsDB.categories.add(categoryData);
                console.log('카테고리 저장 결과:', result);
                
                // 저장된 카테고리를 로컬 배열에 추가 (ID 포함)
                if (result && result.id) {
                    this.categories.push(result);
                }
            }
            console.log('기본 카테고리 데이터를 Supabase에 저장했습니다.');
        } catch (error) {
            console.error('기본 카테고리 데이터 저장 실패:', error);
        }
    }

    // Initialize
    async init() {
        // 데이터 로드 완료 대기
        await this.loadDataFromSupabase();
        
        this.setupEventListeners();
        this.renderProducts();
        this.renderExportStatus();
        this.updateStats();
        this.renderCategories();
        this.loadCategoryOptions();
    }

    // Event listeners setup
    setupEventListeners() {
        // Form submission
        const addProductForm = document.getElementById('addProductForm');
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddProduct();
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Export search input
        const exportSearchInput = document.getElementById('exportSearchInput');
        if (exportSearchInput) {
            exportSearchInput.addEventListener('input', (e) => {
                this.filterExportStatus(e.target.value);
            });
        }
    }

    // Search functionality setup
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterProducts(e.target.value);
            }, 300);
        });
    }

    // Add new product
    async addProduct(productData) {
        try {
            console.log('제품 추가 시작:', productData);
            
            // 1단계: 바코드 없이 제품을 Supabase에 먼저 추가
            const result = await window.toolsDB.products.add(productData);
            console.log('제품 추가 결과:', result);
            
            if (result && result.id) {
                // 2단계: Supabase에서 할당된 실제 ID로 바코드 생성
                const barcode = `P${result.id.toString().padStart(3, '0')}`;
                console.log('생성된 바코드:', barcode);
                
                // 3단계: 생성된 바코드를 Supabase에 업데이트
                const updateResult = await window.toolsDB.products.update(result.id, { 
                    barcode: barcode 
                });
                
                if (updateResult) {
                    // 4단계: 최종 제품 데이터 구성 (바코드 포함)
                    const finalProduct = { ...result, barcode: barcode };
                    
                    // 5단계: 로컬 배열에 추가
                    this.products.push(finalProduct);
                    
                    // 6단계: UI 업데이트
                    this.renderProducts();
                    this.updateStats();
                    this.renderExportStatus();
                    
                    this.showNotification('제품이 성공적으로 추가되었습니다.', 'success');
                    return true;
                } else {
                    this.showNotification('제품은 추가되었으나 바코드 업데이트에 실패했습니다.', 'warning');
                    return false;
                }
            } else {
                this.showNotification('제품 추가에 실패했습니다.', 'error');
                return false;
            }
        } catch (error) {
            console.error('제품 추가 실패:', error);
            this.showNotification('제품 추가 중 오류가 발생했습니다.', 'error');
            return false;
        }
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
            
            // 제품 데이터 준비 (메이커, 모델, 규격 포함)
            const productData = {
                name: document.getElementById('productName').value,
                maker: document.getElementById('productMaker').value,
                model: document.getElementById('productModel').value,
                specification: document.getElementById('productSpecification').value || '',
                category: document.getElementById('productCategory').value,
                status: document.getElementById('productStatus').value,
                description: document.getElementById('productDescription').value || '',
                serial_number: document.getElementById('productSerial').value || '',
                purchase_date: document.getElementById('productPurchaseDate').value || null
            };

            let success = false;
            
            if (this.editingProductId) {
                // 편집 모드
                success = await this.updateProduct(productData);
            } else {
                // 추가 모드
                success = await this.addProduct(productData);
            }

            if (success) {
                // Reset form
                form.reset();
                // Refresh export status
                this.renderExportStatus();
                
                // 버튼 텍스트 원래대로
                const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
                submitBtn.textContent = '제품 추가';
                
                // 편집 모드 종료
                this.editingProductId = null;
            }
        } finally {
            // 처리 완료 후 플래그 해제
            this.isProcessing = false;
        }
    }

    // Change product status
    async changeProductStatus(productId, newStatus) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            // Supabase에서 제품 상태 업데이트
            const updateData = {
                status: newStatus,
                last_modified: new Date().toISOString()
            };

            if (newStatus === 'Exported') {
                // 반출 정보 추가
                const exportPurpose = prompt('반출 목적을 입력해주세요:');
                const exportedBy = prompt('반출자 이름을 입력해주세요:');
                
                if (exportPurpose && exportedBy) {
                    updateData.exported_by = exportedBy;
                    updateData.exported_date = new Date().toISOString();
                    updateData.export_purpose = exportPurpose;
                    
                    // 로컬 제품 정보 업데이트
                    product.exportedBy = exportedBy;
                    product.exportedDate = updateData.exported_date;
                    product.exportPurpose = exportPurpose;
                } else {
                    this.showNotification('반출 목적과 반출자 이름을 모두 입력해주세요.', 'warning');
                    return;
                }
            } else {
                // 반출 상태가 아닌 경우 반출 정보 초기화
                updateData.exported_by = null;
                updateData.exported_date = null;
                updateData.export_purpose = null;
                
                // 로컬 제품 정보 초기화
                product.exportedBy = null;
                product.exportedDate = null;
                product.exportPurpose = null;
            }

            // Supabase에서 제품 업데이트
            const result = await window.toolsDB.products.update(productId, updateData);
            if (result) {
                // 로컬 제품 상태 업데이트
                product.status = newStatus;
                product.lastModified = updateData.last_modified;
                
                // UI 새로고침
                this.renderProducts();
                this.updateStats();
                this.renderExportStatus();
                this.showNotification(`제품 상태가 '${newStatus}'로 변경되었습니다.`, 'success');
            } else {
                this.showNotification('제품 상태 변경에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('제품 상태 변경 실패:', error);
            this.showNotification('제품 상태 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    // Delete product
    async deleteProduct(productId) {
        try {
            // ID를 정수로 변환 (Supabase SERIAL ID는 정수)
            const numericId = parseInt(productId);
            
            if (isNaN(numericId)) {
                this.showNotification('잘못된 제품 ID입니다.', 'error');
                return false;
            }
            
            console.log('제품 삭제 시도:', numericId, typeof numericId);
            
            // Supabase에서 제품 삭제
            const success = await window.toolsDB.products.delete(numericId);
            if (success) {
                // 로컬 배열에서 제거
                this.products = this.products.filter(p => p.id !== productId);
                this.saveData();
                this.renderProducts();
                this.updateStats();
                this.renderExportStatus();
                this.showNotification('제품이 성공적으로 삭제되었습니다.', 'success');
                return true;
            } else {
                this.showNotification('제품 삭제에 실패했습니다.', 'error');
                return false;
            }
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
        document.getElementById('productName').value = product.name;
        document.getElementById('productMaker').value = product.maker || '';
        document.getElementById('productModel').value = product.model || '';
        document.getElementById('productSpecification').value = product.specification || '';
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStatus').value = product.status;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productSerial').value = product.serial_number || '';
        document.getElementById('productPurchaseDate').value = product.purchase_date || '';

        // 제품 ID 저장 (수정 시 사용)
        this.editingProductId = productId;

        // 버튼 텍스트 변경
        const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
        submitBtn.textContent = '제품 수정';
        
        // 폼을 제품 등록 탭으로 이동
        this.showTab('product-registration');
    }

    // Update product
    async updateProduct(productData) {
        try {
            // Supabase에서 제품 수정
            const result = await window.toolsDB.products.update(this.editingProductId, productData);
            if (result) {
                // 로컬 배열 업데이트
                const index = this.products.findIndex(p => p.id === this.editingProductId);
                if (index !== -1) {
                    this.products[index] = { ...this.products[index], ...productData };
                }
                
                this.saveData();
                this.renderProducts();
                this.updateStats();
                this.renderExportStatus();
                this.showNotification('제품이 성공적으로 수정되었습니다.', 'success');
                
                // 편집 모드 종료
                this.editingProductId = null;
                this.resetForm();
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

    // Render products
    renderProducts() {
        const container = document.getElementById('productsContainer');
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
                <th>시리얼 번호</th>
                <th>설명</th>
                <th>구매일</th>
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
                 <th>시리얼 번호</th>
                 <th>설명</th>
                 <th>구매일</th>
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

    // Create product row
    createProductRow(product) {
        const row = document.createElement('tr');
        const statusColor = this.getStatusColor(product.status);
        
        const exportInfo = product.exported_by ? 
            `사용자: ${product.exported_by}<br>날짜: ${new Date(product.exported_date).toLocaleDateString()}<br>목적: ${product.export_purpose}` : 
            '반출되지 않음';
        
        // 날짜 처리 - created_at 또는 added_date 사용
        const registrationDate = product.created_at || product.added_date;
        const displayDate = registrationDate ? new Date(registrationDate).toLocaleDateString() : '-';
        
        row.innerHTML = `
            <td><strong>${product.name}</strong></td>
            <td>${product.maker || '-'}</td>
            <td>${product.model || '-'}</td>
            <td>${product.specification || '-'}</td>
            <td>${product.category}</td>
            <td><span style="color: ${statusColor}; font-weight: 600;">${product.status}</span></td>
            <td>${product.serial_number || '-'}</td>
            <td>${product.description || '-'}</td>
            <td>${product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : '-'}</td>
            <td>${displayDate}</td>
            <td>${this.createBarcode(product.id)}</td>
            <td style="font-size: 0.9rem;">${exportInfo}</td>
            <td>${this.getActionButtons(product)}</td>
        `;
        
        // Add event listeners to buttons
        this.addRowEventListeners(row, product);
        
        return row;
    }

    // Get status color
    getStatusColor(status) {
        const colors = {
            'Available': '#28a745',
            'Exported': '#007bff',
            'Under Maintenance': '#ffc107',
            'Retired': '#dc3545'
        };
        return colors[status] || '#6c757d';
    }

           // createBarcode for product
           createBarcode(productId) {
               // 간단한 바코드 데이터 생성 (P001, P002...)
               const barcodeData = `P${productId.toString().padStart(3, '0')}`;
               const barcodeId = `barcode-${productId}`;
               
               // 바코드 컨테이너 스타일링 (2.5cm x 1cm 크기)
               const barcodeStyle = `
                   width: 150px;
                   height: 60px;
                   background: white;
                   border: 1px solid #ccc;
                   padding: 5px;
                   text-align: center;
                   font-family: monospace;
                   font-size: 10px;
                   display: flex;
                   flex-direction: column;
                   align-items: center;
                   justify-content: center;
                   cursor: pointer;
               `;

               return `
                   <div style="${barcodeStyle}" onclick="desktopSystem.showBarcodeDetails(${productId})" title="바코드 클릭하여 상세보기">
                       <svg id="${barcodeId}" width="140" height="40"></svg>
                       <div style="font-size: 8px; margin-top: 2px;">${barcodeData}</div>
                   </div>
                   <script>
                       JsBarcode("#${barcodeId}", "${barcodeData}", {
                           format: "CODE128",
                           width: 1,
                           height: 30,
                           displayValue: false,
                           background: "#ffffff",
                           lineColor: "#000000"
                       });
                   </script>
               `;
           }

           // Show barcode details with print option
           showBarcodeDetails(productId) {
               const product = this.products.find(p => p.id === productId);
               if (product) {
                   const barcodeData = `P${productId.toString().padStart(3, '0')}`;
                   const printWindow = window.open('', '_blank', 'width=400,height=300');
                   
                   printWindow.document.write(`
                       <!DOCTYPE html>
                       <html>
                       <head>
                           <title>바코드 출력 - ${product.name}</title>
                           <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                           <style>
                               body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                               .barcode-container { margin: 20px 0; }
                               .product-info { margin: 10px 0; font-size: 14px; }
                               .print-btn { 
                                   background: #007bff; 
                                   color: white; 
                                   border: none; 
                                   padding: 10px 20px; 
                                   border-radius: 5px; 
                                   cursor: pointer; 
                                   margin: 10px; 
                               }
                               .print-btn:hover { background: #0056b3; }
                               @media print {
                                   .print-btn { display: none; }
                                   body { margin: 0; }
                               }
                           </style>
                       </head>
                       <body>
                           <h2>${product.name}</h2>
                           <div class="product-info">
                               <p><strong>카테고리:</strong> ${product.category}</p>
                               <p><strong>시리얼 번호:</strong> ${product.serial_number || '없음'}</p>
                               <p><strong>바코드:</strong> ${barcodeData}</p>
                           </div>
                           <div class="barcode-container">
                               <svg id="print-barcode" width="200" height="60"></svg>
                           </div>
                           <button class="print-btn" onclick="window.print()">🖨️ 바코드 출력</button>
                           <button class="print-btn" onclick="window.close()">닫기</button>
                           <script>
                               JsBarcode("#print-barcode", "${barcodeData}", {
                                   format: "CODE128",
                                   width: 1.5,
                                   height: 40,
                                   displayValue: true,
                                   background: "#ffffff",
                                   lineColor: "#000000",
                                   fontSize: 12
                               });
                           </script>
                       </body>
                       </html>
                   `);
                   
                   printWindow.document.close();
               }
           }
     
     // Get action buttons (제품 등록에서는 수정, 삭제만)
     getActionButtons(product) {
        let buttons = '';
        
        // 제품 등록에서는 수정과 삭제만 표시
        buttons += `
            <button class="btn btn-sm btn-primary" data-action="edit" data-id="${product.id}">수정</button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${product.id}">삭제</button>
        `;
        
        return buttons;
    }

    // Add row event listeners (제품 등록에서는 수정, 삭제만)
    addRowEventListeners(row, product) {
        const buttons = row.querySelectorAll('[data-action]');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const productId = parseInt(e.target.dataset.id);
                
                switch(action) {
                    case 'edit':
                        this.editProduct(productId);
                        break;
                    case 'delete':
                        this.deleteProduct(productId);
                        break;
                }
            });
        });
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

    // Render filtered products
    renderFilteredProducts(filteredProducts) {
        const container = document.getElementById('productsContainer');
        container.innerHTML = '';

        if (filteredProducts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">검색된 제품이 없습니다.</p>';
            return;
        }

        const productsTable = this.createFilteredProductsTable(filteredProducts);
        container.appendChild(productsTable);
    }

    // Update statistics
    updateStats() {
        const total = this.products.length;
        const available = this.products.filter(p => p.status === 'Available').length;
        const exported = this.products.filter(p => p.status === 'Exported').length;
        const maintenance = this.products.filter(p => p.status === 'Under Maintenance').length;

        document.getElementById('totalProducts').textContent = total;
        document.getElementById('availableProducts').textContent = available;
        document.getElementById('exportedProducts').textContent = exported;
        document.getElementById('maintenanceProducts').textContent = maintenance;

        // Update export status statistics
        this.updateExportStatusStats();
    }

    // Update export status statistics
    updateExportStatusStats() {
        const exportedProducts = this.products.filter(p => p.status === 'Exported');
        const totalExported = exportedProducts.length;
        
        let availableForReturn = 0;
        let overdueExports = 0;
        let longTermExports = 0;

        exportedProducts.forEach(product => {
            if (product.exported_date) {
                const exportDate = new Date(product.exported_date);
                const today = new Date();
                const daysDiff = Math.floor((today - exportDate) / (1000 * 60 * 60 * 24));

                if (daysDiff > 30) {
                    longTermExports++;
                } else if (daysDiff > 7) {
                    overdueExports++;
                } else {
                    availableForReturn++;
                }
            }
        });

        // Update export status stats
        const totalExportedElement = document.getElementById('totalExported');
        const availableForReturnElement = document.getElementById('availableForReturn');
        const overdueExportsElement = document.getElementById('overdueExports');
        const longTermExportsElement = document.getElementById('longTermExports');

        if (totalExportedElement) totalExportedElement.textContent = totalExported;
        if (availableForReturnElement) availableForReturnElement.textContent = availableForReturn;
        if (overdueExportsElement) overdueExportsElement.textContent = overdueExports;
        if (longTermExportsElement) longTermExportsElement.textContent = longTermExports;
    }

           // renderExportStatus (updated to use list format)
           renderExportStatus() {
               const container = document.getElementById('exportStatusContainer');
               container.innerHTML = '';

               if (this.products.length === 0) {
                   container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">등록된 제품이 없습니다.</p>';
                   return;
               }

               // Create export status table
               const exportTable = this.createExportStatusTable();
               container.appendChild(exportTable);

               // Load categories for filter
               this.loadCategoryFilter();
           }

           // createExportStatusTable (new method for list format)
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
                       <th>시리얼 번호</th>
                       <th>설명</th>
                       <th>구매일</th>
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

                       // createExportStatusRow (new method for list format)
            createExportStatusRow(product) {
                const row = document.createElement('tr');
                const statusColor = this.getStatusColor(product.status);
                
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
                    exportDate = exportDateObj.toLocaleDateString();
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
                const displayDate = registrationDate ? new Date(registrationDate).toLocaleDateString() : '-';

                row.innerHTML = `
                    <td><strong style="cursor: pointer; color: #007bff;" onclick="showProductDetail(${product.id})" title="클릭하여 상세 정보 보기">${product.name}</strong></td>
                    <td>${product.maker || '-'}</td>
                    <td>${product.model || '-'}</td>
                    <td>${product.specification || '-'}</td>
                    <td>${product.category}</td>
                    <td><span style="color: ${statusColor}; font-weight: 600;">${product.status}</span></td>
                    <td>${product.serial_number || '-'}</td>
                    <td class="description-cell">${product.description || '-'}</td>
                    <td>${product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : '-'}</td>
                    <td>${displayDate}</td>
                    <td>${exportUser}</td>
                    <td>${exportDate}</td>
                    <td class="purpose-cell">${exportPurpose}</td>
                    <td>${daysInfo}</td>
                    <td>${this.getExportStatusActionButtons(product)}</td>
                `;

                // Add event listeners to buttons
                this.addExportStatusRowEventListeners(row, product);
                return row;
            }

           // getExportStatusActionButtons (반출 현황에서는 상태 변경만)
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

           // addExportStatusRowEventListeners (new method for export status row events)
           addExportStatusRowEventListeners(row, product) {
               const buttons = row.querySelectorAll('button');
               buttons.forEach(button => {
                   button.addEventListener('click', (e) => {
                       e.preventDefault();
                       const action = button.getAttribute('data-action');
                       const productId = parseInt(button.getAttribute('data-id'));

                       switch (action) {
                           case 'export':
                               this.changeProductStatus(productId, 'Exported');
                               break;
                           case 'return':
                               this.changeProductStatus(productId, 'Available');
                               break;
                           case 'maintenance':
                               this.changeProductStatus(productId, 'Under Maintenance');
                               break;
                           case 'edit':
                               this.editProduct(productId);
                               break;
                           case 'delete':
                               if (confirm(`정말로 "${product.name}"을 삭제하시겠습니까?`)) {
                                   this.deleteProduct(productId);
                               }
                               break;
                       }
                   });
               });
           }

           // loadCategoryFilter (new method to populate category filter)
           loadCategoryFilter() {
               const categoryFilter = document.getElementById('exportCategoryFilter');
               if (!categoryFilter) return;

               // Clear existing options except the first one
               while (categoryFilter.children.length > 1) {
                   categoryFilter.removeChild(categoryFilter.lastChild);
               }

               // Add category options
               this.categories.forEach(category => {
                   const option = document.createElement('option');
                   option.value = category.name; // Assuming category is an object { name: "Category Name" }
                   option.textContent = category.name;
                   categoryFilter.appendChild(option);
               });
           }

           // filterExportStatus (updated to work with new list format)
           filterExportStatus(searchTerm) {
               const statusFilter = document.getElementById('exportStatusFilter');
               const categoryFilter = document.getElementById('exportCategoryFilter');
               
               const selectedStatus = statusFilter ? statusFilter.value : '';
               const selectedCategory = categoryFilter ? categoryFilter.value : '';

               let filteredProducts = this.products;

               // Filter by search term
               if (searchTerm) {
                   filteredProducts = filteredProducts.filter(p =>
                       p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (p.exported_by && p.exported_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (p.export_purpose && p.export_purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (p.serial_number && p.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
                   );
               }

               // Filter by status
               if (selectedStatus) {
                   filteredProducts = filteredProducts.filter(p => p.status === selectedStatus);
               }

               // Filter by category
               if (selectedCategory) {
                   filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
               }

               this.renderFilteredExportStatus(filteredProducts);
           }

           // filterExportStatusByStatus (updated to work with new list format)
           filterExportStatusByStatus() {
               const statusFilter = document.getElementById('exportStatusFilter').value;
               const categoryFilter = document.getElementById('exportCategoryFilter');
               const searchInput = document.getElementById('exportSearchInput');
               
               const selectedStatus = statusFilter.value;
               const selectedCategory = categoryFilter ? categoryFilter.value : '';
               const searchTerm = searchInput.value.toLowerCase();

               let filteredProducts = this.products;

               // Filter by status
               if (selectedStatus) {
                   filteredProducts = filteredProducts.filter(p => p.status === selectedStatus);
               }

               // Filter by category
               if (selectedCategory) {
                   filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
               }

               // Filter by search term
               if (searchTerm) {
                   filteredProducts = filteredProducts.filter(p =>
                       p.name.toLowerCase().includes(searchTerm) ||
                       (p.exported_by && p.exported_by.toLowerCase().includes(searchTerm)) ||
                       (p.export_purpose && p.export_purpose.toLowerCase().includes(searchTerm)) ||
                       (p.serial_number && p.serial_number.toLowerCase().includes(searchTerm))
                   );
               }

               this.renderFilteredExportStatus(filteredProducts);
           }

           // filterExportStatusByCategory (new method for category filtering)
           filterExportStatusByCategory() {
               const categoryFilter = document.getElementById('exportCategoryFilter');
               const statusFilter = document.getElementById('exportStatusFilter');
               const searchInput = document.getElementById('exportSearchInput');
               
               const selectedCategory = categoryFilter.value;
               const selectedStatus = statusFilter ? statusFilter.value : '';
               const searchTerm = searchInput.value.toLowerCase();

               let filteredProducts = this.products;

               // Filter by category
               if (selectedCategory) {
                   filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
               }

               // Filter by status
               if (selectedStatus) {
                   filteredProducts = filteredProducts.filter(p => p.status === selectedStatus);
               }

               // Filter by search term
               if (searchTerm) {
                   filteredProducts = filteredProducts.filter(p =>
                       p.name.toLowerCase().includes(searchTerm) ||
                       (p.exported_by && p.exported_by.toLowerCase().includes(searchTerm)) ||
                       (p.export_purpose && p.export_purpose.toLowerCase().includes(searchTerm)) ||
                       (p.serial_number && p.serial_number.toLowerCase().includes(searchTerm))
                   );
               }

               this.renderFilteredExportStatus(filteredProducts);
           }

           // renderFilteredExportStatus (new method for filtered export status)
           renderFilteredExportStatus(filteredProducts) {
               const container = document.getElementById('exportStatusContainer');
               container.innerHTML = '';

               if (filteredProducts.length === 0) {
                   container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">검색된 제품이 없습니다.</p>';
                   return;
               }

               const exportTable = this.createFilteredExportStatusTable(filteredProducts);
               container.appendChild(exportTable);
           }

           // createFilteredExportStatusTable (new method for filtered table)
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
                       <th>시리얼 번호</th>
                       <th>설명</th>
                       <th>구매일</th>
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
            // Supabase에 카테고리 추가
            const categoryData = {
                name: newCategoryName,
                created_at: new Date().toISOString()
            };
            const result = await window.toolsDB.categories.add(categoryData);
            if (result && result.id) {
                // 로컬 배열에 추가 (ID 포함된 객체)
                this.categories.push(result);
                
                // 입력 필드 초기화
                newCategoryInput.value = '';
                
                // 카테고리 목록 새로고침
                this.renderCategories();
                
                // 제품 등록 폼의 카테고리 선택 옵션 새로고침
                this.loadCategoryOptions();
                
                this.showNotification('새 카테고리가 추가되었습니다.', 'success');
            } else {
                this.showNotification('카테고리 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('카테고리 추가 실패:', error);
            this.showNotification('카테고리 추가 중 오류가 발생했습니다.', 'error');
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
    
    // Download products as Excel
    downloadProductsExcel() {
        try {
            const worksheet = this.createProductsWorksheet();
            const workbook = this.createWorkbook('제품_등록_목록', worksheet);
            this.downloadExcel(workbook, '제품_등록_목록.xlsx');
            this.showNotification('제품 등록 목록이 엑셀로 다운로드되었습니다.', 'success');
        } catch (error) {
            console.error('엑셀 다운로드 실패:', error);
            this.showNotification('엑셀 다운로드 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // Download export status as Excel
    downloadExportStatusExcel() {
        try {
            const worksheet = this.createExportStatusWorksheet();
            const workbook = this.createWorkbook('반출_현황_목록', worksheet);
            this.downloadExcel(workbook, '반출_현황_목록.xlsx');
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
            '시리얼 번호', '설명', '구매일', '등록일', '바코드', '반출 정보'
        ];
        
        const data = this.products.map(product => [
            product.name || '',
            product.maker || '',
            product.model || '',
            product.specification || '',
            product.category || '',
            this.getStatusText(product.status) || '',
            product.serial_number || '',
            product.description || '',
            product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : '',
            product.created_at ? new Date(product.created_at).toLocaleDateString() : '',
            product.barcode || '',
            this.getExportInfoText(product)
        ]);
        
        return [headers, ...data];
    }
    
    // Create export status worksheet data
    createExportStatusWorksheet() {
        const headers = [
            '제품명', '메이커', '모델명', '규격', '카테고리', '현재 상태', 
            '시리얼 번호', '설명', '구매일', '등록일', '반출자', '반출일', '반출 목적', '반출 기간'
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
                exportDate = exportDateObj.toLocaleDateString();
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
            const displayDate = registrationDate ? new Date(registrationDate).toLocaleDateString() : '-';
            
            return [
                product.name || '',
                product.maker || '',
                product.model || '',
                product.specification || '',
                product.category || '',
                this.getStatusText(product.status) || '',
                product.serial_number || '',
                product.description || '',
                product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : '',
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
            return `사용자: ${product.exported_by}, 날짜: ${new Date(product.exported_date).toLocaleDateString()}, 목적: ${product.export_purpose || '지정되지 않음'}`;
        }
        return '반출되지 않음';
    }
    
    // Create workbook
    createWorkbook(sheetName, worksheet) {
        const workbook = {
            SheetNames: [sheetName],
            Sheets: {
                [sheetName]: this.createSheet(worksheet)
            }
        };
        return workbook;
    }
    
    // Create sheet
    createSheet(worksheet) {
        const sheet = {};
        const range = { s: { c: 0, r: 0 }, e: { c: worksheet[0].length - 1, r: worksheet.length - 1 } };
        
        // Add headers with bold style
        worksheet[0].forEach((header, colIndex) => {
            const cellRef = this.getCellRef(0, colIndex);
            sheet[cellRef] = {
                v: header,
                s: { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } }
            };
        });
        
        // Add data
        for (let rowIndex = 1; rowIndex < worksheet.length; rowIndex++) {
            worksheet[rowIndex].forEach((cellValue, colIndex) => {
                const cellRef = this.getCellRef(rowIndex, colIndex);
                sheet[cellRef] = { v: cellValue };
            });
        }
        
        sheet['!ref'] = this.getCellRef(range.s.r, range.s.c) + ':' + this.getCellRef(range.e.r, range.e.c);
        
        return sheet;
    }
    
    // Get cell reference (A1, B1, etc.)
    getCellRef(row, col) {
        const colRef = this.getColRef(col);
        return colRef + (row + 1);
    }
    
    // Get column reference (A, B, C, etc.)
    getColRef(col) {
        let result = '';
        while (col >= 0) {
            result = String.fromCharCode(65 + (col % 26)) + result;
            col = Math.floor(col / 26) - 1;
        }
        return result;
    }
    
    // Download Excel file
    downloadExcel(workbook, filename) {
        // SheetJS 라이브러리가 로드되어 있는지 확인
        if (typeof XLSX === 'undefined') {
            // SheetJS CDN을 동적으로 로드
            this.loadSheetJS().then(() => {
                this.performDownload(workbook, filename);
            });
        } else {
            this.performDownload(workbook, filename);
        }
    }
    
    // Load SheetJS library
    async loadSheetJS() {
        return new Promise((resolve, reject) => {
            if (typeof XLSX !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Perform actual download
    performDownload(workbook, filename) {
        try {
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
            const blob = new Blob([this.s2ab(wbout)], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('엑셀 파일 생성 실패:', error);
            this.showNotification('엑셀 파일 생성에 실패했습니다.', 'error');
        }
    }
    
    // Convert string to array buffer
    s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
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
            
            // 제품 기본 정보 표시
            document.getElementById('detailProductName').textContent = product.name;
            document.getElementById('detailMaker').textContent = product.maker || '-';
            document.getElementById('detailModel').textContent = product.model || '-';
            document.getElementById('detailSpecification').textContent = product.specification || '-';
            document.getElementById('detailCategory').textContent = product.category;
            document.getElementById('detailSerialNumber').textContent = product.serial_number || '-';
            document.getElementById('detailPurchaseDate').textContent = product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : '-';
            
            const registrationDate = product.created_at || product.added_date;
            document.getElementById('detailRegistrationDate').textContent = registrationDate ? new Date(registrationDate).toLocaleDateString() : '-';
            
            // 현재 상태 표시
            const statusText = this.getStatusText(product.status);
            document.getElementById('detailCurrentStatus').textContent = statusText;
            
            // 반출 이력 표시
            await this.renderExportHistory(product);
            
            // 상세 정보 섹션 표시 (MODAL 대신)
            document.getElementById('productDetailSection').style.display = 'block';
            
            // 상세 정보 섹션으로 스크롤
            document.getElementById('productDetailSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
        } catch (error) {
            console.error('제품 상세 정보 표시 실패:', error);
            this.showNotification('제품 상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
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
        
        const exportDate = history.export_date ? new Date(history.export_date).toLocaleDateString() : '-';
        const returnDate = history.return_date ? new Date(history.return_date).toLocaleDateString() : '-';
        
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
}

// Global functions
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

function goBack() {
    window.location.href = 'index.html';
}

function resetForm() {
    document.getElementById('addProductForm').reset();
    this.editingProductId = null;
    
    // 버튼 텍스트 원래대로
    const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
    submitBtn.textContent = '제품 추가';
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
            window.desktopSystem.exportData();
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
            window.desktopSystem.importData(files[0]);
        }
    });
});
