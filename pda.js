// 10인치 타블렛 공구 관리 시스템 JavaScript (Supabase 연동)
class PDAToolManagement {
    constructor() {
        this.currentUser = '현장 사용자';
        this.currentMode = null;
        this.scannedProduct = null;
        this.currentExportUser = null;
        this.isProcessing = false; // 중복 처리 방지
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
            console.log('PDA 시스템 초기화 완료');
        } catch (error) {
            console.error('PDA 시스템 초기화 실패:', error);
            this.showNotification('시스템 초기화에 실패했습니다.', 'error');
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
    }

    // Select mode (export or return)
    selectMode(mode) {
        this.currentMode = mode;
        
        // Hide mode selection
        document.getElementById('modeSelection').style.display = 'none';
        
        if (mode === 'export') {
            // Show user name modal first for export
            this.showExportUserNameModal();
        } else if (mode === 'return') {
            // Show return scan section directly
            document.getElementById('returnScanSection').classList.add('active');
            // Focus on scan input
            setTimeout(() => {
                document.getElementById('returnScanInput').focus();
            }, 100);
        }
    }

    // Go back to mode selection
    goBackToModeSelection() {
        this.currentMode = null;
        this.scannedProduct = null;
        this.currentExportUser = null;
        
        // Hide all scan sections
        document.getElementById('exportScanSection').classList.remove('active');
        document.getElementById('returnScanSection').classList.remove('active');
        
        // Hide product info
        this.hideProductInfo('export');
        this.hideProductInfo('return');
        
        // Show mode selection
        document.getElementById('modeSelection').style.display = 'block';
        
        // Clear inputs
        document.getElementById('exportScanInput').value = '';
        document.getElementById('returnScanInput').value = '';
    }

    // Show export user name modal (first step)
    showExportUserNameModal() {
        const modal = document.getElementById('exportUserNameModal');
        modal.classList.add('active');
        document.getElementById('exportUserName').focus();
    }

    // Confirm export user name (first step)
    confirmExportUserName() {
        const userName = document.getElementById('exportUserName').value.trim();
        if (!userName) {
            this.showNotification('반출자 이름을 입력해주세요.', 'warning');
            return;
        }

        this.currentExportUser = userName;
        
        // Close user name modal
        this.closeModal('exportUserNameModal');
        
        // Show export scan section
        document.getElementById('exportScanSection').classList.add('active');
        
        // Focus on scan input
        setTimeout(() => {
            document.getElementById('exportScanInput').focus();
        }, 100);
    }

    // Scan for export
    async scanForExport() {
        if (this.isProcessing) return;
        
        const scanValue = document.getElementById('exportScanInput').value.trim();
        if (!scanValue) {
            this.showNotification('바코드를 스캔하거나 제품 ID를 입력해주세요.', 'warning');
            return;
        }

        this.isProcessing = true;
        
        try {
            const product = await this.findProduct(scanValue);
            if (product) {
                if (product.status === 'Available') {
                    this.scannedProduct = product;
                    this.showProductInfo('export', product);
                    this.showExportModal();
                } else {
                    this.showNotification(`제품 "${product.name}"은 현재 ${this.getStatusText(product.status)} 상태입니다.`, 'warning');
                    this.hideProductInfo('export');
                }
            } else {
                this.showNotification(`제품을 찾을 수 없습니다: ${scanValue}`, 'error');
                this.hideProductInfo('export');
            }
        } catch (error) {
            console.error('반출 스캔 오류:', error);
            this.showNotification('제품 검색 중 오류가 발생했습니다.', 'error');
            this.hideProductInfo('export');
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
                    this.scannedProduct = product;
                    this.showProductInfo('return', product);
                    this.showReturnModal();
                } else {
                    this.showNotification(`제품 "${product.name}"은 현재 ${this.getStatusText(product.status)} 상태입니다.`, 'warning');
                    this.hideProductInfo('return');
                }
            } else {
                this.showNotification(`제품을 찾을 수 없습니다: ${scanValue}`, 'error');
                this.hideProductInfo('return');
            }
        } catch (error) {
            console.error('반납 스캔 오류:', error);
            this.showNotification('제품 검색 중 오류가 발생했습니다.', 'error');
            this.hideProductInfo('return');
        } finally {
            this.isProcessing = false;
        }
    }

    // Find product by ID, serial number, or barcode (Supabase 연동)
    async findProduct(identifier) {
        try {
            // 바코드 형식 확인 (P로 시작하는 7자리)
            if (identifier.startsWith('P') && identifier.length === 7) {
                const productId = parseInt(identifier.substring(1));
                return await window.toolsDB.products.getById(productId);
            }

            // 바코드로 직접 검색
            const productByBarcode = await window.toolsDB.products.getByBarcode(identifier);
            if (productByBarcode) {
                return productByBarcode;
            }

            // 모든 제품을 가져와서 검색 (성능 최적화 필요시 개선)
            const allProducts = await window.toolsDB.products.getAll();
            return allProducts.find(p =>
                p.id.toString() === identifier ||
                p.serial_number === identifier ||
                p.name.toLowerCase().includes(identifier.toLowerCase())
            );
        } catch (error) {
            console.error('제품 검색 오류:', error);
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
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        
        // Clear appropriate input
        if (modalId === 'exportUserNameModal') {
            document.getElementById('exportUserName').value = '';
        }
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
