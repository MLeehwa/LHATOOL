// Supabase 설정 파일
// 브라우저에서 사용할 수 있도록 전역 객체로 생성

// Supabase 프로젝트 설정
// 아래 URL과 키를 본인의 Supabase 프로젝트 정보로 변경하세요
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Supabase 클라이언트 생성 (브라우저용)
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// 공구 관리 시스템 데이터베이스 함수들
const toolsDB = {
  // 사용자 관련 함수 (로그인 및 비밀번호 변경만)
  users: {
    // 사용자 로그인
    async login(username, password) {
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          p_username: username,
          p_password: password
        });
      
      if (error) {
        console.error('Error authenticating user:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        return data[0];
      }
      return null;
    },

    // 비밀번호 변경 (2차 비밀번호 보호)
    async changePassword(username, oldPassword, newPassword, masterPassword = null) {
      const params = {
        p_username: username,
        p_old_password: oldPassword,
        p_new_password: newPassword
      };
      
      // 2차 비밀번호가 제공되면 추가
      if (masterPassword) {
        params.p_master_password = masterPassword;
      }
      
      const { data, error } = await supabase
        .rpc('change_user_password', params);
      
      if (error) {
        console.error('Error changing password:', error);
        return false;
      }
      
      return data;
    }
  },
  // 제품 관련 함수
  products: {
    // 모든 제품 조회
    async getAll() {
      const { data, error } = await supabase
        .from('tools_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data;
    },

    // 제품 추가
    async add(productData) {
      const { data, error } = await supabase
        .from('tools_products')
        .insert([productData])
        .select();
      
      if (error) {
        console.error('Error adding product:', error);
        return null;
      }
      return data[0];
    },

    // 제품 수정
    async update(id, updateData) {
      const { data, error } = await supabase
        .from('tools_products')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating product:', error);
        return null;
      }
      return data[0];
    },

    // 제품 삭제
    async delete(id) {
      const { error } = await supabase
        .from('tools_products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }
      return true;
    },

    // ID로 제품 조회
    async getById(id) {
      const { data, error } = await supabase
        .from('tools_products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }
      return data;
    },

    // 바코드로 제품 조회
    async getByBarcode(barcode) {
      if (!barcode || barcode.trim() === '') {
        return null;
      }
      
      const { data, error } = await supabase
        .from('tools_products')
        .select('*')
        .eq('barcode', barcode.trim())
        .maybeSingle(); // single() 대신 maybeSingle() 사용
      
      if (error) {
        console.error('Error fetching product by barcode:', error);
        return null;
      }
      return data; // null이 반환될 수 있음 (바코드가 존재하지 않는 경우)
    }
  },

  // 카테고리 관련 함수
  categories: {
    // 모든 카테고리 조회
    async getAll() {
      const { data, error } = await supabase
        .from('tools_categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      return data;
    },

    // 카테고리 추가
    async add(categoryData) {
      const { data, error } = await supabase
        .from('tools_categories')
        .insert([categoryData])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding category:', error);
        return null;
      }
      return data;
    },

    // 카테고리 삭제
    async delete(id) {
      const { error } = await supabase
        .from('tools_categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting category:', error);
        return false;
      }
      return true;
    }
  },

  // 반출 이력 관련 함수
  exportHistory: {
    // 모든 반출 이력 조회
    async getAll() {
      const { data, error } = await supabase
        .from('tools_export_history')
        .select(`
          *,
          tools_products (
            name,
            category,
            serial_number,
            barcode
          )
        `)
        .order('export_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching export history:', error);
        return [];
      }
      return data;
    },

    // 제품별 반출 이력 조회
    async getByProductId(productId) {
      const { data, error } = await supabase
        .from('tools_export_history')
        .select('*')
        .eq('product_id', productId)
        .order('export_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching export history by product:', error);
        return [];
      }
      return data;
    },

    // 제품 반출 처리
    async export(productId, exportedBy, purpose = '현장작업') {
      // 1. 제품 상태를 'Exported'로 변경
      const { error: updateError } = await supabase
        .from('tools_products')
        .update({ status: 'Exported' })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Error updating product status:', updateError);
        return false;
      }
      
      // 2. 반출 이력 추가
      const { error: historyError } = await supabase
        .from('tools_export_history')
        .insert([{
          product_id: productId,
          exported_by: exportedBy,
          export_purpose: purpose
        }]);
      
      if (historyError) {
        console.error('Error adding export history:', historyError);
        return false;
      }
      
      return true;
    },

    // 제품 반납 처리
    async return(productId, returnedBy) {
      // 1. 제품 상태를 'Available'로 변경
      const { error: updateError } = await supabase
        .from('tools_products')
        .update({ status: 'Available' })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Error updating product status:', updateError);
        return false;
      }
      
      // 2. 반출 이력에 반납 정보 업데이트
      const { error: historyError } = await supabase
        .from('tools_export_history')
        .update({ 
          return_date: new Date().toISOString(),
          returned_by: returnedBy
        })
        .eq('product_id', productId)
        .is('return_date', null);
      
      if (historyError) {
        console.error('Error updating export history:', historyError);
        return false;
      }
      
      return true;
    },

    // 현재 반출 중인 제품들 조회
    async getCurrentExports() {
      const { data, error } = await supabase
        .from('tools_export_history')
        .select(`
          *,
          tools_products (
            name,
            category,
            serial_number,
            barcode
          )
        `)
        .is('return_date', null)
        .order('export_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching current exports:', error);
        return [];
      }
      return data;
    }
  },

  // 통계 관련 함수
  stats: {
    // 전체 통계 조회
    async getOverallStats() {
      const { data: products, error: productsError } = await supabase
        .from('tools_products')
        .select('status');
      
      if (productsError) {
        console.error('Error fetching products for stats:', productsError);
        return null;
      }
      
      const total = products.length;
      const available = products.filter(p => p.status === 'Available').length;
      const exported = products.filter(p => p.status === 'Exported').length;
      const maintenance = products.filter(p => p.status === 'Under Maintenance').length;
      const retired = products.filter(p => p.status === 'Retired').length;
      
      return {
        total,
        available,
        exported,
        maintenance,
        retired
      };
    },

    // 카테고리별 통계
    async getCategoryStats() {
      const { data, error } = await supabase
        .from('tools_products')
        .select('category, status');
      
      if (error) {
        console.error('Error fetching category stats:', error);
        return [];
      }
      
      const stats = {};
      data.forEach(product => {
        if (!stats[product.category]) {
          stats[product.category] = { total: 0, available: 0, exported: 0 };
        }
        stats[product.category].total++;
        if (product.status === 'Available') {
          stats[product.category].available++;
        } else if (product.status === 'Exported') {
          stats[product.category].exported++;
        }
      });
      
      return Object.entries(stats).map(([category, counts]) => ({
        category,
        ...counts
      }));
    }
  }
};

// 전역 객체로 사용할 수 있도록 window에 할당
window.toolsDB = toolsDB;
window.supabase = supabase;
