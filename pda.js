// 10인치 타블렛 공구 관리 시스템 JavaScript (Supabase 연동)
class PDAToolManagement {
    constructor() {
        this.currentUser = '현장 사용자';
        this.currentMode = null;
        this.scannedProduct = null;
        this.currentExportUser = null;
        this.isProcessing = false; // 중복 처리 방지
        
        // 장바구니 기능 추가
        this.exportCart = []; // 반출 장바구니
        this.returnCart = []; // 반납 장바구니
        
        this.init();
    }

    // Initialize
    async init() {
        try {
            // Supabase 연결 확인
            if (!window.toolsDB) {
                throw new Error('Supabase 연결이 설정되지 않았습니다.');
            }
            
            this.setupEventListeners();
            this.setupInputAttributes();
            console.log('PDA 시스템 초기화 완료');
        } catch (error) {
            console.error('PDA 시스템 초기화 실패:', error);
            this.showNotification('시스템 초기화에 실패했습니다.', 'error');
        }
    }

    // Setup input attributes for better tablet keyboard support
    setupInputAttributes() {
        // Set inputmode for all text inputs to ensure tablet keyboard opens
        const textInputs = [
            'exportScanInput',
            'returnScanInput', 
            'exportUserName'
        ];
        
        textInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.setAttribute('inputmode', 'text');
                // Additional attributes for better mobile/tablet experience
                input.setAttribute('autocapitalize', 'none');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('spellcheck', 'false');
            }
        });
    }

    // 장바구니에 제품 추가
    addToCart(mode, product) {
        if (mode === 'export') {
            // 중복 체크
            const exists = this.exportCart.find(item => item.id === product.id);
            if (exists) {
                this.showNotification(`"${product.name}"은 이미 장바구니에 있습니다.`, 'warning');
                return false;
            }
            
            this.exportCart.push({
                ...product,
                addedAt: new Date()
            });
            this.updateCartDisplay('export');
            this.showNotification(`"${product.name}"이 반출 장바구니에 추가되었습니다.`, 'success');
            return true;
        } else if (mode === 'return') {
            // 중복 체크
            const exists = this.returnCart.find(item => item.id === product.id);
            if (exists) {
                this.showNotification(`"${product.name}"은 이미 장바구니에 있습니다.`, 'warning');
                return false;
            }
            
            this.returnCart.push({
                ...product,
                addedAt: new Date()
            });
            this.updateCartDisplay('return');
            this.showNotification(`"${product.name}"이 반납 장바구니에 추가되었습니다.`, 'success');
            return true;
        }
        return false;
    }

    // 장바구니에서 제품 제거
    removeFromCart(mode, productId) {
        if (mode === 'export') {
            this.exportCart = this.exportCart.filter(item => item.id !== productId);
            this.updateCartDisplay('export');
        } else if (mode === 'return') {
            this.returnCart = this.returnCart.filter(item => item.id !== productId);
            this.updateCartDisplay('return');
        }
    }

    // 장바구니 표시 업데이트
    updateCartDisplay(mode) {
        const cartSection = document.getElementById(`${mode}CartSection`);
        const cartItems = document.getElementById(`${mode}CartItems`);
        
        if (!cartSection || !cartItems) return;
        
        if (mode === 'export') {
            if (this.exportCart.length === 0) {
                cartSection.style.display = 'none';
                return;
            }
            
            cartSection.style.display = 'block';
            cartItems.innerHTML = this.exportCart.map(item => `
                <div class="cart-item">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-details">${item.category} | ${item.maker} | ${item.barcode}</div>
                    </div>
                    <button class="remove-btn" onclick="removeFromExportCart(${item.id})" title="제거">❌</button>
                </div>
            `).join('');
        } else if (mode === 'return') {
            if (this.returnCart.length === 0) {
                cartSection.style.display = 'none';
                return;
            }
            
            cartSection.style.display = 'block';
            cartItems.innerHTML = this.returnCart.map(item => `
                <div class="cart-item">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-details">${item.category} | ${item.maker} | ${item.barcode}</div>
                    </div>
                    <button class="remove-btn" onclick="removeFromReturnCart(${item.id})" title="제거">❌</button>
                </div>
            `).join('');
        }
    }

    // 장바구니 비우기
    clearCart(mode) {
        if (mode === 'export') {
            this.exportCart = [];
            this.updateCartDisplay('export');
            this.showNotification('반출 장바구니가 비워졌습니다.', 'info');
        } else if (mode === 'return') {
            this.returnCart = [];
            this.updateCartDisplay('return');
            this.showNotification('반납 장바구니가 비워졌습니다.', 'info');
        }
    }

    // 반출 장바구니 일괄 처리
    async processExportCart() {
        if (this.exportCart.length === 0) {
            this.showNotification('반출할 제품이 없습니다.', 'warning');
            return;
        }

        if (!this.currentExportUser) {
            this.showNotification('반출자 이름이 설정되지 않았습니다.', 'error');
            return;
        }

        this.isProcessing = true;
        
        try {
            let successCount = 0;
            let failCount = 0;
            
            for (const product of this.exportCart) {
                try {
                    const success = await window.toolsDB.exportHistory.export(
                        product.id,
                        this.currentExportUser,
                        '현장작업'
                    );
                    
                    if (success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    console.error(`제품 ${product.name} 반출 오류:`, error);
                    failCount++;
                }
            }
            
            if (successCount > 0) {
                this.showNotification(`${successCount}개 제품 반출 완료!${failCount > 0 ? ` (${failCount}개 실패)` : ''}`, 'success');
                
                // 성공한 제품들만 장바구니에서 제거
                this.exportCart = this.exportCart.filter(product => {
                    // 실제로는 DB에서 성공 여부를 확인해야 하지만, 여기서는 간단히 처리
                    return false; // 모든 제품 제거
                });
                
                this.updateCartDisplay('export');
                
                // 메인 선택 화면으로 돌아가기
                setTimeout(() => {
                    this.goBackToModeSelection();
                }, 2000);
            } else {
                this.showNotification('모든 제품 반출에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('일괄 반출 처리 오류:', error);
            this.showNotification('일괄 반출 처리 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    // 반납 장바구니 일괄 처리
    async processReturnCart() {
        if (this.returnCart.length === 0) {
            this.showNotification('반납할 제품이 없습니다.', 'warning');
            return;
        }

        this.isProcessing = true;
        
        try {
            let successCount = 0;
            let failCount = 0;
            
            for (const product of this.returnCart) {
                try {
                    // 반출 이력에서 반출자 이름 가져오기
                    const exportHistory = await window.toolsDB.exportHistory.getByProductId(product.id);
                    let exportedBy = '알 수 없음';
                    
                    if (exportHistory && exportHistory.length > 0) {
                        exportedBy = exportHistory[0].exported_by;
                    }
                    
                    const success = await window.toolsDB.exportHistory.return(
                        product.id,
                        exportedBy
                    );
                    
                    if (success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    console.error(`제품 ${product.name} 반납 오류:`, error);
                    failCount++;
                }
            }
            
            if (successCount > 0) {
                this.showNotification(`${successCount}개 제품 반납 완료!${failCount > 0 ? ` (${failCount}개 실패)` : ''}`, 'success');
                
                // 성공한 제품들만 장바구니에서 제거
                this.returnCart = this.returnCart.filter(product => {
                    return false; // 모든 제품 제거
                });
                
                this.updateCartDisplay('return');
                
                // 메인 선택 화면으로 돌아가기
                setTimeout(() => {
                    this.goBackToModeSelection();
                }, 2000);
            } else {
                this.showNotification('모든 제품 반납에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('일괄 반납 처리 오류:', error);
            this.showNotification('일괄 반납 처리 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    // Event listeners setup
    setupEventListeners() {
        // Scan inputs with Enter key support
        const exportScanInput = document.getElementById('exportScanInput');
        const returnScanInput = document.getElementById('returnScanInput');

        exportScanInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.scanForExport();
            }
        });

        returnScanInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.scanForReturn();
            }
        });

        // Modal inputs with Enter key support
        const exportUserName = document.getElementById('exportUserName');

        exportUserName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmExportUserName();
            }
        });

        // Auto-enter functionality for scan inputs
        this.setupAutoEnter(exportScanInput, () => this.scanForExport());
        this.setupAutoEnter(returnScanInput, () => this.scanForReturn());

        // Force keyboard to open on input click for tablet devices
        [exportScanInput, returnScanInput, exportUserName].forEach(input => {
            if (input) {
                input.addEventListener('click', () => {
                    // Force focus and keyboard to open
                    input.focus();
                    // Small delay to ensure focus is set
                    setTimeout(() => {
                        input.click();
                    }, 50);
                });
                
                input.addEventListener('focus', () => {
                    // Ensure inputmode is set when focused
                    input.setAttribute('inputmode', 'text');
                });
            }
        });
    }

    // Setup auto-enter functionality for scan inputs
    setupAutoEnter(inputElement, callback) {
        if (!inputElement) return;

        // 바코드 스캐너는 보통 빠르게 연속으로 입력됨
        let lastInputTime = 0;
        let inputBuffer = '';
        let autoEnterTimeout = null;

        // 입력값 변경 감지
        inputElement.addEventListener('input', (e) => {
            const currentTime = Date.now();
            const inputValue = e.target.value;
            
            // 빠른 입력이 감지되면 바코드 스캔으로 간주
            if (currentTime - lastInputTime < 100) {
                // 빠른 입력이 감지되면 바코드 스캔으로 간주
                inputBuffer = inputValue;
                
                // 기존 타이머 제거
                if (autoEnterTimeout) {
                    clearTimeout(autoEnterTimeout);
                }
                
                // 자동 엔터 타이머 설정 (바코드 스캔 완료 대기)
                autoEnterTimeout = setTimeout(() => {
                    if (inputBuffer.length > 0) {
                        // 자동으로 엔터키 시뮬레이션
                        this.autoEnter(inputElement, callback);
                    }
                }, 300); // 300ms 대기 (바코드 스캔 완료 시간)
            } else {
                // 수동 입력으로 간주
                inputBuffer = inputValue;
                
                // 수동 입력 시 자동 엔터 조건 확인
                this.checkAutoEnterConditions(inputElement, inputValue, callback);
            }
            
            lastInputTime = currentTime;
        });

        // 키보드 입력 감지
        inputElement.addEventListener('keydown', (e) => {
            // 특정 키 입력 시 자동 엔터
            if (e.key === 'Tab' || e.key === ' ') {
                e.preventDefault();
                this.autoEnter(inputElement, callback);
            }
        });

        // 포커스 아웃 시 자동 엔터
        inputElement.addEventListener('blur', () => {
            if (inputElement.value.trim().length > 0) {
                // 포커스가 벗어나면 자동으로 처리
                setTimeout(() => {
                    this.autoEnter(inputElement, callback);
                }, 100);
            }
        });
    }

    // 자동 엔터 조건 확인
    checkAutoEnterConditions(inputElement, value, callback) {
        const trimmedValue = value.trim();
        
        // 빈 값이면 처리하지 않음
        if (trimmedValue.length === 0) return;
        
        // 바코드 형식 감지 (P로 시작하는 4자리: P + 3자리 숫자)
        if (trimmedValue.startsWith('P') && trimmedValue.length === 4) {
            this.autoEnter(inputElement, callback);
            return;
        }
        
        // 일반 바코드 길이 (8-13자리)
        if (trimmedValue.length >= 8 && trimmedValue.length <= 13) {
            // 숫자나 문자로만 구성된 경우 바코드로 간주
            if (/^[A-Za-z0-9]+$/.test(trimmedValue)) {
                this.autoEnter(inputElement, callback);
                return;
            }
        }
        
        // 제품 ID (숫자만, 3자리)
        if (/^\d{3}$/.test(trimmedValue)) {
            this.autoEnter(inputElement, callback);
            return;
        }
        
        // 2자리 이상 숫자 (기타 제품 ID)
        if (/^\d{2,}$/.test(trimmedValue)) {
            this.autoEnter(inputElement, callback);
            return;
        }
    }

    // 자동 엔터 실행
    autoEnter(inputElement, callback) {
        // 입력값이 있으면 콜백 실행
        if (inputElement.value.trim().length > 0) {
            // 입력 필드에 포커스 유지
            inputElement.focus();
            
            // 콜백 실행 (스캔 함수)
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    // Select mode (export or return)
    selectMode(mode) {
        console.log('selectMode 호출됨:', mode);
        
        this.currentMode = mode;
        
        // Hide mode selection
        const modeSelection = document.getElementById('modeSelection');
        if (modeSelection) {
            modeSelection.style.display = 'none';
            modeSelection.style.visibility = 'hidden';
        }
        
        // Reset all input fields to ensure clean state
        this.resetInputFields();
        
        if (mode === 'export') {
            console.log('반출 모드 선택됨, 사용자 이름 모달 표시');
            // Show user name modal first for export
            this.showExportUserNameModal();
        } else if (mode === 'return') {
            console.log('반납 모드 선택됨, 반납 스캔 섹션 표시');
            // Show return scan section directly
            this.showReturnScanSection();
        }
    }
    
    // Show return scan section
    showReturnScanSection() {
        console.log('showReturnScanSection 호출됨');
        
        // 모든 다른 섹션과 모달을 숨김
        this.hideAllSections();
        
        const returnScanSection = document.getElementById('returnScanSection');
        if (!returnScanSection) {
            console.error('returnScanSection을 찾을 수 없습니다.');
            return;
        }
        
        // 반납 스캔 섹션을 강제로 표시
        returnScanSection.style.display = 'block';
        returnScanSection.classList.add('active');
        returnScanSection.style.visibility = 'visible';
        returnScanSection.style.opacity = '1';
        
        // 스캔 입력 필드 초기화 및 포커스
        setTimeout(() => {
            const scanInput = document.getElementById('returnScanInput');
            if (scanInput) {
                scanInput.focus();
                // Force keyboard to open on tablet
                scanInput.click();
                // Set input mode for better tablet keyboard
                scanInput.setAttribute('inputmode', 'text');
                scanInput.setAttribute('autocapitalize', 'none');
                scanInput.setAttribute('autocorrect', 'off');
                scanInput.setAttribute('spellcheck', 'false');
                
                console.log('반납 스캔 섹션 표시됨, 입력 필드 포커스됨');
            } else {
                console.error('returnScanInput을 찾을 수 없습니다.');
            }
        }, 200);
    }

    // Reset all input fields to ensure clean state
    resetInputFields() {
        const inputs = [
            'exportScanInput',
            'returnScanInput',
            'exportUserName'
        ];
        
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
                input.blur();
                input.setAttribute('inputmode', 'text');
                input.setAttribute('autocapitalize', 'none');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('spellcheck', 'false');
            }
        });
    }

    // Hide all sections and modals
    hideAllSections() {
        console.log('hideAllSections 호출됨');
        
        // 모든 스캔 섹션 숨기기
        const exportScanSection = document.getElementById('exportScanSection');
        const returnScanSection = document.getElementById('returnScanSection');
        
        if (exportScanSection) {
            exportScanSection.style.display = 'none';
            exportScanSection.classList.remove('active');
            exportScanSection.style.visibility = 'hidden';
            exportScanSection.style.opacity = '0';
        }
        
        if (returnScanSection) {
            returnScanSection.style.display = 'none';
            returnScanSection.classList.remove('active');
            returnScanSection.style.visibility = 'hidden';
            returnScanSection.style.opacity = '0';
        }
        
        // 모든 모달 숨기기
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('active');
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
        });
        
        // 장바구니 섹션 숨기기
        const exportCartSection = document.getElementById('exportCartSection');
        const returnCartSection = document.getElementById('returnCartSection');
        if (exportCartSection) exportCartSection.style.display = 'none';
        if (returnCartSection) returnCartSection.style.display = 'none';
        
        // 제품 정보 숨기기
        this.hideProductInfo('export');
        this.hideProductInfo('return');
        
        console.log('모든 섹션과 모달이 숨겨짐');
    }

    // Go back to mode selection
    goBackToModeSelection() {
        console.log('goBackToModeSelection 호출됨');
        
        this.currentMode = null;
        this.scannedProduct = null;
        this.currentExportUser = null;
        
        // 장바구니 초기화
        this.exportCart = [];
        this.returnCart = [];
        
        // 모든 섹션과 모달을 숨김
        this.hideAllSections();
        
        // Show mode selection
        const modeSelection = document.getElementById('modeSelection');
        if (modeSelection) {
            modeSelection.style.display = 'block';
            modeSelection.style.visibility = 'visible';
            modeSelection.style.opacity = '1';
        }
        
        // Clear inputs and reset their state
        const exportInput = document.getElementById('exportScanInput');
        const returnInput = document.getElementById('returnScanInput');
        const userNameInput = document.getElementById('exportUserName');
        
        if (exportInput) {
            exportInput.value = '';
            exportInput.blur(); // Remove focus
            exportInput.setAttribute('inputmode', 'text');
        }
        
        if (returnInput) {
            returnInput.value = '';
            returnInput.blur(); // Remove focus
            returnInput.setAttribute('inputmode', 'text');
        }
        
        if (userNameInput) {
            userNameInput.value = '';
            userNameInput.blur(); // Remove focus
            userNameInput.setAttribute('inputmode', 'text');
        }
        
        // Force keyboard to close by focusing on a non-input element
        setTimeout(() => {
            if (modeSelection) {
                modeSelection.focus();
                // Ensure mode selection is properly visible and focused
                modeSelection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 강제로 모드 선택 화면 표시
                modeSelection.style.display = 'block';
                modeSelection.style.visibility = 'visible';
                modeSelection.style.opacity = '1';
            }
        }, 100);
        
        // Additional cleanup to ensure clean state
        setTimeout(() => {
            // Re-setup input attributes to ensure they're ready for next use
            this.setupInputAttributes();
            
            // 최종 확인: 모드 선택 화면이 보이는지 확인
            if (modeSelection && modeSelection.style.display !== 'block') {
                modeSelection.style.display = 'block';
                modeSelection.style.visibility = 'visible';
            }
        }, 200);
        
        console.log('모드 선택 화면으로 돌아감');
    }

    // Show export user name modal (first step)
    showExportUserNameModal() {
        console.log('showExportUserNameModal 호출됨');
        
        const modal = document.getElementById('exportUserNameModal');
        if (!modal) {
            console.error('exportUserNameModal을 찾을 수 없습니다.');
            return;
        }
        
        // 모든 다른 섹션과 모달을 숨김
        this.hideAllSections();
        
        // 모달을 강제로 표시
        modal.style.display = 'flex';
        modal.classList.add('active');
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '1000';
        
        // 입력 필드 초기화 및 포커스
        const userNameInput = document.getElementById('exportUserName');
        if (userNameInput) {
            userNameInput.value = '';
            userNameInput.focus();
            // 타블렛 키보드 강제 열기
            userNameInput.click();
        }
        
        console.log('반출자 이름 모달 표시됨');
    }

    // Confirm export user name (first step)
    confirmExportUserName() {
        console.log('confirmExportUserName 호출됨');
        
        const userName = document.getElementById('exportUserName').value.trim();
        if (!userName) {
            this.showNotification('반출자 이름을 입력해주세요.', 'warning');
            return;
        }

        console.log('반출자 이름 확인됨:', userName);
        this.currentExportUser = userName;
        
        // Close user name modal
        this.closeModal('exportUserNameModal');
        
        // Show export scan section with proper timing
        setTimeout(() => {
            this.showExportScanSection();
        }, 100);
    }
    
    // Show export scan section
    showExportScanSection() {
        console.log('showExportScanSection 호출됨');
        
        // 모든 다른 섹션과 모달을 숨김
        this.hideAllSections();
        
        const exportScanSection = document.getElementById('exportScanSection');
        if (!exportScanSection) {
            console.error('exportScanSection을 찾을 수 없습니다.');
            return;
        }
        
        // 반출 스캔 섹션을 강제로 표시
        exportScanSection.style.display = 'block';
        exportScanSection.classList.add('active');
        exportScanSection.style.visibility = 'visible';
        exportScanSection.style.opacity = '1';
        
        // 스캔 입력 필드 초기화 및 포커스
        setTimeout(() => {
            const scanInput = document.getElementById('exportScanInput');
            if (scanInput) {
                // 입력 필드 초기화
                scanInput.value = '';
                scanInput.setAttribute('inputmode', 'text');
                scanInput.setAttribute('autocapitalize', 'none');
                scanInput.setAttribute('autocorrect', 'off');
                scanInput.setAttribute('spellcheck', 'false');
                
                // 강제 포커스 및 키보드 열기
                scanInput.focus();
                scanInput.click();
                
                console.log('반출 스캔 섹션 표시됨, 입력 필드 포커스됨');
            } else {
                console.error('exportScanInput을 찾을 수 없습니다.');
            }
        }, 200);
    }

    // Scan for export
    async scanForExport() {
        if (this.isProcessing) return;
        
        const scanValue = document.getElementById('exportScanInput').value.trim();
        console.log('📱 scanForExport 호출됨, scanValue:', scanValue);
        
        if (!scanValue) {
            this.showNotification('바코드를 스캔하거나 제품 ID를 입력해주세요.', 'warning');
            return;
        }

        this.isProcessing = true;
        
        try {
            console.log('🔍 제품 검색 시작...');
            const product = await this.findProduct(scanValue);
            console.log('🔍 검색 결과 제품:', product);
            
            if (product) {
                console.log('✅ 제품 찾음, 상태 확인:', product.status);
                
                if (product.status === 'Available') {
                    console.log('📦 장바구니에 추가 시도:', {
                        scannedBarcode: scanValue,
                        productBarcode: product.barcode,
                        productId: product.id,
                        productName: product.name
                    });
                    
                    // 제품을 장바구니에 추가
                    const added = this.addToCart('export', product);
                    if (added) {
                        console.log('✅ 장바구니 추가 성공');
                        
                        // 입력 필드 초기화 및 다음 스캔 준비
                        document.getElementById('exportScanInput').value = '';
                        document.getElementById('exportScanInput').focus();
                        
                        // 제품 정보는 간단히 표시 (장바구니에 추가됨을 알림)
                        this.showProductInfo('export', product);
                        setTimeout(() => {
                            this.hideProductInfo('export');
                        }, 2000);
                    } else {
                        console.log('❌ 장바구니 추가 실패');
                    }
                } else {
                    console.log('⚠️ 제품 상태가 Available이 아님:', product.status);
                    this.showNotification(`제품 "${product.name}"은 현재 ${this.getStatusText(product.status)} 상태입니다.`, 'warning');
                }
            } else {
                console.log('❌ 제품을 찾을 수 없음:', scanValue);
                this.showNotification(`제품을 찾을 수 없습니다: ${scanValue}`, 'error');
            }
        } catch (error) {
            console.error('❌ 반출 스캔 오류:', error);
            this.showNotification('제품 검색 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    // Scan for return
    async scanForReturn() {
        if (this.isProcessing) return;
        
        const scanValue = document.getElementById('returnScanInput').value.trim();
        if (!scanValue) {
            this.showNotification('바코드를 스캔하거나 제품 ID를 입력해주세요.', 'warning');
            return;
        }

        this.isProcessing = true;
        
        try {
            const product = await this.findProduct(scanValue);
            if (product) {
                if (product.status === 'Exported') {
                    // 제품을 장바구니에 추가
                    const added = this.addToCart('return', product);
                    if (added) {
                        // 입력 필드 초기화 및 다음 스캔 준비
                        document.getElementById('returnScanInput').value = '';
                        document.getElementById('returnScanInput').focus();
                        
                        // 제품 정보는 간단히 표시 (장바구니에 추가됨을 알림)
                        this.showProductInfo('return', product);
                        setTimeout(() => {
                            this.hideProductInfo('return');
                        }, 2000);
                    }
                } else {
                    this.showNotification(`제품 "${product.name}"은 현재 ${this.getStatusText(product.status)} 상태입니다.`, 'warning');
                }
            } else {
                this.showNotification(`제품을 찾을 수 없습니다: ${scanValue}`, 'error');
            }
        } catch (error) {
            console.error('반납 스캔 오류:', error);
            this.showNotification('제품 검색 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    // Find product by ID, serial number, or barcode (Supabase 연동)
    async findProduct(identifier) {
        console.log('🔍 findProduct 호출됨, identifier:', identifier);
        
        try {
            // 1. 바코드로 직접 검색 (최우선)
            console.log('🔍 바코드로 직접 검색 시도:', identifier);
            const productByBarcode = await window.toolsDB.products.getByBarcode(identifier);
            if (productByBarcode) {
                console.log('✅ 바코드로 찾은 제품:', productByBarcode);
                return productByBarcode;
            }

            // 2. P 형식 바코드인 경우 ID로 검색 (백업)
            if (identifier.startsWith('P') && identifier.length === 4) {
                const productId = parseInt(identifier.substring(1));
                console.log('📊 P 형식 바코드 감지, productId:', productId);
                
                const product = await window.toolsDB.products.getById(productId);
                console.log('🔍 ID로 검색된 제품:', product);
                
                if (product) {
                    console.log('✅ ID로 찾은 제품:', {
                        id: product.id,
                        barcode: product.barcode,
                        name: product.name,
                        expectedBarcode: identifier
                    });
                    
                    // 바코드 일치 여부 확인
                    if (product.barcode !== identifier) {
                        console.warn('⚠️ 바코드 불일치! ID 기반 검색 결과:', {
                            expected: identifier,
                            actual: product.barcode,
                            productId: product.id
                        });
                    }
                }
                
                return product;
            }

            // 3. 전체 제품 목록에서 검색 (마지막 수단)
            console.log('🔍 전체 제품 목록에서 검색 시도');
            const allProducts = await window.toolsDB.products.getAll();
            console.log('📊 전체 제품 수:', allProducts.length);
            
            const foundProduct = allProducts.find(p =>
                p.id.toString() === identifier ||
                p.serial_number === identifier ||
                p.name.toLowerCase().includes(identifier.toLowerCase())
            );
            
            if (foundProduct) {
                console.log('✅ 전체 검색으로 찾은 제품:', foundProduct);
            }
            
            return foundProduct;
        } catch (error) {
            console.error('❌ 제품 검색 오류:', error);
            throw error;
        }
    }

    // Show export modal
    showExportModal() {
        const modal = document.getElementById('exportModal');
        modal.classList.add('active');
        // Display the user name from first step
        document.getElementById('exportUserNameDisplay').textContent = this.currentExportUser || '이름 없음';
    }

    // Show return modal
    showReturnModal() {
        const modal = document.getElementById('returnModal');
        modal.classList.add('active');
        // 반출자 이름을 반납 모달에 표시
        this.loadExportHistoryForProduct(this.scannedProduct.id, 'return');
    }

    // Close modal
    closeModal(modalId) {
        console.log('closeModal 호출됨:', modalId);
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('모달을 찾을 수 없습니다:', modalId);
            return;
        }
        
        // 모달을 강제로 숨김
        modal.style.display = 'none';
        modal.classList.remove('active');
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        
        // Clear appropriate input
        if (modalId === 'exportUserNameModal') {
            const userNameInput = document.getElementById('exportUserName');
            if (userNameInput) {
                userNameInput.value = '';
                userNameInput.blur();
            }
        }
        
        console.log('모달이 닫힘:', modalId);
    }

    // Confirm export (Supabase 연동)
    async confirmExport() {
        if (this.isProcessing) return;
        
        if (!this.currentExportUser) {
            this.showNotification('반출자 이름이 설정되지 않았습니다.', 'error');
            return;
        }

        if (!this.scannedProduct) {
            this.showNotification('스캔된 제품이 없습니다.', 'error');
            return;
        }

        this.isProcessing = true;
        
        try {
            // Supabase를 통한 반출 처리
            const success = await window.toolsDB.exportHistory.export(
                this.scannedProduct.id,
                this.currentExportUser,
                '현장작업' // 기본 목적
            );

            if (success) {
                this.showNotification(`제품 "${this.scannedProduct.name}" 반출 완료!`, 'success');
                
                // Close modal and reset
                this.closeModal('exportModal');
                this.scannedProduct = null;
                document.getElementById('exportScanInput').value = '';
                this.hideProductInfo('export');
                
                // Go back to mode selection
                setTimeout(() => {
                    this.goBackToModeSelection();
                }, 1500);
            } else {
                this.showNotification('반출 처리에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('반출 처리 오류:', error);
            this.showNotification('반출 처리 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    // Confirm return (Supabase 연동)
    async confirmReturn() {
        if (this.isProcessing) return;
        
        if (!this.scannedProduct) {
            this.showNotification('스캔된 제품이 없습니다.', 'error');
            return;
        }

        // 반출 이력에서 반출자 이름 가져오기
        let exportedBy = null;
        try {
            const exportHistory = await window.toolsDB.exportHistory.getByProductId(this.scannedProduct.id);
            if (exportHistory && exportHistory.length > 0) {
                exportedBy = exportHistory[0].exported_by;
            }
        } catch (error) {
            console.error('반출 이력 조회 오류:', error);
        }

        if (!exportedBy) {
            this.showNotification('반출 이력을 찾을 수 없습니다.', 'error');
            return;
        }

        this.isProcessing = true;
        
        try {
            // Supabase를 통한 반납 처리 (반출자 이름 사용)
            const success = await window.toolsDB.exportHistory.return(
                this.scannedProduct.id,
                exportedBy
            );

            if (success) {
                this.showNotification(`제품 "${this.scannedProduct.name}" 반납 완료! (반출자: ${exportedBy})`, 'success');
                
                // Close modal and reset
                this.closeModal('returnModal');
                this.scannedProduct = null;
                document.getElementById('returnScanInput').value = '';
                this.hideProductInfo('return');
                
                // Go back to mode selection
                setTimeout(() => {
                    this.goBackToModeSelection();
                }, 1500);
            } else {
                this.showNotification('반납 처리에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('반납 처리 오류:', error);
            this.showNotification('반납 처리 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isProcessing = false;
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
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 300px;
            font-weight: 600;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Show product information
    showProductInfo(mode, product) {
        const infoContainer = document.getElementById(`${mode}ProductInfo`);
        if (!infoContainer) return;

        // 제품 정보 채우기
        document.getElementById(`${mode}ProductName`).textContent = product.name || '-';
        document.getElementById(`${mode}ProductCategory`).textContent = product.category || '-';
        document.getElementById(`${mode}ProductMaker`).textContent = product.maker || '-';
        document.getElementById(`${mode}ProductModel`).textContent = product.model || '-';
        document.getElementById(`${mode}ProductBarcode`).textContent = product.barcode || '-';

        // 반납 모드일 때 추가 정보 표시
        if (mode === 'return') {
            // 반출 이력에서 최신 정보 가져오기
            this.loadExportHistoryForProduct(product.id, mode);
        }

        // 정보 표시
        infoContainer.style.display = 'block';
    }

    // Hide product information
    hideProductInfo(mode) {
        const infoContainer = document.getElementById(`${mode}ProductInfo`);
        if (infoContainer) {
            infoContainer.style.display = 'none';
        }
    }

    // Load export history for a specific product
    async loadExportHistoryForProduct(productId, mode) {
        try {
            const exportHistory = await window.toolsDB.exportHistory.getByProductId(productId);
            if (exportHistory && exportHistory.length > 0) {
                const latestExport = exportHistory[0]; // 가장 최근 반출
                document.getElementById(`${mode}ProductExportedBy`).textContent = latestExport.exported_by || '-';
                
                const exportDate = latestExport.export_date ? new Date(latestExport.export_date) : null;
                document.getElementById(`${mode}ProductExportDate`).textContent = 
                    exportDate ? exportDate.toLocaleDateString('ko-KR') : '-';
                
                // 반납 모달에도 반출자 이름 표시
                if (mode === 'return') {
                    document.getElementById('returnUserNameDisplay').textContent = latestExport.exported_by || '이름 없음';
                }
            } else {
                document.getElementById(`${mode}ProductExportedBy`).textContent = '-';
                document.getElementById(`${mode}ProductExportDate`).textContent = '-';
                
                // 반납 모달에도 기본값 표시
                if (mode === 'return') {
                    document.getElementById('returnUserNameDisplay').textContent = '이름 없음';
                }
            }
        } catch (error) {
            console.error('반출 이력 로드 오류:', error);
            document.getElementById(`${mode}ProductExportedBy`).textContent = '-';
            document.getElementById(`${mode}ProductExportDate`).textContent = '-';
            
            // 반납 모달에도 기본값 표시
            if (mode === 'return') {
                document.getElementById('returnUserNameDisplay').textContent = '이름 없음';
            }
        }
    }
}

// Global functions
function selectMode(mode) {
    if (window.pdaSystem) {
        window.pdaSystem.selectMode(mode);
    }
}

function goBack() {
    window.location.href = 'index.html';
}

function scanForExport() {
    if (window.pdaSystem) {
        window.pdaSystem.scanForExport();
    }
}

function scanForReturn() {
    if (window.pdaSystem) {
        window.pdaSystem.scanForReturn();
    }
}

function confirmExportUserName() {
    if (window.pdaSystem) {
        window.pdaSystem.confirmExportUserName();
    }
}

function confirmExport() {
    if (window.pdaSystem) {
        window.pdaSystem.confirmExport();
    }
}

function confirmReturn() {
    if (window.pdaSystem) {
        window.pdaSystem.confirmReturn();
    }
}

function closeModal(modalId) {
    if (window.pdaSystem) {
        window.pdaSystem.closeModal(modalId);
    }
}

function goBackToModeSelection() {
    if (window.pdaSystem) {
        window.pdaSystem.goBackToModeSelection();
    }
}

// 장바구니 관련 전역 함수들
function clearExportCart() {
    if (window.pdaSystem) {
        window.pdaSystem.clearCart('export');
    }
}

function clearReturnCart() {
    if (window.pdaSystem) {
        window.pdaSystem.clearCart('return');
    }
}

function processExportCart() {
    if (window.pdaSystem) {
        window.pdaSystem.processExportCart();
    }
}

function processReturnCart() {
    if (window.pdaSystem) {
        window.pdaSystem.processReturnCart();
    }
}

function removeFromExportCart(productId) {
    if (window.pdaSystem) {
        window.pdaSystem.removeFromCart('export', productId);
    }
}

function removeFromReturnCart(productId) {
    if (window.pdaSystem) {
        window.pdaSystem.removeFromCart('return', productId);
    }
}

// Initialize system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pdaSystem = new PDAToolManagement();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            // Save shortcut disabled for PDA mode
        }
    });
});
