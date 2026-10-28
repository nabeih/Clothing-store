
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('show');
    const firstInput = modal.querySelector('input:not([type="hidden"]), select');
    if (firstInput) setTimeout(() => firstInput.focus(), 150);
}
window.openModal = openModal;

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('show');
}
window.closeModal = closeModal;

/* ============================================
   نظام إدارة المتجر - طبقة الوظائف
   ============================================ */

/* ============================================
   1. تسجيل الدخول
   ============================================ */
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const user = getUsers().find(u => u.email === email && u.password === password);

    if (!user) {
        showToast('البريد أو كلمة المرور غير صحيحة', 'error');
        return;
    }

    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    startApp();
}

function quickLogin(email) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = '123456';
    handleLogin(new Event('submit'));
}

function logout() {
    if (!confirm('تسجيل الخروج؟')) return;
    localStorage.removeItem(KEYS.CURRENT_USER);
    location.reload();
}

/* ============================================
   2. تشغيل التطبيق
   ============================================ */
function startApp() {
    const user = getCurrentUser();
    if (!user) return;

    if (CURRENT_PANEL === 'online' && !canAccessOnlinePanel(user)) {
        location.replace('index.html');
        return;
    }

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    applyPanelBranding();

    document.getElementById('userAvatar').textContent = user.name.charAt(0);
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = {
        owner: 'المالك 👑',
        manager: 'مدير فرع',
        cashier: 'كاشير',
    }[user.role] || user.role;

    buildSidebar();
    showDemoBanner();
    fillAllDropdowns();
    initTopBarAndNotifications();

    loadDashboard();
    loadInventoryTable();
    loadPurchasesManagement();
    loadPosProducts();
    loadSalesHistory();
    loadPurchasesTable();
    loadDebtsTable();
    loadEmployeesTable();
    loadBranchesTable();
    loadMerchantsTable();
    loadExpensesTable();
    loadReports();
    renderOnlineOrders();
    updateOnlineOrdersBadge();
    if (typeof updateOnlineProductsCountBadge === 'function') updateOnlineProductsCountBadge();
    if (typeof updateCustomersCountBadge === 'function') updateCustomersCountBadge();

    const requestedScreen = location.hash.slice(1);
    if (requestedScreen && document.getElementById('screen-' + requestedScreen)) {
        switchScreen(requestedScreen);
    } else if (CURRENT_PANEL === 'online') {
        switchScreen('online-orders');
    } else if (user.role === 'cashier') {
        switchScreen('pos');
    }
}

function showDemoBanner() {
    if (!IS_DEMO) return;
    const banner = document.getElementById('demoBanner');
    if (!banner) return;
    banner.innerHTML = `
        <div class="demo-badge">
            <i class="fas fa-info-circle"></i>
            <span>أنت تستخدم <strong>النسخة الإعلانية التجريبية</strong> - للعرض فقط</span>
            <a onclick="showDemoLimit('ميزة إضافية', '')">اطلب النسخة الحقيقية ←</a>
        </div>
    `;
}

/* ============================================
   3. القائمة الجانبية
   ============================================ */
/* ============================================
   لوحة الإدارة / لوحة الموقع الإلكتروني
   نفس التطبيق والبيانات، لكن لوحة الموقع تُفتح على index.html?panel=online
   وتعرض شاشات الأونلاين فقط، وللمالك والمدير فقط.
   ============================================ */
const CURRENT_PANEL = new URLSearchParams(location.search).get('panel') === 'online' ? 'online' : 'admin';
const ONLINE_ONLY_SCREENS = ['online-orders', 'online-products'];
const ONLINE_PANEL_SCREENS = [...ONLINE_ONLY_SCREENS, 'customers'];

function canAccessOnlinePanel(user) {
    return !!user && (user.role === 'owner' || user.role === 'manager');
}

function openPanel(panel, screenId) {
    const query = panel === 'online' ? '?panel=online' : '';
    location.href = 'index.html' + query + (screenId ? '#' + screenId : '');
}

function openOnlineCustomers() {
    switchScreen('customers');
    const btn = document.querySelector('#customerFilterGroup button[onclick*="\'online\'"]');
    filterCustomerTab('online', btn);
}

function applyPanelBranding() {
    if (CURRENT_PANEL !== 'online') return;
    document.title = 'لوحة الموقع الإلكتروني - متجر الأناقة';
    const header = document.querySelector('.sidebar-header span');
    if (header) header.textContent = 'لوحة الموقع';
    const storeName = document.querySelector('.topbar-store-name');
    if (storeName) storeName.innerHTML = '<i class="fas fa-globe text-primary"></i> متجر الأناقة - لوحة الموقع';
}

function buildOnlineSidebar() {
    document.getElementById('sidebarNav').innerHTML = `
        <div class="nav-title">الموقع الإلكتروني</div>
        <div class="nav-item active" onclick="switchScreen('online-orders')">
            <i class="fas fa-shopping-bag"></i><span>طلبات الموقع</span>
            <span class="badge danger" id="onlineOrdersBadge" style="margin-right:auto;border-radius:50%;padding:2px 6px;font-size:0.7rem;display:none;">0</span>
        </div>
        <div class="nav-item" onclick="switchScreen('online-products')">
            <i class="fas fa-tshirt"></i><span>منتجات المتجر أونلاين</span>
            <span class="badge success" id="onlineProductsCountBadge" style="margin-right:auto;font-size:0.7rem;border-radius:12px;padding:2px 8px;display:none;">0</span>
        </div>
        <div class="nav-item" onclick="openOnlineCustomers()">
            <i class="fas fa-users-cog"></i><span>عملاء المتجر أونلاين</span>
            <span class="badge info" id="customersCountBadge" style="margin-right:auto;font-size:0.7rem;border-radius:12px;padding:2px 8px;display:none;">0</span>
        </div>
        <a href="store/index.html" target="_blank" class="nav-item" style="text-decoration:none;color:inherit;display:flex;align-items:center;">
            <i class="fas fa-external-link-alt text-primary"></i><span>عرض المتجر الإلكتروني</span>
            <span class="badge info" style="margin-right:auto;font-size:0.65rem;border-radius:12px;padding:2px 8px;">معاينة ↗</span>
        </a>

        <div class="nav-title">التنقل</div>
        <div class="nav-item" onclick="openPanel('admin')">
            <i class="fas fa-th-large"></i><span>الانتقال إلى لوحة الإدارة</span>
        </div>

        <div class="nav-title">النظام</div>
        <div class="nav-item" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i><span>تسجيل الخروج</span>
        </div>
    `;
}

function buildSidebar() {
    if (CURRENT_PANEL === 'online') {
        buildOnlineSidebar();
        return;
    }

    const user = getCurrentUser();
    const isCashier = user.role === 'cashier';

    let nav = '';

    if (!isCashier) {
        nav += `
            <div class="nav-title">الرئيسية</div>
            <div class="nav-item active" onclick="switchScreen('dashboard')">
                <i class="fas fa-chart-pie"></i><span>لوحة التحكم</span>
            </div>
        `;
    }

    nav += `
        <div class="nav-title">العمليات</div>
        <div class="nav-item ${isCashier ? 'active' : ''}" onclick="switchScreen('pos')">
            <i class="fas fa-cash-register"></i><span>الكاشير</span>
        </div>
        <div class="nav-item" onclick="switchScreen('sales-record')">
            <i class="fas fa-history"></i><span>سجل المبيعات</span>
        </div>
        <div class="nav-item" onclick="switchScreen('returns')">
            <i class="fas fa-exchange-alt"></i><span>المرتجعات والتبديل</span>
        </div>
        <div class="nav-item has-sub" id="navItem-cashbox" onclick="toggleSidebarSubmenu('cashboxSubmenu', event)">
            <i class="fas fa-cash-register"></i><span>الصندوق والمالية</span>
            <i class="fas fa-chevron-down sub-arrow"></i>
        </div>
        <div class="nav-sub-menu" id="cashboxSubmenu">
            <div class="nav-sub-item" onclick="switchScreen('cashbox'); switchCashboxSubtab('daily');">
                <i class="fas fa-wallet"></i><span>حركات الصندوق اليومية</span>
            </div>
            <div class="nav-sub-item" onclick="switchScreen('cashbox'); switchCashboxSubtab('reconcile');">
                <i class="fas fa-balance-scale"></i><span>الجرد ومطابقة الدرج</span>
            </div>
            <div class="nav-sub-item" onclick="switchScreen('cashbox'); switchCashboxSubtab('journal');">
                <i class="fas fa-stream"></i><span>سجل التدفقات المالية</span>
            </div>
            <div class="nav-sub-item" onclick="switchScreen('cashbox'); switchCashboxSubtab('digital');">
                <i class="fas fa-mobile-alt"></i><span>المحافظ والبنوك</span>
            </div>
        </div>
    `;

    if (!isCashier) {
        nav += `
            <div class="nav-item" onclick="switchScreen('inventory')">
                <i class="fas fa-dolly-flatbed"></i><span>إدارة المشتريات</span>
            </div>
            <div class="nav-item" onclick="switchScreen('merchants')">
                <i class="fas fa-handshake"></i><span>الموردين وحساباتهم</span>
            </div>
            <div class="nav-item" onclick="switchScreen('categories')">
                <i class="fas fa-tags"></i><span>التصنيفات والسمات</span>
            </div>

            <div class="nav-title">الإدارة</div>
            <div class="nav-item" onclick="switchScreen('branches')">
                <i class="fas fa-store"></i><span>الفروع</span>
            </div>
            <div class="nav-item" onclick="switchScreen('employees')">
                <i class="fas fa-users"></i><span>الموظفين</span>
            </div>
            <div class="nav-item" onclick="switchScreen('customers')">
                <i class="fas fa-user-friends"></i><span>الزبائن وقاعدة العملاء</span>
                <span class="badge info" id="customersCountBadge" style="margin-right:auto;font-size:0.7rem;border-radius:12px;padding:2px 8px;display:none;">0</span>
            </div>
            <div class="nav-item" onclick="switchScreen('debts')">
                <i class="fas fa-hand-holding-usd"></i><span>ديون العملاء</span>
            </div>
            <div class="nav-item" onclick="switchScreen('expenses')">
                <i class="fas fa-money-bill-wave"></i><span>المصروفات</span>
            </div>
            <div class="nav-item" onclick="switchScreen('reports')">
                <i class="fas fa-chart-line"></i><span>التقارير</span>
            </div>
        `;
    }

    nav += `
        <div class="nav-title">الموقع الإلكتروني والمتجر</div>
        ${canAccessOnlinePanel(user) ? `
        <div class="nav-item" onclick="openPanel('online')">
            <i class="fas fa-globe"></i><span>لوحة الموقع الإلكتروني</span>
            <span class="badge danger" id="onlineOrdersBadge" style="margin-right:auto;border-radius:50%;padding:2px 6px;font-size:0.7rem;display:none;" title="طلبات معلقة">0</span>
        </div>
        ` : ''}
        <a href="store/index.html" target="_blank" class="nav-item" style="text-decoration:none;color:inherit;display:flex;align-items:center;">
            <i class="fas fa-external-link-alt text-primary"></i><span>عرض المتجر الإلكتروني</span>
            <span class="badge info" style="margin-right:auto;font-size:0.65rem;border-radius:12px;padding:2px 8px;">معاينة ↗</span>
        </a>

        <div class="nav-title">النظام</div>
        <div class="nav-item" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i><span>تسجيل الخروج</span>
        </div>
    `;

    document.getElementById('sidebarNav').innerHTML = nav;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
    document.getElementById('sidebarOverlay').classList.toggle('show');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('show');
    document.getElementById('sidebarOverlay').classList.remove('show');
}

function toggleSidebarSubmenu(menuId, event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById(menuId);
    if (!menu) return;
    const parentItem = menu.previousElementSibling;
    const isShowing = menu.classList.contains('show');

    if (isShowing) {
        menu.classList.remove('show');
        if (parentItem) parentItem.classList.remove('expanded');
    } else {
        menu.classList.add('show');
        if (parentItem) parentItem.classList.add('expanded');
    }
}
window.toggleSidebarSubmenu = toggleSidebarSubmenu;

/* ============================================
   4. التنقل بين الشاشات
   ============================================ */
function switchScreen(screenId) {
    if (CURRENT_PANEL === 'admin' && ONLINE_ONLY_SCREENS.includes(screenId)) {
        openPanel('online', screenId);
        return;
    }
    if (CURRENT_PANEL === 'online' && !ONLINE_PANEL_SCREENS.includes(screenId)) {
        openPanel('admin', screenId);
        return;
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + screenId);
    if (screen) screen.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
        const onclick = n.getAttribute('onclick') || '';
        if (onclick.includes(`'${screenId}'`)) n.classList.add('active');
    });

    if (screenId === 'cashbox') {
        const p = document.getElementById('navItem-cashbox');
        const s = document.getElementById('cashboxSubmenu');
        if (p) {
            p.classList.add('active');
            p.classList.add('expanded');
        }
        if (s) s.classList.add('show');
    }

    if (screenId === 'dashboard') loadDashboard();
    if (screenId === 'inventory') {
        loadPurchasesManagement();
        loadInventoryTable();
        loadPurchasesTable();
    }
    if (screenId === 'categories') {
        loadCategoriesTable();
        loadColorsTable();
        loadSizesTable();
    }
    if (screenId === 'pos') loadPosProducts();
    if (screenId === 'sales-record') loadSalesHistory();
    if (screenId === 'online-orders') renderOnlineOrders();
    if (screenId === 'online-products') renderOnlineProducts();
    if (screenId === 'customers') loadCustomersScreen();
    if (screenId === 'returns') loadReturnsScreen();
    if (screenId === 'cashbox') loadCashboxScreen();
    if (screenId === 'purchases') {
        switchScreen('inventory');
        return;
    }
    if (screenId === 'debts') loadDebtsTable();
    if (screenId === 'employees') loadEmployeesTable();
    if (screenId === 'branches') loadBranchesTable();
    if (screenId === 'merchants') loadMerchantsTable();
    if (screenId === 'expenses') loadExpensesTable();
    if (screenId === 'reports') loadReports();

    if (typeof updateNotifications === 'function') updateNotifications();
    if (window.innerWidth < 768) closeSidebar();
    window.scrollTo(0, 0);
}

/* ============================================
   5. تعبئة القوائم المنسدلة
   ============================================ */
function fillAllDropdowns() {
    const catSelect = document.getElementById('p-category');
    if (catSelect) {
        catSelect.innerHTML = '<option value="">-- اختر تصنيف --</option>' +
            getCategories().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    const colorDropdown = document.getElementById('ms-color-dropdown');
    if (colorDropdown) {
        colorDropdown.innerHTML = getColors().map(c => `
            <label class="ms-item">
                <input type="checkbox" name="p-colors" value="${escapeHtml(c)}" onchange="handleColorSelection()"> ${escapeHtml(c)}
            </label>
        `).join('');
    }

    const sizeDropdown = document.getElementById('ms-size-dropdown');
    if (sizeDropdown) {
        sizeDropdown.innerHTML = getSizes().map(s => `
            <label class="ms-item">
                <input type="checkbox" name="p-sizes" value="${escapeHtml(s)}" onchange="updateSizeLabel()"> ${escapeHtml(s)}
            </label>
        `).join('');
    }

    const restockSelect = document.getElementById('restockProduct');
    if (restockSelect) {
        restockSelect.innerHTML = '<option value="">-- اختر منتج --</option>' +
            getProducts().map(p =>
                `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.size || '-')}) - متوفر: ${getProductQuantity(p.id)}</option>`
            ).join('');
    }

    const branchSelect = document.getElementById('emp-branch');
    if (branchSelect) {
        branchSelect.innerHTML = '<option value="">بدون</option>' +
            getBranches().map(b => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`).join('');
    }

    if (typeof initPosCustomers === 'function') {
        initPosCustomers();
    }
}

let colorImages = {};

function updateSizeLabel() {
    const selected = Array.from(document.querySelectorAll('input[name="p-sizes"]:checked')).map(cb => cb.value);
    const label = document.getElementById('ms-size-label');
    if (label) {
        label.textContent = selected.length > 0 ? selected.join('، ') : '-- اختر المقاسات --';
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.multi-select')) {
        document.querySelectorAll('.ms-dropdown').forEach(d => d.classList.remove('show'));
    }
});

function handleColorSelection() {
    const container = document.getElementById('color-images-container');
    if (!container) return;
    
    const checkboxes = document.querySelectorAll('input[name="p-colors"]:checked');
    const selectedColors = Array.from(checkboxes).map(cb => cb.value);
    
    const label = document.getElementById('ms-color-label');
    if (label) {
        label.textContent = selectedColors.length > 0 ? selectedColors.join('، ') : '-- اختر الألوان --';
    }

    Object.keys(colorImages).forEach(c => {
        if (!selectedColors.includes(c)) delete colorImages[c];
    });

    if (selectedColors.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<strong style="color:var(--gray);">صور الألوان المختارة:</strong>';
    selectedColors.forEach(c => {
        const hasImg = colorImages[c] ? 'تم رفع صورة' : 'لا يوجد صورة';
        const colorStyle = colorImages[c] ? 'green' : '#64748b';
        html += `
            <div style="display:flex; align-items:center; gap:10px; background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
                <div style="width:80px; font-weight:bold; color:var(--primary);">${escapeHtml(c)}</div>
                <input type="file" accept="image/*" class="form-control" style="font-size: 0.9rem; padding: 6px 10px; flex:1;" onchange="handleColorImageUpload(this, ${jsArg(c)})">
                <span style="font-size:0.8rem; color:${colorStyle}; white-space:nowrap;" id="img-status-${escapeHtml(c)}">${hasImg}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function handleColorImageUpload(input, color) {
    if (input.files && input.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            colorImages[color] = e.target.result;
            const status = document.getElementById(`img-status-${color}`);
            if (status) {
                status.textContent = 'تم رفع صورة';
                status.style.color = 'green';
            }
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        delete colorImages[color];
        const status = document.getElementById(`img-status-${color}`);
        if (status) {
            status.textContent = 'لا يوجد صورة';
            status.style.color = '#64748b';
        }
    }
}

/* ============================================
   6. لوحة التحكم
   ============================================ */
function loadDashboard() {
    const todaySales = getTodaySales();
    const netProfit = getNetProfit();
    const revenue = getActualRevenue();
    const receivables = getReceivables();
    const lowStock = getProducts().filter(p => {
        const q = getProductQuantity(p.id);
        return q > 0 && q <= LOW_STOCK;
    }).length;

    document.getElementById('dashboardStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon success"><i class="fas fa-dollar-sign"></i></div>
            <div class="stat-label">مبيعات اليوم</div>
            <div class="stat-value">₪${todaySales.toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon primary"><i class="fas fa-chart-line"></i></div>
            <div class="stat-label">صافي الربح</div>
            <div class="stat-value" style="color:${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'};">₪${netProfit.toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon info"><i class="fas fa-receipt"></i></div>
            <div class="stat-label">إجمالي الإيرادات الفعلية</div>
            <div class="stat-value">₪${revenue.toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon danger"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="stat-label">الذمم المدينة</div>
            <div class="stat-value" style="color:var(--danger);">₪${receivables.toFixed(2)}</div>
        </div>
    `;

    const recentSales = getSales().slice().reverse().slice(0, 5);
    const tbody = document.getElementById('recentSalesTable');

    if (recentSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">لا توجد مبيعات</td></tr>';
    } else {
        tbody.innerHTML = recentSales.map(s => `
            <tr>
                <td><strong>#${escapeHtml(s.id)}</strong></td>
                <td>${escapeHtml(s.customer)}</td>
                <td><strong style="color:var(--success);">₪${Number(s.total).toFixed(2)}</strong></td>
                <td style="font-size:.8rem;">${new Date(s.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
            </tr>
        `).join('');
    }

    const out = getOutOfStockProducts();
    const loss = getLossProducts();
    let alertsHTML = '';

    if (out.length === 0 && loss.length === 0) {
        alertsHTML = '<div style="text-align:center;padding:20px;color:var(--gray);"><i class="fas fa-check-circle" style="font-size:2rem;color:var(--success);margin-bottom:10px;display:block;"></i>كل شيء ممتاز! لا توجد تنبيهات</div>';
    } else {
        if (out.length > 0) alertsHTML += `<div style="background:#fff5f5;border:1px solid #fed7d7;padding:12px;border-radius:10px;margin-bottom:10px;"><strong style="color:#dc2626;font-size:.9rem;">⚠️ ${out.length} منتج نفد من المخزون</strong></div>`;
        if (loss.length > 0) alertsHTML += `<div style="background:#fffaf0;border:1px solid #feebc8;padding:12px;border-radius:10px;"><strong style="color:#d97706;font-size:.9rem;">🔻 ${loss.length} منتج بسعر خاسر</strong></div>`;
    }

    document.getElementById('inventoryAlerts').innerHTML = alertsHTML;
}

/* ============================================
   7. المخزون
   ============================================ */
function loadInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const search = (document.getElementById('inventorySearch')?.value || '').toLowerCase().trim();
    let products = getProducts();

    if (search) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(search) ||
            (p.code || '').toLowerCase().includes(search)
        );
    }

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">لا توجد منتجات</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => {
        const qty = getProductQuantity(p.id);
        const avgCost = getProductAvgCost(p.id);
        const isLow = qty > 0 && qty <= LOW_STOCK;
        const isOut = qty <= 0;
        const stockBadge = isOut ? 'danger' : (isLow ? 'warning' : 'success');
        const isLoss = Number(p.price) <= avgCost;

        const imageHtml = p.image 
            ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee;">`
            : `<div style="width: 48px; height: 48px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 18px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); border: 1px solid #e2e8f0;"><i class="fas fa-tshirt"></i></div>`;

        return `
            <tr>
                <td><span class="badge primary">${escapeHtml(p.code || '-')}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${imageHtml}
                        <div style="display: flex; flex-direction: column; align-items: start;">
                            <strong style="font-size: 1.05rem; color: #1e293b;">${escapeHtml(p.name)}</strong>
                            ${isLoss ? '<span class="badge danger" style="margin-top: 4px; font-size: 0.7rem; padding: 2px 6px;">خاسر</span>' : ''}
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(p.category)}</td>
                <td>${escapeHtml(p.size || '-')} ${p.color ? '<span style="color:#64748b; margin:0 4px;">•</span> ' + escapeHtml(p.color) : ''}</td>
                <td>₪${avgCost.toFixed(2)}</td>
                <td><strong style="color:var(--primary);">₪${Number(p.price).toFixed(2)}</strong></td>
                <td><span class="badge ${stockBadge}">${qty}</span></td>
            </tr>
        `;
    }).join('');
}

/* ============================================
   8. حفظ / تعديل المنتج
   ============================================ */
function saveProduct() {
    const editId = document.getElementById('editingProductId').value;
    const code = document.getElementById('p-code').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const category = document.getElementById('p-category').value;
    const cost = parseFloat(document.getElementById('p-cost').value);
    const price = parseFloat(document.getElementById('p-price').value);
    const qty = parseInt(document.getElementById('p-qty').value) || 0;

    const sizeCheckboxes = document.querySelectorAll('input[name="p-sizes"]:checked');
    const colorCheckboxes = document.querySelectorAll('input[name="p-colors"]:checked');
    
    let sizes = Array.from(sizeCheckboxes).map(cb => cb.value);
    let colors = Array.from(colorCheckboxes).map(cb => cb.value);
    
    if (sizes.length === 0) sizes = [''];
    if (colors.length === 0) colors = [''];

    if (!name || !category || isNaN(cost) || isNaN(price)) {
        showToast('يرجى تعبئة الحقول المطلوبة', 'error');
        return;
    }

    const products = getProducts();
    const purchases = getPurchases();

    if (editId) {
        const id = parseInt(editId);
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            const size = sizes[0] || '';
            const color = colors[0] || '';
            const imgStr = colorImages[color] || products[index].image;
            
            products[index] = {
                ...products[index],
                code: code || products[index].code,
                name, category, size, color,
                base_cost: cost, price
            };
            if (imgStr) products[index].image = imgStr;
        }
        saveProducts(products);
        showToast('تم تحديث المنتج');
    } else {
        if (IS_DEMO && products.length + (sizes.length * colors.length) >= DEMO_LIMITS.products) {
            showDemoLimit('منتج', DEMO_LIMITS.products);
            return;
        }

        let newId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
        let newPurchaseId = purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) : 0;
        const newCode = code || '#' + (100 + newId + 1);

        sizes.forEach(s => {
            colors.forEach(c => {
                newId++;
                const imgStr = colorImages[c] || null;
                
                products.push({ 
                    id: newId, 
                    code: newCode, 
                    name, 
                    category, 
                    size: s, 
                    color: c, 
                    base_cost: cost, 
                    price, 
                    image: imgStr 
                });

                if (qty > 0) {
                    newPurchaseId++;
                    purchases.push({
                        id: newPurchaseId,
                        product_id: newId,
                        product_name: name,
                        size: s,
                        quantity: qty,
                        unit_cost: cost,
                        total_cost: qty * cost,
                        supplier: 'رصيد افتتاحي',
                        note: 'كمية أولية',
                        created_at: new Date().toISOString(),
                    });
                }
            });
        });
        
        saveProducts(products);
        if (qty > 0) savePurchases(purchases);

        showToast('تمت إضافة المنتجات بنجاح');
    }

    cancelProductEdit();
    fillAllDropdowns();
    loadInventoryTable();
    switchScreen('inventory');
}

function editProduct(id) {
    const p = getProductById(id);
    if (!p) return;

    document.getElementById('editingProductId').value = p.id;
    document.getElementById('p-code').value = p.code || '';
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-cost').value = p.base_cost || 0;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-qty').value = getProductQuantity(p.id);
    
    document.querySelectorAll('input[name="p-sizes"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="p-colors"]').forEach(cb => cb.checked = false);
    
    if (p.size) {
        const sCb = document.querySelector(`input[name="p-sizes"][value="${p.size}"]`);
        if (sCb) sCb.checked = true;
    }
    if (p.color) {
        const cCb = document.querySelector(`input[name="p-colors"][value="${p.color}"]`);
        if (cCb) cCb.checked = true;
        if (p.image) {
            colorImages[p.color] = p.image;
        }
    }
    
    handleColorSelection();
    updateSizeLabel();

    document.getElementById('productFormTitle').innerHTML = '<i class="fas fa-edit text-warning"></i> تعديل المنتج';
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
    switchScreen('add-product');
}

function cancelProductEdit() {
    document.getElementById('editingProductId').value = '';
    ['p-code', 'p-name', 'p-category', 'p-cost', 'p-price'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    document.querySelectorAll('input[name="p-sizes"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="p-colors"]').forEach(cb => cb.checked = false);
    
    colorImages = {};
    handleColorSelection();
    updateSizeLabel();

    document.getElementById('p-qty').value = '0';
    document.getElementById('productFormTitle').innerHTML = '<i class="fas fa-plus-circle text-primary"></i> إضافة منتج جديد';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

/* ============================================
   9. التصنيفات
   ============================================ */
function loadCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    const categories = getCategories();
    const products = getProducts();

    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty">لا توجد تصنيفات</td></tr>';
        return;
    }

    tbody.innerHTML = categories.map(cat => {
        const count = products.filter(p => p.category === cat).length;
        return `
            <tr>
                <td><strong>${escapeHtml(cat)}</strong></td>
                <td><span class="badge primary">${count} منتج</span></td>
                <td>
                    <button class="btn-icon" onclick="editCategory(${jsArg(cat)})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon danger" onclick="deleteCategory(${jsArg(cat)})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function saveCategory() {
    const input = document.getElementById('newCategoryInput');
    const name = input.value.trim();
    const editId = document.getElementById('editingCategoryId').value;

    if (!name) {
        showToast('أدخل اسم التصنيف', 'error');
        return;
    }

    const categories = getCategories();

    if (editId) {
        const index = categories.indexOf(editId);
        if (index !== -1) categories[index] = name;

        const products = getProducts();
        products.forEach(p => {
            if (p.category === editId) p.category = name;
        });
        saveProducts(products);

        document.getElementById('editingCategoryId').value = '';
        showToast('تم تحديث التصنيف');
    } else {
        if (IS_DEMO && categories.length >= DEMO_LIMITS.categories) {
            showDemoLimit('تصنيف', DEMO_LIMITS.categories);
            return;
        }
        if (categories.includes(name)) {
            showToast('التصنيف موجود مسبقاً', 'error');
            return;
        }
        categories.push(name);
        showToast('تمت إضافة التصنيف');
    }

    saveCategories(categories);
    input.value = '';
    fillAllDropdowns();
    loadCategoriesTable();
}

function editCategory(name) {
    document.getElementById('newCategoryInput').value = name;
    document.getElementById('editingCategoryId').value = name;
    document.getElementById('newCategoryInput').focus();
}

function deleteCategory(name) {
    const products = getProducts().filter(p => p.category === name);

    if (products.length > 0) {
        if (!confirm(`يوجد ${products.length} منتج في هذا التصنيف. سيتم حذف التصنيف فقط. متابعة؟`)) return;
    } else {
        if (!confirm('حذف هذا التصنيف؟')) return;
    }

    saveCategories(getCategories().filter(c => c !== name));
    fillAllDropdowns();
    loadCategoriesTable();
    showToast('تم حذف التصنيف');
}

/* --- ألوان --- */
function loadColorsTable() {
    const tbody = document.getElementById('colorsTableBody');
    const colors = getColors();
    const products = getProducts();

    if (colors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty">لا توجد ألوان</td></tr>';
        return;
    }

    tbody.innerHTML = colors.map(col => {
        const count = products.filter(p => p.color === col).length;
        return `
            <tr>
                <td><strong>${escapeHtml(col)}</strong></td>
                <td><span class="badge primary">${count} منتج</span></td>
                <td>
                    <button class="btn-icon" onclick="editColor(${jsArg(col)})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon danger" onclick="deleteColor(${jsArg(col)})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function saveColor() {
    const input = document.getElementById('newColorInput');
    const name = input.value.trim();
    const editId = document.getElementById('editingColorId').value;

    if (!name) {
        showToast('أدخل اسم اللون', 'error');
        return;
    }

    const colors = getColors();

    if (editId) {
        const index = colors.indexOf(editId);
        if (index !== -1) colors[index] = name;

        const products = getProducts();
        products.forEach(p => {
            if (p.color === editId) p.color = name;
        });
        saveProducts(products);

        document.getElementById('editingColorId').value = '';
        showToast('تم تحديث اللون');
    } else {
        if (colors.includes(name)) {
            showToast('اللون موجود مسبقاً', 'error');
            return;
        }
        colors.push(name);
        showToast('تمت إضافة اللون');
    }

    saveColors(colors);
    input.value = '';
    fillAllDropdowns();
    loadColorsTable();
}

function editColor(name) {
    document.getElementById('newColorInput').value = name;
    document.getElementById('editingColorId').value = name;
    document.getElementById('newColorInput').focus();
}

function deleteColor(name) {
    const products = getProducts().filter(p => p.color === name);

    if (products.length > 0) {
        if (!confirm(`يوجد ${products.length} منتج بهذا اللون. سيتم حذف اللون فقط. متابعة؟`)) return;
    } else {
        if (!confirm('حذف هذا اللون؟')) return;
    }

    saveColors(getColors().filter(c => c !== name));
    fillAllDropdowns();
    loadColorsTable();
    showToast('تم حذف اللون');
}

/* --- مقاسات --- */
function loadSizesTable() {
    const tbody = document.getElementById('sizesTableBody');
    const sizes = getSizes();
    const products = getProducts();

    if (sizes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty">لا توجد مقاسات</td></tr>';
        return;
    }

    tbody.innerHTML = sizes.map(sz => {
        const count = products.filter(p => p.size === sz).length;
        return `
            <tr>
                <td><strong>${escapeHtml(sz)}</strong></td>
                <td><span class="badge primary">${count} منتج</span></td>
                <td>
                    <button class="btn-icon" onclick="editSize(${jsArg(sz)})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon danger" onclick="deleteSize(${jsArg(sz)})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function saveSize() {
    const input = document.getElementById('newSizeInput');
    const name = input.value.trim();
    const editId = document.getElementById('editingSizeId').value;

    if (!name) {
        showToast('أدخل اسم المقاس', 'error');
        return;
    }

    const sizes = getSizes();

    if (editId) {
        const index = sizes.indexOf(editId);
        if (index !== -1) sizes[index] = name;

        const products = getProducts();
        products.forEach(p => {
            if (p.size === editId) p.size = name;
        });
        saveProducts(products);

        document.getElementById('editingSizeId').value = '';
        showToast('تم تحديث المقاس');
    } else {
        if (sizes.includes(name)) {
            showToast('المقاس موجود مسبقاً', 'error');
            return;
        }
        sizes.push(name);
        showToast('تمت إضافة المقاس');
    }

    saveSizes(sizes);
    input.value = '';
    fillAllDropdowns();
    loadSizesTable();
}

function editSize(name) {
    document.getElementById('newSizeInput').value = name;
    document.getElementById('editingSizeId').value = name;
    document.getElementById('newSizeInput').focus();
}

function deleteSize(name) {
    const products = getProducts().filter(p => p.size === name);

    if (products.length > 0) {
        if (!confirm(`يوجد ${products.length} منتج بهذا المقاس. سيتم حذف المقاس فقط. متابعة؟`)) return;
    } else {
        if (!confirm('حذف هذا المقاس؟')) return;
    }

    saveSizes(getSizes().filter(c => c !== name));
    fillAllDropdowns();
    loadSizesTable();
    showToast('تم حذف المقاس');
}

/* ============================================
   10. نقطة البيع (POS)
   ============================================ */
let cart = [];
let selectedPaymentMethod = 'cash';
let paymentScreenshotData = null;

function loadPosProducts(filter = '') {
    const grid = document.getElementById('posProductsGrid');
    let products = getProducts();

    if (filter) {
        const q = filter.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.code || '').toLowerCase().includes(q)
        );
    }

    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--gray);">لا توجد منتجات</div>';
        return;
    }

    grid.innerHTML = products.map(p => {
        const qty = getProductQuantity(p.id);
        const isOut = qty <= 0;

        return `
            <div class="product-card ${isOut ? 'disabled' : ''}" onclick="${isOut ? '' : `addToCart(${p.id})`}">
                <div class="product-img">
                    ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:cover;">` : '<i class="fas fa-tshirt"></i>'}
                </div>
                <h6>${escapeHtml(p.name)}</h6>
                <span class="code">${escapeHtml(p.size || '-')} ${escapeHtml(p.color ? '• ' + p.color : '')}</span>
                <div class="price">₪${Number(p.price).toFixed(2)}</div>
                <div class="stock ${isOut ? 'out' : (qty <= LOW_STOCK ? 'low' : '')}">
                    ${isOut ? 'نفد' : 'متوفر: ' + qty}
                </div>
            </div>
        `;
    }).join('');
}

function filterPosProducts() {
    const q = document.getElementById('posSearch').value.trim();
    loadPosProducts(q);
}

function addToCart(productId) {
    const p = getProductById(productId);
    if (!p) return;

    const qty = getProductQuantity(productId);
    const avgCost = getProductAvgCost(productId);

    if (qty <= 0) {
        showToast('المنتج نفد', 'error');
        return;
    }

    const existing = cart.find(i => i.product_id === productId);

    if (existing) {
        if (existing.quantity >= qty) {
            showToast('الكمية المتوفرة غير كافية', 'error');
            return;
        }
        existing.quantity++;
        existing.subtotal = existing.sold_price * existing.quantity;
    } else {
        cart.push({
            product_id: productId,
            name: p.name,
            size: p.size,
            color: p.color,
            base_price: Number(p.price),
            sold_price: Number(p.price),
            cost_at_sale: Number(avgCost.toFixed(2)),
            quantity: 1,
            subtotal: Number(p.price),
        });
    }

    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.product_id !== productId);
    renderCart();
}

function updateCartQty(productId, delta) {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    const qty = getProductQuantity(productId);
    const newQty = item.quantity + delta;

    if (newQty > qty) {
        showToast('الكمية المتوفرة غير كافية', 'error');
        return;
    }
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }

    item.quantity = newQty;
    item.subtotal = item.sold_price * newQty;
    renderCart();
}

function updateCartPrice(productId, newPrice) {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
        showToast('سعر غير صحيح', 'error');
        return;
    }

    item.sold_price = price;
    item.subtotal = price * item.quantity;
    renderCart();
}

/* ============================================
   مساعدات ألوان ومقاسات السلة في الكاشير
   ============================================ */
function getColorHex(color) {
    if (!color) return '#64748b';
    const c = String(color).trim().toLowerCase();
    const map = {
        'أبيض': '#f8fafc',
        'ابيض': '#f8fafc',
        'white': '#f8fafc',
        'أسود': '#1e293b',
        'اسود': '#1e293b',
        'black': '#1e293b',
        'أحمر': '#ef4444',
        'احمر': '#ef4444',
        'red': '#ef4444',
        'أزرق': '#3b82f6',
        'ازرق': '#3b82f6',
        'blue': '#3b82f6',
        'وردي': '#ec4899',
        'زهري': '#ec4899',
        'pink': '#ec4899',
        'رمادي': '#94a3b8',
        'رصاصي': '#94a3b8',
        'gray': '#94a3b8',
        'grey': '#94a3b8',
        'أخضر': '#10b981',
        'اخضر': '#10b981',
        'green': '#10b981',
        'أصفر': '#f59e0b',
        'اصفر': '#f59e0b',
        'yellow': '#f59e0b',
        'برتقالي': '#f97316',
        'orange': '#f97316',
        'كحلي': '#1e3a8a',
        'navy': '#1e3a8a',
        'بني': '#78350f',
        'brown': '#78350f',
        'بيج': '#d7c4a3',
        'beige': '#d7c4a3',
        'بنفسجي': '#8b5cf6',
        'موف': '#8b5cf6',
        'purple': '#8b5cf6',
        'خمري': '#881337',
        'عنابي': '#881337',
        'maroon': '#881337',
        'سماوي': '#38bdf8',
        'cyan': '#38bdf8',
        'زيتي': '#4d7c0f',
        'olive': '#4d7c0f',
        'ذهبي': '#eab308',
        'gold': '#eab308',
        'فضي': '#cbd5e1',
        'silver': '#cbd5e1',
        'جينز': '#2563eb',
        'خردلي': '#d97706',
        'سكري': '#fef3c7',
        'أوف وايت': '#fdfbf7',
        'اوف وايت': '#fdfbf7',
        'مشجر': '#06b6d4',
        'كروهات': '#6366f1'
    };
    return map[c] || '#64748b';
}

function renderCartVariantChip(v, currentProductId, inColorGroup) {
    const vStock = typeof getProductQuantity === 'function' ? getProductQuantity(v.id) : 0;
    const isCurrent = (v.id === currentProductId);
    const isOut = vStock <= 0;
    const sizeLabel = v.size ? `مقاس ${v.size}` : 'عادي';
    const label = inColorGroup ? sizeLabel : `${v.color || 'عام'} - ${sizeLabel}`;
    const stockClass = isOut ? 'out' : (vStock <= 3 ? 'low' : 'ok');
    const stockText = isOut ? 'نفد (0)' : `${vStock} متوفر`;

    return `
        <div class="cart-variant-chip ${isCurrent ? 'current' : ''} ${isOut ? 'out' : ''} ${!isCurrent && !isOut ? 'clickable' : ''}"
             ${!isCurrent && !isOut ? `onclick="addToCart(${v.id})"` : ''}
             title="${escapeHtml(isCurrent ? 'الصنف المحدد حالياً بالسلة' : (isOut ? 'نفد من المخزون' : `اضغط لإضافة ${label} إلى السلة`))}">
            ${!inColorGroup && v.color ? `<span class="variant-dot" style="background:${getColorHex(v.color)};"></span>` : ''}
            <span class="chip-label">${escapeHtml(label)}</span>
            <span class="chip-qty ${stockClass}">${stockText}</span>
            ${isCurrent ? '<span class="chip-badge-current"><i class="fas fa-check"></i> الحالي</span>' : (!isOut ? '<span class="chip-badge-add"><i class="fas fa-plus"></i></span>' : '')}
        </div>
    `;
}

function renderCartVariantsBox(item) {
    const allProducts = typeof getProducts === 'function' ? getProducts() : [];
    const prod = typeof getProductById === 'function' ? getProductById(item.product_id) : null;
    const targetName = (item.name || (prod && prod.name) || '').trim().toLowerCase();

    if (!targetName) return '';

    const variants = allProducts.filter(p => (p.name || '').trim().toLowerCase() === targetName);
    if (variants.length === 0) return '';

    // تجميع الخيارات حسب اللون
    const colorGroups = {};
    variants.forEach(v => {
        const c = (v.color || '').trim() || 'عام';
        if (!colorGroups[c]) colorGroups[c] = [];
        colorGroups[c].push(v);
    });

    const totalStock = variants.reduce((sum, v) => sum + Math.max(0, typeof getProductQuantity === 'function' ? getProductQuantity(v.id) : 0), 0);
    const colorKeys = Object.keys(colorGroups);

    let bodyHtml = '';

    if (colorKeys.length === 1 && colorKeys[0] === 'عام') {
        bodyHtml = `
            <div class="cart-variants-chips">
                ${variants.map(v => renderCartVariantChip(v, item.product_id, false)).join('')}
            </div>
        `;
    } else {
        bodyHtml = colorKeys.map(color => {
            const groupVars = colorGroups[color];
            const groupTotal = groupVars.reduce((sum, v) => sum + Math.max(0, typeof getProductQuantity === 'function' ? getProductQuantity(v.id) : 0), 0);
            const hex = getColorHex(color);

            return `
                <div class="cart-color-group">
                    <div class="cart-color-title">
                        <span class="variant-dot" style="background:${hex};"></span>
                        <span class="cart-color-name">${escapeHtml(color)}</span>
                        <span class="cart-color-qty">(${groupTotal} متوفر)</span>
                    </div>
                    <div class="cart-variants-chips">
                        ${groupVars.map(v => renderCartVariantChip(v, item.product_id, true)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    return `
        <div class="cart-variants-box">
            <div class="cart-variants-header" onclick="this.closest('.cart-variants-box').classList.toggle('collapsed')">
                <span class="cart-variants-title">
                    <i class="fas fa-boxes text-primary"></i> المتوفر لكل لون ومقاس (${variants.length} خيارات):
                </span>
                <span class="cart-variants-total">
                    إجمالي: <strong>${totalStock} قطعة</strong>
                    <i class="fas fa-chevron-down chevron-icon"></i>
                </span>
            </div>
            <div class="cart-variants-body">
                ${bodyHtml}
            </div>
        </div>
    `;
}

function renderCart() {
    const container = document.getElementById('cartItems');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>السلة فارغة</p>
            </div>
        `;
        updateCartTotals();
        return;
    }

    container.innerHTML = cart.map(item => {
        const isModified = item.sold_price !== item.base_price;
        const variantsHtml = renderCartVariantsBox(item);

        return `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-title-wrap">
                        <span class="cart-item-name">${escapeHtml(item.name)}</span>
                        <div class="cart-item-tags">
                            ${item.color ? `<span class="cart-item-badge color-badge"><span class="variant-dot" style="background:${getColorHex(item.color)};"></span>${escapeHtml(item.color)}</span>` : ''}
                            ${item.size ? `<span class="cart-item-badge size-badge">مقاس ${escapeHtml(item.size)}</span>` : ''}
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.product_id})" title="حذف من السلة">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cart-item-body">
                    <div class="cart-item-price">
                        <label>₪</label>
                        <input type="number" step="0.5" value="${item.sold_price}"
                               class="${isModified ? 'modified' : ''}"
                               onchange="updateCartPrice(${item.product_id}, this.value)">
                    </div>
                    <div class="cart-item-qty">
                        <button onclick="updateCartQty(${item.product_id}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQty(${item.product_id}, 1)">+</button>
                    </div>
                    <div class="cart-item-subtotal">₪${item.subtotal.toFixed(2)}</div>
                </div>
                ${variantsHtml}
            </div>
        `;
    }).join('');

    updateCartTotals();
}

window.getColorHex = getColorHex;
window.renderCartVariantChip = renderCartVariantChip;
window.renderCartVariantsBox = renderCartVariantsBox;
window.renderCart = renderCart;

function updateCartTotals() {
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const discount = parseFloat(document.getElementById('cartDiscount')?.value) || 0;
    const total = Math.max(0, subtotal - discount);

    if (document.getElementById('cartSubtotal')) {
        document.getElementById('cartSubtotal').textContent = '₪' + subtotal.toFixed(2);
    }
    if (document.getElementById('cartTotal')) {
        document.getElementById('cartTotal').textContent = '₪' + total.toFixed(2);
    }

    if (typeof updatePosPaymentBreakdown === 'function') {
        updatePosPaymentBreakdown();
    }
}

function clearCart() {
    if (cart.length === 0) return;
    if (!confirm('تفريغ السلة؟')) return;
    cart = [];
    renderCart();
    selectPaymentMethod('cash');
}

/* ============================================
   11. طرق الدفع
   ============================================ */

/* ============================================
   حسابات المتجر البنكية والمحافظ للدفع الإلكتروني
   ============================================ */
const STORE_PAYMENT_ACCOUNTS = {
    'PalPay': {
        name: 'محفظة PalPay',
        type: 'محفظة إلكترونية',
        label: 'رقم المحفظة / الهاتف:',
        accountNo: '0599-887766',
        iban: '',
        title: 'متجر الأناقة للملابس'
    },
    'Jawwal Pay': {
        name: 'جوال باي (Jawwal Pay)',
        type: 'محفظة إلكترونية',
        label: 'رقم المحفظة:',
        accountNo: '0599-887766',
        iban: '',
        title: 'متجر الأناقة للملابس'
    },
    'بنك فلسطين': {
        name: 'بنك فلسطين',
        type: 'حساب بنكي',
        label: 'رقم الحساب / الفرع:',
        accountNo: '1234567 (فرع 450)',
        iban: 'PS04 PALS 0000 0000 0001 2345 67',
        title: 'متجر الأناقة للملابس'
    },
    'البنك الإسلامي الفلسطيني': {
        name: 'البنك الإسلامي الفلسطيني',
        type: 'حساب بنكي',
        label: 'رقم الحساب / الفرع:',
        accountNo: '2345678 (فرع 210)',
        iban: 'PS50 ISBK 0000 0000 0002 3456 78',
        title: 'متجر الأناقة للملابس'
    },
    'البنك العربي': {
        name: 'البنك العربي',
        type: 'حساب بنكي',
        label: 'رقم الحساب:',
        accountNo: '3456789',
        iban: 'PS30 ARAB 0000 0000 0003 4567 89',
        title: 'متجر الأناقة للملابس'
    },
    'Zain Cash': {
        name: 'زين كاش (Zain Cash)',
        type: 'محفظة إلكترونية',
        label: 'رقم المحفظة:',
        accountNo: '0799-887766',
        iban: '',
        title: 'متجر الأناقة للملابس'
    },
    'PayPal': {
        name: 'PayPal',
        type: 'حساب باي بال',
        label: 'البريد الإلكتروني:',
        accountNo: 'payments@el-anaqa-store.com',
        iban: '',
        title: 'متجر الأناقة للملابس'
    },
    'أخرى': {
        name: 'حساب آخر',
        type: 'حساب دفع',
        label: 'رقم الحساب:',
        accountNo: '0599-887766',
        iban: '',
        title: 'متجر الأناقة للملابس'
    }
};

function updateStoreAccountDisplay() {
    const sel = document.getElementById('appName');
    const card = document.getElementById('storeAccountInfoCard');
    if (!sel || !card) return;

    const val = sel.value;
    const info = STORE_PAYMENT_ACCOUNTS[val] || STORE_PAYMENT_ACCOUNTS['PalPay'];

    const typeBadge = document.getElementById('storeAccTypeBadge');
    const titleEl = document.getElementById('storeAccTitle');
    const labelEl = document.getElementById('storeAccLabel');
    const noEl = document.getElementById('storeAccNo');
    const ibanRow = document.getElementById('storeAccIbanRow');
    const ibanEl = document.getElementById('storeAccIban');

    if (typeBadge) typeBadge.textContent = info.type;
    if (titleEl) titleEl.textContent = info.title;
    if (labelEl) labelEl.textContent = info.label;
    if (noEl) noEl.textContent = info.accountNo;

    if (ibanRow && ibanEl) {
        if (info.iban) {
            ibanRow.style.display = 'block';
            ibanEl.textContent = info.iban;
        } else {
            ibanRow.style.display = 'none';
        }
    }
}

function copyStoreAccNo() {
    const text = document.getElementById('storeAccNo')?.textContent || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast('تم نسخ رقم الحساب بنجاح! 📋');
    }).catch(() => {
        showToast('تعذر النسخ التلقائي', 'info');
    });
}

function copyStoreIban() {
    const text = document.getElementById('storeAccIban')?.textContent || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast('تم نسخ رقم الآيبان بنجاح! 📋');
    }).catch(() => {
        showToast('تعذر النسخ التلقائي', 'info');
    });
}

let posPaymentTender = 'cash'; // 'cash' | 'digital' | 'split'

function initPosCustomers() {
    const datalist = document.getElementById('posCustomerDatalist');
    if (!datalist) return;

    const customers = typeof getCustomers === 'function' ? getCustomers() : [];
    const debts = typeof getCustomerDebts === 'function' ? getCustomerDebts() : [];

    datalist.innerHTML = customers.map(c => {
        const custDebts = debts.filter(d => (d.customer_name || '').toLowerCase() === (c.name || '').toLowerCase());
        const invTotal = custDebts.filter(d => d.type === 'invoice').reduce((s, x) => s + Number(x.amount || 0), 0);
        const paidTotal = custDebts.filter(d => d.type === 'payment').reduce((s, x) => s + Number(x.amount || 0), 0);
        const balance = invTotal - paidTotal;
        const balLabel = balance > 0 ? ` (دين سابق: ₪${balance.toFixed(2)})` : '';
        return `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} - ${escapeHtml(c.phone || 'بدون هاتف')}${balLabel}</option>`;
    }).join('');
}
window.initPosCustomers = initPosCustomers;

function onPosCustomerInputChange() {
    const input = document.getElementById('customerName');
    if (!input) return;

    let val = input.value.trim();
    if (val.includes(' - ')) {
        val = val.split(' - ')[0].trim();
        input.value = val;
    }

    const card = document.getElementById('posCustomerDetailCard');
    const nameEl = document.getElementById('posCustCardName');
    const phoneEl = document.getElementById('posCustCardPhone');
    const badgeEl = document.getElementById('posCustCardDebtBadge');
    const phoneInput = document.getElementById('posCustomerPhone');

    if (!val || val === 'عميل نقدي' || val === 'نقدي') {
        if (card) card.style.display = 'none';
        if (phoneInput) phoneInput.value = '';
        updatePosPaymentBreakdown();
        return;
    }

    const customers = typeof getCustomers === 'function' ? getCustomers() : [];
    const cust = customers.find(c => c.name.toLowerCase() === val.toLowerCase());

    const debts = typeof getCustomerDebts === 'function' ? getCustomerDebts() : [];
    const custDebts = debts.filter(d => (d.customer_name || '').toLowerCase() === val.toLowerCase());
    const invTotal = custDebts.filter(d => d.type === 'invoice').reduce((s, x) => s + Number(x.amount || 0), 0);
    const paidTotal = custDebts.filter(d => d.type === 'payment').reduce((s, x) => s + Number(x.amount || 0), 0);
    const balance = invTotal - paidTotal;

    if (phoneInput && cust) {
        phoneInput.value = cust.phone || '';
    }

    if (card && nameEl && phoneEl && badgeEl) {
        card.style.display = 'block';
        nameEl.textContent = val + (cust ? ' (عميل مسجل)' : ' (عميل جديد)');
        phoneEl.textContent = cust && cust.phone ? `📞 هاتف: ${cust.phone}${cust.note ? ' | ' + cust.note : ''}` : '📞 لم يتم تسجيل رقم هاتف (أدخل الهاتف عند البيع الآجل)';

        if (balance > 0) {
            badgeEl.className = 'badge danger';
            badgeEl.textContent = `دين سابق: ₪${balance.toFixed(2)}`;
        } else if (balance < 0) {
            badgeEl.className = 'badge info';
            badgeEl.textContent = `رصيد دائن: ₪${Math.abs(balance).toFixed(2)}`;
        } else {
            badgeEl.className = 'badge success';
            badgeEl.textContent = 'خالص (لا توجد ديون سابقة)';
        }
    }

    updatePosPaymentBreakdown();
}
window.onPosCustomerInputChange = onPosCustomerInputChange;

function setPosWalkinCustomer() {
    const input = document.getElementById('customerName');
    if (input) input.value = 'عميل نقدي';
    const card = document.getElementById('posCustomerDetailCard');
    if (card) card.style.display = 'none';
    const phoneInput = document.getElementById('posCustomerPhone');
    if (phoneInput) phoneInput.value = '';
    togglePosNewCustomerForm(false);
    updatePosPaymentBreakdown();
}
window.setPosWalkinCustomer = setPosWalkinCustomer;

function togglePosNewCustomerForm(show) {
    const box = document.getElementById('posNewCustomerFields');
    if (!box) return;
    const shouldShow = (typeof show === 'boolean') ? show : (box.style.display === 'none' || !box.style.display);
    box.style.display = shouldShow ? 'block' : 'none';
    if (shouldShow) {
        const nameInput = document.getElementById('newCustName');
        if (nameInput) nameInput.focus();
    }
}
window.togglePosNewCustomerForm = togglePosNewCustomerForm;

function saveNewPosCustomer() {
    const nameInput = document.getElementById('newCustName');
    const phoneInput = document.getElementById('newCustPhone');
    const noteInput = document.getElementById('newCustNote');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!name || name.length < 2) {
        showToast('يرجى إدخال اسم العميل بشكل صحيح', 'error');
        if (nameInput) nameInput.focus();
        return;
    }
    if (!phone || phone.length < 7) {
        showToast('يرجى إدخال رقم هاتف صحيح للعميل', 'error');
        if (phoneInput) phoneInput.focus();
        return;
    }

    const customers = typeof getCustomers === 'function' ? getCustomers() : [];
    let cust = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!cust) {
        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        cust = { id: newId, name, phone, note };
        customers.push(cust);
        if (typeof saveCustomers === 'function') saveCustomers(customers);
    } else {
        cust.phone = phone;
        if (note) cust.note = note;
        if (typeof saveCustomers === 'function') saveCustomers(customers);
    }

    const mainCustInput = document.getElementById('customerName');
    if (mainCustInput) mainCustInput.value = name;
    const posPhone = document.getElementById('posCustomerPhone');
    if (posPhone) posPhone.value = phone;

    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (noteInput) noteInput.value = '';
    togglePosNewCustomerForm(false);

    initPosCustomers();
    onPosCustomerInputChange();
    showToast(`✅ تم حفظ الزبون (${name}) واختياره بنجاح`);
}
window.saveNewPosCustomer = saveNewPosCustomer;

function getPosCartTotal() {
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const discount = parseFloat(document.getElementById('cartDiscount')?.value) || 0;
    return Math.max(0, subtotal - discount);
}
window.getPosCartTotal = getPosCartTotal;

function selectPosTender(tender) {
    posPaymentTender = tender;

    ['cash', 'digital', 'split'].forEach(t => {
        const btn = document.getElementById('tenderBtn-' + t);
        if (btn) {
            btn.classList.toggle('active', t === tender);
            if (t === tender) {
                btn.style.borderColor = 'var(--primary)';
                btn.style.background = '#eef2ff';
                btn.style.color = 'var(--primary)';
            } else {
                btn.style.borderColor = '#e2e8f0';
                btn.style.background = '#fff';
                btn.style.color = 'var(--gray)';
            }
        }
    });

    const cashPanel = document.getElementById('posTenderPanelCash');
    const digitalPanel = document.getElementById('posTenderPanelDigital');
    const splitPanel = document.getElementById('posTenderPanelSplit');

    if (cashPanel) cashPanel.style.display = (tender === 'cash') ? 'block' : 'none';
    if (digitalPanel) digitalPanel.style.display = (tender === 'digital') ? 'block' : 'none';
    if (splitPanel) splitPanel.style.display = (tender === 'split') ? 'block' : 'none';

    const total = getPosCartTotal();
    if (tender === 'cash') {
        const cIn = document.getElementById('posCashPaidAmount');
        if (cIn) cIn.value = total > 0 ? total.toFixed(2) : '';
    } else if (tender === 'digital') {
        const dIn = document.getElementById('posDigitalPaidAmount');
        if (dIn) dIn.value = total > 0 ? total.toFixed(2) : '';
        if (typeof updateStoreAccountDisplay === 'function') updateStoreAccountDisplay();
    } else if (tender === 'split') {
        splitPosAmounts5050();
    }

    updatePosPaymentBreakdown();
}
window.selectPosTender = selectPosTender;

function selectPaymentMethod(method) {
    if (method === 'cash') selectPosTender('cash');
    else if (method === 'app') selectPosTender('digital');
    else if (method === 'debt') {
        selectPosTender('cash');
        const cIn = document.getElementById('posCashPaidAmount');
        if (cIn) cIn.value = '0';
        updatePosPaymentBreakdown();
    }
}
window.selectPaymentMethod = selectPaymentMethod;

function setCashFullPaid() {
    const total = getPosCartTotal();
    const cIn = document.getElementById('posCashPaidAmount');
    if (cIn) cIn.value = total.toFixed(2);
    updatePosPaymentBreakdown();
}
window.setCashFullPaid = setCashFullPaid;

function setDigitalFullPaid() {
    const total = getPosCartTotal();
    const dIn = document.getElementById('posDigitalPaidAmount');
    if (dIn) dIn.value = total.toFixed(2);
    updatePosPaymentBreakdown();
}
window.setDigitalFullPaid = setDigitalFullPaid;

function splitPosAmounts5050() {
    const total = getPosCartTotal();
    const half = Math.round((total / 2) * 2) / 2;
    const remainder = +(total - half).toFixed(2);

    const sCash = document.getElementById('posSplitCashInput');
    const sDig = document.getElementById('posSplitDigitalInput');

    if (sCash) sCash.value = half.toFixed(2);
    if (sDig) sDig.value = remainder.toFixed(2);

    updatePosPaymentBreakdown();
}
window.splitPosAmounts5050 = splitPosAmounts5050;

function updatePosPaymentBreakdown() {
    const total = getPosCartTotal();
    let paidCash = 0;
    let paidDigital = 0;

    if (posPaymentTender === 'cash') {
        const raw = document.getElementById('posCashPaidAmount')?.value;
        paidCash = (raw === '' || raw === undefined) ? total : (parseFloat(raw) || 0);
        paidDigital = 0;
    } else if (posPaymentTender === 'digital') {
        const raw = document.getElementById('posDigitalPaidAmount')?.value;
        paidDigital = (raw === '' || raw === undefined) ? total : (parseFloat(raw) || 0);
        paidCash = 0;
    } else if (posPaymentTender === 'split') {
        paidCash = parseFloat(document.getElementById('posSplitCashInput')?.value) || 0;
        paidDigital = parseFloat(document.getElementById('posSplitDigitalInput')?.value) || 0;
    }

    const totalPaid = +(paidCash + paidDigital).toFixed(2);
    const debtRemaining = Math.max(0, +(total - totalPaid).toFixed(2));

    const sumTotalPaidEl = document.getElementById('posSumTotalPaid');
    if (sumTotalPaidEl) {
        if (posPaymentTender === 'split') {
            sumTotalPaidEl.innerHTML = `₪${totalPaid.toFixed(2)} <span style="font-size:0.75rem;color:#64748b;font-weight:normal;">(كاش: ₪${paidCash.toFixed(2)} + تحويل: ₪${paidDigital.toFixed(2)})</span>`;
        } else {
            sumTotalPaidEl.innerHTML = `₪${totalPaid.toFixed(2)}`;
        }
    }

    const badgeBox = document.getElementById('posDebtStatusBadgeBox');
    if (badgeBox) {
        if (total === 0 && cart.length === 0) {
            badgeBox.style.background = '#f8fafc';
            badgeBox.style.border = '1px solid #e2e8f0';
            badgeBox.style.color = '#64748b';
            badgeBox.innerHTML = '<span>السلة فارغة</span><span>₪0.00</span>';
        } else if (debtRemaining <= 0) {
            badgeBox.style.background = '#f0fdf4';
            badgeBox.style.border = '1px solid #bbf7d0';
            badgeBox.style.color = '#15803d';
            if (totalPaid > total) {
                const change = +(totalPaid - total).toFixed(2);
                badgeBox.innerHTML = `
                    <span><i class="fas fa-check-circle"></i> خالص بالكامل</span>
                    <span style="color:#047857;font-weight:800;">متبقي للزبون فكة: ₪${change.toFixed(2)}</span>
                `;
            } else {
                badgeBox.innerHTML = `
                    <span><i class="fas fa-check-circle"></i> حالة الدفع:</span>
                    <strong>مدفوع بالكامل (خالص)</strong>
                `;
            }
        } else {
            badgeBox.style.background = '#fef2f2';
            badgeBox.style.border = '1.5px solid #fecaca';
            badgeBox.style.color = '#991b1b';
            badgeBox.innerHTML = `
                <span><i class="fas fa-hand-holding-usd text-danger"></i> بيع آجل (دين متبقي على الزبون):</span>
                <strong style="color:#b91c1c;font-size:1.05rem;">₪${debtRemaining.toFixed(2)}</strong>
            `;
        }
    }

    return { total, paidCash, paidDigital, totalPaid, debtRemaining };
}
window.updatePosPaymentBreakdown = updatePosPaymentBreakdown;

function removeScreenshot() {
    paymentScreenshotData = null;
    const preview = document.getElementById('screenshotPreview');
    const input = document.getElementById('paymentScreenshot');
    if (preview) preview.style.display = 'none';
    if (input) input.value = '';
}
window.removeScreenshot = removeScreenshot;

document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'paymentScreenshot') {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            showToast('حجم الصورة كبير (الحد 3 ميجا)', 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
            paymentScreenshotData = evt.target.result;
            const previewImg = document.getElementById('previewImg');
            const previewBox = document.getElementById('screenshotPreview');
            if (previewImg) previewImg.src = paymentScreenshotData;
            if (previewBox) previewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

/* ============================================
   12. إتمام البيع (Checkout & Accounting Sync)
   ============================================ */
function checkout() {
    if (cart.length === 0) {
        showToast('السلة فارغة', 'error');
        return;
    }

    if (IS_DEMO && getSales().length >= DEMO_LIMITS.sales) {
        showDemoLimit('فاتورة بيع', DEMO_LIMITS.sales);
        return;
    }

    for (let item of cart) {
        if (getProductQuantity(item.product_id) < item.quantity) {
            showToast(`الكمية غير كافية: ${item.name}`, 'error');
            return;
        }
    }

    const { total, paidCash, paidDigital, totalPaid, debtRemaining } = updatePosPaymentBreakdown();

    let rawCustomer = (document.getElementById('customerName')?.value || '').trim();
    if (rawCustomer.includes(' - ')) {
        rawCustomer = rawCustomer.split(' - ')[0].trim();
    }
    let customerPhone = document.getElementById('posCustomerPhone')?.value.trim() || '';

    // التحقق الصارم في حالة وجود دين متبقي: يجب تحديد الزبون ورقم هاتفه
    if (debtRemaining > 0) {
        if (!rawCustomer || rawCustomer === 'عميل نقدي' || rawCustomer === 'نقدي' || rawCustomer.length < 2) {
            showToast('⚠️ البيع الآجل (الدين) يتطلب تحديد أو إنشاء اسم العميل!', 'error');
            const custInput = document.getElementById('customerName');
            if (custInput) custInput.focus();
            return;
        }
        if (!customerPhone || customerPhone.length < 6) {
            const newPhone = document.getElementById('newCustPhone')?.value.trim();
            if (newPhone) {
                customerPhone = newPhone;
                if (document.getElementById('posCustomerPhone')) {
                    document.getElementById('posCustomerPhone').value = newPhone;
                }
            } else {
                showToast('⚠️ البيع الآجل يتطلب إدخال رقم هاتف العميل للتواصل ومتابعة الدين', 'error');
                togglePosNewCustomerForm(true);
                return;
            }
        }
    }

    let appName = null;
    let senderName = null;
    let senderPhone = null;
    let transferRef = null;

    if (posPaymentTender === 'digital') {
        appName = document.getElementById('appName')?.value || 'محفظة إلكترونية';
        senderName = document.getElementById('senderName')?.value.trim() || null;
        senderPhone = document.getElementById('senderPhone')?.value.trim() || null;
        transferRef = document.getElementById('transferRef')?.value.trim() || null;
    } else if (posPaymentTender === 'split' && paidDigital > 0) {
        appName = document.getElementById('splitAppName')?.value || 'محفظة إلكترونية';
    }

    const user = getCurrentUser();
    const finalCustomer = rawCustomer || 'عميل نقدي';
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const discount = parseFloat(document.getElementById('cartDiscount')?.value) || 0;

    const sale = {
        id: Math.floor(Math.random() * 90000) + 10000,
        customer: finalCustomer,
        customer_phone: customerPhone || null,
        items: cart.map(i => ({ ...i })),
        subtotal,
        discount,
        total,
        payment: {
            billing_status: debtRemaining > 0 ? (totalPaid > 0 ? 'partial_debt' : 'full_debt') : 'paid',
            tender: posPaymentTender,
            method: posPaymentTender === 'cash' ? 'cash' : (posPaymentTender === 'digital' ? 'app' : 'split'),
            paid_cash: Number(paidCash),
            paid_digital: Number(paidDigital),
            total_paid: Number(totalPaid),
            debt_remaining: Number(debtRemaining),
            app_name: appName,
            sender_name: senderName,
            sender_phone: senderPhone,
            transfer_ref: transferRef,
            screenshot: paymentScreenshotData || null
        },
        cashier_id: user.id,
        cashier_name: user.name,
        status: 'completed',
        voided_reason: null,
        voided_by: null,
        voided_at: null,
        created_at: new Date().toISOString(),
    };

    const sales = getSales();
    sales.push(sale);
    saveSales(sales);

    if (debtRemaining > 0) {
        const debts = getCustomerDebts();
        let newId = debts.length > 0 ? Math.max(...debts.map(d => d.id)) : 0;

        // 1. تسجيل قيد الفاتورة الأصلية (استحقاق كامل المبلغ)
        newId++;
        debts.push({
            id: newId,
            customer_name: finalCustomer,
            customer_phone: customerPhone || '',
            type: 'invoice',
            amount: total,
            sale_id: sale.id,
            note: `فاتورة بيع آجل #${sale.id}`,
            created_at: new Date().toISOString(),
        });

        // 2. تسجيل قيد الدفعة الفورية إذا كان العميل دفع جزءاً (نقد أو تحويل)
        if (totalPaid > 0) {
            newId++;
            const tenderDesc = posPaymentTender === 'split' ? `مقسم: كاش ₪${paidCash} + تحويل ₪${paidDigital}` : (posPaymentTender === 'digital' ? 'تحويل بنكي/محفظة' : 'نقداً');
            debts.push({
                id: newId,
                customer_name: finalCustomer,
                customer_phone: customerPhone || '',
                type: 'payment',
                amount: totalPaid,
                sale_id: sale.id,
                note: `دفعة أولى فورية لفاتورة #${sale.id} (${tenderDesc})`,
                created_at: new Date().toISOString(),
            });
        }

        saveCustomerDebts(debts);

        if (typeof getCustomers === 'function' && typeof saveCustomers === 'function') {
            const customers = getCustomers();
            if (!customers.some(c => c.name.toLowerCase() === finalCustomer.toLowerCase())) {
                const maxCId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) : 0;
                customers.push({
                    id: maxCId + 1,
                    name: finalCustomer,
                    phone: customerPhone || '',
                    note: 'تمت إضافته من الكاشير'
                });
                saveCustomers(customers);
            }
        }

        if (document.getElementById('debtsTableBody') && typeof loadDebtsTable === 'function') {
            loadDebtsTable();
        }
    }

    if (typeof loadCashboxData === 'function') {
        loadCashboxData();
    }

    printInvoice(sale);

    cart = [];
    if (document.getElementById('cartDiscount')) document.getElementById('cartDiscount').value = 0;
    if (document.getElementById('customerName')) document.getElementById('customerName').value = '';
    if (document.getElementById('posCustomerPhone')) document.getElementById('posCustomerPhone').value = '';
    if (document.getElementById('posCustomerDetailCard')) document.getElementById('posCustomerDetailCard').style.display = 'none';
    if (document.getElementById('senderName')) document.getElementById('senderName').value = '';
    if (document.getElementById('senderPhone')) document.getElementById('senderPhone').value = '';
    if (document.getElementById('transferRef')) document.getElementById('transferRef').value = '';
    if (document.getElementById('paymentScreenshot')) document.getElementById('paymentScreenshot').value = '';
    removeScreenshot();
    selectPosTender('cash');
    renderCart();
    loadPosProducts();
    initPosCustomers();

    if (debtRemaining > 0) {
        showToast(`✅ تم البيع بنجاح! تم تسجيل دفعة ₪${totalPaid.toFixed(2)} ودين متبقي ₪${debtRemaining.toFixed(2)} على العميل (${finalCustomer})`);
    } else {
        showToast(`✅ تم البيع بنجاح! الإجمالي: ₪${total.toFixed(2)}`);
    }
}

/* ============================================
   13. طباعة الفاتورة
   ============================================ */
function printInvoice(sale) {
    const itemsHTML = sale.items.map(item => `
        <tr>
            <td>${escapeHtml(item.name)} (${escapeHtml(item.size || '-')})</td>
            <td>${item.quantity}</td>
            <td>₪${item.sold_price.toFixed(2)}</td>
            <td>₪${item.subtotal.toFixed(2)}</td>
        </tr>
    `).join('');

    let paymentInfo = '';
    const p = sale.payment || {};
    if (p.tender === 'split') {
        paymentInfo = `<div style="text-align:center;font-size:12px;margin:10px 0;padding:8px;background:#f5f3ff;border-radius:6px;border:1px solid #ddd6fe;"><strong>طريقة الدفع: مقسم (نقد + تحويل)</strong><br>كاش: ₪${(p.paid_cash||0).toFixed(2)} | تحويل (${escapeHtml(p.app_name || 'محفظة')}): ₪${(p.paid_digital||0).toFixed(2)}${p.debt_remaining > 0 ? `<br><strong style="color:#b91c1c;">المتبقي دين: ₪${p.debt_remaining.toFixed(2)}</strong>` : ''}</div>`;
    } else if (p.tender === 'digital' || p.method === 'app') {
        paymentInfo = `<div style="text-align:center;font-size:12px;margin:10px 0;padding:8px;background:#fffbeb;border-radius:6px;border:1px solid #fef3c7;"><strong>طريقة الدفع: ${escapeHtml(p.app_name || 'تحويل إلكتروني')}</strong>${p.sender_name ? `<br>المرسل: ${escapeHtml(p.sender_name)}` : ''}${p.sender_phone ? `<br>الهاتف: ${escapeHtml(p.sender_phone)}` : ''}${p.debt_remaining > 0 ? `<br><strong style="color:#b91c1c;">المتبقي دين: ₪${p.debt_remaining.toFixed(2)}</strong>` : ''}</div>`;
    } else if (p.debt_remaining > 0) {
        paymentInfo = `<div style="text-align:center;font-size:12px;margin:10px 0;padding:8px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca;"><strong>فاتورة بيع آجل (دين)</strong><br>المدفوع فوراً: ₪${(p.paid_cash || p.total_paid || 0).toFixed(2)}<br><strong style="color:#b91c1c;">المتبقي ذمة على العميل: ₪${p.debt_remaining.toFixed(2)}</strong></div>`;
    }

    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة #${escapeHtml(sale.id)}</title>
            <style>
                body{font-family:'Cairo',sans-serif;padding:20px;max-width:350px;margin:0 auto}
                h2{text-align:center;margin:0 0 5px}
                .center{text-align:center;color:#666;font-size:12px;margin-bottom:15px}
                table{width:100%;border-collapse:collapse;font-size:12px;margin:15px 0}
                th{background:#f0f0f0;padding:8px;text-align:right}
                td{padding:8px;border-bottom:1px solid #eee}
                .total{font-size:18px;font-weight:bold;text-align:left;margin-top:15px;padding-top:15px;border-top:2px solid #000}
                .footer{text-align:center;margin-top:20px;font-size:11px;color:#999}
            </style>
        </head>
        <body>
            <h2>متجر الأناقة</h2>
            <div class="center">
                فاتورة #${escapeHtml(sale.id)}<br>
                ${new Date(sale.created_at).toLocaleString('ar-EG')}<br>
                الكاشير: ${escapeHtml(sale.cashier_name)}<br>
                العميل: ${escapeHtml(sale.customer)}
            </div>
            ${paymentInfo}
            <table>
                <thead>
                    <tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
            </table>
            <div style="text-align:left;font-size:13px;padding-top:10px;border-top:1px dashed #ccc;">
                المجموع: ₪${sale.subtotal.toFixed(2)}<br>
                ${sale.discount > 0 ? `الخصم: -₪${sale.discount.toFixed(2)}<br>` : ''}
            </div>
            <div class="total">الإجمالي: ₪${sale.total.toFixed(2)}</div>
            <div class="footer">شكراً لزيارتكم! 🛍️</div>
        </body>
        </html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

function printInvoiceById(id) {
    const sale = getSales().find(s => s.id === id);
    if (sale) printInvoice(sale);
}

/* ============================================
   14. سجل المبيعات
   ============================================ */
function loadSalesHistory() {
    const tbody = document.getElementById('salesHistoryTable');
    const filterDate = document.getElementById('filterSalesDate')?.value;
    let sales = getSales().slice().reverse();

    if (filterDate) {
        sales = sales.filter(s => new Date(s.created_at).toISOString().split('T')[0] === filterDate);
    }

    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">لا توجد مبيعات</td></tr>';
        return;
    }

    const user = getCurrentUser();
    const isOwner = user.role === 'owner';

    tbody.innerHTML = sales.map(s => {
        const isVoided = s.status === 'voided';
        const itemsSummary = s.items.map(i => `${i.name} (${i.size || '-'}) ×${i.quantity}`).join('، ');
        const hasPriceChange = s.items.some(i => i.sold_price !== i.base_price);
        const p = s.payment || {};
        const isAppPayment = (p.tender === 'digital' || p.method === 'app');
        const isSplitPayment = (p.tender === 'split');
        const hasDebt = (p.debt_remaining > 0 || p.method === 'debt');

        let paymentIcon = '<i class="fas fa-money-bill-wave" style="color:var(--success);"></i> كاش';
        if (isSplitPayment) {
            paymentIcon = '<span class="badge" style="background:#f5f3ff;color:#6d28d9;font-size:0.7rem;"><i class="fas fa-layer-group"></i> مقسم</span>';
        } else if (isAppPayment) {
            paymentIcon = `<span class="badge warning" style="font-size:0.7rem;"><i class="fas fa-mobile-alt"></i> ${escapeHtml(p.app_name || 'تطبيق')}</span>`;
        }
        if (hasDebt) {
            const debtAmt = p.debt_remaining !== undefined ? p.debt_remaining : (s.total - (p.paid_upfront || 0));
            paymentIcon += ` <span class="badge danger" style="font-size:0.65rem;">دين: ₪${debtAmt.toFixed(2)}</span>`;
        }

        return `
            <tr style="${isVoided ? 'opacity:0.55;background:#fef2f2;' : ''}">
                <td>
                    <strong>#${escapeHtml(s.id)}</strong>
                    ${isVoided ? '<br><span class="badge danger" style="font-size:0.65rem;">ملغاة</span>' : ''}
                </td>
                <td style="font-size:.8rem;">${new Date(s.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>${escapeHtml(s.customer)}</td>
                <td style="font-size:0.8rem;"><strong><i class="fas fa-user-tie"></i> ${escapeHtml(s.cashier_name || '-')}</strong></td>
                <td style="font-size:.8rem;color:var(--gray);max-width:230px;">
                    ${escapeHtml(itemsSummary)}
                    ${hasPriceChange ? '<br><span style="color:var(--warning);font-weight:700;font-size:.72rem;"><i class="fas fa-tag"></i> تعديل أسعار</span>' : ''}
                    ${isVoided ? `<br><span style="color:var(--danger);font-size:0.7rem;"><i class="fas fa-ban"></i> السبب: ${escapeHtml(s.voided_reason)}</span>` : ''}
                </td>
                <td>
                    <strong style="color:${isVoided ? 'var(--gray)' : 'var(--success)'};${isVoided ? 'text-decoration:line-through;' : ''}">₪${Number(s.total).toFixed(2)}</strong>
                    <br><small style="font-size:0.7rem;">${paymentIcon}</small>
                </td>
                <td>
                    ${isAppPayment ? `
                        <button class="btn-icon warning" onclick="viewPaymentDetails(${s.id})" title="بيانات الدفع">
                            <i class="fas fa-receipt"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="printInvoiceById(${s.id})" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                    ${!isVoided ? `
                        <button class="btn-icon warning" onclick="voidSale(${s.id})" title="إلغاء">
                            <i class="fas fa-ban"></i>
                        </button>
                    ` : ''}
                    ${isOwner ? `
                        <button class="btn-icon danger" onclick="deleteSale(${s.id})" title="حذف (للمالك)">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

/* ============================================
   15. إلغاء الفاتورة (Void)
   ============================================ */
function voidSale(id) {
    const sale = getSales().find(s => s.id === id);
    if (!sale) return;

    if (sale.status === 'voided') {
        showToast('الفاتورة ملغاة مسبقاً', 'warning');
        return;
    }

    const reason = prompt(
        `⚠️ إلغاء الفاتورة #${sale.id}\n\n` +
        `المبلغ: ₪${sale.total.toFixed(2)}\n` +
        `العميل: ${sale.customer}\n\n` +
        `يرجى إدخال سبب الإلغاء (إجباري):`,
        'إرجاع العميل للبضاعة'
    );

    if (!reason || reason.trim().length < 3) {
        showToast('يجب إدخال سبب الإلغاء', 'error');
        return;
    }

    const managerPin = prompt('🔐 أدخل رمز المدير للموافقة (افتراضي: 1234):', '1234');
    if (managerPin !== '1234') {
        showToast('رمز الموافقة غير صحيح', 'error');
        return;
    }

    const sales = getSales();
    const index = sales.findIndex(s => s.id === id);
    if (index !== -1) {
        sales[index] = {
            ...sales[index],
            status: 'voided',
            voided_reason: reason.trim(),
            voided_by: getCurrentUser().id,
            voided_by_name: getCurrentUser().name,
            voided_at: new Date().toISOString(),
        };
        saveSales(sales);
    }

    if (sale.payment && sale.payment.method === 'debt') {
        const debts = getCustomerDebts().filter(d => d.sale_id !== id);
        saveCustomerDebts(debts);
    }

    showToast(`✅ تم إلغاء الفاتورة #${sale.id}`);

    loadSalesHistory();
    loadInventoryTable();
    loadPosProducts();
    loadDashboard();
    loadReports();
    loadDebtsTable();
}

/* ============================================
   16. حذف نهائي (للمالك فقط)
   ============================================ */
function deleteSale(id) {
    const user = getCurrentUser();
    if (user.role !== 'owner') {
        showToast('⚠️ الحذف النهائي للمالك فقط', 'error');
        return;
    }

    const sale = getSales().find(s => s.id === id);
    if (!sale) return;

    if (!confirm(`🚨 حذف نهائي للفاتورة #${sale.id}\n\nالمبلغ: ₪${sale.total.toFixed(2)}\n\n⚠️ لا يمكن التراجع!`)) return;

    const auditLog = getAuditLog();
    auditLog.push({
        id: auditLog.length + 1,
        action: 'delete_sale',
        sale_id: sale.id,
        sale_total: sale.total,
        deleted_by: user.id,
        deleted_by_name: user.name,
        deleted_at: new Date().toISOString(),
    });
    saveAuditLog(auditLog);

    if (sale.payment && sale.payment.method === 'debt') {
        const debts = getCustomerDebts().filter(d => d.sale_id !== id);
        saveCustomerDebts(debts);
    }

    saveSales(getSales().filter(s => s.id !== id));

    showToast('تم حذف الفاتورة نهائياً');
    loadSalesHistory();
    loadInventoryTable();
    loadPosProducts();
    loadDashboard();
    loadReports();
    loadDebtsTable();
}

/* ============================================
   17. عرض بيانات الدفع
   ============================================ */
function viewPaymentDetails(id) {
    const sale = getSales().find(s => s.id === id);
    if (!sale || !sale.payment) return;

    const p = sale.payment;

    if (p.method === 'cash') {
        showToast('هذه الفاتورة دفع كاش', 'warning');
        return;
    }

    let html = `
        <div style="text-align:right;">
            <div style="background:#fef3c7;border-radius:12px;padding:14px;margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #fcd34d;">
                    <span style="color:#92400e;font-weight:700;">التطبيق:</span>
                    <strong style="color:#78350f;">${escapeHtml(p.app_name)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #fcd34d;">
                    <span style="color:#92400e;font-weight:700;">المرسل:</span>
                    <strong style="color:#78350f;">${escapeHtml(p.sender_name)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #fcd34d;">
                    <span style="color:#92400e;font-weight:700;">الهاتف:</span>
                    <strong style="color:#78350f;" dir="ltr">${escapeHtml(p.sender_phone)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;">
                    <span style="color:#92400e;font-weight:700;">المبلغ:</span>
                    <strong style="color:#16a34a;font-size:1.05rem;">₪${Number(sale.total).toFixed(2)}</strong>
                </div>
            </div>
    `;

    if (p.screenshot) {
        html += `
            <div style="margin-bottom:14px;">
                <h6 style="font-weight:800;margin-bottom:8px;color:var(--dark);">
                    <i class="fas fa-image"></i> صورة الإشعار:
                </h6>
                <img src="${escapeHtml(p.screenshot)}" style="width:100%;border-radius:12px;border:2px solid #e2e8f0;cursor:pointer;" onclick="window.open(${jsArg(p.screenshot)},'_blank')">
                <small style="display:block;text-align:center;color:var(--gray);font-size:.72rem;margin-top:5px;">
                    اضغط على الصورة لعرضها بحجم كامل
                </small>
            </div>
        `;
    }

    html += `
            <div style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:12px;">
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;">
                    <span style="color:var(--gray);">الكاشير:</span>
                    <strong>${escapeHtml(sale.cashier_name || '-')}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;">
                    <span style="color:var(--gray);">التاريخ:</span>
                    <strong>${new Date(sale.created_at).toLocaleString('ar-EG')}</strong>
                </div>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'paymentDetailsModal';
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:460px;">
            <div class="modal-header">
                <h5><i class="fas fa-receipt"></i> بيانات الدفع - #${escapeHtml(sale.id)}</h5>
                <button class="modal-close" onclick="document.getElementById('paymentDetailsModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${html}
                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="document.getElementById('paymentDetailsModal').remove()">إغلاق</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/* ============================================
   18. إدارة المشتريات التفاعلية (Purchases Management)
   ============================================ */
let purchActiveItems = [];
let purchActiveInvoiceId = 'INV-' + Math.floor(Math.random() * 9000 + 1000);
let purchPosted = false;
let purchOperationMode = 'normal'; // 'normal' | 'opening'

const PURCH_COLORS = [
    ['أحمر', '#e34b54'],
    ['أسود', '#222831'],
    ['أبيض', '#f1f5f9'],
    ['أزرق', '#3b82f6'],
    ['بني', '#9a633e'],
    ['أخضر', '#10b981'],
    ['رمادي', '#64748b'],
    ['وردي', '#ec4899'],
    ['أصفر', '#eab308']
];
const PURCH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42'];

function switchPurchSubtab(tab) {
    ['invoice', 'stock', 'history'].forEach(t => {
        const btn = document.getElementById(`tabBtn-purch-${t}`);
        const content = document.getElementById(`purchSubtab-${t}`);
        if (btn) btn.classList.toggle('active', t === tab);
        if (content) content.style.display = (t === tab ? 'block' : 'none');
    });
    if (tab === 'stock') loadInventoryTable();
    if (tab === 'history') loadPurchasesTable();
}

function setPurchOperationMode(mode) {
    purchOperationMode = mode;
    const pillNormal = document.getElementById('purchModePillNormal');
    const pillOpening = document.getElementById('purchModePillOpening');
    const alertBox = document.getElementById('purchOpeningStockAlert');
    const supplierInput = document.getElementById('purchSupplier');
    const supplierLabel = document.getElementById('purchSupplierLabel');
    const supplierHint = document.getElementById('purchSupplierHint');
    const supplierIcon = document.getElementById('purchSupplierIcon');
    const quickSupplierBtn = document.getElementById('purchQuickSupplierBtn');
    const invNoInput = document.getElementById('purchInvoiceNo');
    const invNoLabel = document.getElementById('purchInvoiceNoLabel');
    const step1Title = document.getElementById('purchStep1Title');
    const step2Title = document.getElementById('purchStep2Title');
    const paymentGrp = document.getElementById('purchPaymentFieldsGroup');
    const confirmBtnText = document.getElementById('purchConfirmBtnText');
    const summaryTitle = document.getElementById('purchSummaryCardTitle');
    const totalAmountLabel = document.getElementById('purchTotalAmountLabel');
    const grandBoxLabel = document.getElementById('purchGrandBoxLabel');
    const grandBoxSub = document.getElementById('purchGrandBoxSub');
    const addProductBtnText = document.getElementById('purchAddProductBtnText');
    const paidLine = document.getElementById('purchPaidLineBox');

    if (mode === 'opening') {
        if (pillNormal) pillNormal.classList.remove('active');
        if (pillOpening) pillOpening.classList.add('active');
        if (alertBox) alertBox.style.display = 'flex';

        if (step1Title) step1Title.textContent = 'بيانات بضاعة أول المدة';
        if (step2Title) step2Title.textContent = 'أصناف بضاعة أول المدة (المخزون المتوفر)';
        if (summaryTitle) summaryTitle.textContent = 'ملخص بضاعة أول المدة';
        if (totalAmountLabel) totalAmountLabel.textContent = 'إجمالي رأس مال البضاعة';
        if (grandBoxLabel) grandBoxLabel.textContent = 'حالة القيد المالي للمخزون';
        if (grandBoxSub) grandBoxSub.textContent = 'بضاعة مملوكة للمتجر (لا ينشئ أي ديون لموردين).';
        if (confirmBtnText) confirmBtnText.textContent = 'اعتماد بضاعة أول المدة للمخزون';
        if (addProductBtnText) addProductBtnText.textContent = 'إدخال صنف موجود بالمحل';
        if (paidLine) paidLine.style.display = 'none';

        if (supplierInput) {
            supplierInput.value = 'رصيد افتتاحي (مخزون المتجر)';
            supplierInput.setAttribute('readonly', 'true');
            supplierInput.style.backgroundColor = '#f1f5f9';
            supplierInput.style.color = '#334155';
            supplierInput.style.fontWeight = '700';
        }
        if (supplierLabel) supplierLabel.innerHTML = 'جهة التوريد <span class="badge info" style="font-size:0.7rem;">رصيد افتتاحي</span>';
        if (supplierHint) supplierHint.innerHTML = '<i class="fas fa-check-circle text-success"></i> بضاعة ملك للمحل ولا تترتب عليها أي ذمم دائنة لمورد';
        if (supplierIcon) supplierIcon.className = 'fas fa-warehouse text-primary';
        if (quickSupplierBtn) quickSupplierBtn.style.display = 'none';

        if (invNoLabel) invNoLabel.textContent = 'رقم سند الرصيد الافتتاحي *';
        if (invNoInput && (!invNoInput.value || invNoInput.value.startsWith('SUP-'))) {
            const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            invNoInput.value = 'INIT-' + todayStr + '-' + Math.floor(Math.random() * 900 + 100);
        }

        if (paymentGrp) paymentGrp.style.display = 'none';
    } else {
        if (pillNormal) pillNormal.classList.add('active');
        if (pillOpening) pillOpening.classList.remove('active');
        if (alertBox) alertBox.style.display = 'none';

        if (step1Title) step1Title.textContent = 'بيانات الفاتورة';
        if (step2Title) step2Title.textContent = 'أصناف الفاتورة';
        if (summaryTitle) summaryTitle.textContent = 'ملخص الفاتورة';
        if (totalAmountLabel) totalAmountLabel.textContent = 'إجمالي الفاتورة';
        if (grandBoxLabel) grandBoxLabel.textContent = 'المبلغ المتبقي للمورد';
        if (grandBoxSub) grandBoxSub.textContent = 'ينشأ قيد حساب المورد عند الاعتماد.';
        if (confirmBtnText) confirmBtnText.textContent = 'اعتماد الفاتورة';
        if (addProductBtnText) addProductBtnText.textContent = 'إدخال منتج جديد';
        if (paidLine) paidLine.style.display = 'flex';

        if (supplierInput) {
            supplierInput.removeAttribute('readonly');
            supplierInput.style.backgroundColor = '#fff';
            supplierInput.style.color = 'inherit';
            supplierInput.style.fontWeight = 'normal';
            if (supplierInput.value.includes('رصيد افتتاحي')) supplierInput.value = '';
        }
        if (supplierLabel) supplierLabel.textContent = 'المورد / التاجر *';
        if (supplierHint) supplierHint.innerHTML = '<i class="fas fa-info-circle"></i> يمكنك الاختيار من القائمة أو كتابة اسم مورد جديد مباشرة';
        if (supplierIcon) supplierIcon.className = 'fas fa-truck-loading';
        if (quickSupplierBtn) quickSupplierBtn.style.display = 'flex';

        if (invNoLabel) invNoLabel.textContent = 'رقم فاتورة المورد *';
        if (invNoInput && invNoInput.value.startsWith('INIT-')) {
            invNoInput.value = 'SUP-' + Math.floor(Math.random() * 9000 + 1000);
        }

        if (paymentGrp) paymentGrp.style.display = 'contents';
        if (typeof onPurchMethodChange === 'function') onPurchMethodChange();
    }
    calcPurchTotals();
    savePurchDraft(true);
}

function startOpeningStockMode() {
    switchPurchSubtab('invoice');
    setPurchOperationMode('opening');
    if (purchActiveItems.length === 0) {
        openQuickOpeningStockModal();
    }
}

/* ============================================
   إدخال سريع لبضاعة أول المدة واستيراد ملفات
   ============================================ */
let quickStockRows = [];

function openQuickOpeningStockModal() {
    if (!quickStockRows || quickStockRows.length === 0) {
        quickStockRows = [
            createDefaultQuickStockRow(),
            createDefaultQuickStockRow(),
            createDefaultQuickStockRow()
        ];
    }
    renderQuickOpeningStockTable();
    openModal('quickOpeningStockModal');
}

function createDefaultQuickStockRow(data = {}) {
    return {
        id: 'QSR-' + Math.random().toString(36).slice(2, 9),
        name: data.name || '',
        category: data.category || (typeof getCategories === 'function' && getCategories()[0]) || 'ملابس رجالية',
        size: data.size || 'M',
        color: data.color || 'أسود',
        qty: data.qty !== undefined && data.qty !== null ? data.qty : '',
        cost: data.cost !== undefined && data.cost !== null ? data.cost : '',
        price: data.price !== undefined && data.price !== null ? data.price : ''
    };
}

function addQuickOpeningStockRow(prefillData = null) {
    const newRow = createDefaultQuickStockRow(prefillData || {});
    quickStockRows.push(newRow);
    renderQuickOpeningStockTable();
    setTimeout(() => {
        const inp = document.getElementById(`qsr-name-${newRow.id}`);
        if (inp) inp.focus();
    }, 50);
}

function removeQuickOpeningStockRow(rowId) {
    quickStockRows = quickStockRows.filter(r => r.id !== rowId);
    if (quickStockRows.length === 0) {
        quickStockRows.push(createDefaultQuickStockRow());
    }
    renderQuickOpeningStockTable();
}

function onQuickStockRowChange(rowId, field, value) {
    const row = quickStockRows.find(r => r.id === rowId);
    if (!row) return;

    row[field] = value;

    if (field === 'cost') {
        const numCost = parseFloat(value);
        if (!isNaN(numCost) && numCost > 0 && (!row.price || parseFloat(row.price) === 0)) {
            const suggested = Math.round(numCost * 1.4);
            row.price = suggested;
            const priceInput = document.getElementById(`qsr-price-${rowId}`);
            if (priceInput) priceInput.value = suggested;
        }
    }

    updateQuickStockSummary();
}

function renderQuickOpeningStockTable() {
    const tbody = document.getElementById('quickOpeningStockTableBody');
    if (!tbody) return;

    const categories = typeof getCategories === 'function' ? getCategories() : ['ملابس رجالية', 'ملابس نسائية', 'أطفال', 'عام'];
    const colors = (typeof PURCH_COLORS !== 'undefined' && PURCH_COLORS.length > 0) ? PURCH_COLORS.map(c => c[0]) : ['أسود', 'أبيض', 'أزرق', 'رمادي', 'كحلي', 'أحمر'];
    const sizes = (typeof PURCH_SIZES !== 'undefined' && PURCH_SIZES.length > 0) ? PURCH_SIZES : ['S', 'M', 'L', 'XL', '2XL', '3XL', 'حر (One Size)'];

    tbody.innerHTML = quickStockRows.map((r, idx) => {
        const catOptions = categories.map(c => `<option value="${escapeHtml(c)}" ${c === r.category ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
        const sizeOptions = sizes.map(s => `<option value="${escapeHtml(s)}" ${s === r.size ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('');
        const colOptions = colors.map(c => `<option value="${escapeHtml(c)}" ${c === r.color ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');

        return `
            <tr id="qsr-tr-${escapeHtml(r.id)}">
                <td style="text-align:center;color:var(--gray);font-weight:700;">${idx + 1}</td>
                <td>
                    <input type="text" id="qsr-name-${escapeHtml(r.id)}" class="quick-stock-input" value="${escapeHtml(r.name || '')}"
                        placeholder="مثال: قميص قطني، تيشيرت..." oninput="onQuickStockRowChange(${jsArg(r.id)}, 'name', this.value)">
                </td>
                <td>
                    <select class="quick-stock-select" onchange="onQuickStockRowChange(${jsArg(r.id)}, 'category', this.value)">
                        ${catOptions}
                    </select>
                </td>
                <td>
                    <select class="quick-stock-select" onchange="onQuickStockRowChange(${jsArg(r.id)}, 'size', this.value)">
                        ${sizeOptions}
                    </select>
                </td>
                <td>
                    <select class="quick-stock-select" onchange="onQuickStockRowChange(${jsArg(r.id)}, 'color', this.value)">
                        ${colOptions}
                    </select>
                </td>
                <td>
                    <input type="number" min="1" step="1" class="quick-stock-input" value="${r.qty !== undefined ? r.qty : ''}"
                        placeholder="10" style="text-align:center;font-weight:700;"
                        oninput="onQuickStockRowChange(${jsArg(r.id)}, 'qty', this.value)">
                </td>
                <td>
                    <input type="number" min="0" step="0.5" class="quick-stock-input" value="${r.cost !== undefined ? r.cost : ''}"
                        placeholder="25" style="text-align:center;"
                        oninput="onQuickStockRowChange(${jsArg(r.id)}, 'cost', this.value)">
                </td>
                <td>
                    <input type="number" id="qsr-price-${escapeHtml(r.id)}" min="0" step="0.5" class="quick-stock-input" value="${r.price !== undefined ? r.price : ''}"
                        placeholder="40" style="text-align:center;color:var(--primary);font-weight:700;"
                        oninput="onQuickStockRowChange(${jsArg(r.id)}, 'price', this.value)">
                </td>
                <td style="text-align:center;">
                    <button type="button" class="btn-icon danger" onclick="removeQuickOpeningStockRow(${jsArg(r.id)})" title="حذف هذا السطر">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    updateQuickStockSummary();
}

function updateQuickStockSummary() {
    let validCount = 0;
    let totalQty = 0;
    let totalCost = 0;

    quickStockRows.forEach(r => {
        const q = parseFloat(r.qty) || 0;
        const c = parseFloat(r.cost) || 0;
        if ((r.name || '').trim() && q > 0) {
            validCount++;
        }
        if (q > 0) {
            totalQty += q;
            totalCost += (q * c);
        }
    });

    const rowCountEl = document.getElementById('quickStockRowCount');
    const totalQtyEl = document.getElementById('quickStockTotalQty');
    const totalCostEl = document.getElementById('quickStockTotalCost');

    if (rowCountEl) rowCountEl.textContent = `${validCount} من ${quickStockRows.length}`;
    if (totalQtyEl) totalQtyEl.textContent = `${totalQty} قطعة`;
    if (totalCostEl) totalCostEl.textContent = `₪${totalCost.toFixed(2)}`;
}

function downloadOpeningStockTemplate() {
    const bom = '\uFEFF';
    const csvContent = bom + [
        'اسم المنتج,التصنيف,المقاس,اللون,الكمية,سعر التكلفة,سعر البيع',
        'تيشيرت بولو كاجوال,ملابس رجالية,L,أسود,20,35,55',
        'تيشيرت بولو كاجوال,ملابس رجالية,M,أبيض,15,35,55',
        'بنطلون جينز كلاسيك,ملابس رجالية,32,كحلي,25,60,95',
        'فستان صيفي مشجر,ملابس نسائية,M,أزرق,12,70,120'
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Opening_Stock_Template_نموذج_بضاعة_اول_المدة.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('تم تحميل نموذج إكسل الفارغ (CSV) بنجاح! 📥');
}

function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(s => s.replace(/^["']|["']$/g, '').trim());
}

function handleOpeningStockCsvUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length === 0) {
                showToast('الملف فارغ!', 'error');
                return;
            }

            const importedRows = [];
            lines.forEach((line, index) => {
                const cols = parseCsvLine(line);
                if (cols.length < 2) return;

                if (index === 0 && (cols[0].includes('اسم') || cols[0].toLowerCase().includes('name') || cols[0].toLowerCase().includes('product'))) {
                    return;
                }

                const name = (cols[0] || '').trim();
                if (!name) return;

                const category = (cols[1] || 'ملابس رجالية').trim();
                const size = (cols[2] || 'M').trim();
                const color = (cols[3] || 'أسود').trim();
                const qty = parseFloat(cols[4]) || 1;
                const cost = parseFloat(cols[5]) || 0;
                const price = parseFloat(cols[6]) || (cost ? Math.round(cost * 1.4) : 0);

                importedRows.push(createDefaultQuickStockRow({
                    name,
                    category,
                    size,
                    color,
                    qty,
                    cost,
                    price
                }));
            });

            if (importedRows.length === 0) {
                showToast('لم يتم العثور على أي أصناف صالحة في الملف، تأكد من مطابقة الأعمدة.', 'warning');
                return;
            }

            quickStockRows = importedRows;
            renderQuickOpeningStockTable();
            showToast(`✅ تم استيراد ${importedRows.length} صنف من ملف CSV بنجاح!`, 'success');
        } catch (err) {
            console.error(err);
            showToast('حدث خطأ أثناء قراءة ملف CSV: ' + err.message, 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file, 'utf-8');
}

function submitQuickOpeningStockToInvoice() {
    const validRows = quickStockRows.filter(r => (r.name || '').trim() && (parseFloat(r.qty) || 0) > 0);
    if (validRows.length === 0) {
        showToast('يرجى كتابة اسم منتج وتحديد كمية أكبر من صفر لسطر واحد على الأقل.', 'error');
        return;
    }

    let missingCost = false;
    validRows.forEach(r => {
        if (!r.cost || parseFloat(r.cost) <= 0) missingCost = true;
    });

    if (missingCost) {
        if (!confirm('تنبيه: بعض الأصناف ليس لها سعر تكلفة (0 ₪)، هل ترغب في الاستمرار بترحيلها؟')) {
            return;
        }
    }

    setPurchOperationMode('opening');

    const grouped = {};
    validRows.forEach(r => {
        const key = r.name.trim().toLowerCase() + '___' + (r.category || 'عام').trim().toLowerCase();
        if (!grouped[key]) {
            grouped[key] = {
                name: r.name.trim(),
                category: r.category || 'عام',
                retail: parseFloat(r.price) || (parseFloat(r.cost) ? Math.round(parseFloat(r.cost) * 1.4) : 0),
                min: parseFloat(r.price) ? (parseFloat(r.price) * 0.8) : 0,
                rows: []
            };
        }
        grouped[key].rows.push(r);
        if (parseFloat(r.price) > grouped[key].retail) {
            grouped[key].retail = parseFloat(r.price);
            grouped[key].min = parseFloat(r.price) * 0.8;
        }
    });

    const allProducts = typeof getProducts === 'function' ? getProducts() : [];

    Object.values(grouped).forEach(g => {
        let existingItem = purchActiveItems.find(item => item.name.toLowerCase() === g.name.toLowerCase());
        const catalogMatch = allProducts.find(p => p.name.toLowerCase() === g.name.toLowerCase());

        const variants = g.rows.map(r => {
            const colTuple = PURCH_COLORS.find(c => c[0] === r.color);
            const hex = colTuple ? colTuple[1] : '#cbd5e1';
            const cost = parseFloat(r.cost) || 0;
            const qty = parseFloat(r.qty) || 0;

            const existingVariantProduct = allProducts.find(p =>
                p.name.toLowerCase() === g.name.toLowerCase() &&
                (p.size || '') === (r.size || '') &&
                (p.color || '') === (r.color || '')
            );

            const stock = existingVariantProduct ? getProductQuantity(existingVariantProduct.id) : 0;
            const avg = existingVariantProduct ? getProductAvgCost(existingVariantProduct.id) : cost;

            return {
                productId: existingVariantProduct ? existingVariantProduct.id : null,
                color: r.color || '',
                hex: hex,
                size: r.size || '',
                stock: stock,
                avg: avg,
                qty: qty,
                cost: cost,
                image: null
            };
        });

        const hasColor = variants.some(v => v.color);
        const hasSize = variants.some(v => v.size);
        let mode = 'none';
        if (hasColor && hasSize) mode = 'both';
        else if (hasColor) mode = 'color';
        else if (hasSize) mode = 'size';

        if (existingItem) {
            variants.forEach(newV => {
                const matchedV = existingItem.variants.find(v => v.color === newV.color && v.size === newV.size);
                if (matchedV) {
                    matchedV.qty = (parseFloat(matchedV.qty) || 0) + newV.qty;
                    if (newV.cost > 0) matchedV.cost = newV.cost;
                } else {
                    existingItem.variants.push(newV);
                }
            });
            if (g.retail > existingItem.retail) existingItem.retail = g.retail;
        } else {
            purchActiveItems.push({
                uid: 'UID-' + Math.random().toString(36).slice(2, 9),
                catalogId: catalogMatch ? catalogMatch.id : null,
                name: g.name,
                code: catalogMatch ? (catalogMatch.code || '') : '',
                category: g.category || 'عام',
                retail: g.retail,
                min: g.min,
                mode: mode,
                isNew: !catalogMatch,
                variants: variants
            });
        }
    });

    closeModal('quickOpeningStockModal');
    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
    showToast(`🎉 تم ترحيل ${validRows.length} سطر بنجاح إلى جدول بضاعة أول المدة!`, 'success');
}

function loadPurchasesManagement() {
    fillPurchSuppliers();
    fillPurchNewCategories();
    const dateInput = document.getElementById('purchDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }
    const invInput = document.getElementById('purchInvoiceNo');
    if (invInput && !invInput.value) {
        invInput.value = (purchOperationMode === 'opening' ? 'INIT-' : 'SUP-') + Math.floor(Math.random() * 9000 + 1000);
    }

    const hasDraft = loadPurchDraft();
    if (!hasDraft) {
        setPurchOperationMode(purchOperationMode || 'normal');
        renderPurchProducts();
        calcPurchTotals();
        renderPurchDraftBox();
    }
}

function fillPurchSuppliers() {
    const merchants = typeof getMerchants === 'function' ? getMerchants() : [];
    
    // 1. Datalist for input combo
    const dl = document.getElementById('purchSupplierList');
    if (dl) {
        dl.innerHTML = merchants.map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)} ${escapeHtml(m.phone ? '(' + m.phone + ')' : '')}</option>`).join('');
    }

    // 2. Fallback if purchSupplier is still a select
    const sel = document.getElementById('purchSupplier');
    if (sel && sel.tagName === 'SELECT') {
        const currentVal = sel.value;
        let html = '<option value="">اختر المورد</option>';
        merchants.forEach(m => {
            html += `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)} (${escapeHtml(m.phone || 'مورد')})</option>`;
        });
        html += '<option value="__new__">+ مورد جديد...</option>';
        sel.innerHTML = html;
        if (currentVal) sel.value = currentVal;
    }
}

function onPurchMethodChange() {
    const sel = document.getElementById('purchMethod');
    const bankBox = document.getElementById('purchBankDetailsBox');
    const paidInput = document.getElementById('purchPaid');
    if (!sel) return;

    if (bankBox) {
        if (sel.value === 'bank') {
            bankBox.style.display = 'block';
        } else {
            bankBox.style.display = 'none';
        }
    }

    if (sel.value === 'credit' && paidInput) {
        paidInput.value = '0';
    } else if ((sel.value === 'cash' || sel.value === 'bank') && paidInput) {
        const t = typeof calcPurchTotals === 'function' ? calcPurchTotals() : null;
        if ((!paidInput.value || Number(paidInput.value) === 0) && t && t.totalAmount > 0) {
            paidInput.value = t.totalAmount;
        }
    }

    if (typeof calcPurchTotals === 'function') calcPurchTotals();
    savePurchDraft(true);
}

function onPurchSupplierInput() {
    savePurchDraft(true);
}

function openQuickAddSupplierModal() {
    const currentVal = (document.getElementById('purchSupplier')?.value || '').trim();
    if (document.getElementById('quickSupplierName')) {
        document.getElementById('quickSupplierName').value = currentVal;
    }
    if (document.getElementById('quickSupplierPhone')) {
        document.getElementById('quickSupplierPhone').value = '';
    }
    if (document.getElementById('quickSupplierNote')) {
        document.getElementById('quickSupplierNote').value = '';
    }
    openModal('quickSupplierModal');
}

function saveQuickSupplier() {
    const name = (document.getElementById('quickSupplierName')?.value || '').trim();
    const phone = (document.getElementById('quickSupplierPhone')?.value || '').trim();
    if (!name) {
        showToast('يرجى إدخال اسم المورد', 'error');
        return;
    }
    const merchants = typeof getMerchants === 'function' ? getMerchants() : [];
    let existing = merchants.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (!existing) {
        let newId = merchants.length > 0 ? Math.max(...merchants.map(m => m.id)) : 0;
        merchants.push({ id: newId + 1, name: name, phone: phone, balance: 0 });
        if (typeof saveMerchants === 'function') saveMerchants(merchants);
    } else if (phone && !existing.phone) {
        existing.phone = phone;
        if (typeof saveMerchants === 'function') saveMerchants(merchants);
    }

    fillPurchSuppliers();
    const supInput = document.getElementById('purchSupplier');
    if (supInput) supInput.value = name;
    savePurchDraft(true);
    closeModal('quickSupplierModal');
    showToast('تمت إضافة المورد واختياره بنجاح! ✅');
}

function onPurchSearchInput() {
    const q = (document.getElementById('purchSearch')?.value || '').toLowerCase().trim();
    const resultsContainer = document.getElementById('purchSearchResults');
    if (!resultsContainer) return;

    if (!q) {
        resultsContainer.innerHTML = '';
        return;
    }

    const allProducts = getProducts();
    const grouped = [];
    allProducts.forEach(p => {
        const existing = grouped.find(g => (g.name || '').toLowerCase() === (p.name || '').toLowerCase() || (g.code && p.code && g.code === p.code));
        if (!existing) {
            grouped.push({
                id: p.id,
                name: p.name,
                code: p.code || '',
                category: p.category || '',
                price: p.price,
                base_cost: p.base_cost
            });
        }
    });

    const matches = grouped.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );

    if (matches.length > 0) {
        resultsContainer.innerHTML = matches.map(p => `
            <div class="purch-search-item">
                <div>
                    <strong style="color:var(--dark);font-size:0.92rem;">${escapeHtml(p.name)}</strong>
                    <div style="font-size:0.75rem;color:var(--gray);margin-top:2px;">
                        ${p.code ? `<span class="badge primary" style="font-size:0.7rem;padding:2px 6px;">${escapeHtml(p.code)}</span>` : ''} 
                        ${escapeHtml(p.category ? `• ${p.category}` : '')}
                    </div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="addExistingToPurchInvoice(${p.id})">
                    <i class="fas fa-plus"></i> إضافة للفاتورة
                </button>
            </div>
        `).join('');
    } else {
        const cleanQuery = (document.getElementById('purchSearch')?.value || '').replace(/'/g, "\\'");
        resultsContainer.innerHTML = `
            <div class="purch-search-item" style="border-style:dashed;">
                <div>
                    <strong style="color:var(--dark);">لم يُعثر على تطابق واضح</strong>
                    <small style="color:var(--gray);display:block;margin-top:2px;">تحقق من الاسم أو أدخل منتجاً جديداً مباشرة</small>
                </div>
                <button class="btn btn-primary btn-sm" onclick="openPurchNewProductModal(${jsArg(cleanQuery)})">
                    <i class="fas fa-plus"></i> إدخال منتج جديد
                </button>
            </div>
        `;
    }
}

function clearPurchSearch() {
    const input = document.getElementById('purchSearch');
    if (input) input.value = '';
    const resultsContainer = document.getElementById('purchSearchResults');
    if (resultsContainer) resultsContainer.innerHTML = '';
}

function addExistingToPurchInvoice(productId) {
    if (purchPosted) {
        showToast('الفاتورة معتمدة. ابدأ فاتورة جديدة.', 'warning');
        return;
    }
    const allProducts = getProducts();
    const baseProd = allProducts.find(p => p.id === productId);
    if (!baseProd) return;

    if (purchActiveItems.some(p => p.catalogId === baseProd.id || (p.code && baseProd.code && p.code === baseProd.code))) {
        showToast('المنتج موجود بالفعل في الفاتورة؛ يمكنك تعديل جدول كمياته.', 'info');
        clearPurchSearch();
        return;
    }

    const matchingVariants = allProducts.filter(p =>
        p.name === baseProd.name && (baseProd.code ? p.code === baseProd.code : true)
    );

    const variants = matchingVariants.map(mv => {
        const col = PURCH_COLORS.find(c => c[0] === mv.color);
        const stock = getProductQuantity(mv.id);
        const avg = getProductAvgCost(mv.id);
        return {
            productId: mv.id,
            color: mv.color || '',
            hex: col ? col[1] : '#cbd5e1',
            size: mv.size || '',
            stock: stock,
            avg: avg,
            qty: 1, cost: mv.base_cost || avg || 0
        };
    });

    const hasColor = variants.some(v => v.color);
    const hasSize = variants.some(v => v.size);
    let mode = 'none';
    if (hasColor && hasSize) mode = 'both';
    else if (hasColor) mode = 'color';
    else if (hasSize) mode = 'size';

    if (variants.length === 0) {
        variants.push({
            productId: baseProd.id,
            color: baseProd.color || '',
            hex: '#cbd5e1',
            size: baseProd.size || '',
            stock: getProductQuantity(baseProd.id),
            avg: getProductAvgCost(baseProd.id),
            qty: 0,
            cost: baseProd.base_cost || 0
        });
    }

    purchActiveItems.push({
        uid: 'UID-' + Math.random().toString(36).slice(2, 9),
        catalogId: baseProd.id,
        name: baseProd.name,
        code: baseProd.code || '',
        category: baseProd.category || 'عام',
        retail: Number(baseProd.price || 0),
        min: Number(baseProd.price || 0) * 0.8,
        mode: mode,
        isNew: false,
        variants: variants
    });

    clearPurchSearch();
    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
    showToast('أُضيف المنتج إلى الفاتورة');
}

function fillPurchNewCategories() {
    const sel = document.getElementById('purchNewCategory');
    if (!sel) return;
    const cats = typeof getCategories === 'function' ? getCategories() : [];
    sel.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function onPurchNewModeChange() {
    const mode = document.getElementById('purchNewMode')?.value || 'both';
    const colorGrp = document.getElementById('purchNewColorGroup');
    const sizeGrp = document.getElementById('purchNewSizeGroup');
    if (colorGrp) colorGrp.style.display = (mode === 'both' || mode === 'color') ? 'block' : 'none';
    if (sizeGrp) sizeGrp.style.display = (mode === 'both' || mode === 'size') ? 'block' : 'none';
}

function openPurchNewProductModal(prefillName = '') {
    fillPurchNewCategories();

    // Populate colors
    const colSel = document.getElementById('purchNewColor');
    if (colSel) {
        colSel.innerHTML = PURCH_COLORS.map(c => `<option value="${escapeHtml(c[0])}">${escapeHtml(c[0])}</option>`).join('');
    }

    // Populate sizes
    const sizeSel = document.getElementById('purchNewSize');
    if (sizeSel) {
        sizeSel.innerHTML = PURCH_SIZES.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }

    if (document.getElementById('purchNewName')) document.getElementById('purchNewName').value = prefillName || '';
    if (document.getElementById('purchNewCode')) document.getElementById('purchNewCode').value = '';
    if (document.getElementById('purchNewCost')) document.getElementById('purchNewCost').value = '';
    if (document.getElementById('purchNewQty')) document.getElementById('purchNewQty').value = '1';
    if (document.getElementById('purchNewRetail')) document.getElementById('purchNewRetail').value = '';
    if (document.getElementById('purchNewMinPrice')) document.getElementById('purchNewMinPrice').value = '';
    if (document.getElementById('purchNewMode')) document.getElementById('purchNewMode').value = 'both';

    onPurchNewModeChange();
    openModal('purchNewProductModal');
    setTimeout(() => document.getElementById('purchNewName')?.focus(), 200);
}

function addPurchNewProduct() {
    const name = (document.getElementById('purchNewName')?.value || '').trim();
    const code = (document.getElementById('purchNewCode')?.value || '').trim();
    const category = document.getElementById('purchNewCategory')?.value || 'عام';
    const cost = Math.max(0, parseFloat(document.getElementById('purchNewCost')?.value) || 0);
    const qty = Math.max(1, parseInt(document.getElementById('purchNewQty')?.value) || 1);
    let retail = parseFloat(document.getElementById('purchNewRetail')?.value) || 0;
    const mode = document.getElementById('purchNewMode')?.value || 'both';

    if (!name) {
        showToast('يرجى إدخال اسم المنتج المطلوب', 'error');
        document.getElementById('purchNewName')?.focus();
        return;
    }

    if (retail <= 0 && cost > 0) {
        retail = Math.round(cost * 1.5);
    }
    const min = parseFloat(document.getElementById('purchNewMinPrice')?.value) || (retail * 0.8);

    const chosenColor = (mode === 'both' || mode === 'color') ? (document.getElementById('purchNewColor')?.value || 'أسود') : '';
    const chosenSize = (mode === 'both' || mode === 'size') ? (document.getElementById('purchNewSize')?.value || 'M') : '';

    const colObj = PURCH_COLORS.find(c => c[0] === chosenColor);
    const hex = colObj ? colObj[1] : (chosenColor ? '#222831' : '#cbd5e1');

    const variants = [{
        color: chosenColor,
        hex: hex,
        size: chosenSize,
        stock: 0,
        avg: 0,
        qty: qty,
        cost: cost
    }];

    purchActiveItems.push({
        uid: 'UID-' + Math.random().toString(36).slice(2, 9),
        catalogId: null,
        name: name,
        code: code || 'NEW-' + Math.floor(Math.random() * 900 + 100),
        category: category,
        retail: retail,
        min: min,
        mode: mode,
        isNew: true,
        variants: variants
    });

    closeModal('purchNewProductModal');
    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
    showToast('✅ تم إضافة المنتج بنجاح إلى الفاتورة!');
}

function addVariantToPurchProduct(pUid) {
    const p = purchActiveItems.find(x => x.uid === pUid);
    if (!p) return;
    const colSel = document.getElementById(`sel-col-${pUid}`);
    const sizeSel = document.getElementById(`sel-size-${pUid}`);

    const color = (p.mode === 'both' || p.mode === 'color') ? (colSel ? colSel.value : 'أسود') : '';
    const size = (p.mode === 'both' || p.mode === 'size') ? (sizeSel ? sizeSel.value : 'M') : '';

    if (p.variants.some(v => v.color === color && v.size === size)) {
        showToast('هذه التركيبة مضافة بالفعل لهذا المنتج', 'warning');
        return;
    }

    const cObj = PURCH_COLORS.find(c => c[0] === color);
    p.variants.push({
        color: color,
        hex: cObj ? cObj[1] : '#cbd5e1',
        size: size,
        stock: 0,
        avg: 0,
        qty: 0,
        cost: 0
    });

    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
}

function removeVariantFromPurchProduct(pUid, index) {
    const p = purchActiveItems.find(x => x.uid === pUid);
    if (!p) return;
    p.variants.splice(index, 1);
    if (p.variants.length === 0) {
        p.variants.push({ color: '', hex: '', size: '', stock: 0, avg: 0, qty: 0, cost: 0 });
    }
    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
}

function removeProductFromPurchInvoice(pUid) {
    if (!confirm('هل تريد إزالة هذا الصنف بالكامل من الفاتورة؟')) return;
    purchActiveItems = purchActiveItems.filter(x => x.uid !== pUid);
    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
}

function onPurchVariantFieldChange(pUid, index, field, val) {
    const p = purchActiveItems.find(x => x.uid === pUid);
    if (!p || !p.variants[index]) return;
    const num = Math.max(0, parseFloat(val) || 0);
    p.variants[index][field] = (field === 'qty' ? Math.floor(num) : num);
    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
}

function onPurchProductControlChange(pUid, field, val) {
    const p = purchActiveItems.find(x => x.uid === pUid);
    if (!p) return;
    if (field === 'mode') {
        p.mode = val;
        if (val === 'none') {
            p.variants.forEach(v => { v.color = ''; v.size = ''; });
        } else if (val === 'color') {
            p.variants.forEach(v => { v.size = ''; });
        } else if (val === 'size') {
            p.variants.forEach(v => { v.color = ''; });
        }
    } else {
        p[field] = Math.max(0, parseFloat(val) || 0);
    }
    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
}

function renderPurchProducts() {
    const container = document.getElementById('purchProductsContainer');
    if (!container) return;

    if (purchActiveItems.length === 0) {
        container.innerHTML = `
            <div class="empty" style="border:2px dashed #cbd5e1;border-radius:14px;padding:36px;text-align:center;color:var(--gray);">
                <i class="fas fa-boxes" style="font-size:2.4rem;color:#cbd5e1;margin-bottom:12px;display:block;"></i>
                لم تتم إضافة أصناف بعد. ابحث عن منتج موجود أو أدخل منتجاً جديداً من الزر أعلاه.
            </div>
        `;
        return;
    }

    container.innerHTML = purchActiveItems.map(p => {
        const colorMode = (p.mode === 'both' || p.mode === 'color');
        const sizeMode = (p.mode === 'both' || p.mode === 'size');

        let headers = '';
        if (colorMode) headers += '<th>اللون</th>';
        if (sizeMode) headers += '<th>المقاس</th>';
        headers += `
            <th>المخزون الحالي</th>
            <th>كمية الدفعة</th>
            <th>سعر شراء الوحدة</th>
            <th>إجمالي السطر</th>
            <th>المخزون بعد الاعتماد</th>
            <th>متوسط التكلفة الجديد</th>
            <th>إجراء</th>
        `;

        const rows = p.variants.map((v, i) => {
            const qty = Number(v.qty || 0);
            const cost = Number(v.cost || 0);
            const stock = Number(v.stock || 0);
            const avg = Number(v.avg || 0);
            const lineTotal = qty * cost;
            const newStock = stock + qty;
            const newAvg = newStock > 0 ? ((stock * avg) + (qty * cost)) / newStock : 0;

            let rowHtml = '<tr>';
            if (colorMode) {
                rowHtml += `
                    <td>
                        <span class="variant-pill">
                            <span class="variant-dot" style="background:${escapeHtml(v.hex || '#222831')};"></span>
                            ${escapeHtml(v.color || 'بدون')}
                        </span>
                    </td>
                `;
            }
            if (sizeMode) {
                rowHtml += `<td><strong>${escapeHtml(v.size || 'بدون')}</strong></td>`;
            }
            rowHtml += `
                <td style="color:var(--gray);">${stock}</td>
                <td>
                    <input type="number" min="0" step="1" class="purch-qty-input" value="${v.qty || ''}" placeholder="كمية"
                        onchange="onPurchVariantFieldChange(${jsArg(p.uid)}, ${i}, 'qty', this.value)" ${purchPosted ? 'disabled' : ''}>
                </td>
                <td>
                    <input type="number" min="0" step="0.01" class="purch-cost-input" value="${v.cost || ''}" placeholder="السعر"
                        onchange="onPurchVariantFieldChange(${jsArg(p.uid)}, ${i}, 'cost', this.value)" ${purchPosted ? 'disabled' : ''}>
                </td>
                <td><strong style="color:var(--primary);">₪${lineTotal.toFixed(2)}</strong></td>
                <td><span class="badge ${newStock > 0 ? 'success' : 'danger'}">${newStock}</span></td>
                <td><strong>${newStock > 0 ? '₪' + newAvg.toFixed(2) : '—'}</strong></td>
                <td>
                    <div style="display:inline-flex;align-items:center;gap:6px;">
                        <input type="file" accept="image/*" id="purch-img-input-${escapeHtml(p.uid)}-${i}" style="display:none;"
                               onchange="handlePurchVariantImageUpload(${jsArg(p.uid)}, ${i}, event)" ${purchPosted ? 'disabled' : ''}>
                        
                        ${v.image ? `
                            <div class="purch-variant-img-box" style="position:relative;display:inline-block;">
                                <img src="${escapeHtml(v.image)}" alt="صورة الصنف" class="purch-variant-thumb"
                                     onclick="previewPurchVariantImage(${jsArg(v.image)}, ${jsArg(`${p.name} - ${v.color || ''} ${v.size || ''}`)})"
                                     title="اضغط لمعاينة الصورة">
                                <button type="button" class="purch-thumb-change-btn"
                                        onclick="document.getElementById('purch-img-input-${p.uid}-${i}').click()"
                                        ${purchPosted ? 'disabled' : ''} title="تغيير الصورة">
                                    <i class="fas fa-camera"></i>
                                </button>
                                <button type="button" class="purch-thumb-del-btn"
                                        onclick="removePurchVariantImage(${jsArg(p.uid)}, ${i})"
                                        ${purchPosted ? 'disabled' : ''} title="حذف الصورة">
                                    &times;
                                </button>
                            </div>
                        ` : `
                            <button type="button" class="btn-icon" style="color:var(--primary);border-color:#c7d2fe;background:#eef2ff;"
                                    onclick="document.getElementById('purch-img-input-${p.uid}-${i}').click()"
                                    ${purchPosted ? 'disabled' : ''} title="رفع صورة لهذا الصنف">
                                <i class="fas fa-camera"></i>
                            </button>
                        `}

                        <button type="button" class="btn-icon danger" onclick="removeVariantFromPurchProduct(${jsArg(p.uid)}, ${i})" ${purchPosted ? 'disabled' : ''} title="حذف التركيبة">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
            return rowHtml;
        }).join('');

        const colOptions = PURCH_COLORS.map(c => `<option value="${escapeHtml(c[0])}">${escapeHtml(c[0])}</option>`).join('');
        const sizeOptions = PURCH_SIZES.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

        const totalBatchQty = p.variants.reduce((acc, v) => acc + (Number(v.qty) || 0), 0);
        const totalBatchCost = p.variants.reduce((acc, v) => acc + ((Number(v.qty) || 0) * (Number(v.cost) || 0)), 0);

        return `
            <article class="purch-product">
                <div class="purch-prod-head">
                    <div>
                        <h4>${escapeHtml(p.name)}</h4>
                        <div style="font-size:0.78rem;color:var(--gray);margin-top:2px;">
                            ${p.code ? `<span class="badge primary" style="font-size:0.7rem;padding:2px 6px;">${escapeHtml(p.code)}</span>` : ''} 
                            • ${escapeHtml(p.category || 'ملابس')} 
                            • <span style="color:${p.isNew ? 'var(--warning)' : 'var(--success)'};font-weight:700;">${p.isNew ? 'منتج جديد — مسودة' : 'منتج موجود في المتجر'}</span>
                        </div>
                    </div>
                    <button class="btn btn-outline btn-sm" style="color:var(--danger);border-color:#fecaca;" onclick="removeProductFromPurchInvoice(${jsArg(p.uid)})" ${purchPosted ? 'disabled' : ''}>
                        <i class="fas fa-times"></i> إزالة الصنف
                    </button>
                </div>
                <div class="purch-prod-body">
                    <div class="purch-prod-controls">
                        <div class="form-group">
                            <label style="font-size:0.78rem;margin-bottom:4px;">سعر البيع الافتراضي</label>
                            <input type="number" step="0.01" style="height:38px!important;" value="${p.retail || 0}"
                                onchange="onPurchProductControlChange(${jsArg(p.uid)}, 'retail', this.value)" ${purchPosted ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.78rem;margin-bottom:4px;">الحد الأدنى للبيع</label>
                            <input type="number" step="0.01" style="height:38px!important;" value="${p.min || 0}"
                                onchange="onPurchProductControlChange(${jsArg(p.uid)}, 'min', this.value)" ${purchPosted ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label style="font-size:0.78rem;margin-bottom:4px;">طبيعة المنتج</label>
                            <select style="height:38px!important;" onchange="onPurchProductControlChange(${jsArg(p.uid)}, 'mode', this.value)" ${purchPosted ? 'disabled' : ''}>
                                <option value="both" ${p.mode === 'both' ? 'selected' : ''}>لون ومقاس</option>
                                <option value="color" ${p.mode === 'color' ? 'selected' : ''}>لون فقط</option>
                                <option value="size" ${p.mode === 'size' ? 'selected' : ''}>مقاس فقط</option>
                                <option value="none" ${p.mode === 'none' ? 'selected' : ''}>بدون لون أو مقاس</option>
                            </select>
                        </div>
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px;font-size:0.85rem;font-weight:700;">
                        <span><i class="fas fa-layer-group text-primary"></i> تركيبات المنتج وكميات هذه الدفعة</span>
                        <small style="color:var(--gray);font-weight:normal;font-size:0.75rem;">سعر الوحدة هو سعر الشراء في هذه الفاتورة</small>
                    </div>

                    <div class="table-responsive" style="border:1px solid #e2e8f0;border-radius:10px;">
                        <table class="purch-variant-table">
                            <thead><tr>${headers}</tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>

                    <div class="purch-tools">
                        ${colorMode ? `<select id="sel-col-${escapeHtml(p.uid)}">${colOptions}</select>` : ''}
                        ${sizeMode ? `<select id="sel-size-${escapeHtml(p.uid)}">${sizeOptions}</select>` : ''}
                        <button class="btn btn-outline btn-sm" onclick="addVariantToPurchProduct(${jsArg(p.uid)})" ${purchPosted ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i> إضافة تركيبة / لون / مقاس
                        </button>
                    </div>

                    <div class="purch-metrics">
                        <div class="purch-metric-chip">كمية الدفعة: <b>${totalBatchQty}</b></div>
                        <div class="purch-metric-chip">قيمة المنتج: <b>₪${totalBatchCost.toFixed(2)}</b></div>
                        <div class="purch-metric-chip">عدد التركيبات: <b>${p.variants.length}</b></div>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function calcPurchTotals() {
    let totalItems = purchActiveItems.length;
    let totalQty = 0;
    let totalAmount = 0;

    purchActiveItems.forEach(p => {
        p.variants.forEach(v => {
            const q = Number(v.qty || 0);
            const c = Number(v.cost || 0);
            totalQty += q;
            totalAmount += (q * c);
        });
    });

    const isOpening = (purchOperationMode === 'opening');
    const paidInput = document.getElementById('purchPaid');
    const paid = isOpening ? totalAmount : Math.max(0, parseFloat(paidInput ? paidInput.value : 0) || 0);
    const remaining = isOpening ? 0 : Math.max(0, totalAmount - paid);

    const cView = document.getElementById('purchCountView');
    const qView = document.getElementById('purchQtyTotalView');
    const tView = document.getElementById('purchTotalView');
    const pView = document.getElementById('purchPaidView');
    const rView = document.getElementById('purchRemainingView');

    if (cView) cView.textContent = totalItems;
    if (qView) qView.textContent = totalQty;
    if (tView) tView.textContent = '₪' + totalAmount.toFixed(2);
    if (pView) pView.textContent = '₪' + (isOpening ? totalAmount.toFixed(2) : paid.toFixed(2));
    if (rView) rView.textContent = isOpening ? '0.00 (رأسمال متجر)' : '₪' + remaining.toFixed(2);

    return { totalItems, totalQty, totalAmount, paid, remaining, isOpening };
}

function savePurchDraft(silent = false) {
    if (purchPosted) return;
    const draftData = {
        invoiceId: purchActiveInvoiceId,
        operationMode: purchOperationMode,
        supplier: document.getElementById('purchSupplier')?.value || '',
        invoiceNo: document.getElementById('purchInvoiceNo')?.value || '',
        date: document.getElementById('purchDate')?.value || '',
        method: document.getElementById('purchMethod')?.value || 'cash',
        paid: document.getElementById('purchPaid')?.value || 0,
        note: document.getElementById('purchNote')?.value || '',
        bankName: document.getElementById('purchBankName')?.value || '',
        bankAccount: document.getElementById('purchBankAccount')?.value || '',
        bankRef: document.getElementById('purchBankRef')?.value || '',
        items: purchActiveItems,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('clothing_store_purch_draft', JSON.stringify(draftData));
    const statusBadge = document.getElementById('purchSaveStatus');
    if (statusBadge) {
        statusBadge.className = 'purch-status-badge saved';
        statusBadge.innerHTML = '<i class="fas fa-check"></i> تم حفظ المسودة محلياً';
    }
    renderPurchDraftBox();
    if (!silent) showToast('تم حفظ مسودة الفاتورة');
}

function loadPurchDraft() {
    const raw = localStorage.getItem('clothing_store_purch_draft');
    if (!raw) return false;
    try {
        const d = JSON.parse(raw);
        if (!d || !d.items) return false;
        purchActiveInvoiceId = d.invoiceId || purchActiveInvoiceId;

        if (d.operationMode) {
            setPurchOperationMode(d.operationMode);
        } else if (d.invoiceNo && d.invoiceNo.startsWith('INIT-')) {
            setPurchOperationMode('opening');
        } else {
            setPurchOperationMode('normal');
        }

        if (document.getElementById('purchSupplier')) document.getElementById('purchSupplier').value = d.supplier || '';
        if (document.getElementById('purchInvoiceNo')) document.getElementById('purchInvoiceNo').value = d.invoiceNo || '';
        if (document.getElementById('purchDate')) document.getElementById('purchDate').value = d.date || '';
        if (document.getElementById('purchMethod')) document.getElementById('purchMethod').value = d.method || 'cash';
        if (document.getElementById('purchPaid')) document.getElementById('purchPaid').value = d.paid || 0;
        if (document.getElementById('purchNote')) document.getElementById('purchNote').value = d.note || '';
        if (document.getElementById('purchBankName')) document.getElementById('purchBankName').value = d.bankName || '';
        if (document.getElementById('purchBankAccount')) document.getElementById('purchBankAccount').value = d.bankAccount || '';
        if (document.getElementById('purchBankRef')) document.getElementById('purchBankRef').value = d.bankRef || '';

        const bankBox = document.getElementById('purchBankDetailsBox');
        if (bankBox) {
            bankBox.style.display = (d.method === 'bank' ? 'block' : 'none');
        }

        purchActiveItems = d.items || [];
        purchPosted = false;

        const statusBadge = document.getElementById('purchSaveStatus');
        if (statusBadge) {
            statusBadge.className = 'purch-status-badge saved';
            statusBadge.innerHTML = '<i class="fas fa-history"></i> تم استرجاع المسودة';
        }

        renderPurchProducts();
        calcPurchTotals();
        renderPurchDraftBox();
        return true;
    } catch (e) {
        return false;
    }
}

function discardPurchDraft() {
    if (!confirm('هل تريد حذف المسودة المحلية والبدء من جديد؟')) return;
    localStorage.removeItem('clothing_store_purch_draft');
    startNewPurchInvoice();
    showToast('تم حذف المسودة المحلية');
}

function renderPurchDraftBox() {
    const box = document.getElementById('purchDraftListView');
    if (!box) return;
    const raw = localStorage.getItem('clothing_store_purch_draft');
    if (!raw) {
        box.innerHTML = 'لا توجد مسودة محفوظة.';
        return;
    }
    try {
        const d = JSON.parse(raw);
        const isOpening = (d.operationMode === 'opening' || (d.invoiceNo && d.invoiceNo.startsWith('INIT-')));
        box.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div>
                    <strong style="display:block;color:var(--dark);">${escapeHtml(d.invoiceNo || 'فاتورة بدون رقم')} ${isOpening ? '<span class="badge info" style="font-size:0.68rem;padding:2px 6px;">بضاعة أول المدة</span>' : ''}</strong>
                    <small style="color:var(--gray);">${escapeHtml(d.supplier || 'لم يحدد المورد')} · ${d.date || ''}</small>
                </div>
                <button class="btn btn-outline btn-sm" onclick="loadPurchDraft();showToast('تم استرجاع المسودة');">
                    استكمال
                </button>
            </div>
        `;
    } catch (e) {
        box.innerHTML = 'تعذر قراءة المسودة.';
    }
}

function startNewPurchInvoice() {
    purchActiveItems = [];
    purchPosted = false;
    purchActiveInvoiceId = 'INV-' + Math.floor(Math.random() * 9000 + 1000);

    setPurchOperationMode('normal');

    if (document.getElementById('purchSupplier')) document.getElementById('purchSupplier').value = '';
    if (document.getElementById('purchInvoiceNo')) document.getElementById('purchInvoiceNo').value = 'SUP-' + Math.floor(Math.random() * 9000 + 1000);
    if (document.getElementById('purchDate')) document.getElementById('purchDate').value = new Date().toISOString().slice(0, 10);
    if (document.getElementById('purchMethod')) document.getElementById('purchMethod').value = 'cash';
    if (document.getElementById('purchPaid')) document.getElementById('purchPaid').value = '0';
    if (document.getElementById('purchNote')) document.getElementById('purchNote').value = '';
    if (document.getElementById('purchBankName')) document.getElementById('purchBankName').value = '';
    if (document.getElementById('purchBankAccount')) document.getElementById('purchBankAccount').value = '';
    if (document.getElementById('purchBankRef')) document.getElementById('purchBankRef').value = '';
    const bBox = document.getElementById('purchBankDetailsBox');
    if (bBox) bBox.style.display = 'none';

    const statusBadge = document.getElementById('purchSaveStatus');
    if (statusBadge) {
        statusBadge.className = 'purch-status-badge';
        statusBadge.innerHTML = 'مسودة — غير معتمدة';
    }

    renderPurchProducts();
    calcPurchTotals();
    renderPurchDraftBox();
}

function loadPurchDemo() {
    purchPosted = false;
    purchActiveInvoiceId = 'DEMO-1258';

    const supSel = document.getElementById('purchSupplier');
    if (supSel) {
        supSel.value = 'شركة الملابس المتحدة';
    }

    if (document.getElementById('purchInvoiceNo')) document.getElementById('purchInvoiceNo').value = 'SUP-1258';
    if (document.getElementById('purchDate')) document.getElementById('purchDate').value = new Date().toISOString().slice(0, 10);
    if (document.getElementById('purchMethod')) document.getElementById('purchMethod').value = 'partial';
    if (document.getElementById('purchPaid')) document.getElementById('purchPaid').value = 250;
    if (document.getElementById('purchNote')) document.getElementById('purchNote').value = 'فاتورة تجريبية تضم منتجات موجودة وجديدة';

    purchActiveItems = [
        {
            uid: 'UID-demo-1',
            catalogId: 1,
            name: 'تيشيرت Nike',
            code: 'NK-100',
            category: 'ملابس رجالية',
            retail: 50,
            min: 40,
            mode: 'both',
            isNew: false,
            variants: [
                { color: 'أحمر', hex: '#e34b54', size: 'M', stock: 7, avg: 18, qty: 5, cost: 20 },
                { color: 'أحمر', hex: '#e34b54', size: 'L', stock: 4, avg: 18.5, qty: 3, cost: 21 },
                { color: 'أحمر', hex: '#e34b54', size: 'XL', stock: 2, avg: 19, qty: 0, cost: 0 },
                { color: 'أسود', hex: '#222831', size: 'M', stock: 9, avg: 17, qty: 0, cost: 0 },
                { color: 'أسود', hex: '#222831', size: 'L', stock: 6, avg: 17.5, qty: 0, cost: 0 },
                { color: 'أسود', hex: '#222831', size: 'XL', stock: 3, avg: 18, qty: 0, cost: 0 }
            ]
        },
        {
            uid: 'UID-demo-2',
            catalogId: null,
            name: 'جاكيت شتوي بريميوم',
            code: 'JK-2026',
            category: 'ملابس رجالية',
            retail: 120,
            min: 95,
            mode: 'both',
            isNew: true,
            variants: [
                { color: 'أزرق', hex: '#3b82f6', size: 'M', stock: 0, avg: 0, qty: 6, cost: 48 },
                { color: 'أزرق', hex: '#3b82f6', size: 'L', stock: 0, avg: 0, qty: 4, cost: 50 },
                { color: 'أسود', hex: '#222831', size: 'M', stock: 0, avg: 0, qty: 3, cost: 47 }
            ]
        }
    ];

    renderPurchProducts();
    calcPurchTotals();
    savePurchDraft(true);
    showToast('تم تحميل مثال الفاتورة بنجاح!');
}

function exportPurchJSON() {
    const t = calcPurchTotals();
    const invoiceData = {
        invoiceId: purchActiveInvoiceId,
        supplier: document.getElementById('purchSupplier')?.value || '',
        invoiceNo: document.getElementById('purchInvoiceNo')?.value || '',
        date: document.getElementById('purchDate')?.value || '',
        method: document.getElementById('purchMethod')?.value || '',
        paid: t.paid,
        remaining: t.remaining,
        totals: t,
        items: purchActiveItems,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-invoice-${invoiceData.invoiceNo || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير ملف الفاتورة بنجاح');
}

function requestConfirmPurchInvoice() {
    const isOpening = (purchOperationMode === 'opening' || (document.getElementById('purchInvoiceNo')?.value || '').startsWith('INIT-'));
    const sup = document.getElementById('purchSupplier')?.value || '';
    const invNo = (document.getElementById('purchInvoiceNo')?.value || '').trim();
    if (!sup) {
        showToast(isOpening ? 'يرجى تحديد جهة الرصيد الافتتاحي' : 'يرجى اختيار المورد أولاً', 'error');
        return;
    }
    if (!invNo) {
        showToast(isOpening ? 'يرجى إدخال رقم سند الرصيد الافتتاحي' : 'يرجى إدخال رقم فاتورة المورد', 'error');
        return;
    }
    const t = calcPurchTotals();
    if (purchActiveItems.length === 0 || t.totalQty <= 0) {
        showToast('يرجى إدخال كمية لمنتج واحد على الأقل', 'error');
        return;
    }
    if (!isOpening && t.paid > t.totalAmount) {
        showToast('المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة', 'error');
        return;
    }

    let missingCost = false;
    purchActiveItems.forEach(p => {
        p.variants.forEach(v => {
            if (Number(v.qty) > 0 && (!v.cost || Number(v.cost) <= 0)) {
                missingCost = true;
            }
        });
    });
    if (missingCost) {
        showToast('يرجى تحديد سعر الشراء / التكلفة لكل صنف تم إدخال كمية له', 'error');
        return;
    }

    if (!isOpening && invNo) {
        const existingPurch = (typeof getPurchases === 'function' ? getPurchases() : []).some(p => p.invoice_id === invNo && p.supplier === sup);
        const existingTx = (typeof getMerchantTransactions === 'function' ? getMerchantTransactions() : []).some(t => t.type === 'invoice' && t.reference === invNo && t.merchant_name === sup);
        if (existingPurch || existingTx) {
            showToast(`⚠️ رقم الفاتورة (${invNo}) مسجل مسبقاً للمورد (${sup})! تم منع تكرار الفاتورة.`, 'error');
            return;
        }
    }

    const modalTitle = document.querySelector('#purchConfirmModal .modal-header h5');
    const modalDesc = document.querySelector('#purchConfirmModal .modal-body > div');
    if (isOpening) {
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-boxes text-primary"></i> تأكيد اعتماد بضاعة أول المدة (المخزون المتوفر)';
        if (modalDesc) {
            modalDesc.innerHTML = `
                عند الضغط على <strong>تأكيد الاعتماد</strong>، سيتم إدخال البضاعة في النظام بشكل فوري:
                <ul style="margin:10px 18px 0;padding:0;line-height:1.8;">
                    <li>تحديث كميات المخزون لكافة الأصناف والتركيبات المتوفرة.</li>
                    <li>تثبيت سعر التكلفة وسعر البيع لكل تركيبة.</li>
                    <li>إتاحة المنتجات للبيع مباشرة في شاشة الكاشير (POS).</li>
                    <li><strong>لن يتم إنشاء أي ديون أو ذمم لموردين</strong> (البضاعة مسجلة كرأسمال مملوك للمتجر).</li>
                </ul>
            `;
        }
    } else {
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-shield-alt text-primary"></i> تأكيد اعتماد فاتورة المشتريات';
        if (modalDesc) {
            modalDesc.innerHTML = `
                عند الضغط على <strong>تأكيد الاعتماد</strong>، سيتم تنفيذ العمليات التالية في النظام بشكل فوري:
                <ul style="margin:10px 18px 0;padding:0;line-height:1.8;">
                    <li>تحديث كميات المخزون لكافة التركيبات الواردة في الفاتورة.</li>
                    <li>إعادة احتساب متوسط التكلفة التراكمي لكل منتج.</li>
                    <li>إضافة أي منتجات جديدة تلقائياً لكاشير المتجر (POS).</li>
                    <li>تسجيل قيد حساب المورد والمبالغ المدفوعة والمتبقية كذمة دائنة.</li>
                </ul>
            `;
        }
    }

    openModal('purchConfirmModal');
}

function postPurchInvoice() {
    closeModal('purchConfirmModal');
    const isOpening = (purchOperationMode === 'opening' || (document.getElementById('purchInvoiceNo')?.value || '').startsWith('INIT-'));
    const sup = isOpening ? 'رصيد افتتاحي (مخزون المتجر)' : (document.getElementById('purchSupplier')?.value || 'مورد عام');
    const invNo = (document.getElementById('purchInvoiceNo')?.value || '').trim();
    const date = document.getElementById('purchDate')?.value || new Date().toISOString().slice(0, 10);
    const method = isOpening ? 'store_capital' : (document.getElementById('purchMethod')?.value || 'cash');
    const note = (document.getElementById('purchNote')?.value || '').trim();
    const t = calcPurchTotals();

    const products = getProducts();
    const purchases = getPurchases();

    if (!isOpening && invNo && purchases.some(p => p.invoice_id === invNo && p.supplier === sup)) {
        showToast(`⚠️ تم تسجيل الفاتورة (${invNo}) مسبقاً للمورد (${sup})! تم إيقاف العملية لمنع التكرار.`, 'error');
        return;
    }

    let maxProdId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
    let maxPurchId = purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) : 0;

    purchActiveItems.forEach(item => {
        item.variants.forEach(v => {
            const qty = Number(v.qty || 0);
            const cost = Number(v.cost || 0);
            if (qty <= 0) return;

            let prodRecord = products.find(p =>
                (p.name || '').toLowerCase() === (item.name || '').toLowerCase() &&
                (p.size || '') === (v.size || '') &&
                (p.color || '') === (v.color || '')
            );

            if (!prodRecord) {
                maxProdId++;
                prodRecord = {
                    id: maxProdId,
                    code: item.code || '#' + (100 + maxProdId),
                    name: item.name,
                    category: item.category || 'عام',
                    size: v.size || '',
                    color: v.color || '',
                    base_cost: cost,
                    price: Number(item.retail) || (cost * 1.5),
                    image: v.image || item.image || null
                };
                products.push(prodRecord);
            } else {
                if (item.retail && Number(item.retail) > 0) {
                    prodRecord.price = Number(item.retail);
                }
                prodRecord.base_cost = cost;
                if (v.image) {
                    prodRecord.image = v.image;
                }
            }

            maxPurchId++;
            purchases.push({
                id: maxPurchId,
                invoice_id: invNo,
                invoice_type: isOpening ? 'opening_stock' : 'purchase',
                product_id: prodRecord.id,
                product_name: prodRecord.name,
                size: prodRecord.size || '',
                color: prodRecord.color || '',
                quantity: qty,
                unit_cost: cost,
                total_cost: qty * cost,
                supplier: sup,
                payment_method: method,
                bank_name: !isOpening ? ((document.getElementById('purchBankName')?.value || '').trim() || null) : null,
                bank_account: !isOpening ? ((document.getElementById('purchBankAccount')?.value || '').trim() || null) : null,
                bank_ref: !isOpening ? ((document.getElementById('purchBankRef')?.value || '').trim() || null) : null,
                note: note || (isOpening ? `إدخال رصيد افتتاحي للمخزون (سند #${invNo})` : `توريد من فاتورة ${invNo}`),
                created_at: new Date(date).toISOString()
            });
        });
    });

    saveProducts(products);
    savePurchases(purchases);

    if (!isOpening) {
        const merchants = typeof getMerchants === 'function' ? getMerchants() : [];
        let merchant = merchants.find(m => m.name === sup);
        if (!merchant && sup) {
            let maxMId = merchants.length > 0 ? Math.max(...merchants.map(m => m.id)) : 0;
            merchant = { id: maxMId + 1, name: sup, phone: '', balance: 0 };
            merchants.push(merchant);
            if (typeof saveMerchants === 'function') saveMerchants(merchants);
        }

        if (sup && typeof getMerchantTransactions === 'function' && typeof saveMerchantTransactions === 'function') {
            const txs = getMerchantTransactions();
            let maxTxId = txs.length > 0 ? Math.max(...txs.map(x => x.id)) : 0;

            // منع تكرار قيد فاتورة المشتريات في حسابات الموردين
            const invoiceExists = txs.some(x => x.type === 'invoice' && x.reference === invNo && x.merchant_name === sup);
            if (!invoiceExists) {
                maxTxId++;
                txs.push({
                    id: maxTxId,
                    merchant_name: sup,
                    type: 'invoice',
                    reference: invNo,
                    amount: t.totalAmount,
                    note: note || `فاتورة مشتريات #${invNo}`,
                    created_at: new Date(date).toISOString()
                });
            }

            if (t.paid > 0) {
                const payRef = 'PAY-' + invNo;
                const paymentExists = txs.some(x => x.type === 'payment' && x.reference === payRef && x.merchant_name === sup);
                if (!paymentExists) {
                    maxTxId++;
                    txs.push({
                        id: maxTxId,
                        merchant_name: sup,
                        type: 'payment',
                        payment_method: method,
                        reference: payRef,
                        amount: t.paid,
                        note: `دفعة لفاتورة مشتريات #${invNo}`,
                        created_at: new Date(date).toISOString()
                    });
                }
            }
            saveMerchantTransactions(txs);
        }
    }

    localStorage.removeItem('clothing_store_purch_draft');
    purchPosted = true;

    if (isOpening) {
        showToast('🎉 تم تسجيل بضاعة أول المدة بنجاح وأصبحت جاهزة في الكاشير والمخزون!', 'success');
    } else {
        showToast('🎉 تم اعتماد فاتورة المشتريات وتحديث المخزون بنجاح!', 'success');
    }

    fillAllDropdowns();
    fillPurchSuppliers();
    loadPurchasesTable();
    loadInventoryTable();
    loadPosProducts();
    loadDashboard();
    loadReports();

    setTimeout(() => {
        startNewPurchInvoice();
    }, 1200);
}

function deletePurchaseInvoice(invId) {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة بالكامل؟ سيتم إعادة حساب المخزون.')) return;
    
    const purchases = getPurchases().filter(p => (p.invoice_id || 'OLD-' + p.id) !== invId);
    savePurchases(purchases);
    
    showToast('✅ تم حذف الفاتورة');
    fillAllDropdowns();
    loadPurchasesTable();
    loadInventoryTable();
    loadPosProducts();
    loadDashboard();
}

function loadPurchasesTable() {
    const tbody = document.getElementById('purchasesTableBody');
    if (!tbody) return;
    
    const purchases = getPurchases();
    
    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">لا توجد فواتير مشتريات مسجلة</td></tr>';
        return;
    }

    const invoicesMap = {};
    purchases.forEach(p => {
        const invId = p.invoice_id || 'OLD-' + p.id; 
        if (!invoicesMap[invId]) {
            const isOpening = (p.invoice_type === 'opening_stock' || invId.startsWith('INIT-') || (p.supplier && p.supplier.includes('رصيد افتتاحي')));
            invoicesMap[invId] = {
                id: invId,
                isOpening: isOpening,
                date: p.created_at,
                supplier: p.supplier || '-',
                note: p.note || '',
                itemsCount: 0,
                totalQty: 0,
                totalCost: 0,
                items: []
            };
        }
        invoicesMap[invId].itemsCount++;
        invoicesMap[invId].totalQty += Number(p.quantity);
        invoicesMap[invId].totalCost += Number(p.total_cost);
        invoicesMap[invId].items.push(p);
    });

    const invoices = Object.values(invoicesMap).sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = invoices.map((inv) => {
        const idBadge = inv.isOpening
            ? `<strong style="color:#0284c7;font-family:monospace;font-size:0.95rem;">#${escapeHtml(inv.id)}</strong> <span class="badge info" style="font-size:0.7rem;vertical-align:middle;"><i class="fas fa-boxes"></i> رصيد افتتاحي</span>`
            : `<strong style="color:var(--primary);font-family:monospace;font-size:0.95rem;">#${escapeHtml(inv.id)}</strong>`;

        const supText = inv.isOpening
            ? `<strong style="color:#0284c7;"><i class="fas fa-warehouse"></i> ${escapeHtml(inv.supplier)}</strong>`
            : `<strong>${escapeHtml(inv.supplier)}</strong>`;

        return `
        <tr>
            <td>${idBadge}</td>
            <td style="font-size:.82rem;">${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
            <td>${supText} ${inv.note ? '<br><small style="color:var(--gray); font-size:0.75rem;">' + escapeHtml(inv.note) + '</small>' : ''}</td>
            <td><span class="badge primary">${inv.itemsCount} أصناف</span></td>
            <td><span class="badge success">${inv.totalQty} قطع</span></td>
            <td><strong style="color:var(--primary);font-size:0.95rem;">₪${inv.totalCost.toFixed(2)}</strong></td>
            <td>
                <div style="display:flex;gap:6px;">
                    <button class="btn-icon" onclick="viewPurchaseInvoiceDetails(${jsArg(inv.id)})" title="عرض تفاصيل الفاتورة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon danger" onclick="deletePurchaseInvoice(${jsArg(inv.id)})" title="حذف الفاتورة بالكامل">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function viewPurchaseInvoiceDetails(invId) {
    const purchases = getPurchases().filter(p => (p.invoice_id || 'OLD-' + p.id) === invId);
    if (purchases.length === 0) {
        showToast('لم يتم العثور على بيانات الفاتورة', 'error');
        return;
    }

    const first = purchases[0];
    const isOpening = (first.invoice_type === 'opening_stock' || invId.startsWith('INIT-') || (first.supplier && first.supplier.includes('رصيد افتتاحي')));
    const totalQty = purchases.reduce((s, p) => s + Number(p.quantity), 0);
    const totalCost = purchases.reduce((s, p) => s + Number(p.total_cost), 0);

    const titleEl = document.getElementById('purchModalTitle');
    if (titleEl) {
        titleEl.innerHTML = isOpening
            ? `<i class="fas fa-boxes text-primary"></i> سند إدخال بضاعة أول المدة #${escapeHtml(invId)}`
            : `<i class="fas fa-file-invoice text-primary"></i> فاتورة مشتريات #${escapeHtml(invId)}`;
    }

    const bodyEl = document.getElementById('purchInvoiceDetailsBody');
    if (!bodyEl) return;

    let rowsHtml = purchases.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(p.product_name)}</strong></td>
            <td>${escapeHtml(p.size || '—')}</td>
            <td>${escapeHtml(p.color || '—')}</td>
            <td><span class="badge success">${p.quantity}</span></td>
            <td>₪${Number(p.unit_cost).toFixed(2)}</td>
            <td><strong>₪${Number(p.total_cost).toFixed(2)}</strong></td>
        </tr>
    `).join('');

    bodyEl.innerHTML = `
        <div style="background:#f8fafc;padding:14px;border-radius:12px;margin-bottom:16px;border:1px solid #e2e8f0;display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;">
            <div><span style="color:var(--gray);font-size:0.8rem;">رقم السند/الفاتورة:</span> <strong style="display:block;">#${escapeHtml(invId)}</strong></div>
            <div><span style="color:var(--gray);font-size:0.8rem;">${isOpening ? 'نوع العملية:' : 'المورد:'}</span> <strong style="display:block;">${escapeHtml(first.supplier || (isOpening ? 'رصيد افتتاحي (مخزون المتجر)' : 'مورد عام'))}</strong></div>
            <div><span style="color:var(--gray);font-size:0.8rem;">التاريخ:</span> <strong style="display:block;">${new Date(first.created_at).toLocaleDateString('ar-EG')}</strong></div>
            <div><span style="color:var(--gray);font-size:0.8rem;">حالة القيد:</span> <strong style="display:block;">${isOpening ? 'بضاعة مملوكة للمتجر (رأسمال بدون ديون)' : (first.payment_method === 'bank' ? 'تحويل بنكي / محفظة' : (first.payment_method === 'credit' ? 'آجل' : 'نقدي'))}</strong></div>
            ${!isOpening && first.bank_name ? `<div><span style="color:var(--gray);font-size:0.8rem;">البنك:</span> <strong style="display:block;">${escapeHtml(first.bank_name)}</strong></div>` : ''}
            ${!isOpening && first.bank_ref ? `<div><span style="color:var(--gray);font-size:0.8rem;">رقم الحوالة:</span> <strong style="display:block;">${escapeHtml(first.bank_ref)}</strong></div>` : ''}
        </div>

        <div class="table-responsive" style="max-height:300px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;">
            <table>
                <thead>
                    <tr><th>#</th><th>المنتج</th><th>المقاس</th><th>اللون</th><th>الكمية</th><th>سعر الشراء</th><th>الإجمالي</th></tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;background:#eef2ff;padding:12px 16px;border-radius:10px;margin-top:14px;">
            <div><span>إجمالي القطع: </span><strong style="color:var(--primary);">${totalQty} قطعة</strong></div>
            <div><span>التكلفة الإجمالية: </span><strong style="color:var(--primary);font-size:1.15rem;">₪${totalCost.toFixed(2)}</strong></div>
        </div>
    `;

    const printBtn = document.getElementById('purchPrintBtn');
    if (printBtn) {
        printBtn.onclick = () => printPurchaseInvoice(invId);
    }

    openModal('purchInvoiceDetailsModal');
}

function printPurchaseInvoice(invId) {
    const purchases = getPurchases().filter(p => (p.invoice_id || 'OLD-' + p.id) === invId);
    if (purchases.length === 0) return;
    const first = purchases[0];
    const isOpening = (first.invoice_type === 'opening_stock' || invId.startsWith('INIT-') || (first.supplier && first.supplier.includes('رصيد افتتاحي')));
    const totalCost = purchases.reduce((s, p) => s + Number(p.total_cost), 0);

    const itemsHTML = purchases.map(p => `
        <tr>
            <td>${escapeHtml(p.product_name)} (${escapeHtml(p.size || '-')} ${escapeHtml(p.color ? '• ' + p.color : '')})</td>
            <td>${p.quantity}</td>
            <td>₪${Number(p.unit_cost).toFixed(2)}</td>
            <td>₪${Number(p.total_cost).toFixed(2)}</td>
        </tr>
    `).join('');

    const w = window.open('', '_blank', 'width=500,height=700');
    w.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${isOpening ? 'سند إدخال بضاعة أول المدة' : 'فاتورة توريد مشتريات'} #${escapeHtml(invId)}</title>
            <style>
                body{font-family:'Cairo',sans-serif;padding:24px;max-width:480px;margin:0 auto}
                h2{text-align:center;margin:0 0 5px}
                .meta{font-size:13px;color:#475569;margin-bottom:15px;line-height:1.8;border-bottom:1px solid #e2e8f0;padding-bottom:10px;}
                table{width:100%;border-collapse:collapse;font-size:13px;margin:15px 0}
                th{background:#f1f5f9;padding:8px;text-align:right}
                td{padding:8px;border-bottom:1px solid #eee}
                .total{font-size:18px;font-weight:bold;text-align:left;margin-top:15px;padding-top:10px;border-top:2px solid #000}
            </style>
        </head>
        <body>
            <h2>متجر الأناقة للملابس</h2>
            <div style="text-align:center;color:#64748b;font-size:12px;margin-bottom:10px;">${isOpening ? '📦 سند إدخال بضاعة أول المدة (رصيد افتتاحي للمخزون)' : 'سند استلام بضاعة / فاتورة مشتريات'}</div>
            <div class="meta">
                <strong>رقم السند/الفاتورة:</strong> #${escapeHtml(invId)}<br>
                <strong>${isOpening ? 'الجهة:' : 'المورد:'}</strong> ${escapeHtml(first.supplier || (isOpening ? 'رصيد افتتاحي (مخزون المتجر)' : 'مورد عام'))}<br>
                <strong>التاريخ:</strong> ${new Date(first.created_at).toLocaleString('ar-EG')}<br>
                <strong>القيد المالي:</strong> ${isOpening ? 'رأسمال مخزون مملوك للمتجر (بدون ديون)' : (first.payment_method === 'bank' ? 'تحويل بنكي' : (first.payment_method === 'credit' ? 'آجل' : 'نقدي'))}<br>
            </div>
            <table>
                <thead>
                    <tr><th>الصنف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
            </table>
            <div class="total">الإجمالي الكلي: ₪${totalCost.toFixed(2)}</div>
            <script>window.onload=()=>{window.print();window.close();}<\/script>
        </body>
        </html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

/* ============================================
   19. ديون العملاء
   ============================================ */
function loadDebtsTable() {
    const summary = getCustomerDebtSummary();
    const tbody = document.getElementById('debtsTableBody');
    const search = (document.getElementById('debtsSearch')?.value || '').toLowerCase().trim();

    let totalDebt = 0, totalPaid = 0, totalBalance = 0, customerCount = 0;

    Object.values(summary).forEach(c => {
        totalDebt += c.totalDebt;
        totalPaid += c.totalPaid;
        if (c.balance > 0) {
            totalBalance += c.balance;
            customerCount++;
        }
    });

    document.getElementById('debtsStatsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-hand-holding-usd"></i></div><div class="stat-label">إجمالي الديون</div><div class="stat-value">₪${totalDebt.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-icon success"><i class="fas fa-check-circle"></i></div><div class="stat-label">المدفوعات</div><div class="stat-value">₪${totalPaid.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-hourglass-half"></i></div><div class="stat-label">المتبقي</div><div class="stat-value" style="color:var(--danger);">₪${totalBalance.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-users"></i></div><div class="stat-label">عدد المدينين</div><div class="stat-value">${customerCount}</div></div>
    `;

    let customers = Object.values(summary).filter(c => c.balance > 0.01);

    if (search) {
        customers = customers.filter(c =>
            c.name.toLowerCase().includes(search) ||
            (c.phone || '').toLowerCase().includes(search)
        );
    }

    const datalist = document.getElementById('customerList');
    if (datalist) {
        datalist.innerHTML = Object.values(summary)
            .filter(c => c.balance > 0.01)
            .map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.phone)}</option>`)
            .join('');
    }

    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">لا توجد ديون</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td dir="ltr">${escapeHtml(c.phone)}</td>
            <td>₪${c.totalDebt.toFixed(2)}</td>
            <td style="color:var(--success);">₪${c.totalPaid.toFixed(2)}</td>
            <td><strong style="color:var(--danger);font-size:1.05rem;">₪${c.balance.toFixed(2)}</strong></td>
            <td>
                <button class="btn-icon" onclick="viewCustomerStatement(${jsArg(c.name)}, ${jsArg(c.phone)})" title="كشف حساب">
                    <i class="fas fa-file-alt"></i>
                </button>
                <button class="btn-icon success" onclick="quickPay(${jsArg(c.name)}, ${c.balance})" title="دفعة سريعة">
                    <i class="fas fa-money-bill-wave"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function quickPay(customerName, balance) {
    const amount = prompt(
        `تسجيل دفعة من ${customerName}\n\nالمتبقي: ₪${balance.toFixed(2)}\n\nأدخل المبلغ المدفوع:`,
        balance.toFixed(2)
    );
    if (!amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        showToast('قيمة غير صحيحة', 'error');
        return;
    }

    const debts = getCustomerDebts();
    const customer = debts.find(d => d.customer_name === customerName);
    const phone = customer ? customer.customer_phone : '';

    debts.push({
        id: debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1,
        customer_name: customerName,
        customer_phone: phone,
        type: 'payment',
        amount: parsedAmount,
        note: 'دفعة',
        created_at: new Date().toISOString(),
    });
    saveCustomerDebts(debts);

    showToast(`✅ تم تسجيل دفعة ₪${parsedAmount.toFixed(2)} من ${customerName}`);
    loadDebtsTable();
    loadDashboard();
    loadReports();
}

function saveCustomerPayment() {
    const name = document.getElementById('debtPayName').value.trim();
    const amount = parseFloat(document.getElementById('debtPayAmount').value);
    const note = document.getElementById('debtPayNote').value.trim();

    if (!name || isNaN(amount) || amount <= 0) {
        showToast('يرجى ملء الحقول', 'error');
        return;
    }

    const debts = getCustomerDebts();
    const customer = debts.find(d => d.customer_name === name);
    const phone = customer ? customer.customer_phone : '';

    debts.push({
        id: debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1,
        customer_name: name,
        customer_phone: phone,
        type: 'payment',
        amount: amount,
        note: note || 'دفعة نقدية',
        created_at: new Date().toISOString(),
    });
    saveCustomerDebts(debts);

    document.getElementById('debtPayName').value = '';
    document.getElementById('debtPayAmount').value = '';
    document.getElementById('debtPayNote').value = '';

    showToast('✅ تم تسجيل الدفعة');
    loadDebtsTable();
    loadDashboard();
    loadReports();
}

function viewCustomerStatement(name, phone) {
    const transactions = getCustomerDebts()
        .filter(d => d.customer_name === name && d.customer_phone === phone)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let running = 0;
    let html = `كشف حساب: ${name}\nالهاتف: ${phone}\n\n━━━━━━━━━━━━━━━━\n\n`;

    transactions.forEach(t => {
        if (t.type === 'invoice') running += Number(t.amount);
        else running -= Number(t.amount);

        html += `📅 ${new Date(t.created_at).toLocaleDateString('ar-EG')}\n`;
        html += `${t.type === 'invoice' ? '📄 دين' : '💰 دفعة'}: ₪${Number(t.amount).toFixed(2)}\n`;
        if (t.note) html += `📝 ${t.note}\n`;
        html += `الرصيد: ₪${running.toFixed(2)}\n\n`;
    });

    html += `━━━━━━━━━━━━━━━━\n`;
    html += `الرصيد النهائي: ₪${running.toFixed(2)}`;

    alert(html);
}

/* ============================================
   20. الموظفين
   ============================================ */
function loadEmployeesTable() {
    const tbody = document.getElementById('employeesTableBody');
    const users = getUsers().filter(u => u.role !== 'owner');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">لا يوجد موظفون</td></tr>';
        return;
    }

    tbody.innerHTML = users.map((u, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(u.name)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td><span class="badge ${u.role === 'manager' ? 'info' : 'primary'}">${u.role === 'manager' ? 'مدير فرع' : 'كاشير'}</span></td>
            <td>${escapeHtml(u.branch_id ? getBranchName(u.branch_id) : '-')}</td>
            <td>
                <button class="btn-icon" onclick="editEmployee(${u.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon danger" onclick="deleteEmployee(${u.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openEmployeeModal() {
    document.getElementById('employeeModalTitle').textContent = 'موظف جديد';
    document.getElementById('employeeId').value = '';
    document.getElementById('emp-name').value = '';
    document.getElementById('emp-email').value = '';
    document.getElementById('emp-password').value = '';
    document.getElementById('emp-role').value = 'cashier';
    fillAllDropdowns();
    document.getElementById('employeeModal').classList.add('show');
}

function editEmployee(id) {
    const u = getUsers().find(x => x.id === id);
    if (!u) return;

    document.getElementById('employeeModalTitle').textContent = 'تعديل موظف';
    document.getElementById('employeeId').value = u.id;
    document.getElementById('emp-name').value = u.name;
    document.getElementById('emp-email').value = u.email;
    document.getElementById('emp-password').value = u.password;
    document.getElementById('emp-role').value = u.role;
    fillAllDropdowns();
    document.getElementById('emp-branch').value = u.branch_id || '';
    document.getElementById('employeeModal').classList.add('show');
}

function saveEmployee(e) {
    e.preventDefault();

    const id = document.getElementById('employeeId').value;
    const name = document.getElementById('emp-name').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    const password = document.getElementById('emp-password').value;
    const role = document.getElementById('emp-role').value;
    const branch_id = parseInt(document.getElementById('emp-branch').value) || null;

    if (!name || !email || !password) {
        showToast('يرجى ملء الحقول', 'error');
        return;
    }

    const users = getUsers();

    if (id) {
        const index = users.findIndex(u => u.id === parseInt(id));
        if (index !== -1) {
            users[index] = { ...users[index], name, email, password, role, branch_id };
        }
        showToast('تم تحديث الموظف');
    } else {
        const employeesCount = users.filter(u => u.role !== 'owner').length;
        if (IS_DEMO && employeesCount >= DEMO_LIMITS.employees) {
            showDemoLimit('موظف', DEMO_LIMITS.employees);
            return;
        }

        const emailExists = users.find(u => u.email === email);
        if (emailExists) {
            showToast('البريد مستخدم مسبقاً', 'error');
            return;
        }

        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({ id: newId, name, email, password, role, branch_id });
        showToast('تمت إضافة الموظف');
    }

    saveUsers(users);
    closeModal('employeeModal');
    loadEmployeesTable();
}

function deleteEmployee(id) {
    if (!confirm('حذف هذا الموظف؟')) return;
    saveUsers(getUsers().filter(u => u.id !== id));
    loadEmployeesTable();
    showToast('تم حذف الموظف');
}

/* ============================================
   21. الفروع
   ============================================ */
function loadBranchesTable() {
    const tbody = document.getElementById('branchesTableBody');
    const branches = getBranches();

    if (branches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">لا توجد فروع</td></tr>';
        return;
    }

    tbody.innerHTML = branches.map((b, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(b.name)}</strong></td>
            <td><span class="badge primary">${escapeHtml(b.code || '-')}</span></td>
            <td>${escapeHtml(b.phone || '-')}</td>
            <td>${escapeHtml(b.address || '-')}</td>
            <td>
                <button class="btn-icon" onclick="editBranch(${b.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon danger" onclick="deleteBranch(${b.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openBranchModal() {
    document.getElementById('branchModalTitle').textContent = 'فرع جديد';
    document.getElementById('branchId').value = '';
    ['br-name', 'br-code', 'br-phone', 'br-address'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('branchModal').classList.add('show');
}

function editBranch(id) {
    const b = getBranches().find(x => x.id === id);
    if (!b) return;

    document.getElementById('branchModalTitle').textContent = 'تعديل فرع';
    document.getElementById('branchId').value = b.id;
    document.getElementById('br-name').value = b.name;
    document.getElementById('br-code').value = b.code || '';
    document.getElementById('br-phone').value = b.phone || '';
    document.getElementById('br-address').value = b.address || '';
    document.getElementById('branchModal').classList.add('show');
}

function saveBranch(e) {
    e.preventDefault();

    const id = document.getElementById('branchId').value;
    const name = document.getElementById('br-name').value.trim();
    const code = document.getElementById('br-code').value.trim();
    const phone = document.getElementById('br-phone').value.trim();
    const address = document.getElementById('br-address').value.trim();

    if (!name) {
        showToast('أدخل اسم الفرع', 'error');
        return;
    }

    const branches = getBranches();

    if (id) {
        const index = branches.findIndex(b => b.id === parseInt(id));
        if (index !== -1) {
            branches[index] = { ...branches[index], name, code, phone, address };
        }
        showToast('تم تحديث الفرع');
    } else {
        if (IS_DEMO && branches.length >= DEMO_LIMITS.branches) {
            showDemoLimit('فرع', DEMO_LIMITS.branches);
            return;
        }

        const newId = branches.length > 0 ? Math.max(...branches.map(b => b.id)) + 1 : 1;
        branches.push({ id: newId, name, code, phone, address });
        showToast('تمت إضافة الفرع');
    }

    saveBranches(branches);
    closeModal('branchModal');
    loadBranchesTable();
    fillAllDropdowns();
}

function deleteBranch(id) {
    if (!confirm('حذف هذا الفرع؟')) return;
    saveBranches(getBranches().filter(b => b.id !== id));
    loadBranchesTable();
    showToast('تم حذف الفرع');
}

/* ============================================
   22. الموردين وحساباتهم
   ============================================ */
function loadMerchantsTable() {
    const summary = getMerchantSummary();
    const tbody = document.getElementById('merchantsTableBody');

    const totalInvoices = Object.values(summary).reduce((s, m) => s + m.totalInvoices, 0);
    const totalPaid = Object.values(summary).reduce((s, m) => s + m.totalPaid, 0);
    const totalBalance = totalInvoices - totalPaid;

    const statsGrid = document.getElementById('merchantStatsGrid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-file-invoice"></i></div><div class="stat-label">إجمالي الفواتير</div><div class="stat-value">₪${totalInvoices.toFixed(2)}</div></div>
            <div class="stat-card"><div class="stat-icon success"><i class="fas fa-check-circle"></i></div><div class="stat-label">المدفوعات</div><div class="stat-value">₪${totalPaid.toFixed(2)}</div></div>
            <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-hourglass-half"></i></div><div class="stat-label">الرصيد المتبقي</div><div class="stat-value" style="color:var(--danger);">₪${totalBalance.toFixed(2)}</div></div>
        `;
    }

    const merchants = Object.values(summary);

    if (tbody) {
        if (merchants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty">لا توجد حسابات تجار مسجلة</td></tr>';
        } else {
            tbody.innerHTML = merchants.map(m => `
                <tr>
                    <td><strong>${escapeHtml(m.name)}</strong></td>
                    <td>₪${m.totalInvoices.toFixed(2)}</td>
                    <td>₪${m.totalPaid.toFixed(2)}</td>
                    <td><strong style="color:${m.balance > 0 ? 'var(--danger)' : 'var(--success)'};">₪${m.balance.toFixed(2)}</strong></td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="viewMerchantStatement(${jsArg(m.name)})" title="كشف حساب تفصيلي">
                            <i class="fas fa-file-alt text-primary"></i> كشف الحساب
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    const paySelect = document.getElementById('pay-name');
    if (paySelect) {
        const currentVal = paySelect.value;
        const allSupplierNames = new Set();
        if (typeof getMerchants === 'function') {
            getMerchants().forEach(m => { if (m.name) allSupplierNames.add(m.name); });
        }
        merchants.forEach(m => allSupplierNames.add(m.name));
        if (typeof getPurchases === 'function') {
            getPurchases().forEach(p => {
                if (p.supplier && !p.supplier.includes('افتتاحي')) allSupplierNames.add(p.supplier);
            });
        }

        const sortedNames = Array.from(allSupplierNames).sort();
        paySelect.innerHTML = '<option value="">-- اختر المورد --</option>' + sortedNames.map(name => {
            const bal = summary[name] ? summary[name].balance : 0;
            return `<option value="${escapeHtml(name)}" data-balance="${bal}">${escapeHtml(name)} (الرصيد: ₪${bal.toFixed(2)})` + '</option>';
        }).join('');

        if (currentVal && allSupplierNames.has(currentVal)) {
            paySelect.value = currentVal;
        }
        updatePayMerchantBalance();
    }
}
window.loadMerchantsTable = loadMerchantsTable;

function updatePayMerchantBalance() {
    const sel = document.getElementById('pay-name');
    const hint = document.getElementById('payMerchantBalanceHint');
    if (!sel || !hint) return;
    const opt = sel.options[sel.selectedIndex];
    if (!sel.value || !opt) {
        hint.innerHTML = '';
        return;
    }
    const bal = parseFloat(opt.getAttribute('data-balance')) || 0;
    if (bal > 0) {
        hint.innerHTML = `<span style="color:#b91c1c;font-weight:700;"><i class="fas fa-exclamation-circle"></i> رصيد مستحق للمورد بذمتنا: ₪${bal.toFixed(2)}</span>`;
    } else if (bal < 0) {
        hint.innerHTML = `<span style="color:#15803d;font-weight:700;"><i class="fas fa-check-circle"></i> رصيد دائن للمتجر (لنا عند المورد): ₪${Math.abs(bal).toFixed(2)}</span>`;
    } else {
        hint.innerHTML = `<span style="color:#64748b;font-weight:700;"><i class="fas fa-check"></i> الحساب خالص تماماً (الرصيد: ₪0.00)</span>`;
    }
}
window.updatePayMerchantBalance = updatePayMerchantBalance;

function payFullMerchantBalance() {
    const sel = document.getElementById('pay-name');
    if (!sel || !sel.value) {
        showToast('يرجى اختيار المورد أولاً', 'error');
        return;
    }
    const opt = sel.options[sel.selectedIndex];
    const bal = parseFloat(opt.getAttribute('data-balance')) || 0;
    if (bal <= 0) {
        showToast('لا يوجد رصيد مستحق على هذا المورد لسداده', 'info');
        return;
    }
    const amountInput = document.getElementById('pay-amount');
    if (amountInput) {
        amountInput.value = bal.toFixed(2);
    }
}
window.payFullMerchantBalance = payFullMerchantBalance;

function saveMerchantPayment() {
    const sel = document.getElementById('pay-name');
    const name = sel ? sel.value.trim() : '';
    const amount = parseFloat(document.getElementById('pay-amount')?.value);
    const method = document.getElementById('pay-method')?.value || 'cash';
    const ref = (document.getElementById('pay-ref')?.value || '').trim() || ('PAY-' + Date.now());
    const note = (document.getElementById('pay-note')?.value || '').trim();

    if (!name) {
        showToast('يرجى اختيار المورد', 'error');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر', 'error');
        return;
    }

    const tx = getMerchantTx();
    const newId = tx.length > 0 ? Math.max(...tx.map(t => t.id)) + 1 : 1;
    tx.push({
        id: newId,
        merchant_name: name,
        type: 'payment',
        payment_method: method,
        reference: ref,
        amount: amount,
        note: note || `سند صرف للمورد (${name})`,
        created_at: new Date().toISOString()
    });
    saveMerchantTx(tx);

    if (document.getElementById('pay-amount')) document.getElementById('pay-amount').value = '';
    if (document.getElementById('pay-ref')) document.getElementById('pay-ref').value = '';
    if (document.getElementById('pay-note')) document.getElementById('pay-note').value = '';

    showToast(`✅ تم تسجيل سند الصرف بقيمة ₪${amount.toFixed(2)} بنجاح`);
    loadMerchantsTable();
    if (typeof loadCashboxData === 'function') loadCashboxData();
}
window.saveMerchantPayment = saveMerchantPayment;

function viewMerchantStatement(merchantName) {
    const summary = getMerchantSummary();
    const merchant = summary[merchantName] || { name: merchantName, totalInvoices: 0, totalPaid: 0, balance: 0, transactions: [] };
    const txs = [...merchant.transactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const titleEl = document.getElementById('merchantStatementTitle');
    const bodyEl = document.getElementById('merchantStatementBody');
    const printBtn = document.getElementById('printMerchantStatementBtn');

    if (titleEl) {
        titleEl.innerHTML = `<i class="fas fa-file-invoice-dollar text-primary"></i> كشف حساب المورد: <span style="color:#0284c7;">${escapeHtml(merchantName)}</span>`;
    }

    let running = 0;
    const rowsHtml = txs.map(t => {
        const isInv = (t.type === 'invoice');
        if (isInv) running += Number(t.amount || 0);
        else running -= Number(t.amount || 0);

        const typeBadge = isInv 
            ? '<span class="badge warning"><i class="fas fa-file-invoice"></i> فاتورة توريد</span>'
            : '<span class="badge success"><i class="fas fa-money-bill-wave"></i> سند صرف سداد</span>';

        const methodLabel = t.payment_method === 'cash' ? '💵 كاش' : (t.payment_method === 'bank' ? '🏛️ بنكي' : (t.payment_method === 'check' ? '📜 شيك' : ''));

        return `
            <tr>
                <td>${new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                <td>${typeBadge}</td>
                <td><strong>${escapeHtml(t.reference || '-')}</strong></td>
                <td><small>${methodLabel} ${escapeHtml(t.note || '')}</small></td>
                <td style="color:#b91c1c;font-weight:700;">${isInv ? '₪' + Number(t.amount).toFixed(2) : '-'}</td>
                <td style="color:#15803d;font-weight:700;">${!isInv ? '₪' + Number(t.amount).toFixed(2) : '-'}</td>
                <td style="font-weight:800;color:${running > 0 ? '#b91c1c' : '#15803d'};">₪${running.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:16px;">
                <div style="background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:10px;text-align:center;">
                    <div style="font-size:0.78rem;color:#9a3412;">إجمالي التوريدات (فواتير)</div>
                    <div style="font-size:1.3rem;font-weight:800;color:#c2410c;">₪${merchant.totalInvoices.toFixed(2)}</div>
                </div>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:10px;text-align:center;">
                    <div style="font-size:0.78rem;color:#166534;">إجمالي المسدد (دفعات)</div>
                    <div style="font-size:1.3rem;font-weight:800;color:#15803d;">₪${merchant.totalPaid.toFixed(2)}</div>
                </div>
                <div style="background:${merchant.balance > 0 ? '#fef2f2' : '#f0fdf4'};border:1px solid ${merchant.balance > 0 ? '#fecaca' : '#bbf7d0'};padding:12px;border-radius:10px;text-align:center;">
                    <div style="font-size:0.78rem;color:${merchant.balance > 0 ? '#991b1b' : '#166534'};">الرصيد المستحق الحالي</div>
                    <div style="font-size:1.3rem;font-weight:800;color:${merchant.balance > 0 ? '#b91c1c' : '#15803d'};">₪${merchant.balance.toFixed(2)}</div>
                </div>
            </div>

            <div class="table-responsive">
                <table style="width:100%;font-size:0.85rem;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th>التاريخ</th>
                            <th>نوع الحركة</th>
                            <th>رقم المرجع / الفاتورة</th>
                            <th>البيان / الطريقة</th>
                            <th>قيمة الفاتورة (+)</th>
                            <th>الدفعة المسددة (-)</th>
                            <th>الرصيد التراكمي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="7" class="text-center" style="padding:20px;color:#94a3b8;">لا توجد حركات مسجلة لهذا المورد</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (printBtn) {
        printBtn.onclick = () => printMerchantStatement(merchantName);
    }

    openModal('merchantStatementModal');
}
window.viewMerchantStatement = viewMerchantStatement;

function printMerchantStatement(merchantName) {
    const summary = getMerchantSummary();
    const merchant = summary[merchantName] || { name: merchantName, totalInvoices: 0, totalPaid: 0, balance: 0, transactions: [] };
    const txs = [...merchant.transactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let running = 0;
    const rowsHtml = txs.map(t => {
        const isInv = (t.type === 'invoice');
        if (isInv) running += Number(t.amount || 0);
        else running -= Number(t.amount || 0);

        return `
            <tr>
                <td style="padding:7px;border:1px solid #cbd5e1;text-align:center;">${new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                <td style="padding:7px;border:1px solid #cbd5e1;">${isInv ? 'فاتورة توريد' : 'سند صرف سداد'}</td>
                <td style="padding:7px;border:1px solid #cbd5e1;text-align:center;">${escapeHtml(t.reference || '-')}</td>
                <td style="padding:7px;border:1px solid #cbd5e1;">${escapeHtml(t.note || '')}</td>
                <td style="padding:7px;border:1px solid #cbd5e1;text-align:right;">${isInv ? '₪' + Number(t.amount).toFixed(2) : '-'}</td>
                <td style="padding:7px;border:1px solid #cbd5e1;text-align:right;">${!isInv ? '₪' + Number(t.amount).toFixed(2) : '-'}</td>
                <td style="padding:7px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">₪${running.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const win = window.open('', '_blank', 'width=850,height=750');
    win.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>كشف حساب مورد - ${escapeHtml(merchantName)}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; margin: 0; color: #1e293b; }
                .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
                .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
                .kpi-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; background: #f8fafc; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; }
                .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; font-weight: bold; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="header">
                <h2 style="margin:0 0 6px;">متجر الألبسة والأناقة</h2>
                <h4 style="margin:0;color:#475569;">كشف حساب تفصيلي للمورد: ${escapeHtml(merchantName)}</h4>
                <div style="font-size:0.9rem;margin-top:6px;color:#0f172a;">تاريخ التقرير: <strong>${new Date().toLocaleDateString('ar-EG')}</strong></div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-box">
                    <div style="font-size:0.75rem;color:#64748b;">إجمالي التوريدات (فواتير)</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#c2410c;">₪${merchant.totalInvoices.toFixed(2)}</div>
                </div>
                <div class="kpi-box">
                    <div style="font-size:0.75rem;color:#64748b;">إجمالي المسدد (دفعات)</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#15803d;">₪${merchant.totalPaid.toFixed(2)}</div>
                </div>
                <div class="kpi-box" style="background:#fef2f2;">
                    <div style="font-size:0.75rem;color:#991b1b;">الرصيد المستحق النهائي</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#b91c1c;">₪${merchant.balance.toFixed(2)}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>نوع الحركة</th>
                        <th>رقم المرجع / الفاتورة</th>
                        <th>البيان</th>
                        <th>الفاتورة (+)</th>
                        <th>الدفعة (-)</th>
                        <th>الرصيد التراكمي</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="signatures">
                <div>توقيع المحاسب / الإدارة: ....................</div>
                <div>توقيع واستلام المورد: ....................</div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}
window.printMerchantStatement = printMerchantStatement;

/* ============================================
   23. المصروفات
   ============================================ */
function saveFixedExpense() {
    const type = document.getElementById('fixed-type').value;
    const amount = parseFloat(document.getElementById('fixed-amount').value);
    const period = document.getElementById('fixed-period').value.trim();

    if (isNaN(amount) || amount <= 0) {
        showToast('أدخل مبلغاً صحيحاً', 'error');
        return;
    }

    const expenses = getFixedExpenses();
    if (IS_DEMO && expenses.length >= DEMO_LIMITS.expenses) {
        showDemoLimit('مصروف', DEMO_LIMITS.expenses);
        return;
    }

    expenses.push({
        id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
        type, amount, period,
        created_at: new Date().toISOString(),
    });
    saveFixedExpenses(expenses);

    document.getElementById('fixed-amount').value = '';
    document.getElementById('fixed-period').value = '';

    showToast('تم حفظ المصروف');
    loadExpensesTable();
}

function saveVariableExpense() {
    const category = document.getElementById('variable-category').value;
    const amount = parseFloat(document.getElementById('variable-amount').value);
    const reason = document.getElementById('variable-reason').value.trim();

    if (isNaN(amount) || amount <= 0 || !reason) {
        showToast('يرجى ملء الحقول', 'error');
        return;
    }

    const expenses = getVariableExpenses();
    expenses.push({
        id: expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1,
        category, amount, reason,
        created_at: new Date().toISOString(),
    });
    saveVariableExpenses(expenses);

    document.getElementById('variable-amount').value = '';
    document.getElementById('variable-reason').value = '';

    showToast('تم حفظ المصروف');
    loadExpensesTable();
}

function loadExpensesTable() {
    const fixed = getFixedExpenses();
    const variable = getVariableExpenses();
    const totalFixed = fixed.reduce((s, e) => s + Number(e.amount), 0);
    const totalVariable = variable.reduce((s, e) => s + Number(e.amount), 0);

    document.getElementById('expensesStatsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-home"></i></div><div class="stat-label">المصروفات الثابتة</div><div class="stat-value">₪${totalFixed.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-bolt"></i></div><div class="stat-label">المصروفات المتغيرة</div><div class="stat-value">₪${totalVariable.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-calculator"></i></div><div class="stat-label">الإجمالي</div><div class="stat-value">₪${(totalFixed + totalVariable).toFixed(2)}</div></div>
    `;

    const all = [
        ...fixed.map(e => ({ ...e, _type: 'ثابت', _label: e.type + (e.period ? ' - ' + e.period : '') })),
        ...variable.map(e => ({ ...e, _type: 'متغير', _label: e.category + ' - ' + e.reason })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const tbody = document.getElementById('expensesTableBody');

    if (all.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">لا توجد مصروفات</td></tr>';
        return;
    }

    tbody.innerHTML = all.map(e => `
        <tr>
            <td style="font-size:.8rem;">${new Date(e.created_at).toLocaleDateString('ar-EG')}</td>
            <td><span class="badge ${e._type === 'ثابت' ? 'warning' : 'danger'}">${e._type}</span></td>
            <td>${escapeHtml(e._label)}</td>
            <td><strong>₪${Number(e.amount).toFixed(2)}</strong></td>
            <td>
                <button class="btn-icon danger" onclick="deleteExpense(${jsArg(e._type)}, ${e.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteExpense(type, id) {
    if (!confirm('حذف هذا المصروف؟')) return;

    if (type === 'ثابت') {
        saveFixedExpenses(getFixedExpenses().filter(e => e.id !== id));
    } else {
        saveVariableExpenses(getVariableExpenses().filter(e => e.id !== id));
    }

    loadExpensesTable();
    showToast('تم الحذف');
}

/* ============================================
   24. التقارير
   ============================================ */
let topChart = null;

function loadReports() {
    const actualRevenue = getActualRevenue();
    const cash = getCashRevenue();
    const receivables = getReceivables();
    const debtPayments = getDebtPaymentsReceived();

    const cogs = getCOGS();
    const expenses = getTotalExpenses();
    const netProfit = getNetProfit();

    document.getElementById('repRevenue').textContent = '₪' + actualRevenue.toFixed(2);
    document.getElementById('repCOGS').textContent = '₪' + cogs.toFixed(2);
    document.getElementById('repExpenses').textContent = '₪' + expenses.total.toFixed(2);
    document.getElementById('repNetProfit').textContent = '₪' + netProfit.toFixed(2);

    if (document.getElementById('repCashRevenue')) {
        document.getElementById('repCashRevenue').textContent = '₪' + cash.toFixed(2);
    }
    if (document.getElementById('repDebtPayments')) {
        document.getElementById('repDebtPayments').textContent = '₪' + debtPayments.toFixed(2);
    }
    if (document.getElementById('repReceivables')) {
        document.getElementById('repReceivables').textContent = '₪' + receivables.toFixed(2);
    }

    const productSales = {};
    getActiveSales().forEach(sale => {
        (sale.items || []).forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + Number(item.quantity);
        });
    });

    const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (topChart) topChart.destroy();

    const ctx = document.getElementById('topProductsChart').getContext('2d');
    topChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(i => i[0]),
            datasets: [{
                label: 'الكمية المباعة',
                data: sorted.map(i => i[1]),
                backgroundColor: '#4f46e5',
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } }
        }
    });

    const out = getOutOfStockProducts();
    const loss = getLossProducts();

    document.getElementById('outOfStockAlerts').innerHTML = out.length === 0
        ? '✅ لا توجد منتجات نافذة'
        : out.map(p => `• ${p.name} (${p.size || '-'})`).join('<br>');

    document.getElementById('lossProductAlerts').innerHTML = loss.length === 0
        ? '✅ لا توجد منتجات خاسرة'
        : loss.map(p => `• ${p.name} - السعر: ₪${p.price} / التكلفة: ₪${getProductAvgCost(p.id).toFixed(2)}`).join('<br>');
}

/* ============================================
   25. طلبات الموقع (Online Orders) - محاكاة
   ============================================ */
let mockOnlineOrders = [];

function simulateNewOnlineOrder() {
    const products = getProducts();
    if(products.length === 0) {
        showToast('يجب إضافة منتجات للمخزون أولاً', 'error');
        return;
    }
    const p = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 3) + 1;

    const demoCustomers = [
        { name: 'أحمد خليل', phone: '0599123456' },
        { name: 'سارة يوسف', phone: '0599876543' },
        { name: 'محمود عثمان', phone: '0568112233' },
        { name: 'ليلى إبراهيم', phone: '0598445566' },
        { name: 'طارق الزين', phone: '0569778899' },
        { name: 'زبون تجريبي', phone: '0599001122' }
    ];
    const cust = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
    
    mockOnlineOrders.push({
        id: 'WEB-' + Math.floor(Math.random() * 90000 + 10000),
        date: new Date().toISOString(),
        customer: cust.name,
        phone: cust.phone,
        productName: p.name,
        quantity: qty,
        total: qty * Number(p.price),
        status: 'pending' // pending, accepted, rejected
    });
    
    showToast('تم استقبال طلب جديد من الموقع!');
    updateOnlineOrdersBadge();
    renderOnlineOrders();
}

function updateOnlineOrdersBadge() {
    const badge = document.getElementById('onlineOrdersBadge');
    if(!badge) return;
    
    const pendingCount = mockOnlineOrders.filter(o => o.status === 'pending').length;
    if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function acceptOnlineOrder(target) {
    if(!confirm('هل تريد الموافقة على هذا الطلب وتحويله للكاشير؟')) return;
    
    let order = null;
    if (typeof target === 'string') {
        order = mockOnlineOrders.find(o => o.id === target);
    } else {
        order = mockOnlineOrders[target];
    }
    if (!order) return;
    order.status = 'accepted';

    try {
        let stored = JSON.parse(localStorage.getItem('store_online_orders_v6')) || [];
        const found = stored.find(s => s.id === order.id);
        if (found) found.status = 'accepted';
        localStorage.setItem('store_online_orders_v6', JSON.stringify(stored));

        // إرسال إشعار فوري لحساب الزبون
        if (order.phone) {
            let notifs = JSON.parse(localStorage.getItem('store_customer_notifications_v1')) || [];
            notifs.unshift({
                id: 'NOTIF-' + Date.now(),
                customerPhone: order.phone,
                orderId: order.id,
                title: '🎉 تمت الموافقة على طلبك بنجاح!',
                message: `يسعدنا إبلاغك بأنه تمت الموافقة على طلبك رقم (${order.id}) بقيمة ₪${Number(order.total).toFixed(2)}، وفريق المتجر يقوم الآن بتجهيزه للشحن والتوصيل.`,
                type: 'accepted',
                read: false,
                date: new Date().toISOString()
            });
            localStorage.setItem('store_customer_notifications_v1', JSON.stringify(notifs));
        }
    } catch(e) {}

    showToast('تمت الموافقة على الطلب وإرسال إشعار فوري للزبون! 🔔');
    updateOnlineOrdersBadge();
    renderOnlineOrders();
}

function rejectOnlineOrder(target) {
    if(!confirm('هل تريد رفض هذا الطلب؟')) return;
    
    let order = null;
    if (typeof target === 'string') {
        order = mockOnlineOrders.find(o => o.id === target);
    } else {
        order = mockOnlineOrders[target];
    }
    if (!order) return;
    order.status = 'rejected';

    try {
        let stored = JSON.parse(localStorage.getItem('store_online_orders_v6')) || [];
        const found = stored.find(s => s.id === order.id);
        if (found) found.status = 'rejected';
        localStorage.setItem('store_online_orders_v6', JSON.stringify(stored));

        // إرسال إشعار للزبون بخصوص الرفض
        if (order.phone) {
            let notifs = JSON.parse(localStorage.getItem('store_customer_notifications_v1')) || [];
            notifs.unshift({
                id: 'NOTIF-' + Date.now(),
                customerPhone: order.phone,
                orderId: order.id,
                title: 'تحديث بخصوص طلبك',
                message: `نعتذر منك، تعذر قبول طلبك رقم (${order.id}) حالياً نظراً لنفاد الكمية من المخزون أو عدم توفر الموديل.`,
                type: 'rejected',
                read: false,
                date: new Date().toISOString()
            });
            localStorage.setItem('store_customer_notifications_v1', JSON.stringify(notifs));
        }
    } catch(e) {}

    showToast('تم رفض الطلب وتحديث حالة الزبون', 'warning');
    updateOnlineOrdersBadge();
    renderOnlineOrders();
}

let currentWaOrder = null;

function openOnlineOrderWhatsApp(target) {
    let order = null;
    if (typeof target === 'string') {
        order = mockOnlineOrders.find(o => o.id === target);
    } else {
        order = mockOnlineOrders[target];
    }
    if (!order) return;

    currentWaOrder = order;

    const infoEl = document.getElementById('waOrderInfo');
    if (infoEl) {
        infoEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span>طلب <strong>#${escapeHtml(order.id)}</strong> — ${escapeHtml(order.customer)}</span>
                <span class="badge ${order.status === 'accepted' ? 'success' : (order.status === 'rejected' ? 'danger' : 'warning')}">
                    ${order.status === 'accepted' ? 'مقبول' : (order.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار')}
                </span>
            </div>
            <div style="font-size:0.8rem;color:var(--gray);margin-top:4px;">
                المنتج: ${escapeHtml(order.productName)} (x${order.quantity}) | الإجمالي: <strong style="color:var(--success);">₪${Number(order.total).toFixed(2)}</strong>
            </div>
        `;
    }

    const phoneInput = document.getElementById('waOrderPhone');
    if (phoneInput) {
        phoneInput.value = order.phone || '0599123456';
    }

    setWaTemplate('confirm');
    openModal('orderWhatsAppModal');
}

function setWaTemplate(type) {
    if (!currentWaOrder) return;
    const o = currentWaOrder;
    const msgInput = document.getElementById('waOrderMessage');
    if (!msgInput) return;

    if (type === 'confirm') {
        msgInput.value = `السلام عليكم ورحمة الله أهلاً بك ${o.customer} 🌸\nمعك خدمة العملاء من متجر الأناقة للملابس.\n\nبخصوص طلبك رقم #${o.id}:\n📦 الأصناف: ${o.productName} (الكمية: ${o.quantity})\n💰 الإجمالي: ₪${Number(o.total).toFixed(2)}\n\nنود تأكيد استلام الطلب وبدء تجهيزه لك. يرجى تأكيد العنوان المناسب للتوصيل ✨`;
    } else if (type === 'ready') {
        msgInput.value = `أهلاً بك ${o.customer} 🌸\nنود إعلامك بأن طلبك رقم #${o.id} من متجر الأناقة أصبح جاهزاً الآن ومغلفاً بعناية 🎁\n\n💰 المبلغ المطلوب: ₪${Number(o.total).toFixed(2)}\nيسعدنا خدمتكم دائماً!`;
    } else if (type === 'delivery') {
        msgInput.value = `مرحباً ${o.customer} 🚗\nطلبك رقم #${o.id} خرج الآن مع مندوب التوصيل وسيتواصل معك خلال وقت قصير.\n\nالمبلغ عند الاستلام: ₪${Number(o.total).toFixed(2)}\nشكراً لاختيارك متجر الأناقة! ✨`;
    }
}

function formatWhatsAppPhone(phone) {
    if (!phone) return '';
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.startsWith('00')) clean = clean.substring(2);
    if (clean.startsWith('05')) {
        clean = '970' + clean.substring(1);
    }
    return clean;
}

function sendWhatsAppMessageNow() {
    const phoneInput = document.getElementById('waOrderPhone');
    const msgInput = document.getElementById('waOrderMessage');
    const rawPhone = (phoneInput ? phoneInput.value : '').trim();
    const message = (msgInput ? msgInput.value : '').trim();

    if (!rawPhone) {
        showToast('يرجى إدخال رقم هاتف العميل', 'error');
        return;
    }

    if (currentWaOrder) {
        currentWaOrder.phone = rawPhone;
        renderOnlineOrders();
    }

    const formattedPhone = formatWhatsAppPhone(rawPhone);
    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`;

    window.open(waUrl, '_blank');
    closeModal('orderWhatsAppModal');
    showToast('جاري فتح محادثة واتساب...');
}

function renderOnlineOrders() {
    const tbody = document.getElementById('onlineOrdersTableBody');
    if(!tbody) return;
    
    // مزامنة الطلبات الواردة من واجهة المتجر الإلكتروني الخارجي
    try {
        const stored = JSON.parse(localStorage.getItem('store_online_orders_v6'));
        if (Array.isArray(stored) && stored.length > 0) {
            stored.forEach(item => {
                const existing = mockOnlineOrders.find(m => m.id === item.id);
                if (!existing) {
                    mockOnlineOrders.unshift(item);
                } else {
                    existing.status = item.status;
                }
            });
        }
    } catch(e) {}
    updateOnlineOrdersBadge();

    if (mockOnlineOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">لا توجد طلبات جديدة حالياً</td></tr>';
        return;
    }
    
    tbody.innerHTML = mockOnlineOrders.slice().reverse().map((o, i) => {
        let statusBadge = '<span class="badge warning">قيد الانتظار</span>';
        let actions = `
            <div style="display:inline-flex;align-items:center;gap:4px;">
                <button class="btn-icon whatsapp" onclick="openOnlineOrderWhatsApp(${jsArg(o.id)})" title="مراسلة الزبون عبر واتساب"><i class="fab fa-whatsapp"></i></button>
                <button class="btn-icon success" onclick="acceptOnlineOrder(${jsArg(o.id)})" title="قبول الطلب"><i class="fas fa-check"></i></button>
                <button class="btn-icon danger" onclick="rejectOnlineOrder(${jsArg(o.id)})" title="رفض الطلب"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        if (o.status === 'accepted') {
            statusBadge = '<span class="badge success">مقبول</span>';
            actions = `
                <div style="display:inline-flex;align-items:center;gap:6px;">
                    <button class="btn-icon whatsapp" onclick="openOnlineOrderWhatsApp(${jsArg(o.id)})" title="مراسلة الزبون عبر واتساب"><i class="fab fa-whatsapp"></i></button>
                    <span style="color:var(--success);font-size:.8rem;"><i class="fas fa-check-double"></i> تم المعالجة</span>
                </div>
            `;
        } else if (o.status === 'rejected') {
            statusBadge = '<span class="badge danger">مرفوض</span>';
            actions = `
                <div style="display:inline-flex;align-items:center;gap:6px;">
                    <button class="btn-icon whatsapp" onclick="openOnlineOrderWhatsApp(${jsArg(o.id)})" title="مراسلة الزبون عبر واتساب"><i class="fab fa-whatsapp"></i></button>
                    <span style="color:var(--danger);font-size:.8rem;"><i class="fas fa-ban"></i> ملغى</span>
                </div>
            `;
        }

        return `
            <tr>
                <td><strong>${escapeHtml(o.id)}</strong></td>
                <td style="font-size:.8rem;">${new Date(o.date).toLocaleString('ar-EG', { dateStyle:'short', timeStyle:'short' })}</td>
                <td>
                    <strong>${escapeHtml(o.customer)}</strong>
                    ${o.phone ? `<small style="display:block;color:var(--gray);direction:ltr;text-align:right;"><i class="fas fa-phone-alt" style="font-size:0.7rem;"></i> ${escapeHtml(o.phone)}</small>` : ''}
                </td>
                <td>${escapeHtml(o.productName)} <span class="badge primary">x${escapeHtml(o.quantity)}</span></td>
                <td><strong>₪${Number(o.total).toFixed(2)}</strong></td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

window.openOnlineOrderWhatsApp = openOnlineOrderWhatsApp;
window.setWaTemplate = setWaTemplate;
window.formatWhatsAppPhone = formatWhatsAppPhone;
window.sendWhatsAppMessageNow = sendWhatsAppMessageNow;

/* ============================================
   26. إدارة منتجات المتجر الإلكتروني أونلاين
   ============================================ */
const STOREFRONT_CATALOG_KEY = 'storefront_catalog_v1';

const INITIAL_STOREFRONT_CATALOG = [
    {
        id: 'CAT-101',
        name: 'طقم سويت شيرت وبنطال شتوي نبيذي مبطن',
        category: 'رجالي',
        subCategory: 'أطقم شتوية',
        price: 135,
        oldPrice: 175,
        badge: 'الأكثر مبيعاً 🔥',
        badgeType: 'sale',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'نبيذي / أحمر', hex: '#881337' },
            { name: 'أسود ملكي', hex: '#0f172a' },
            { name: 'رمادي داكن', hex: '#475569' }
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        desc: 'طقم شتوي فاخر مكون من سويت شيرت هودي بسحاب كامل مع بطانة فليس دافئة فائقة النعومة، وبنطال رياضي بقصة مريحة مع جيوب عملية وحزام خصر مطاطي.'
    },
    {
        id: 'CAT-102',
        name: 'طقم رياضي سحاب كامل رمادي أنيق',
        category: 'رجالي',
        subCategory: 'أطقم رياضية',
        price: 125,
        oldPrice: 155,
        badge: 'وصل حديثاً ✨',
        badgeType: 'new',
        image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'رمادي فاتح', hex: '#94a3b8' },
            { name: 'كحلي ملكي', hex: '#1e3a8a' },
            { name: 'أسود', hex: '#0f172a' }
        ],
        sizes: ['M', 'L', 'XL', 'XXL'],
        desc: 'طقم رياضي عصري بلون رمادي مريح مع ياقة عالية وسحاب متين، نسيج مرن يسمح بمرور الهواء ومثالي للإطلالات اليومية والنشاطات الرياضية.'
    },
    {
        id: 'CAT-103',
        name: 'طقم شتوي رياضي أسود فاخر مع تفاصيل جلدية',
        category: 'رجالي',
        subCategory: 'أطقم شتوية',
        price: 145,
        oldPrice: 190,
        badge: 'خصم خاص 💥',
        badgeType: 'sale',
        image: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'أسود', hex: '#000000' },
            { name: 'زيتي', hex: '#365314' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        desc: 'طقم متكامل بتصميم رجالي فخم وقماش مقاوم للتوبير ومقاوم للرياح، مبطن بطبقة خفيفة من القطن الفاخر لتوفير أقصى درجات الدفء والأناقة.'
    },
    {
        id: 'CAT-104',
        name: 'جاكيت بومبر شتوي مقاوم للمطر والرياح',
        category: 'رجالي',
        subCategory: 'جاكيتات',
        price: 160,
        oldPrice: 210,
        badge: 'شتاء 2026 ❄️',
        badgeType: 'hot',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'كحلي ملكي', hex: '#172554' },
            { name: 'أسود', hex: '#0f172a' },
            { name: 'زيتي', hex: '#3f6212' }
        ],
        sizes: ['M', 'L', 'XL', 'XXL'],
        desc: 'جاكيت شتوي أنيق بتقنية العزل الحراري وطبقة خارجية طاردة للمياه مع جيوب سحاب داخلية وخارجية وسوار مطاطي مانع لدخول الهواء.'
    },
    {
        id: 'CAT-105',
        name: 'هودي أوفر سايز قطن تركي 100%',
        category: 'رجالي',
        subCategory: 'هوديز',
        price: 85,
        oldPrice: 110,
        badge: 'عرض حصري ⭐',
        badgeType: 'sale',
        image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'بيج ميلانج', hex: '#d6d3d1' },
            { name: 'أسود', hex: '#18181b' },
            { name: 'زيتي', hex: '#4d7c0f' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        desc: 'هودي شبابي بقصة أوفر سايز عصرية منسوج من أجود خيوط القطن الخالص مع جيب كنغر أمامي وغطاء رأس مزدوج الطبقات.'
    },
    {
        id: 'CAT-106',
        name: 'معطف ترانش نسائي طويل فاخر مع حزام',
        category: 'ستاتي',
        subCategory: 'معاطف وجواكيت',
        price: 195,
        oldPrice: 260,
        badge: 'الأكثر مبيعاً 🔥',
        badgeType: 'sale',
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'بيج ميلانج', hex: '#d6d3d1' },
            { name: 'أسود', hex: '#000000' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        desc: 'معطف أنيق وعصري بقصة كلاسيكية راقية، قماش جوخ دافئ وخفيف الوزن مع حزام خصر وأزرار رخامية مزدوجة.'
    },
    {
        id: 'CAT-107',
        name: 'طقم بيجامة صوف شتوية قطعتين مريحة',
        category: 'ستاتي',
        subCategory: 'أطقم شتوية',
        price: 95,
        oldPrice: 125,
        badge: 'وصل حديثاً ✨',
        badgeType: 'new',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'وردي ناعم', hex: '#f43f5e' },
            { name: 'رمادي داكن', hex: '#475569' },
            { name: 'أبيض', hex: '#ffffff' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        desc: 'طقم بيجامة شتوية مخملية فائقة النعومة توفر راحة تامة والدفء المطلوب في الأجواء الباردة مع تفاصيل تطريز راقية.'
    },
    {
        id: 'CAT-108',
        name: 'طقم شتوي بناتي هودي وتنورة كنزة ناعمة',
        category: 'أطفال',
        subCategory: 'بناتي',
        price: 90,
        oldPrice: 120,
        badge: 'شتاء 2026 ❄️',
        badgeType: 'hot',
        image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'وردي', hex: '#fb7185' },
            { name: 'بيج ميلانج', hex: '#e7e5e4' }
        ],
        sizes: ['4 سنوات', '6 سنوات', '8 سنوات', '10 سنوات'],
        desc: 'طقم بناتي كاجوال وأنيق مصنوع من قطن ناعم ومناسب لبشرة الأطفال، خياطة متينة ومقاومة للغسيل المتكرر.'
    },
    {
        id: 'CAT-109',
        name: 'طقم ترينينج أولادي شتوي مبطن كابتشينو',
        category: 'أطفال',
        subCategory: 'أولادي',
        price: 85,
        oldPrice: 115,
        badge: 'الأكثر مبيعاً 🔥',
        badgeType: 'sale',
        image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'كحلي ملكي', hex: '#1e3a8a' },
            { name: 'رمادي داكن', hex: '#334155' }
        ],
        sizes: ['4 سنوات', '6 سنوات', '8 سنوات', '10 سنوات', '12 سنة'],
        desc: 'ترينينج رياضي ولادي مريح وعملي جداً للمدرسة واللعب اليومي، مزود بسحاب متين وجيوب عملية للحفاظ على الدفء.'
    },
    {
        id: 'CAT-110',
        name: 'حذاء سنيكرز رياضي كلاسيك مريح مقاوم للانزلاق',
        category: 'أحذية',
        subCategory: 'سنيكرز كاجوال',
        price: 110,
        oldPrice: 145,
        badge: 'وصل حديثاً ✨',
        badgeType: 'new',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
        colors: [
            { name: 'أبيض', hex: '#ffffff' },
            { name: 'أسود', hex: '#0f172a' }
        ],
        sizes: ['39', '40', '41', '42', '43', '44'],
        desc: 'حذاء رياضي خفيف الوزن بنعل مرن يوفر راحة فائقة للقدمين طوال اليوم، تصميم كاجوال يناسب جميع الإطلالات اليومية.'
    }
];

function getStorefrontCatalog() {
    try {
        const stored = localStorage.getItem(STOREFRONT_CATALOG_KEY);
        if (stored) {
            return JSON.parse(stored);
        } else {
            localStorage.setItem(STOREFRONT_CATALOG_KEY, JSON.stringify(INITIAL_STOREFRONT_CATALOG));
            return [...INITIAL_STOREFRONT_CATALOG];
        }
    } catch (e) {
        return [...INITIAL_STOREFRONT_CATALOG];
    }
}

function saveStorefrontCatalog(list) {
    try {
        localStorage.setItem(STOREFRONT_CATALOG_KEY, JSON.stringify(list));
        updateOnlineProductsCountBadge();
    } catch (e) {
        console.error('Error saving storefront catalog:', e);
    }
}

let currentOnlineFilterCategory = 'all';
let currentOnlineSearchQuery = '';

function renderOnlineProducts(filterCat = null, searchQuery = null) {
    if (filterCat !== null) currentOnlineFilterCategory = filterCat;
    if (searchQuery !== null) currentOnlineSearchQuery = searchQuery.trim().toLowerCase();

    const catalog = getStorefrontCatalog();
    updateOnlineProductsStats(catalog);
    updateOnlineProductsCountBadge();

    const container = document.getElementById('onlineProductsContainer');
    if (!container) return;

    let filtered = catalog.filter(p => {
        const matchCategory = currentOnlineFilterCategory === 'all' || p.category === currentOnlineFilterCategory;
        const matchSearch = !currentOnlineSearchQuery || 
            (p.name && p.name.toLowerCase().includes(currentOnlineSearchQuery)) ||
            (p.subCategory && p.subCategory.toLowerCase().includes(currentOnlineSearchQuery)) ||
            (p.id && p.id.toLowerCase().includes(currentOnlineSearchQuery));
        return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1;text-align:center;padding:50px 20px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;color:#94a3b8;">
                <i class="fas fa-box-open" style="font-size:3rem;margin-bottom:12px;color:#cbd5e1;display:block;"></i>
                <h4 style="color:#475569;margin-bottom:6px;">لم يتم العثور على أي منتجات تطابق البحث</h4>
                <p style="font-size:0.85rem;margin-bottom:16px;">يمكنك إضافة منتجات جديدة أو تغيير معايير التصفية</p>
                <button type="button" class="btn btn-primary btn-sm" onclick="openOnlineProductModal()">
                    <i class="fas fa-plus"></i> إضافة منتج جديد الآن
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(p => {
        const badgeHtml = p.badge && p.badge !== 'none' ? `
            <span style="position:absolute;top:10px;right:10px;background:rgba(225,29,72,0.95);color:#fff;font-size:0.7rem;font-weight:800;padding:3px 9px;border-radius:20px;box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                ${escapeHtml(p.badge)}
            </span>
        ` : '';

        const discountHtml = p.oldPrice && Number(p.oldPrice) > Number(p.price) ? `
            <span style="text-decoration:line-through;color:#94a3b8;font-size:0.82rem;margin-right:6px;">₪${Number(p.oldPrice).toFixed(2)}</span>
        ` : '';

        const colorsHtml = (p.colors || []).map(c => `
            <span title="${escapeHtml(c.name || '')}" style="width:14px;height:14px;border-radius:50%;background:${escapeHtml(c.hex || '#475569')};display:inline-block;border:1.5px solid #fff;box-shadow:0 0 2px rgba(0,0,0,0.3);"></span>
        `).join('');

        const sizesHtml = (p.sizes || []).map(s => `
            <span style="background:#f1f5f9;color:#475569;font-size:0.7rem;font-weight:700;padding:2px 6px;border-radius:4px;">${escapeHtml(s)}</span>
        `).join('');

        return `
            <div class="card" style="margin-bottom:0;display:flex;flex-direction:column;overflow:hidden;border:1.5px solid #e2e8f0;border-radius:14px;transition:transform 0.2s, box-shadow 0.2s;" onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)';" onmouseleave="this.style.transform='';this.style.boxShadow='';">
                <div style="position:relative;background:#f8fafc;aspect-ratio:1/1.05;overflow:hidden;">
                    <img src="${escapeHtml(p.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80')}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">
                    ${badgeHtml}
                    <span style="position:absolute;bottom:10px;left:10px;background:rgba(15,23,42,0.85);color:#fff;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:6px;">
                        ${escapeHtml(p.category)}
                    </span>
                </div>
                <div style="padding:14px;display:flex;flex-direction:column;flex:1;">
                    <div style="font-size:0.75rem;color:#64748b;font-weight:600;margin-bottom:2px;">${escapeHtml(p.subCategory || p.category)} • كود: ${escapeHtml(p.id)}</div>
                    <h4 style="font-size:0.95rem;font-weight:800;color:#0f172a;margin-bottom:8px;line-height:1.4;">${escapeHtml(p.name)}</h4>
                    
                    <div style="display:flex;align-items:center;margin-bottom:10px;">
                        <strong style="color:var(--primary);font-size:1.15rem;font-weight:900;">₪${Number(p.price).toFixed(2)}</strong>
                        ${discountHtml}
                    </div>

                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-top:8px;border-top:1px dashed #e2e8f0;">
                        <div style="display:flex;gap:3px;align-items:center;">
                            ${colorsHtml}
                        </div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${sizesHtml}
                        </div>
                    </div>

                    <div style="margin-top:auto;display:flex;gap:8px;padding-top:10px;border-top:1px solid #f1f5f9;">
                        <button type="button" class="btn btn-sm btn-outline" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;" onclick="openOnlineProductModal(${jsArg(p.id)})">
                            <i class="fas fa-edit text-primary"></i> تعديل
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" style="color:#ef4444;border-color:#fecaca;display:inline-flex;align-items:center;justify-content:center;padding:6px 12px;" title="حذف من المتجر" onclick="deleteOnlineProduct(${jsArg(p.id)})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateOnlineProductsStats(catalog) {
    const list = catalog || getStorefrontCatalog();
    const totalEl = document.getElementById('statOnlineTotal');
    const menEl = document.getElementById('statOnlineMen');
    const womenEl = document.getElementById('statOnlineWomen');
    const kidsEl = document.getElementById('statOnlineKids');
    const shoesEl = document.getElementById('statOnlineShoes');

    if (totalEl) totalEl.textContent = list.length;
    if (menEl) menEl.textContent = list.filter(p => p.category === 'رجالي').length;
    if (womenEl) womenEl.textContent = list.filter(p => p.category === 'ستاتي').length;
    if (kidsEl) kidsEl.textContent = list.filter(p => p.category === 'أطفال').length;
    if (shoesEl) shoesEl.textContent = list.filter(p => p.category === 'أحذية').length;
}

function updateOnlineProductsCountBadge() {
    const badge = document.getElementById('onlineProductsCountBadge');
    if (!badge) return;
    const list = getStorefrontCatalog();
    badge.textContent = list.length;
    badge.style.display = list.length > 0 ? 'inline-block' : 'none';
}

function filterOnlineProductsCategory(cat, btn) {
    if (btn) {
        document.querySelectorAll('#onlineProductCatFilterGroup button').forEach(b => {
            b.className = 'btn btn-sm btn-outline';
        });
        btn.className = 'btn btn-sm btn-primary';
    }
    renderOnlineProducts(cat, null);
}

function searchOnlineProducts(query) {
    renderOnlineProducts(null, query);
}

function openOnlineProductModal(prodId = null) {
    const modal = document.getElementById('onlineProductModal');
    if (!modal) return;

    const titleEl = document.getElementById('onlineProdModalTitle');
    const idInput = document.getElementById('onlineProdId');
    const nameInput = document.getElementById('onlineProdName');
    const catSelect = document.getElementById('onlineProdCategory');
    const subCatInput = document.getElementById('onlineProdSubCategory');
    const priceInput = document.getElementById('onlineProdPrice');
    const oldPriceInput = document.getElementById('onlineProdOldPrice');
    const badgeSelect = document.getElementById('onlineProdBadge');
    const imgUrlInput = document.getElementById('onlineProdImgUrl');
    const imgPreview = document.getElementById('onlineProdImgPreview');
    const imgPlaceholder = document.getElementById('onlineProdImgPlaceholder');
    const descInput = document.getElementById('onlineProdDesc');

    if (prodId) {
        // وضع التعديل
        const catalog = getStorefrontCatalog();
        const p = catalog.find(item => item.id === prodId);
        if (!p) return;

        if (titleEl) titleEl.innerHTML = `<i class="fas fa-edit text-primary"></i> تعديل منتج: ${escapeHtml(p.name)}`;
        if (idInput) idInput.value = p.id;
        if (nameInput) nameInput.value = p.name || '';
        if (catSelect) catSelect.value = p.category || 'رجالي';
        if (subCatInput) subCatInput.value = p.subCategory || '';
        if (priceInput) priceInput.value = p.price || '';
        if (oldPriceInput) oldPriceInput.value = p.oldPrice || '';
        if (badgeSelect) badgeSelect.value = p.badge || 'none';
        if (imgUrlInput) imgUrlInput.value = p.image || '';
        if (descInput) descInput.value = p.desc || '';

        if (p.image) {
            if (imgPreview) { imgPreview.src = p.image; imgPreview.style.display = 'block'; }
            if (imgPlaceholder) imgPlaceholder.style.display = 'none';
        } else {
            if (imgPreview) imgPreview.style.display = 'none';
            if (imgPlaceholder) imgPlaceholder.style.display = 'block';
        }

        // تحديد المقاسات
        document.querySelectorAll('input[name="onlineProdSizes"]').forEach(cb => {
            cb.checked = (p.sizes || []).includes(cb.value);
        });

        // تحديد الألوان
        const prodColorNames = (p.colors || []).map(c => c.name);
        document.querySelectorAll('input[name="onlineProdColors"]').forEach(cb => {
            const colorName = cb.value.split('|')[0];
            cb.checked = prodColorNames.includes(colorName);
        });

    } else {
        // وضع إضافة جديد
        if (titleEl) titleEl.innerHTML = `<i class="fas fa-plus-circle text-primary"></i> إضافة منتج جديد للمتجر الإلكتروني`;
        if (idInput) idInput.value = '';
        if (nameInput) nameInput.value = '';
        if (catSelect) catSelect.value = 'رجالي';
        if (subCatInput) subCatInput.value = '';
        if (priceInput) priceInput.value = '';
        if (oldPriceInput) oldPriceInput.value = '';
        if (badgeSelect) badgeSelect.value = 'none';
        if (imgUrlInput) imgUrlInput.value = '';
        if (descInput) descInput.value = '';
        if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; }
        if (imgPlaceholder) imgPlaceholder.style.display = 'block';

        // قيم افتراضية للمقاسات والألوان
        document.querySelectorAll('input[name="onlineProdSizes"]').forEach(cb => {
            cb.checked = ['S', 'M', 'L', 'XL'].includes(cb.value);
        });
        document.querySelectorAll('input[name="onlineProdColors"]').forEach(cb => {
            cb.checked = cb.value.includes('أسود') || cb.value.includes('نبيذي') || cb.value.includes('رمادي');
        });
    }

    openModal('onlineProductModal');
}

function handleOnlineProductImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const imgPreview = document.getElementById('onlineProdImgPreview');
            const imgPlaceholder = document.getElementById('onlineProdImgPlaceholder');
            const imgUrlInput = document.getElementById('onlineProdImgUrl');

            if (imgPreview) {
                imgPreview.src = dataUrl;
                imgPreview.style.display = 'block';
            }
            if (imgPlaceholder) imgPlaceholder.style.display = 'none';
            if (imgUrlInput) imgUrlInput.value = dataUrl;
        };
        reader.readAsDataURL(file);
    }
}

function updateOnlineProdImgFromUrl(url) {
    const imgPreview = document.getElementById('onlineProdImgPreview');
    const imgPlaceholder = document.getElementById('onlineProdImgPlaceholder');
    if (url && url.trim().length > 5) {
        if (imgPreview) {
            imgPreview.src = url.trim();
            imgPreview.style.display = 'block';
        }
        if (imgPlaceholder) imgPlaceholder.style.display = 'none';
    } else {
        if (imgPreview) imgPreview.style.display = 'none';
        if (imgPlaceholder) imgPlaceholder.style.display = 'block';
    }
}

function saveOnlineProduct(e) {
    if (e) e.preventDefault();

    const editId = document.getElementById('onlineProdId')?.value;
    const name = document.getElementById('onlineProdName')?.value.trim();
    const category = document.getElementById('onlineProdCategory')?.value || 'رجالي';
    const subCategory = document.getElementById('onlineProdSubCategory')?.value.trim() || category;
    const price = parseFloat(document.getElementById('onlineProdPrice')?.value);
    const oldPriceRaw = document.getElementById('onlineProdOldPrice')?.value;
    const oldPrice = oldPriceRaw ? parseFloat(oldPriceRaw) : null;
    const badge = document.getElementById('onlineProdBadge')?.value || 'none';
    const image = document.getElementById('onlineProdImgUrl')?.value.trim() || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80';
    const desc = document.getElementById('onlineProdDesc')?.value.trim() || `أحدث تشكيلة ${name} الفاخرة بأعلى معايير الجودة والأناقة.`;

    if (!name || isNaN(price) || price <= 0) {
        showToast('يرجى إدخال اسم المنتج والسعر بشكل صحيح', 'error');
        return;
    }

    const sizes = Array.from(document.querySelectorAll('input[name="onlineProdSizes"]:checked')).map(cb => cb.value);
    const colors = Array.from(document.querySelectorAll('input[name="onlineProdColors"]:checked')).map(cb => {
        const parts = cb.value.split('|');
        return { name: parts[0], hex: parts[1] || '#475569' };
    });

    const catalog = getStorefrontCatalog();

    if (editId) {
        // تعديل منتج قائم
        const idx = catalog.findIndex(item => item.id === editId);
        if (idx !== -1) {
            catalog[idx] = {
                ...catalog[idx],
                name: name,
                category: category,
                subCategory: subCategory,
                price: price,
                oldPrice: oldPrice,
                badge: badge,
                badgeType: badge.includes('مبيعاً') || badge.includes('خصم') ? 'sale' : (badge.includes('شتاء') ? 'hot' : 'new'),
                image: image,
                sizes: sizes.length > 0 ? sizes : ['M', 'L', 'XL'],
                colors: colors.length > 0 ? colors : [{ name: 'أسود', hex: '#0f172a' }],
                desc: desc
            };
            showToast('✅ تم تحديث بيانات المنتج في المتجر بنجاح');
        }
    } else {
        // إضافة منتج جديد
        const newProduct = {
            id: 'CAT-' + Math.floor(Math.random() * 9000 + 1000),
            name: name,
            category: category,
            subCategory: subCategory,
            price: price,
            oldPrice: oldPrice,
            badge: badge,
            badgeType: badge.includes('مبيعاً') || badge.includes('خصم') ? 'sale' : (badge.includes('شتاء') ? 'hot' : 'new'),
            image: image,
            sizes: sizes.length > 0 ? sizes : ['M', 'L', 'XL'],
            colors: colors.length > 0 ? colors : [{ name: 'أسود', hex: '#0f172a' }],
            desc: desc
        };
        catalog.unshift(newProduct);
        showToast('🎉 تم نشر المنتج الجديد في المتجر الإلكتروني بنجاح!');
    }

    saveStorefrontCatalog(catalog);
    closeModal('onlineProductModal');
    renderOnlineProducts();
}

function deleteOnlineProduct(prodId) {
    const catalog = getStorefrontCatalog();
    const p = catalog.find(item => item.id === prodId);
    if (!p) return;

    if (!confirm(`هل أنت متأكد من حذف المنتج "${p.name}" من المتجر الإلكتروني؟`)) return;

    const updated = catalog.filter(item => item.id !== prodId);
    saveStorefrontCatalog(updated);
    renderOnlineProducts();
    showToast('تم حذف المنتج من المتجر الإلكتروني', 'info');
}

window.renderOnlineProducts = renderOnlineProducts;
window.filterOnlineProductsCategory = filterOnlineProductsCategory;
window.searchOnlineProducts = searchOnlineProducts;
window.openOnlineProductModal = openOnlineProductModal;
window.handleOnlineProductImageUpload = handleOnlineProductImageUpload;
window.updateOnlineProdImgFromUrl = updateOnlineProdImgFromUrl;
window.saveOnlineProduct = saveOnlineProduct;
window.deleteOnlineProduct = deleteOnlineProduct;
window.updateOnlineProductsCountBadge = updateOnlineProductsCountBadge;

/* ============================================
   25. ب. إدارة حسابات الزبائن وقاعدة بيانات العملاء
   ============================================ */
let currentCustomerFilterTab = 'all';
let currentCustomerSearchQuery = '';

function updateCustomersCountBadge() {
    try {
        const customers = typeof getCustomers === 'function' ? getCustomers() : [];
        const onlineCount = customers.filter(c => c.source === 'online').length;
        const badge = document.getElementById('customersCountBadge');
        if (badge) {
            if (onlineCount > 0) {
                badge.textContent = `${onlineCount} أونلاين`;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {}
}

function loadCustomersScreen() {
    renderCustomersTable();
}

function filterCustomerTab(tab, btn) {
    currentCustomerFilterTab = tab;
    const group = document.getElementById('customerFilterGroup');
    if (group) {
        group.querySelectorAll('button').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-outline');
        });
    }
    if (btn) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
    }
    renderCustomersTable();
}

function handleCustomerSearch(query) {
    currentCustomerSearchQuery = (query || '').trim().toLowerCase();
    renderCustomersTable();
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    const customers = typeof getCustomers === 'function' ? getCustomers() : [];
    const onlineOrders = JSON.parse(localStorage.getItem('store_online_orders_v6')) || (typeof mockOnlineOrders !== 'undefined' ? mockOnlineOrders : []);
    const debts = typeof getCustomerDebts === 'function' ? getCustomerDebts() : [];

    // حساب الإحصائيات
    const totalCust = customers.length;
    const onlineCust = customers.filter(c => c.source === 'online').length;
    const posCust = customers.filter(c => c.source !== 'online').length;
    const totalOrdersCount = onlineOrders.length;

    const statTotalEl = document.getElementById('statCustTotal');
    const statOnlineEl = document.getElementById('statCustOnline');
    const statPosEl = document.getElementById('statCustPos');
    const statOrdersEl = document.getElementById('statCustOrders');

    if (statTotalEl) statTotalEl.textContent = totalCust;
    if (statOnlineEl) statOnlineEl.textContent = onlineCust;
    if (statPosEl) statPosEl.textContent = posCust;
    if (statOrdersEl) statOrdersEl.textContent = totalOrdersCount;

    updateCustomersCountBadge();

    // تصفية حسب التبويب
    let filtered = [...customers];
    if (currentCustomerFilterTab === 'online') {
        filtered = filtered.filter(c => c.source === 'online');
    } else if (currentCustomerFilterTab === 'pos') {
        filtered = filtered.filter(c => c.source !== 'online');
    } else if (currentCustomerFilterTab === 'debts') {
        const debtNames = new Set(debts.filter(d => (d.balance || d.amount) > 0).map(d => (d.customer_name || '').toLowerCase()));
        filtered = filtered.filter(c => debtNames.has((c.name || '').toLowerCase()));
    }

    // تصفية حسب البحث
    if (currentCustomerSearchQuery) {
        filtered = filtered.filter(c => {
            const name = (c.name || '').toLowerCase();
            const phone = (c.phone || '').toLowerCase();
            const city = (c.city || '').toLowerCase();
            const addr = (c.address || '').toLowerCase();
            return name.includes(currentCustomerSearchQuery) ||
                   phone.includes(currentCustomerSearchQuery) ||
                   city.includes(currentCustomerSearchQuery) ||
                   addr.includes(currentCustomerSearchQuery);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding:40px;color:#64748b;">
                    <i class="fas fa-user-slash" style="font-size:2rem;color:#cbd5e1;margin-bottom:10px;display:block;"></i>
                    <strong style="font-size:1.05rem;color:#1e293b;display:block;">لا يوجد عملاء مطابقين للبحث أو التصفية</strong>
                    <span style="font-size:0.85rem;">يمكنك إضافة عميل جديد أو انتظار تسجيل عملاء عبر المتجر الإلكتروني.</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map((c, idx) => {
        const isOnline = c.source === 'online';
        const cleanPhone = (c.phone || '').replace(/\D/g, '');
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '970' + cleanPhone.substring(1) : cleanPhone}` : null;
        
        // حساب عدد طلبات هذا العميل
        const custOrders = onlineOrders.filter(o => {
            const oPhone = (o.phone || o.customerPhone || '').replace(/\D/g, '');
            const oName = (o.customer || o.customerName || '').trim().toLowerCase();
            return (cleanPhone && oPhone === cleanPhone) || (c.name && oName === c.name.trim().toLowerCase());
        });

        // تنسيق التاريخ
        let dateStr = '—';
        if (c.createdAt) {
            try {
                dateStr = new Date(c.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
            } catch(e) {
                dateStr = c.createdAt;
            }
        }

        const initial = c.name ? c.name.trim().charAt(0) : 'ع';

        return `
            <tr>
                <td style="font-weight:700;color:#64748b;">${idx + 1}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:36px;height:36px;border-radius:50%;background:${isOnline ? '#eef2ff' : '#f1f5f9'};color:${isOnline ? '#4f46e5' : '#475569'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.95rem;flex-shrink:0;">
                            ${escapeHtml(initial)}
                        </div>
                        <div>
                            <div style="font-weight:800;color:#0f172a;cursor:pointer;" onclick="viewCustomerDetails(${jsArg(c.id)})" title="عرض تفاصيل وسجل العميل">
                                ${escapeHtml(c.name)}
                            </div>
                            ${c.note ? `<small style="color:#64748b;font-size:0.75rem;">${escapeHtml(c.note)}</small>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:6px;direction:ltr;justify-content:flex-end;">
                        <strong style="color:#1e293b;font-size:0.88rem;">${escapeHtml(c.phone || '—')}</strong>
                        ${waLink ? `
                            <a href="${escapeHtml(waLink)}" target="_blank" class="btn btn-sm" style="padding:3px 8px;background:#dcfce7;color:#16a34a;border:none;border-radius:6px;text-decoration:none;" title="محادثة واتساب">
                                <i class="fab fa-whatsapp"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>
                <td>
                    ${isOnline ? `
                        <span class="badge" style="background:#eef2ff;color:#4f46e5;font-weight:800;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:5px;font-size:0.78rem;">
                            <i class="fas fa-globe"></i> متجر أونلاين
                        </span>
                    ` : `
                        <span class="badge" style="background:#f1f5f9;color:#475569;font-weight:800;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:5px;font-size:0.78rem;">
                            <i class="fas fa-cash-register"></i> كاشير محلي
                        </span>
                    `}
                </td>
                <td>
                    <div style="font-size:0.85rem;color:#334155;">
                        <strong>${escapeHtml(c.city || 'المدينة غير محددة')}</strong>
                        ${c.address ? `<div style="font-size:0.75rem;color:#64748b;">${escapeHtml(c.address)}</div>` : ''}
                    </div>
                </td>
                <td>
                    ${custOrders.length > 0 ? `
                        <button type="button" class="btn btn-sm" onclick="viewCustomerDetails(${jsArg(c.id)})" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;font-weight:800;padding:3px 10px;border-radius:12px;font-size:0.78rem;cursor:pointer;">
                            <i class="fas fa-shopping-bag"></i> ${custOrders.length} طلبات
                        </button>
                    ` : `
                        <span style="font-size:0.8rem;color:#94a3b8;">لا توجد طلبات</span>
                    `}
                </td>
                <td style="font-size:0.82rem;color:#64748b;">${dateStr}</td>
                <td style="text-align:center;">
                    <div style="display:inline-flex;gap:4px;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="viewCustomerDetails(${jsArg(c.id)})" title="عرض السجل والطلبات" style="padding:4px 8px;border-radius:6px;">
                            <i class="fas fa-eye text-primary"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" onclick="openCustomerModal(${jsArg(c.id)})" title="تعديل بيانات العميل" style="padding:4px 8px;border-radius:6px;">
                            <i class="fas fa-edit text-info"></i>
                        </button>
                        ${typeof viewCustomerStatement === 'function' ? `
                            <button type="button" class="btn btn-sm btn-outline" onclick="viewCustomerStatement(${jsArg(c.name)}, ${jsArg(c.phone || '')})" title="كشف الحساب" style="padding:4px 8px;border-radius:6px;">
                                <i class="fas fa-file-invoice-dollar text-warning"></i>
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-sm btn-outline text-danger" onclick="deleteCustomerRecord(${jsArg(c.id)})" title="حذف العميل" style="padding:4px 8px;border-radius:6px;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewCustomerDetails(custId) {
    const customers = typeof getCustomers === 'function' ? getCustomers() : [];
    const cust = customers.find(c => String(c.id) === String(custId) || c.phone === custId);
    if (!cust) {
        showToast('تعذر العثور على بيانات العميل', 'error');
        return;
    }

    const modalBody = document.getElementById('customerDetailsBody');
    if (!modalBody) return;

    const onlineOrders = JSON.parse(localStorage.getItem('store_online_orders_v6')) || (typeof mockOnlineOrders !== 'undefined' ? mockOnlineOrders : []);
    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '970' + cleanPhone.substring(1) : cleanPhone}` : null;

    const custOrders = onlineOrders.filter(o => {
        const oPhone = (o.phone || o.customerPhone || '').replace(/\D/g, '');
        const oName = (o.customer || o.customerName || '').trim().toLowerCase();
        return (cleanPhone && oPhone === cleanPhone) || (cust.name && oName === cust.name.trim().toLowerCase());
    });

    const totalSpent = custOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    const isOnline = cust.source === 'online';
    const initial = cust.name ? cust.name.trim().charAt(0) : 'ع';

    modalBody.innerHTML = `
        <!-- كرت العميل الرئيسي -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:54px;height:54px;border-radius:50%;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;">
                    ${escapeHtml(initial)}
                </div>
                <div>
                    <h3 style="font-size:1.2rem;font-weight:900;color:#0f172a;margin:0 0 4px;">
                        ${escapeHtml(cust.name)}
                        ${isOnline ? '<span class="badge" style="background:#eef2ff;color:#4f46e5;font-size:0.75rem;padding:2px 8px;margin-right:6px;"><i class="fas fa-globe"></i> متجر أونلاين</span>' : '<span class="badge" style="background:#f1f5f9;color:#475569;font-size:0.75rem;padding:2px 8px;margin-right:6px;"><i class="fas fa-cash-register"></i> كاشير</span>'}
                    </h3>
                    <div style="font-size:0.85rem;color:#64748b;display:flex;gap:14px;flex-wrap:wrap;">
                        <span><i class="fas fa-phone-alt"></i> ${escapeHtml(cust.phone || 'بدون هاتف')}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(cust.city || 'المدينة غير محددة')} ${escapeHtml(cust.address ? ' - ' + cust.address : '')}</span>
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                ${waLink ? `
                    <a href="${waLink}" target="_blank" class="btn btn-sm" style="background:#25d366;color:#fff;border:none;border-radius:20px;padding:6px 14px;text-decoration:none;font-weight:700;">
                        <i class="fab fa-whatsapp"></i> محادثة واتساب
                    </a>
                ` : ''}
                <button type="button" class="btn btn-sm btn-outline" onclick="closeModal('customerDetailsModal'); openCustomerModal(${jsArg(cust.id)});">
                    <i class="fas fa-edit"></i> تعديل
                </button>
            </div>
        </div>

        <!-- ملخص مالي وسجلات -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:20px;">
            <div style="background:#fff;border:1px solid #e2e8f0;padding:14px;border-radius:10px;text-align:center;">
                <span style="font-size:0.8rem;color:#64748b;font-weight:700;">عدد الطلبات الكلي</span>
                <div style="font-size:1.4rem;font-weight:900;color:#0f172a;margin-top:4px;">${custOrders.length}</div>
            </div>
            <div style="background:#fff;border:1px solid #e2e8f0;padding:14px;border-radius:10px;text-align:center;">
                <span style="font-size:0.8rem;color:#64748b;font-weight:700;">إجمالي مشتريات المتجر</span>
                <div style="font-size:1.4rem;font-weight:900;color:#10b981;margin-top:4px;">₪${totalSpent.toFixed(2)}</div>
            </div>
            <div style="background:#fff;border:1px solid #e2e8f0;padding:14px;border-radius:10px;text-align:center;">
                <span style="font-size:0.8rem;color:#64748b;font-weight:700;">تاريخ الانضمام</span>
                <div style="font-size:0.95rem;font-weight:800;color:#3b82f6;margin-top:8px;">
                    ${cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('ar-EG') : 'عميل معتمد'}
                </div>
            </div>
        </div>

        <!-- جدول طلبات هذا العميل -->
        <h4 style="font-size:1rem;font-weight:800;color:#1e293b;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-shopping-bag text-primary"></i> سجل طلبات العميل من المتجر أونلاين:
        </h4>
        ${custOrders.length === 0 ? `
            <div style="text-align:center;padding:25px;background:#f8fafc;border-radius:10px;color:#64748b;font-size:0.9rem;">
                <i class="fas fa-box-open" style="font-size:1.8rem;color:#cbd5e1;margin-bottom:6px;display:block;"></i>
                لم يقم هذا العميل بأي طلبات شراء إلكترونية حتى الآن.
            </div>
        ` : `
            <div class="table-responsive" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <table class="data-table" style="width:100%;margin:0;">
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>التاريخ</th>
                            <th>المنتجات والكمية</th>
                            <th>المبلغ الإجمالي</th>
                            <th>حالة الطلب</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${custOrders.map(o => {
                            let badgeStyle = 'background:#fef3c7;color:#d97706;';
                            let statusText = 'قيد الانتظار';
                            if (o.status === 'accepted') { badgeStyle = 'background:#dcfce7;color:#16a34a;'; statusText = 'مقبول وجاري التجهيز'; }
                            else if (o.status === 'rejected') { badgeStyle = 'background:#fee2e2;color:#dc2626;'; statusText = 'مرفوض'; }
                            else if (o.status === 'delivered') { badgeStyle = 'background:#eff6ff;color:#2563eb;'; statusText = 'تم التسليم'; }

                            const dateFmt = o.date ? new Date(o.date).toLocaleDateString('ar-EG') : (o.time || '—');
                            const itemsDesc = o.items ? o.items.map(it => `${it.name} (x${it.quantity})`).join(', ') : (o.productName || 'طلب متجر');

                            return `
                                <tr>
                                    <td><strong>#${escapeHtml(o.id)}</strong></td>
                                    <td style="font-size:0.82rem;color:#64748b;">${dateFmt}</td>
                                    <td style="font-size:0.85rem;max-width:220px;">${escapeHtml(itemsDesc)}</td>
                                    <td><strong style="color:#0f172a;">₪${Number(o.total || 0).toFixed(2)}</strong></td>
                                    <td>
                                        <span class="badge" style="${badgeStyle};padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:800;">
                                            ${statusText}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;

    openModal('customerDetailsModal');
}

function openCustomerModal(custId = null) {
    const idInput = document.getElementById('custModalId');
    const nameInput = document.getElementById('custModalName');
    const phoneInput = document.getElementById('custModalPhone');
    const cityInput = document.getElementById('custModalCity');
    const sourceSelect = document.getElementById('custModalSource');
    const addrInput = document.getElementById('custModalAddress');
    const noteInput = document.getElementById('custModalNote');
    const titleEl = document.getElementById('customerModalTitle');

    if (custId) {
        const customers = typeof getCustomers === 'function' ? getCustomers() : [];
        const cust = customers.find(c => String(c.id) === String(custId) || c.phone === custId);
        if (cust) {
            if (titleEl) titleEl.innerHTML = '<i class="fas fa-user-edit text-primary"></i> تعديل بيانات العميل';
            if (idInput) idInput.value = cust.id;
            if (nameInput) nameInput.value = cust.name || '';
            if (phoneInput) phoneInput.value = cust.phone || '';
            if (cityInput) cityInput.value = cust.city || '';
            if (sourceSelect) sourceSelect.value = cust.source || 'pos';
            if (addrInput) addrInput.value = cust.address || '';
            if (noteInput) noteInput.value = cust.note || '';
        }
    } else {
        if (titleEl) titleEl.innerHTML = '<i class="fas fa-user-plus text-primary"></i> إضافة عميل جديد';
        if (idInput) idInput.value = '';
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (cityInput) cityInput.value = '';
        if (sourceSelect) sourceSelect.value = 'pos';
        if (addrInput) addrInput.value = '';
        if (noteInput) noteInput.value = '';
    }

    openModal('customerModal');
}

function saveCustomerForm(e) {
    if (e) e.preventDefault();

    const id = document.getElementById('custModalId')?.value;
    const name = document.getElementById('custModalName')?.value.trim();
    const phone = document.getElementById('custModalPhone')?.value.trim();
    const city = document.getElementById('custModalCity')?.value.trim();
    const source = document.getElementById('custModalSource')?.value || 'pos';
    const address = document.getElementById('custModalAddress')?.value.trim();
    const note = document.getElementById('custModalNote')?.value.trim();

    if (!name || !phone) {
        showToast('يرجى إدخال اسم العميل ورقم الهاتف على الأقل', 'error');
        return;
    }

    let customers = typeof getCustomers === 'function' ? getCustomers() : [];

    if (id) {
        // تعديل
        const idx = customers.findIndex(c => String(c.id) === String(id));
        if (idx !== -1) {
            customers[idx].name = name;
            customers[idx].phone = phone;
            customers[idx].city = city;
            customers[idx].source = source;
            customers[idx].address = address;
            customers[idx].note = note;
        }
        showToast('تم تحديث بيانات العميل بنجاح', 'success');
    } else {
        // إضافة
        if (customers.some(c => c.phone === phone)) {
            showToast('هذا الرقم مسجل لعميل آخر بالفعل!', 'warning');
            return;
        }
        const nextId = customers.length > 0 ? Math.max(...customers.map(c => Number(c.id) || 0)) + 1 : 1;
        customers.push({
            id: nextId,
            name: name,
            phone: phone,
            city: city,
            source: source,
            address: address,
            note: note,
            createdAt: new Date().toISOString()
        });
        showToast('تمت إضافة العميل الجديد بنجاح', 'success');
    }

    if (typeof saveCustomers === 'function') {
        saveCustomers(customers);
    } else {
        localStorage.setItem('store_customers_v6', JSON.stringify(customers));
    }

    // إذا كان المصدر أونلاين، مزامنة مع store_online_users_v1
    if (source === 'online') {
        try {
            let onlineUsers = JSON.parse(localStorage.getItem('store_online_users_v1')) || [];
            const oIdx = onlineUsers.findIndex(u => u.phone === phone);
            if (oIdx !== -1) {
                onlineUsers[oIdx].name = name;
                onlineUsers[oIdx].city = city;
                onlineUsers[oIdx].address = address;
            } else {
                onlineUsers.push({
                    id: 'CUST-' + Date.now(),
                    name: name,
                    phone: phone,
                    city: city,
                    address: address,
                    password: '123',
                    createdAt: new Date().toISOString()
                });
            }
            localStorage.setItem('store_online_users_v1', JSON.stringify(onlineUsers));
        } catch(e) {}
    }

    closeModal('customerModal');
    renderCustomersTable();
    if (typeof initPosCustomers === 'function') initPosCustomers();
}

function deleteCustomerRecord(custId) {
    let customers = typeof getCustomers === 'function' ? getCustomers() : [];
    const cust = customers.find(c => String(c.id) === String(custId));
    if (!cust) return;

    if (!confirm(`هل أنت متأكد من حذف العميل "${cust.name}" نهائياً من النظام؟`)) return;

    customers = customers.filter(c => String(c.id) !== String(custId));
    if (typeof saveCustomers === 'function') {
        saveCustomers(customers);
    } else {
        localStorage.setItem('store_customers_v6', JSON.stringify(customers));
    }

    // حذف من قائمة مستخدمي المتجر أيضاً إن وجد
    try {
        let onlineUsers = JSON.parse(localStorage.getItem('store_online_users_v1')) || [];
        onlineUsers = onlineUsers.filter(u => u.phone !== cust.phone);
        localStorage.setItem('store_online_users_v1', JSON.stringify(onlineUsers));
    } catch(e) {}

    renderCustomersTable();
    if (typeof initPosCustomers === 'function') initPosCustomers();
    showToast('تم حذف العميل من قاعدة البيانات', 'info');
}

window.loadCustomersScreen = loadCustomersScreen;
window.renderCustomersTable = renderCustomersTable;
window.filterCustomerTab = filterCustomerTab;
window.handleCustomerSearch = handleCustomerSearch;
window.viewCustomerDetails = viewCustomerDetails;
window.openCustomerModal = openCustomerModal;
window.saveCustomerForm = saveCustomerForm;
window.deleteCustomerRecord = deleteCustomerRecord;
window.updateCustomersCountBadge = updateCustomersCountBadge;

/* ============================================
   26. بدء التشغيل
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        startApp();
    }
});
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBtnDesk = document.getElementById('notifBellBtn');
    const notifBtnMob = document.getElementById('notifBellBtnMobile');
    const notifBackdrop = document.getElementById('notifBackdrop');
    if (notifDropdown && notifDropdown.classList.contains('show')) {
        if (e.target === notifBackdrop ||
            (!notifDropdown.contains(e.target) &&
             (!notifBtnDesk || !notifBtnDesk.contains(e.target)) &&
             (!notifBtnMob || !notifBtnMob.contains(e.target)))) {
            closeNotifDropdown();
        }
    }
});


/* ============================================
   نظام جرس التنبيهات الذكي والشريط العلوي
   ============================================ */
let currentNotifFilterTab = 'all';

function getDismissedNotifIds() {
    try {
        return JSON.parse(localStorage.getItem('store_dismissed_notifs_v6') || '[]');
    } catch (e) {
        return [];
    }
}

function saveDismissedNotifIds(ids) {
    try {
        localStorage.setItem('store_dismissed_notifs_v6', JSON.stringify(ids));
    } catch (e) {}
}

function getReadNotifIds() {
    try {
        return JSON.parse(localStorage.getItem('store_read_notifs_v6') || '[]');
    } catch (e) {
        return [];
    }
}

function saveReadNotifIds(ids) {
    try {
        localStorage.setItem('store_read_notifs_v6', JSON.stringify(ids));
    } catch (e) {}
}

function initTopBarAndNotifications() {
    // 1. تحديث التاريخ في الشريط العلوي
    const dateEl = document.getElementById('topbarDate');
    if (dateEl) {
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            dateEl.innerHTML = `<i class="far fa-calendar-alt"></i> ${dateStr}`;
        } catch (e) {
            dateEl.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('ar-EG')}`;
        }
    }

    // 2. تحديث معلومات المستخدم في التوب بار
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const nameEl = document.getElementById('topbarUserName');
    const avatarEl = document.getElementById('topbarUserAvatar');
    if (user && nameEl) nameEl.textContent = user.name;
    if (user && avatarEl) avatarEl.textContent = user.name.charAt(0);

    // 3. تحديث التنبيهات
    updateNotifications();
}

function getStoreNotificationsList() {
    const list = [];
    const dismissedIds = getDismissedNotifIds();
    const readIds = getReadNotifIds();

    // أ. منتجات نفدت كميتها تماماً
    if (typeof getOutOfStockProducts === 'function') {
        const outProds = getOutOfStockProducts();
        outProds.forEach(p => {
            const id = 'stock-out-' + p.id;
            if (!dismissedIds.includes(id)) {
                list.push({
                    id: id,
                    type: 'stock',
                    severity: 'danger',
                    icon: 'fas fa-ban',
                    tag: 'نفاد المخزون',
                    title: `نفاد الكمية: ${p.name}`,
                    desc: `المقاس: ${p.size || 'عادي'} | اللون: ${p.color || 'عام'} - الرصيد الحالي 0 قطعة`,
                    actionText: 'طلب توريد',
                    actionCode: "switchScreen('inventory'); closeNotifDropdown();",
                    time: 'عاجل',
                    isRead: readIds.includes(id)
                });
            }
        });
    }

    // ب. منتجات مخزونها منخفض (أوشكت على النفاد)
    if (typeof getProducts === 'function' && typeof getProductQuantity === 'function') {
        const threshold = (typeof LOW_STOCK !== 'undefined') ? LOW_STOCK : 5;
        const lowProds = getProducts().filter(p => {
            const q = getProductQuantity(p.id);
            return q > 0 && q <= threshold;
        });

        lowProds.forEach(p => {
            const id = 'stock-low-' + p.id;
            if (!dismissedIds.includes(id)) {
                const q = getProductQuantity(p.id);
                list.push({
                    id: id,
                    type: 'stock',
                    severity: 'warning',
                    icon: 'fas fa-exclamation-triangle',
                    tag: 'مخزون منخفض',
                    title: `أوشك على النفاد: ${p.name}`,
                    desc: `المقاس: ${p.size || 'عادي'} | اللون: ${p.color || 'عام'} - المتبقي: ${q} قطع فقط`,
                    actionText: 'طلب توريد',
                    actionCode: "switchScreen('inventory'); closeNotifDropdown();",
                    time: 'تنبيه',
                    isRead: readIds.includes(id)
                });
            }
        });
    }

    // ج. ديون العملاء المستحقة
    if (typeof getCustomerDebtSummary === 'function') {
        const debts = getCustomerDebtSummary();
        Object.values(debts).filter(c => c.balance > 0.01).forEach(c => {
            const id = 'debt-' + encodeURIComponent(c.name);
            if (!dismissedIds.includes(id)) {
                list.push({
                    id: id,
                    type: 'debts',
                    severity: 'danger',
                    icon: 'fas fa-hand-holding-usd',
                    tag: 'دين عميل',
                    title: `دين مستحق: ${c.name}`,
                    desc: `المتبقي بذمته: ₪${c.balance.toFixed(2)}${c.phone ? ' | هاتف: ' + c.phone : ''}`,
                    actionText: 'متابعة الدين',
                    actionCode: "switchScreen('debts'); closeNotifDropdown();",
                    time: 'مستحق',
                    isRead: readIds.includes(id)
                });
            }
        });
    }

    // د. طلبات الموقع الإلكتروني قيد الانتظار
    if (typeof mockOnlineOrders !== 'undefined' && Array.isArray(mockOnlineOrders)) {
        mockOnlineOrders.filter(o => o.status === 'pending').forEach(o => {
            const id = 'order-' + o.id;
            if (!dismissedIds.includes(id)) {
                list.push({
                    id: id,
                    type: 'orders',
                    severity: 'info',
                    icon: 'fas fa-shopping-bag',
                    tag: 'طلب إلكتروني',
                    title: `طلب موقع معلق #${o.id}`,
                    desc: `العميل: ${o.customer} | الصنف: ${o.productName} (x${o.quantity}) | الإجمالي: ₪${Number(o.total).toFixed(2)}`,
                    actionText: 'معالجة الطلب',
                    actionCode: "switchScreen('online-orders'); closeNotifDropdown();",
                    time: 'جديد',
                    isRead: readIds.includes(id)
                });
            }
        });
    }

    // هـ. منتجات بسعر بيع خاسر
    if (typeof getLossProducts === 'function') {
        const lossProds = getLossProducts();
        lossProds.forEach(p => {
            const id = 'loss-' + p.id;
            if (!dismissedIds.includes(id)) {
                const avgCost = typeof getProductAvgCost === 'function' ? getProductAvgCost(p.id) : 0;
                list.push({
                    id: id,
                    type: 'stock',
                    severity: 'warning',
                    icon: 'fas fa-arrow-trend-down',
                    tag: 'سعر غير مربح',
                    title: `مراجعة السعر: ${p.name}`,
                    desc: `سعر البيع ₪${p.price} يقل عن متوسط التكلفة ₪${avgCost.toFixed(2)}`,
                    actionText: 'تعديل السعر',
                    actionCode: "switchScreen('categories'); closeNotifDropdown();",
                    time: 'تنبيه مالي',
                    isRead: readIds.includes(id)
                });
            }
        });
    }

    // و. تنبيهات حسابات العملاء المسجلين حديثاً في المتجر أونلاين
    try {
        const onlineUsers = JSON.parse(localStorage.getItem('store_online_users_v1')) || [];
        onlineUsers.slice(-5).forEach(u => {
            const id = 'cust-' + (u.id || u.phone);
            if (!dismissedIds.includes(id)) {
                list.push({
                    id: id,
                    type: 'orders',
                    severity: 'info',
                    icon: 'fas fa-user-plus',
                    tag: 'حساب جديد',
                    title: `عميل جديد بالمتجر: ${u.name}`,
                    desc: `الهاتف: ${u.phone} | المدينة: ${u.city || 'غير محدد'}`,
                    actionText: 'عرض العملاء',
                    actionCode: "closeNotifDropdown(); CURRENT_PANEL === 'online' ? openOnlineCustomers() : switchScreen('customers');",
                    time: u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : 'جديد',
                    isRead: readIds.includes(id)
                });
            }
        });
    } catch(e) {}

    // لوحة الموقع تعرض تنبيهات الطلبات والعملاء الجدد فقط
    return CURRENT_PANEL === 'online' ? list.filter(n => n.type === 'orders') : list;
}

function updateNotifications() {
    const list = getStoreNotificationsList();

    // حساب غير المقروء
    const unreadCount = list.filter(n => !n.isRead).length;

    // 1. تحديث شارة الجرس للكمبيوتر والهاتف
    const badgeDesktop = document.getElementById('notifBadge');
    const badgeMobile = document.getElementById('notifBadgeMobile');
    const bellBtnDesktop = document.getElementById('notifBellBtn');
    const bellBtnMobile = document.getElementById('notifBellBtnMobile');

    [badgeDesktop, badgeMobile].forEach(b => {
        if (!b) return;
        if (unreadCount > 0) {
            b.textContent = unreadCount > 99 ? '+99' : unreadCount;
            b.classList.add('show');
        } else {
            b.textContent = '0';
            b.classList.remove('show');
        }
    });

    [bellBtnDesktop, bellBtnMobile].forEach(btn => {
        if (!btn) return;
        if (unreadCount > 0) {
            btn.classList.add('has-unread');
        } else {
            btn.classList.remove('has-unread');
        }
    });

    // 2. تحديث عدادات التبويبات
    const countPill = document.getElementById('notifCountPill');
    if (countPill) countPill.textContent = `${list.length} تنبيه`;

    const tabAllEl = document.getElementById('notifTabAll');
    const tabStockEl = document.getElementById('notifTabStock');
    const tabDebtsEl = document.getElementById('notifTabDebts');
    const tabOrdersEl = document.getElementById('notifTabOrders');

    if (tabAllEl) tabAllEl.textContent = list.length;
    if (tabStockEl) tabStockEl.textContent = list.filter(n => n.type === 'stock').length;
    if (tabDebtsEl) tabDebtsEl.textContent = list.filter(n => n.type === 'debts').length;
    if (tabOrdersEl) tabOrdersEl.textContent = list.filter(n => n.type === 'orders').length;

    // 3. عرض القائمة
    renderNotifList(list);
}

function renderNotifList(allList = null) {
    const listEl = document.getElementById('notifList');
    if (!listEl) return;

    const list = allList || getStoreNotificationsList();

    let filtered = list;
    if (currentNotifFilterTab !== 'all') {
        filtered = list.filter(n => n.type === currentNotifFilterTab);
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="notif-empty">
                <i class="fas fa-bell-slash"></i>
                <p>لا توجد تنبيهات ${currentNotifFilterTab !== 'all' ? 'في هذا القسم' : 'حالياً'}</p>
                <small>كل شيء يسير بسلاسة والمخزون والديون في حالة ممتازة!</small>
            </div>
        `;
        return;
    }

    listEl.innerHTML = filtered.map(item => `
        <div class="notif-item ${item.severity} ${item.isRead ? 'read' : 'unread'}">
            <div class="notif-item-icon ${item.severity}">
                <i class="${item.icon}"></i>
            </div>
            <div class="notif-item-content">
                <div class="notif-item-top">
                    <span class="notif-tag ${item.severity}">${escapeHtml(item.tag)}</span>
                    <span class="notif-time">${escapeHtml(item.time)}</span>
                </div>
                <h6 class="notif-item-title">${escapeHtml(item.title)}</h6>
                <p class="notif-item-desc">${escapeHtml(item.desc)}</p>
                <div class="notif-item-footer">
                    <button class="notif-item-btn" onclick="${item.actionCode}">
                        ${escapeHtml(item.actionText)} <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="notif-dismiss-btn" onclick="dismissNotification(${jsArg(item.id)}, event)" title="إخفاء التنبيه">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function positionNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    const isMobile = window.innerWidth <= 767;
    const activeBtn = isMobile ? document.getElementById('notifBellBtnMobile') : document.getElementById('notifBellBtn');

    if (isMobile) {
        dropdown.style.position = 'fixed';
        dropdown.style.top = '60px';
        dropdown.style.left = '10px';
        dropdown.style.right = '10px';
        dropdown.style.width = 'auto';
        dropdown.style.maxWidth = '480px';
        dropdown.style.margin = '0 auto';
    } else if (activeBtn) {
        const rect = activeBtn.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 8) + 'px';
        dropdown.style.right = 'auto';
        dropdown.style.margin = '0';
        dropdown.style.width = '390px';
        dropdown.style.maxWidth = '90vw';

        let left = rect.left;
        if (left + 390 > window.innerWidth - 12) {
            left = window.innerWidth - 390 - 12;
        }
        if (left < 12) left = 12;
        dropdown.style.left = left + 'px';
    }
}

function toggleNotifDropdown(event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
    }
    const dropdown = document.getElementById('notifDropdown');
    const backdrop = document.getElementById('notifBackdrop');
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('show');
    if (isOpen) {
        closeNotifDropdown();
    } else {
        positionNotifDropdown();
        dropdown.classList.add('show');
        if (backdrop) backdrop.classList.add('show');
        updateNotifications();
    }
}

function closeNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.classList.remove('show');
    const backdrop = document.getElementById('notifBackdrop');
    if (backdrop) backdrop.classList.remove('show');
}

window.addEventListener('resize', () => {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown && dropdown.classList.contains('show')) {
        positionNotifDropdown();
    }
});

window.addEventListener('scroll', () => {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown && dropdown.classList.contains('show') && window.innerWidth >= 768) {
        positionNotifDropdown();
    }
}, { passive: true });

function filterNotifTab(tabName) {
    currentNotifFilterTab = tabName;
    document.querySelectorAll('.notif-tab').forEach(t => {
        if (t.getAttribute('data-tab') === tabName) t.classList.add('active');
        else t.classList.remove('active');
    });
    renderNotifList();
}

function dismissNotification(id, event) {
    if (event) event.stopPropagation();
    const dismissed = getDismissedNotifIds();
    if (!dismissed.includes(id)) {
        dismissed.push(id);
        saveDismissedNotifIds(dismissed);
    }
    updateNotifications();
    showToast('تم إخفاء التنبيه', 'info');
}

function markAllNotificationsAsRead() {
    const list = getStoreNotificationsList();
    const readIds = list.map(n => n.id);
    saveReadNotifIds(readIds);
    updateNotifications();
    showToast('تم تحديد جميع التنبيهات كمقروءة', 'success');
}

function refreshNotifications() {
    updateNotifications();
    showToast('تم فحص وتحديث التنبيهات الآن');
    playNotificationChime();
}

function playNotificationChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0.1, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.45);
    } catch (e) {}
}

window.initTopBarAndNotifications = initTopBarAndNotifications;
window.getStoreNotificationsList = getStoreNotificationsList;
window.updateNotifications = updateNotifications;
window.renderNotifList = renderNotifList;
window.toggleNotifDropdown = toggleNotifDropdown;
window.closeNotifDropdown = closeNotifDropdown;
window.filterNotifTab = filterNotifTab;
window.dismissNotification = dismissNotification;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.refreshNotifications = refreshNotifications;
window.playNotificationChime = playNotificationChime;
window.positionNotifDropdown = positionNotifDropdown;


/* ============================================
   إدارة صور أصناف الفاتورة في المشتريات
   ============================================ */
function handlePurchVariantImageUpload(pUid, varIndex, event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const p = purchActiveItems.find(x => x.uid === pUid);
        if (!p || !p.variants[varIndex]) return;

        p.variants[varIndex].image = e.target.result;
        renderPurchProducts();
        savePurchDraft(true);
        showToast('تم تحميل صورة الصنف بنجاح', 'success');
    };
    reader.readAsDataURL(file);
}

function removePurchVariantImage(pUid, varIndex) {
    const p = purchActiveItems.find(x => x.uid === pUid);
    if (!p || !p.variants[varIndex]) return;

    p.variants[varIndex].image = null;
    renderPurchProducts();
    savePurchDraft(true);
    showToast('تمت إزالة صورة الصنف', 'info');
}

function previewPurchVariantImage(imgSrc, title = 'معاينة صورة الصنف') {
    const modalImg = document.getElementById('purchImagePreviewImg');
    const modalTitle = document.getElementById('purchImagePreviewTitle');
    if (modalImg) modalImg.src = imgSrc;
    if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-image text-primary"></i> ${title}`;
    openModal('purchImagePreviewModal');
}

window.handlePurchVariantImageUpload = handlePurchVariantImageUpload;
window.removePurchVariantImage = removePurchVariantImage;
window.previewPurchVariantImage = previewPurchVariantImage;

// تصدير دوال بضاعة أول المدة
window.setPurchOperationMode = setPurchOperationMode;
window.startOpeningStockMode = startOpeningStockMode;
window.openQuickOpeningStockModal = openQuickOpeningStockModal;
window.addQuickOpeningStockRow = addQuickOpeningStockRow;
window.removeQuickOpeningStockRow = removeQuickOpeningStockRow;
window.onQuickStockRowChange = onQuickStockRowChange;
window.updateQuickStockSummary = updateQuickStockSummary;
window.downloadOpeningStockTemplate = downloadOpeningStockTemplate;
window.handleOpeningStockCsvUpload = handleOpeningStockCsvUpload;
window.submitQuickOpeningStockToInvoice = submitQuickOpeningStockToInvoice;


/* ==========================================================================
   الوحدة 11: نظام المرتجعات والتبديل (Returns & Exchanges System)
   ========================================================================== */

let currentReturnInvoice = null;
let returnItemsState = [];
let selectedReturnFinancialAction = null;

function switchReturnsSubtab(tab) {
    const tabs = ['new', 'history', 'stats'];
    tabs.forEach(t => {
        const el = document.getElementById('returnsSubtab-' + t);
        const btn = document.getElementById('tabBtn-returns-' + t);
        if (el) el.style.display = (t === tab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });

    if (tab === 'new') {
        renderReturnRecentInvoiceChips();
    } else if (tab === 'history') {
        loadReturnsTable();
    } else if (tab === 'stats') {
        loadReturnsStats();
    }
}
window.switchReturnsSubtab = switchReturnsSubtab;

function loadReturnsScreen() {
    switchReturnsSubtab('new');
    renderReturnRecentInvoiceChips();
}
window.loadReturnsScreen = loadReturnsScreen;

function renderReturnRecentInvoiceChips() {
    const container = document.getElementById('quickRecentInvoicesChips');
    if (!container) return;

    const sales = getActiveSales().slice(-7).reverse();
    if (sales.length === 0) {
        container.innerHTML = '<span style="color:#94a3b8;font-size:0.75rem;">لا توجد فواتير مبيعات سابقة مسجلة</span>';
        return;
    }

    container.innerHTML = sales.map(s => `
        <button type="button" class="btn btn-outline btn-sm"
                onclick="searchInvoiceForReturn(${jsArg(s.id)})"
                style="padding:2px 8px;font-size:0.75rem;border-radius:6px;background:#f8fafc;border-color:#cbd5e1;cursor:pointer;">
            <i class="fas fa-receipt text-primary"></i> #${escapeHtml(s.id)} - ${escapeHtml(s.customer || 'عميل')} (₪${Number(s.total).toFixed(0)})
        </button>
    `).join('');
}
window.renderReturnRecentInvoiceChips = renderReturnRecentInvoiceChips;

function searchInvoiceForReturn(specificInvoiceId) {
    let query = specificInvoiceId;
    if (!query) {
        const input = document.getElementById('returnSearchInvoiceInput');
        query = input ? input.value.trim() : '';
    }

    if (!query) {
        showToast('يرجى إدخال رقم الفاتورة أو اسم العميل', 'warning');
        return;
    }

    // تنظيف المدخلات (إزالة # أو مسافات)
    const cleanQuery = String(query).replace('#', '').trim().toLowerCase();

    const sales = getActiveSales();
    let found = sales.find(s => String(s.id).toLowerCase() === cleanQuery);

    if (!found) {
        found = sales.find(s => (s.customer && s.customer.toLowerCase().includes(cleanQuery)));
    }

    if (!found) {
        showToast(`لم يتم العثور على فاتورة برقم أو عميل "${query}"`, 'error');
        return;
    }

    loadInvoiceForReturn(found);
}
window.searchInvoiceForReturn = searchInvoiceForReturn;

function loadInvoiceForReturn(sale) {
    currentReturnInvoice = sale;
    const container = document.getElementById('returnSelectedInvoiceContainer');
    const headerCard = document.getElementById('returnInvoiceHeaderCard');
    if (!container || !headerCard) return;

    // حساب المرتجعات السابقة على هذه الفاتورة إن وجدت
    const allReturns = getReturns();
    const prevReturns = allReturns.filter(r => r.sale_id === sale.id && r.status !== 'cancelled');

    // رصيد دين العميل إن وجد
    const customerDebtsSummary = getCustomerDebtSummary();
    let customerDebtBalance = 0;
    Object.values(customerDebtsSummary).forEach(c => {
        if (c.name === sale.customer) customerDebtBalance = c.balance;
    });

    const paymentLabel = {
        cash: 'نقدي (كاش)',
        app: 'محفظة / بنك',
        debt: 'دين (آجل)'
    }[sale.payment ? sale.payment.method : 'cash'] || 'نقدي';

    headerCard.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
            <div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <h4 style="margin:0;font-weight:900;color:#1e293b;font-size:1.15rem;">
                        <i class="fas fa-file-invoice text-primary"></i> فاتورة مبيعات #${escapeHtml(sale.id)}
                    </h4>
                    <span class="badge ${sale.status === 'completed' ? 'success' : 'secondary'}">
                        ${sale.status === 'completed' ? 'مكتملة' : sale.status}
                    </span>
                    ${prevReturns.length > 0 ? `<span class="badge warning"><i class="fas fa-history"></i> تمت عليها ${prevReturns.length} عملية إرجاع سابقة</span>` : ''}
                </div>
                <div style="margin-top:6px;font-size:0.84rem;color:#64748b;display:flex;gap:16px;flex-wrap:wrap;">
                    <span><i class="far fa-user text-primary"></i> العميل: <strong>${escapeHtml(sale.customer || 'عميل نقدي')}</strong></span>
                    <span><i class="far fa-calendar-alt"></i> التاريخ: <strong>${new Date(sale.created_at).toLocaleDateString('ar-EG')} - ${new Date(sale.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</strong></span>
                    <span><i class="far fa-credit-card"></i> طريقة الدفع الأصلية: <strong>${paymentLabel}</strong></span>
                    <span><i class="fas fa-user-tag"></i> الكاشير: <strong>${escapeHtml(sale.cashier_name || 'الكاشير')}</strong></span>
                </div>
            </div>
            <div style="text-align:left;">
                <span style="font-size:0.75rem;color:#64748b;display:block;">إجمالي الفاتورة:</span>
                <strong style="font-size:1.35rem;color:#0f172a;">₪${Number(sale.total).toFixed(2)}</strong>
                ${customerDebtBalance > 0 ? `
                    <div style="margin-top:4px;padding:3px 8px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca;color:#991b1b;font-size:0.75rem;font-weight:700;">
                        <i class="fas fa-hand-holding-usd"></i> دين العميل الحالي: ₪${customerDebtBalance.toFixed(2)}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // تهيئة حالة أصناف الإرجاع
    returnItemsState = (sale.items || []).map((item, idx) => {
        const prodId = item.product_id || item.id;
        const itemQty = Number(item.quantity || item.qty || 1);
        const itemPrice = Number(item.sold_price || item.price || item.base_price || 0);

        // حساب كم تم إرجاعه من هذا الصنف سابقاً ضمن هذه الفاتورة
        let alreadyReturned = 0;
        prevReturns.forEach(r => {
            (r.return_items || []).forEach(ri => {
                if (Number(ri.product_id) === Number(prodId) && ri.color === item.color && ri.size === item.size) {
                    alreadyReturned += Number(ri.quantity || 0);
                }
            });
        });

        const availableQty = Math.max(0, itemQty - alreadyReturned);

        return {
            index: idx,
            product_id: prodId,
            name: item.name || 'صنف',
            color: item.color || '-',
            size: item.size || '-',
            price: itemPrice,
            cost: Number(item.cost_at_sale || 0),
            original_qty: itemQty,
            already_returned_qty: alreadyReturned,
            available_qty: availableQty,
            mode: 'none', // 'none' | 'return' | 'exchange'
            return_qty: availableQty > 0 ? 1 : 0,
            replacement_product_id: null,
            replacement_variant: null
        };
    });

    renderReturnInvoiceItems();
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

function renderReturnInvoiceItems() {
    const listContainer = document.getElementById('returnItemsListContainer');
    if (!listContainer) return;

    if (!returnItemsState || returnItemsState.length === 0) {
        listContainer.innerHTML = '<div class="text-center p-3 text-muted">لا توجد أصناف في هذه الفاتورة</div>';
        return;
    }

    const allProducts = getProducts();

    listContainer.innerHTML = returnItemsState.map((item, idx) => {
        const isExhausted = item.available_qty <= 0;

        // تجهيز بدائل التبديل لنفس الموديل أو التصنيف
        let replacementOptionsHtml = '<option value="">-- اختر المقاس أو اللون البديل الجديد --</option>';
        if (item.mode === 'exchange') {
            // البحث عن المنتجات التي لها نفس الاسم أو الكود أو قريبة منها
            const baseName = item.name.split(' - ')[0].trim().toLowerCase();
            const candidates = allProducts.filter(p => {
                const pName = p.name.toLowerCase();
                return (pName.includes(baseName) || baseName.includes(pName));
            });

            const listToUse = candidates.length > 0 ? candidates : allProducts.slice(0, 30);
            replacementOptionsHtml += listToUse.map(p => {
                const stock = getProductQuantity(p.id);
                const isSelected = item.replacement_product_id === p.id;
                const isSameVariant = (p.id === item.product_id);
                const stockLabel = stock <= 0 ? '(نفد من المخزن)' : `(متوفر: ${stock})`;
                const priceDiff = Number(p.price) - item.price;
                let diffText = '';
                if (priceDiff > 0) diffText = `[+₪${priceDiff.toFixed(2)} على الزبون]`;
                else if (priceDiff < 0) diffText = `[-₪${Math.abs(priceDiff).toFixed(2)} للزبون]`;
                else diffText = `[نفس السعر]`;

                return `
                    <option value="${escapeHtml(p.id)}" ${isSelected ? 'selected' : ''} ${stock <= 0 ? 'disabled style="color:#94a3b8;"' : ''}>
                        ${escapeHtml(p.name)} | لون: ${escapeHtml(p.color || 'افتراضي')} | مقاس: ${escapeHtml(p.size || 'افتراضي')} | سعر: ₪${Number(p.price).toFixed(2)} ${diffText} ${stockLabel} ${isSameVariant ? '← الصنف الحالي' : ''}
                    </option>
                `;
            }).join('');
        }

        return `
            <div class="return-item-card ${isExhausted ? 'opacity-50' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
                    <div>
                        <div style="font-weight:800;font-size:0.95rem;color:#1e293b;">
                            ${escapeHtml(item.name)}
                        </div>
                        <div style="font-size:0.8rem;color:#64748b;margin-top:3px;display:flex;gap:12px;flex-wrap:wrap;">
                            <span>اللون: <strong style="color:#334155;">${escapeHtml(item.color)}</strong></span>
                            <span>المقاس: <strong style="color:#334155;">${escapeHtml(item.size)}</strong></span>
                            <span>سعر البيع: <strong style="color:#10b981;">₪${item.price.toFixed(2)}</strong></span>
                            <span>الكمية بالفاتورة: <strong>${item.original_qty}</strong></span>
                            ${item.already_returned_qty > 0 ? `<span style="color:#ef4444;">أُرجع سابقاً: ${item.already_returned_qty}</span>` : ''}
                            <span style="font-weight:700;color:var(--primary);">المتاح للإرجاع/التبديل: ${item.available_qty}</span>
                        </div>
                    </div>

                    ${isExhausted ? `
                        <div>
                            <span class="badge secondary" style="font-size:0.8rem;padding:6px 12px;">
                                <i class="fas fa-check"></i> تم إرجاع كامل الكمية سابقاً
                            </span>
                        </div>
                    ` : `
                        <div class="return-mode-chips">
                            <button type="button" class="return-type-pill ${item.mode === 'none' ? 'active-none' : ''}"
                                    onclick="setReturnItemMode(${idx}, 'none')">
                                <i class="fas fa-minus"></i> احتفاظ (لا تغيير)
                            </button>
                            <button type="button" class="return-type-pill ${item.mode === 'return' ? 'active-return' : ''}"
                                    onclick="setReturnItemMode(${idx}, 'return')">
                                <i class="fas fa-undo"></i> إرجاع قطعة
                            </button>
                            <button type="button" class="return-type-pill ${item.mode === 'exchange' ? 'active-exchange' : ''}"
                                    onclick="setReturnItemMode(${idx}, 'exchange')">
                                <i class="fas fa-sync-alt"></i> تبديل مقاس / لون
                            </button>
                        </div>
                    `}
                </div>

                ${!isExhausted && item.mode !== 'none' ? `
                    <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <label style="font-size:0.82rem;font-weight:700;color:#334155;">الكمية المراد ${item.mode === 'return' ? 'إرجاعها' : 'تبديلها'}:</label>
                            <input type="number" min="1" max="${item.available_qty}" value="${item.return_qty}"
                                   style="width:75px;padding:5px 8px;border:1.5px solid var(--primary);border-radius:6px;font-weight:700;text-align:center;"
                                   onchange="onReturnQtyChange(${idx}, this.value)">
                            <span style="font-size:0.75rem;color:#64748b;">(أقصى حد: ${item.available_qty})</span>
                            <span class="badge ${item.return_qty === item.original_qty ? 'danger' : 'info'}" style="font-size:0.75rem;">
                                ${item.return_qty === item.original_qty ? 'إرجاع كامل القطعة' : 'إرجاع جزئي'}
                            </span>
                        </div>

                        <div>
                            <span style="font-size:0.82rem;color:#475569;">قيمة المرتجع المستحقة:</span>
                            <strong style="font-size:1.1rem;color:#dc2626;margin-right:6px;">₪${(item.return_qty * item.price).toFixed(2)}</strong>
                        </div>
                    </div>
                ` : ''}

                ${!isExhausted && item.mode === 'exchange' ? `
                    <div class="exchange-picker-box">
                        <div style="font-weight:700;font-size:0.85rem;color:#3730a3;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                            <i class="fas fa-tshirt"></i> اختر القطعة البديلة الجديدة للزبون (المقاس أو اللون المطلوب):
                        </div>
                        <select style="width:100%;padding:8px 12px;border:1.5px solid #a5b4fc;border-radius:8px;font-family:inherit;font-size:0.84rem;background:#fff;"
                                onchange="onReturnReplacementSelect(${idx}, this.value)">
                            ${replacementOptionsHtml}
                        </select>

                        ${item.replacement_variant ? `
                            <div style="margin-top:8px;font-size:0.8rem;color:#4338ca;background:#eef2ff;padding:8px 12px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                                <span><i class="fas fa-check-circle"></i> تم اختيار: <strong>${escapeHtml(item.replacement_variant.name)} (${escapeHtml(item.replacement_variant.color)} - ${escapeHtml(item.replacement_variant.size)})</strong></span>
                                <span>سعر البديل: <strong>₪${item.replacement_variant.price.toFixed(2)}</strong> (${item.replacement_variant.price === item.price ? 'بدون فرق مالي' : (item.replacement_variant.price > item.price ? `فرق ₪${(item.replacement_variant.price - item.price).toFixed(2)} على الزبون` : `فرق ₪${(item.price - item.replacement_variant.price).toFixed(2)} للزبون`)})</span>
                            </div>
                        ` : `
                            <div style="margin-top:6px;font-size:0.75rem;color:#ef4444;">
                                * يرجى اختيار القطعة والمقاس البديل لإتمام عملية التبديل
                            </div>
                        `}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    updateReturnFinancialSummary();
}

function setReturnItemMode(index, mode) {
    if (!returnItemsState[index]) return;
    returnItemsState[index].mode = mode;
    if (mode === 'none') {
        returnItemsState[index].replacement_product_id = null;
        returnItemsState[index].replacement_variant = null;
    }
    renderReturnInvoiceItems();
}
window.setReturnItemMode = setReturnItemMode;

function onReturnQtyChange(index, qty) {
    if (!returnItemsState[index]) return;
    let val = parseInt(qty, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > returnItemsState[index].available_qty) val = returnItemsState[index].available_qty;
    returnItemsState[index].return_qty = val;
    renderReturnInvoiceItems();
}
window.onReturnQtyChange = onReturnQtyChange;

function onReturnReplacementSelect(index, replacementProdId) {
    if (!returnItemsState[index]) return;
    const pid = parseInt(replacementProdId, 10);
    if (!pid) {
        returnItemsState[index].replacement_product_id = null;
        returnItemsState[index].replacement_variant = null;
        renderReturnInvoiceItems();
        return;
    }

    const prod = getProductById(pid);
    if (!prod) return;

    returnItemsState[index].replacement_product_id = pid;
    returnItemsState[index].replacement_variant = {
        id: prod.id,
        name: prod.name,
        color: prod.color || 'افتراضي',
        size: prod.size || 'افتراضي',
        price: Number(prod.price || 0),
        cost: Number(getProductAvgCost(prod.id) || 0)
    };

    renderReturnInvoiceItems();
}
window.onReturnReplacementSelect = onReturnReplacementSelect;

function updateReturnFinancialSummary() {
    let totalReturned = 0;
    let totalReplacement = 0;
    let activeActionItemsCount = 0;

    returnItemsState.forEach(item => {
        if (item.mode === 'return') {
            totalReturned += item.return_qty * item.price;
            activeActionItemsCount++;
        } else if (item.mode === 'exchange') {
            totalReturned += item.return_qty * item.price;
            if (item.replacement_variant) {
                totalReplacement += item.return_qty * item.replacement_variant.price;
            }
            activeActionItemsCount++;
        }
    });

    const netDiff = totalReplacement - totalReturned; // < 0 means store pays customer, > 0 means customer pays store

    const totalRetEl = document.getElementById('retSumTotalReturned');
    const totalRepEl = document.getElementById('retSumTotalReplacement');
    const netDiffEl = document.getElementById('retSumNetDiff');
    const netDiffLabelEl = document.getElementById('retNetDiffLabel');
    const netDiffBoxEl = document.getElementById('retNetDiffBox');
    const actionsSection = document.getElementById('retFinancialActionCards');

    if (totalRetEl) totalRetEl.textContent = '₪' + totalReturned.toFixed(2);
    if (totalRepEl) totalRepEl.textContent = '₪' + totalReplacement.toFixed(2);
    if (netDiffEl) netDiffEl.textContent = '₪' + Math.abs(netDiff).toFixed(2);

    if (netDiff < 0) {
        if (netDiffLabelEl) netDiffLabelEl.textContent = 'مبلغ مستحق إرجاعه للزبون:';
        if (netDiffBoxEl) {
            netDiffBoxEl.style.background = '#fef2f2';
            netDiffBoxEl.style.borderColor = '#fca5a5';
        }
        if (netDiffEl) netDiffEl.style.color = '#dc2626';
    } else if (netDiff > 0) {
        if (netDiffLabelEl) netDiffLabelEl.textContent = 'مبلغ فرق مستحق تحصيله من الزبون:';
        if (netDiffBoxEl) {
            netDiffBoxEl.style.background = '#f0fdf4';
            netDiffBoxEl.style.borderColor = '#86efac';
        }
        if (netDiffEl) netDiffEl.style.color = '#16a34a';
    } else {
        if (netDiffLabelEl) netDiffLabelEl.textContent = 'تبديل متطابق (بدون فرق مالي):';
        if (netDiffBoxEl) {
            netDiffBoxEl.style.background = '#eff6ff';
            netDiffBoxEl.style.borderColor = '#93c5fd';
        }
        if (netDiffEl) netDiffEl.style.color = '#2563eb';
    }

    // بناء خيارات التسوية المالية
    if (!actionsSection) return;

    if (activeActionItemsCount === 0) {
        actionsSection.innerHTML = '<div style="color:#64748b;font-size:0.82rem;">يرجى تحديد إجراء (إرجاع أو تبديل) لأحد الأصناف أعلاه لعرض خيارات التسوية المالية.</div>';
        selectedReturnFinancialAction = null;
        return;
    }

    let cardsHtml = '';

    if (netDiff < 0) {
        const refundAmt = Math.abs(netDiff).toFixed(2);
        // التحقق من دين العميل الحالي
        const customerSummary = getCustomerDebtSummary();
        let customerDebt = 0;
        if (currentReturnInvoice && currentReturnInvoice.customer) {
            Object.values(customerSummary).forEach(c => {
                if (c.name === currentReturnInvoice.customer) customerDebt = c.balance;
            });
        }

        if (!selectedReturnFinancialAction || !['cash_refund', 'debt_reduction', 'digital_refund'].includes(selectedReturnFinancialAction)) {
            selectedReturnFinancialAction = customerDebt > 0 ? 'debt_reduction' : 'cash_refund';
        }

        cardsHtml = `
            <div class="financial-action-card ${selectedReturnFinancialAction === 'cash_refund' ? 'selected' : ''}"
                 onclick="selectReturnFinancialAction('cash_refund')">
                <i class="fas fa-money-bill-wave text-danger" style="font-size:1.6rem;"></i>
                <div>
                    <strong style="display:block;font-size:0.9rem;color:#1e293b;">إعادة المبلغ نقداً للزبون (كاش)</strong>
                    <small style="color:#64748b;font-size:0.76rem;line-height:1.4;display:block;">
                        صرف ₪${refundAmt} نقداً من درج الكاشير للزبون، ويُسجل كحركة خروج نقدي في الصندوق.
                    </small>
                </div>
            </div>

            <div class="financial-action-card ${selectedReturnFinancialAction === 'debt_reduction' ? 'selected' : ''}"
                 onclick="selectReturnFinancialAction('debt_reduction')">
                <i class="fas fa-hand-holding-usd text-primary" style="font-size:1.6rem;"></i>
                <div>
                    <strong style="display:block;font-size:0.9rem;color:#1e293b;">تخفيض دين الزبون</strong>
                    <small style="color:#64748b;font-size:0.76rem;line-height:1.4;display:block;">
                        خصم ₪${refundAmt} من رصيد دين الزبون (الرصيد الحالي: ₪${customerDebt.toFixed(2)}) دون إخراج نقد من الدرج.
                    </small>
                </div>
            </div>

            <div class="financial-action-card ${selectedReturnFinancialAction === 'digital_refund' ? 'selected' : ''}"
                 onclick="selectReturnFinancialAction('digital_refund')">
                <i class="fas fa-mobile-alt text-info" style="font-size:1.6rem;"></i>
                <div>
                    <strong style="display:block;font-size:0.9rem;color:#1e293b;">إعادة عبر المحفظة / بنك</strong>
                    <small style="color:#64748b;font-size:0.76rem;line-height:1.4;display:block;">
                        إعادة ₪${refundAmt} عبر PalPay أو Jawwal Pay أو تحويل بنكي.
                    </small>
                </div>
            </div>
        `;
    } else if (netDiff > 0) {
        const extraAmt = netDiff.toFixed(2);
        if (!selectedReturnFinancialAction || !['collected_cash', 'add_to_debt', 'collected_digital'].includes(selectedReturnFinancialAction)) {
            selectedReturnFinancialAction = 'collected_cash';
        }

        cardsHtml = `
            <div class="financial-action-card ${selectedReturnFinancialAction === 'collected_cash' ? 'selected' : ''}"
                 onclick="selectReturnFinancialAction('collected_cash')">
                <i class="fas fa-money-bill-wave text-success" style="font-size:1.6rem;"></i>
                <div>
                    <strong style="display:block;font-size:0.9rem;color:#1e293b;">تحصيل الفرق نقداً (في الصندوق)</strong>
                    <small style="color:#64748b;font-size:0.76rem;line-height:1.4;display:block;">
                        استلام ₪${extraAmt} نقداً من الزبون وإضافتها لدرج الصندوق فوراً.
                    </small>
                </div>
            </div>

            <div class="financial-action-card ${selectedReturnFinancialAction === 'add_to_debt' ? 'selected' : ''}"
                 onclick="selectReturnFinancialAction('add_to_debt')">
                <i class="fas fa-file-invoice text-warning" style="font-size:1.6rem;"></i>
                <div>
                    <strong style="display:block;font-size:0.9rem;color:#1e293b;">إضافة الفرق لدين الزبون</strong>
                    <small style="color:#64748b;font-size:0.76rem;line-height:1.4;display:block;">
                        تسجيل ₪${extraAmt} كدين إضافي في ذمة الزبون يتم سداده لاحقاً.
                    </small>
                </div>
            </div>

            <div class="financial-action-card ${selectedReturnFinancialAction === 'collected_digital' ? 'selected' : ''}"
                 onclick="selectReturnFinancialAction('collected_digital')">
                <i class="fas fa-mobile-alt text-info" style="font-size:1.6rem;"></i>
                <div>
                    <strong style="display:block;font-size:0.9rem;color:#1e293b;">تحصيل الفرق إلكترونياً</strong>
                    <small style="color:#64748b;font-size:0.76rem;line-height:1.4;display:block;">
                        استلام ₪${extraAmt} عبر تطبيق PalPay أو Jawwal Pay.
                    </small>
                </div>
            </div>
        `;
    } else {
        selectedReturnFinancialAction = 'even';
        cardsHtml = `
            <div class="financial-action-card selected" style="grid-column: 1 / -1;">
                <i class="fas fa-check-circle text-success" style="font-size:1.6rem;"></i>
                <div>
                    <strong style="display:block;font-size:0.9rem;color:#1e293b;">تبديل متطابق القيمة (0 ₪)</strong>
                    <small style="color:#64748b;font-size:0.76rem;line-height:1.4;display:block;">
                        القطعة البديلة بنفس سعر القطعة المرتجعة، لا يترتب أي حركة مالية على الزبون أو الصندوق.
                    </small>
                </div>
            </div>
        `;
    }

    actionsSection.innerHTML = cardsHtml;
}

function selectReturnFinancialAction(action) {
    selectedReturnFinancialAction = action;
    updateReturnFinancialSummary();
}
window.selectReturnFinancialAction = selectReturnFinancialAction;

function cancelCurrentReturn() {
    currentReturnInvoice = null;
    returnItemsState = [];
    selectedReturnFinancialAction = null;
    const container = document.getElementById('returnSelectedInvoiceContainer');
    if (container) container.style.display = 'none';
    const input = document.getElementById('returnSearchInvoiceInput');
    if (input) {
        input.value = '';
        input.focus();
    }
}
window.cancelCurrentReturn = cancelCurrentReturn;

function submitReturnOperation() {
    if (!currentReturnInvoice) {
        showToast('يرجى اختيار الفاتورة أولاً', 'error');
        return;
    }

    const activeItems = returnItemsState.filter(i => i.mode !== 'none');
    if (activeItems.length === 0) {
        showToast('يرجى تحديد صنف واحد على الأقل للإرجاع أو التبديل', 'warning');
        return;
    }

    // التحقق من صحة التبديل (اختيار بديل لكل صنف في وضع التبديل)
    for (const it of activeItems) {
        if (it.mode === 'exchange') {
            if (!it.replacement_variant || !it.replacement_product_id) {
                showToast(`يرجى اختيار القطعة البديلة للصنف: ${it.name}`, 'error');
                return;
            }
            const stock = getProductQuantity(it.replacement_product_id);
            if (stock < it.return_qty) {
                showToast(`الكمية المتوفرة في المخزن للصنف البديل (${it.replacement_variant.name}) غير كافية`, 'error');
                return;
            }
        }
    }

    const reason = (document.getElementById('returnReasonInput')?.value || '').trim() || 'إرجاع / تبديل صنف';
    const note = (document.getElementById('returnNoteInput')?.value || '').trim();

    let totalReturned = 0;
    let totalReplacement = 0;
    const return_items = [];
    const exchange_items = [];

    activeItems.forEach(it => {
        totalReturned += it.return_qty * it.price;
        return_items.push({
            product_id: it.product_id,
            name: it.name,
            color: it.color,
            size: it.size,
            unit_price: it.price,
            cost: it.cost,
            quantity: it.return_qty,
            mode: it.mode
        });

        if (it.mode === 'exchange' && it.replacement_variant) {
            totalReplacement += it.return_qty * it.replacement_variant.price;
            exchange_items.push({
                product_id: it.replacement_variant.id,
                name: it.replacement_variant.name,
                color: it.replacement_variant.color,
                size: it.replacement_variant.size,
                unit_price: it.replacement_variant.price,
                cost: it.replacement_variant.cost,
                quantity: it.return_qty
            });
        }
    });

    const netDiff = totalReplacement - totalReturned;
    const returnId = 'RET-' + (Math.floor(Math.random() * 90000) + 10000);
    const user = getCurrentUser();

    // نوع العملية العام
    let operationType = 'return_full';
    const hasExchange = activeItems.some(i => i.mode === 'exchange');
    const hasReturn = activeItems.some(i => i.mode === 'return');
    if (hasExchange && !hasReturn) operationType = 'exchange';
    else if (hasExchange && hasReturn) operationType = 'mixed';
    else {
        // فحص هل إرجاع كامل الفاتورة أم جزئي
        const allOriginalItemsExhausted = returnItemsState.every(it => {
            const returnedNow = (it.mode === 'return') ? it.return_qty : 0;
            return (it.already_returned_qty + returnedNow) >= it.original_qty;
        });
        operationType = allOriginalItemsExhausted ? 'return_full' : 'return_partial';
    }

    const returnRecord = {
        id: returnId,
        sale_id: currentReturnInvoice.id,
        customer_name: currentReturnInvoice.customer || 'عميل نقدي',
        created_at: new Date().toISOString(),
        user_name: user ? user.name : 'الكاشير',
        user_id: user ? user.id : null,
        operation_type: operationType,
        reason: reason,
        note: note,
        return_items: return_items,
        exchange_items: exchange_items,
        total_returned: totalReturned,
        total_replacement: totalReplacement,
        net_diff: netDiff,
        financial_action: selectedReturnFinancialAction,
        status: 'completed'
    };

    // حفظ سند الإرجاع في قاعدة البيانات
    const allReturns = getReturns();
    allReturns.unshift(returnRecord);
    saveReturns(allReturns);

    // تطبيق الأثر المالي
    if (selectedReturnFinancialAction === 'debt_reduction') {
        const debts = getCustomerDebts();
        let newId = debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1;
        debts.push({
            id: newId,
            customer_name: currentReturnInvoice.customer,
            customer_phone: currentReturnInvoice.payment?.sender_phone || '',
            type: 'payment',
            amount: Math.abs(netDiff),
            sale_id: currentReturnInvoice.id,
            note: `تخفيض دين مقابل سند إرجاع #${returnId}`,
            created_at: new Date().toISOString()
        });
        saveCustomerDebts(debts);
    } else if (selectedReturnFinancialAction === 'add_to_debt') {
        const debts = getCustomerDebts();
        let newId = debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1;
        debts.push({
            id: newId,
            customer_name: currentReturnInvoice.customer,
            customer_phone: currentReturnInvoice.payment?.sender_phone || '',
            type: 'invoice',
            amount: netDiff,
            sale_id: currentReturnInvoice.id,
            note: `فرق تبديل مقاس/لون - سند #${returnId}`,
            created_at: new Date().toISOString()
        });
        saveCustomerDebts(debts);
    }

    // إشعار نجاح
    showToast(`✅ تم اعتماد سند الإرجاع/التبديل #${returnId} بنجاح`, 'success');

    // إغلاق الحاوية وعرض السند للطباعة
    cancelCurrentReturn();
    loadReturnsTable();
    viewReturnDetails(returnId);
}
window.submitReturnOperation = submitReturnOperation;

function loadReturnsTable() {
    const tbody = document.getElementById('returnsTableBody');
    if (!tbody) return;

    const query = (document.getElementById('returnsHistorySearch')?.value || '').trim().toLowerCase();
    const allReturns = getReturns();

    const filtered = allReturns.filter(r => {
        if (!query) return true;
        const matchId = String(r.id || '').toLowerCase().includes(query);
        const matchSale = String(r.sale_id || '').toLowerCase().includes(query);
        const matchCust = String(r.customer_name || '').toLowerCase().includes(query);
        const matchReason = String(r.reason || '').toLowerCase().includes(query);
        return matchId || matchSale || matchCust || matchReason;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding:24px;color:#94a3b8;">
                    <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                    لا توجد عمليات إرجاع أو تبديل مطابقة
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        let typeBadge = '';
        if (r.operation_type === 'return_full') {
            typeBadge = '<span class="badge danger"><i class="fas fa-undo"></i> إرجاع كامل</span>';
        } else if (r.operation_type === 'return_partial') {
            typeBadge = '<span class="badge warning"><i class="fas fa-undo"></i> إرجاع جزئي</span>';
        } else if (r.operation_type === 'exchange') {
            typeBadge = '<span class="badge primary"><i class="fas fa-sync-alt"></i> تبديل مقاس/لون</span>';
        } else {
            typeBadge = '<span class="badge info"><i class="fas fa-exchange-alt"></i> إرجاع وتبديل مختلط</span>';
        }

        let finBadge = '';
        if (r.financial_action === 'cash_refund') {
            finBadge = `<span style="color:#dc2626;font-weight:700;"><i class="fas fa-arrow-down"></i> إرجاع كاش ₪${Math.abs(r.net_diff).toFixed(2)}</span>`;
        } else if (r.financial_action === 'debt_reduction') {
            finBadge = `<span style="color:#4f46e5;font-weight:700;"><i class="fas fa-hand-holding-usd"></i> تخفيض دين ₪${Math.abs(r.net_diff).toFixed(2)}</span>`;
        } else if (r.financial_action === 'collected_cash') {
            finBadge = `<span style="color:#16a34a;font-weight:700;"><i class="fas fa-arrow-up"></i> تحصيل كاش ₪${r.net_diff.toFixed(2)}</span>`;
        } else if (r.financial_action === 'add_to_debt') {
            finBadge = `<span style="color:#d97706;font-weight:700;"><i class="fas fa-file-invoice"></i> إضافة للدين ₪${r.net_diff.toFixed(2)}</span>`;
        } else if (r.financial_action === 'digital_refund') {
            finBadge = `<span style="color:#0284c7;font-weight:700;"><i class="fas fa-mobile-alt"></i> إرجاع محفظة ₪${Math.abs(r.net_diff).toFixed(2)}</span>`;
        } else {
            finBadge = `<span style="color:#64748b;font-weight:700;"><i class="fas fa-check"></i> متطابق (0 ₪)</span>`;
        }

        const itemsSummary = (r.return_items || []).map(i => `${i.name} (${i.quantity})`).join(', ');

        return `
            <tr>
                <td><strong>#${escapeHtml(r.id)}</strong></td>
                <td>
                    <div style="font-weight:600;">${new Date(r.created_at).toLocaleDateString('ar-EG')}</div>
                    <small style="color:#64748b;">${new Date(r.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</small>
                </td>
                <td><a href="#" onclick="event.preventDefault();searchInvoiceForReturn(${jsArg(r.sale_id)})">#${escapeHtml(r.sale_id)}</a></td>
                <td><strong>${escapeHtml(r.customer_name || 'عميل')}</strong></td>
                <td>${typeBadge}</td>
                <td><small style="max-width:200px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(itemsSummary)}</small></td>
                <td>${finBadge}</td>
                <td>${escapeHtml(r.user_name || 'الكاشير')}</td>
                <td>
                    <button type="button" class="btn btn-outline btn-sm" onclick="viewReturnDetails(${jsArg(r.id)})" title="عرض السند وطباعته">
                        <i class="fas fa-print"></i> عرض
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}
window.loadReturnsTable = loadReturnsTable;

function loadReturnsStats() {
    const grid = document.getElementById('returnsStatsGrid');
    if (!grid) return;

    const all = getReturns();
    const count = all.length;
    const totalReturned = all.reduce((s, r) => s + Number(r.total_returned || 0), 0);
    const totalCashRefunded = all
        .filter(r => r.financial_action === 'cash_refund')
        .reduce((s, r) => s + Math.abs(Number(r.net_diff || 0)), 0);
    const totalDebtReduced = all
        .filter(r => r.financial_action === 'debt_reduction')
        .reduce((s, r) => s + Math.abs(Number(r.net_diff || 0)), 0);

    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon primary"><i class="fas fa-receipt"></i></div>
            <div class="stat-label">إجمالي عمليات الإرجاع والتبديل</div>
            <div class="stat-value">${count}</div>
            <small style="color:var(--gray);font-size:0.72rem;">سندات معتمدة</small>
        </div>
        <div class="stat-card">
            <div class="stat-icon warning"><i class="fas fa-undo-alt"></i></div>
            <div class="stat-label">إجمالي قيمة البضائع المرتجعة</div>
            <div class="stat-value">₪${totalReturned.toFixed(2)}</div>
            <small style="color:var(--gray);font-size:0.72rem;">أُعيدت للمخزن</small>
        </div>
        <div class="stat-card">
            <div class="stat-icon danger"><i class="fas fa-money-bill-wave"></i></div>
            <div class="stat-label">مبالغ النقد المسترد (كاش)</div>
            <div class="stat-value" style="color:var(--danger);">₪${totalCashRefunded.toFixed(2)}</div>
            <small style="color:var(--gray);font-size:0.72rem;">خارج من الدرج</small>
        </div>
        <div class="stat-card">
            <div class="stat-icon success"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="stat-label">مبالغ تخفيض ديون العملاء</div>
            <div class="stat-value" style="color:var(--success);">₪${totalDebtReduced.toFixed(2)}</div>
            <small style="color:var(--gray);font-size:0.72rem;">خصم مباشر من الرصيد</small>
        </div>
    `;
}
window.loadReturnsStats = loadReturnsStats;

function viewReturnDetails(returnId) {
    const all = getReturns();
    const ret = all.find(r => r.id === returnId);
    if (!ret) return;

    const modalTitle = document.getElementById('returnModalHeaderTitle');
    const modalBody = document.getElementById('returnModalBody');
    const printBtn = document.getElementById('returnPrintBtn');

    if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-file-invoice text-primary"></i> سند إرجاع / تبديل #${escapeHtml(ret.id)}`;
    if (printBtn) printBtn.setAttribute('onclick', `printReturnReceipt('${ret.id}')`);

    let finActionDesc = '';
    if (ret.financial_action === 'cash_refund') {
        finActionDesc = `تم صرف مبلغ <strong style="color:#dc2626;">₪${Math.abs(ret.net_diff).toFixed(2)}</strong> نقداً للزبون من درج الصندوق.`;
    } else if (ret.financial_action === 'debt_reduction') {
        finActionDesc = `تم تخفيض دين الزبون بمبلغ <strong style="color:#4f46e5;">₪${Math.abs(ret.net_diff).toFixed(2)}</strong>.`;
    } else if (ret.financial_action === 'collected_cash') {
        finActionDesc = `تم تحصيل فرق سعر بمبلغ <strong style="color:#16a34a;">₪${ret.net_diff.toFixed(2)}</strong> نقداً من الزبون للدرج.`;
    } else if (ret.financial_action === 'add_to_debt') {
        finActionDesc = `تمت إضافة فرق السعر بمبلغ <strong style="color:#d97706;">₪${ret.net_diff.toFixed(2)}</strong> على دين الزبون.`;
    } else {
        finActionDesc = `تبديل متطابق القيمة (0.00 ₪) دون أي فروق مالية.`;
    }

    if (modalBody) {
        modalBody.innerHTML = `
            <div id="printReturnReceiptArea" style="padding:10px;font-family:inherit;">
                <!-- رأس السند -->
                <div style="text-align:center;border-bottom:2px dashed #cbd5e1;padding-bottom:12px;margin-bottom:12px;">
                    <h3 style="margin:0 0 4px;font-weight:900;color:#1e293b;">متجر الملابس والأناقة</h3>
                    <div style="font-size:0.85rem;color:#64748b;">سند إرجاع وتبديل بضاعة</div>
                    <div style="font-size:1.1rem;font-weight:800;color:var(--primary);margin-top:4px;">#${escapeHtml(ret.id)}</div>
                </div>

                <!-- بيانات أساسية -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.84rem;margin-bottom:14px;background:#f8fafc;padding:12px;border-radius:8px;">
                    <div><strong>الفاتورة الأصلية:</strong> #${escapeHtml(ret.sale_id)}</div>
                    <div><strong>التاريخ:</strong> ${new Date(ret.created_at).toLocaleDateString('ar-EG')} - ${new Date(ret.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</div>
                    <div><strong>العميل:</strong> ${escapeHtml(ret.customer_name || 'عميل نقدي')}</div>
                    <div><strong>الموظف المسؤول:</strong> ${escapeHtml(ret.user_name || 'الكاشير')}</div>
                    <div style="grid-column:1/-1;"><strong>السبب:</strong> ${escapeHtml(ret.reason || 'إرجاع / تبديل')}</div>
                    ${ret.note ? `<div style="grid-column:1/-1;"><strong>ملاحظات:</strong> ${escapeHtml(ret.note)}</div>` : ''}
                </div>

                <!-- جدول الأصناف المرتجعة -->
                <h6 style="font-weight:800;margin:12px 0 6px;color:#991b1b;"><i class="fas fa-undo"></i> الأصناف المرتجعة إلى المخزن:</h6>
                <table style="width:100%;border-collapse:collapse;font-size:0.82rem;margin-bottom:12px;">
                    <thead>
                        <tr style="background:#fee2e2;color:#991b1b;border-bottom:1px solid #fca5a5;">
                            <th style="padding:6px;text-align:right;">الصنف</th>
                            <th style="padding:6px;text-align:center;">اللون</th>
                            <th style="padding:6px;text-align:center;">المقاس</th>
                            <th style="padding:6px;text-align:center;">العدد</th>
                            <th style="padding:6px;text-align:center;">السعر</th>
                            <th style="padding:6px;text-align:left;">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(ret.return_items || []).map(i => `
                            <tr style="border-bottom:1px solid #e2e8f0;">
                                <td style="padding:6px;">${escapeHtml(i.name)}</td>
                                <td style="padding:6px;text-align:center;">${escapeHtml(i.color)}</td>
                                <td style="padding:6px;text-align:center;">${escapeHtml(i.size)}</td>
                                <td style="padding:6px;text-align:center;"><strong>${i.quantity}</strong></td>
                                <td style="padding:6px;text-align:center;">₪${Number(i.unit_price).toFixed(2)}</td>
                                <td style="padding:6px;text-align:left;font-weight:700;color:#dc2626;">₪${(i.quantity * i.unit_price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- جدول الأصناف البديلة (إن وجدت) -->
                ${(ret.exchange_items && ret.exchange_items.length > 0) ? `
                    <h6 style="font-weight:800;margin:12px 0 6px;color:#3730a3;"><i class="fas fa-sync-alt"></i> الأصناف البديلة المسلمة للزبون:</h6>
                    <table style="width:100%;border-collapse:collapse;font-size:0.82rem;margin-bottom:12px;">
                        <thead>
                            <tr style="background:#e0e7ff;color:#3730a3;border-bottom:1px solid #a5b4fc;">
                                <th style="padding:6px;text-align:right;">الصنف البديل</th>
                                <th style="padding:6px;text-align:center;">اللون</th>
                                <th style="padding:6px;text-align:center;">المقاس</th>
                                <th style="padding:6px;text-align:center;">العدد</th>
                                <th style="padding:6px;text-align:center;">السعر</th>
                                <th style="padding:6px;text-align:left;">المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ret.exchange_items.map(i => `
                                <tr style="border-bottom:1px solid #e2e8f0;">
                                    <td style="padding:6px;">${escapeHtml(i.name)}</td>
                                    <td style="padding:6px;text-align:center;">${escapeHtml(i.color)}</td>
                                    <td style="padding:6px;text-align:center;">${escapeHtml(i.size)}</td>
                                    <td style="padding:6px;text-align:center;"><strong>${i.quantity}</strong></td>
                                    <td style="padding:6px;text-align:center;">₪${Number(i.unit_price).toFixed(2)}</td>
                                    <td style="padding:6px;text-align:left;font-weight:700;color:#4f46e5;">₪${(i.quantity * i.unit_price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <!-- التسوية المالية -->
                <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:12px;margin-top:14px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.84rem;">
                        <span>قيمة المرتجع:</span>
                        <strong style="color:#dc2626;">₪${Number(ret.total_returned).toFixed(2)}</strong>
                    </div>
                    ${ret.total_replacement > 0 ? `
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.84rem;">
                            <span>قيمة البديل:</span>
                            <strong style="color:#4f46e5;">₪${Number(ret.total_replacement).toFixed(2)}</strong>
                        </div>
                    ` : ''}
                    <div style="border-top:1.5px dashed #cbd5e1;padding-top:6px;margin-top:6px;display:flex;justify-content:space-between;font-size:0.95rem;">
                        <strong>صافي الفارق المالي:</strong>
                        <strong style="color:${ret.net_diff < 0 ? '#dc2626' : (ret.net_diff > 0 ? '#16a34a' : '#2563eb')}">
                            ₪${Math.abs(ret.net_diff).toFixed(2)} ${ret.net_diff < 0 ? '(مسترد للزبون)' : (ret.net_diff > 0 ? '(مستلم من الزبون)' : '')}
                        </strong>
                    </div>
                    <div style="margin-top:8px;font-size:0.82rem;color:#334155;background:#fff;padding:8px;border-radius:6px;border:1px solid #e2e8f0;">
                        <i class="fas fa-info-circle text-primary"></i> ${finActionDesc}
                    </div>
                </div>

                <div style="margin-top:20px;display:flex;justify-content:space-between;font-size:0.8rem;color:#64748b;padding:0 10px;">
                    <div>توقيع الزبون: ....................</div>
                    <div>توقيع الكاشير: ....................</div>
                </div>
            </div>
        `;
    }

    openModal('returnDetailsModal');
}
window.viewReturnDetails = viewReturnDetails;

function printReturnReceipt(returnId) {
    const area = document.getElementById('printReturnReceiptArea');
    if (!area) return;

    const win = window.open('', '_blank', 'width=750,height=650');
    win.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>طباعة سند إرجاع / تبديل #${returnId}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; margin: 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #e2e8f0; padding: 8px; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            ${area.innerHTML}
        </body>
        </html>
    `);
    win.document.close();
}
window.printReturnReceipt = printReturnReceipt;


/* ==========================================================================
   الوحدة 12: نظام الصندوق والحركات المالية ومطابقة الدرج (Cashbox System)
   ========================================================================== */

let currentCashboxDate = new Date().toISOString().split('T')[0];

function switchCashboxSubtab(tab) {
    const tabs = ['daily', 'reconcile', 'journal', 'digital'];
    tabs.forEach(t => {
        const el = document.getElementById('cashboxSubtab-' + t);
        const btn = document.getElementById('tabBtn-cashbox-' + t);
        if (el) el.style.display = (t === tab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });

    if (tab === 'daily') {
        loadCashboxData();
    } else if (tab === 'reconcile') {
        loadCashboxReconciliation();
    } else if (tab === 'journal') {
        renderCashJournal();
    } else if (tab === 'digital') {
        renderCashDigitalTable();
    }
}
window.switchCashboxSubtab = switchCashboxSubtab;

function loadCashboxScreen() {
    setCashboxToday();
    switchCashboxSubtab('daily');
}
window.loadCashboxScreen = loadCashboxScreen;

function setCashboxToday() {
    currentCashboxDate = new Date().toISOString().split('T')[0];
    const filter = document.getElementById('cashboxDateFilter');
    if (filter) filter.value = currentCashboxDate;
    loadCashboxData();
}
window.setCashboxToday = setCashboxToday;

function loadCashboxData(targetDate) {
    if (!targetDate) {
        const input = document.getElementById('cashboxDateFilter');
        targetDate = input ? input.value : currentCashboxDate;
    }
    if (!targetDate) targetDate = new Date().toISOString().split('T')[0];
    currentCashboxDate = targetDate;

    // 1. الرصيد الافتتاحي (Opening Cash)
    const settings = getCashboxSettings();
    const openingCash = Number(settings.opening_balance || 200);

    // 2. المقبوض النقدي (Cash In)
    // أ) مبيعات نقدية ودفعات نقدية وقت البيع
    const allSales = getActiveSales();
    const salesOnDate = allSales.filter(s => s.created_at && s.created_at.startsWith(targetDate));

    let cashSalesTotal = 0;
    let upfrontCashTotal = 0;
    let digitalSalesTotal = 0;

    salesOnDate.forEach(s => {
        const p = s.payment || {};
        if (p.paid_cash !== undefined || p.paid_digital !== undefined) {
            cashSalesTotal += Number(p.paid_cash || 0);
            digitalSalesTotal += Number(p.paid_digital || 0);
        } else {
            if (p.method === 'cash') {
                cashSalesTotal += Number(s.total || 0);
            } else if (p.method === 'debt' && Number(p.paid_upfront || 0) > 0) {
                upfrontCashTotal += Number(p.paid_upfront || 0);
            } else if (p.method === 'app') {
                digitalSalesTotal += Number(s.total || 0);
            }
        }
    });

    const cashSalesOnDate = salesOnDate.filter(s => {
        const p = s.payment || {};
        return (p.paid_cash > 0 || p.method === 'cash');
    });

    // ج) دفعات سداد ديون العملاء النقدية (باستثناء قيود تخفيض الدين بالمرتجعات)
    const allDebts = getCustomerDebts();
    const debtCashPaymentsOnDate = allDebts.filter(d => {
        if (d.type !== 'payment') return false;
        if (!d.created_at || !d.created_at.startsWith(targetDate)) return false;
        if (d.note && d.note.includes('تخفيض دين مقابل سند إرجاع')) return false;
        return true;
    });
    const debtCashTotal = debtCashPaymentsOnDate.reduce((s, d) => s + Number(d.amount || 0), 0);

    // د) فروق أسعار التبديل المحصلة نقداً
    const allReturns = getReturns();
    const exchangeCashInOnDate = allReturns.filter(r => {
        if (r.status === 'cancelled') return false;
        if (!r.created_at || !r.created_at.startsWith(targetDate)) return false;
        return r.financial_action === 'collected_cash' && Number(r.net_diff || 0) > 0;
    });
    const exchangeCashInTotal = exchangeCashInOnDate.reduce((s, r) => s + Number(r.net_diff || 0), 0);

    // هـ) الإيداعات النقدية والتغذية اليدوية
    const allCbEntries = getCashboxEntries();
    const manualCashInOnDate = allCbEntries.filter(e => {
        if (!e.created_at || !e.created_at.startsWith(targetDate)) return false;
        return e.type === 'in';
    });
    const manualCashInTotal = manualCashInOnDate.reduce((s, e) => s + Number(e.amount || 0), 0);

    const totalCashIn = cashSalesTotal + upfrontCashTotal + debtCashTotal + exchangeCashInTotal + manualCashInTotal;

    // 3. المستلم عبر المحافظ والبنوك (Digital In)
    const digitalSalesOnDate = salesOnDate.filter(s => {
        const p = s.payment || {};
        return (p.paid_digital > 0 || p.method === 'app');
    });

    const exchangeDigitalInOnDate = allReturns.filter(r => {
        if (r.status === 'cancelled') return false;
        if (!r.created_at || !r.created_at.startsWith(targetDate)) return false;
        return r.financial_action === 'collected_digital' && Number(r.net_diff || 0) > 0;
    });
    const exchangeDigitalInTotal = exchangeDigitalInOnDate.reduce((s, r) => s + Number(r.net_diff || 0), 0);

    const totalDigitalIn = digitalSalesTotal + exchangeDigitalInTotal;

    // 4. المصروفات والمدفوعات (Cash Out)
    // أ) المصروفات المتغيرة واليومية
    const allVarExpenses = getVariableExpenses();
    const expensesOnDate = allVarExpenses.filter(e => {
        return e.created_at && e.created_at.startsWith(targetDate);
    });
    const expensesTotal = expensesOnDate.reduce((s, e) => s + Number(e.amount || 0), 0);

    // ب) مدفوعات نقدية للموردين والتجار
    const allMerchantTx = getMerchantTransactions();
    const vendorPaymentsOnDate = allMerchantTx.filter(t => {
        if (t.type !== 'payment') return false;
        if (!t.created_at || !t.created_at.startsWith(targetDate)) return false;
        // يتم خصم الدفعات النقدية فقط من درج الكاش
        return (!t.payment_method || t.payment_method === 'cash');
    });
    const vendorPaymentsTotal = vendorPaymentsOnDate.reduce((s, t) => s + Number(t.amount || 0), 0);

    // ج) مبالغ نقدية مستردة للزبائن من المرتجعات
    const cashRefundsOnDate = allReturns.filter(r => {
        if (r.status === 'cancelled') return false;
        if (!r.created_at || !r.created_at.startsWith(targetDate)) return false;
        return r.financial_action === 'cash_refund';
    });
    const cashRefundsTotal = cashRefundsOnDate.reduce((s, r) => s + Math.abs(Number(r.net_diff || 0)), 0);

    // د) سحوبات نقدية يدوية وتوريد للبنك
    const manualCashOutOnDate = allCbEntries.filter(e => {
        if (!e.created_at || !e.created_at.startsWith(targetDate)) return false;
        return e.type === 'out';
    });
    const manualCashOutTotal = manualCashOutOnDate.reduce((s, e) => s + Number(e.amount || 0), 0);

    const totalCashOut = expensesTotal + vendorPaymentsTotal + cashRefundsTotal + manualCashOutTotal;

    // 5. الرصيد المتوقع للصندوق (Expected Drawer Cash)
    const expectedCash = openingCash + totalCashIn - totalCashOut;

    // تحديث بطاقات المؤشرات الأساسية
    const opEl = document.getElementById('cbOpeningCashView');
    const inEl = document.getElementById('cbCashInView');
    const digEl = document.getElementById('cbDigitalInView');
    const outEl = document.getElementById('cbCashOutView');
    const expEl = document.getElementById('cbExpectedCashView');

    if (opEl) opEl.textContent = '₪' + openingCash.toFixed(2);
    if (inEl) inEl.textContent = '₪' + totalCashIn.toFixed(2);
    if (digEl) digEl.textContent = '₪' + totalDigitalIn.toFixed(2);
    if (outEl) outEl.textContent = '₪' + totalCashOut.toFixed(2);
    if (expEl) expEl.textContent = '₪' + expectedCash.toFixed(2);

    // تحديث تفاصيل الداخل والخارج
    const inBreakdown = document.getElementById('cbCashInBreakdown');
    if (inBreakdown) {
        inBreakdown.innerHTML = `
            <div style="font-size:0.85rem;line-height:2.2;">
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-shopping-bag text-success"></i> مبيعات الكاش المباشرة (${cashSalesOnDate.length}):</span>
                    <strong>₪${cashSalesTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-money-check text-success"></i> دفعات أولى نقدية لفواتير الدين:</span>
                    <strong>₪${upfrontCashTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-hand-holding-usd text-success"></i> سداد ديون العملاء كاش (${debtCashPaymentsOnDate.length}):</span>
                    <strong>₪${debtCashTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-exchange-alt text-success"></i> فروق أسعار التبديل المحصلة كاش:</span>
                    <strong>₪${exchangeCashInTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-arrow-down text-success"></i> إيداعات نقدية / تغذية فكة للدرج:</span>
                    <strong>₪${manualCashInTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;font-weight:800;color:#15803d;font-size:0.95rem;">
                    <span>إجمالي النقد الداخل للصندوق:</span>
                    <span>₪${totalCashIn.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    const outBreakdown = document.getElementById('cbCashOutBreakdown');
    if (outBreakdown) {
        outBreakdown.innerHTML = `
            <div style="font-size:0.85rem;line-height:2.2;">
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-receipt text-danger"></i> المصروفات اليومية والنثريات (${expensesOnDate.length}):</span>
                    <strong>₪${expensesTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-truck-loading text-danger"></i> دفعات نقدية للموردين والتجار (${vendorPaymentsOnDate.length}):</span>
                    <strong>₪${vendorPaymentsTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-undo-alt text-danger"></i> مبالغ مستردة للزبائن (مرتجعات):</span>
                    <strong>₪${cashRefundsTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:4px 0;">
                    <span><i class="fas fa-arrow-up text-danger"></i> سحوبات أمانات / توريد بنكي:</span>
                    <strong>₪${manualCashOutTotal.toFixed(2)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;font-weight:800;color:#b91c1c;font-size:0.95rem;">
                    <span>إجمالي النقد الخارج من الصندوق:</span>
                    <span>₪${totalCashOut.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    // تحديث رصيد الجرد المتوقع في شاشة الجرد
    const recExpEl = document.getElementById('cbReconcileExpectedView');
    if (recExpEl) recExpEl.textContent = '₪' + expectedCash.toFixed(2);

    return {
        targetDate,
        openingCash,
        totalCashIn,
        totalDigitalIn,
        totalCashOut,
        expectedCash
    };
}
window.loadCashboxData = loadCashboxData;

function openCashboxOpeningModal() {
    const settings = getCashboxSettings();
    const input = document.getElementById('cbOpeningBalanceInput');
    if (input) input.value = settings.opening_balance || 200;
    openModal('cashboxOpeningModal');
}
window.openCashboxOpeningModal = openCashboxOpeningModal;

function saveCashboxOpening() {
    const input = document.getElementById('cbOpeningBalanceInput');
    const val = parseFloat(input ? input.value : 0);
    if (isNaN(val) || val < 0) {
        showToast('يرجى إدخال مبلغ رصيد افتتاحي صحيح', 'error');
        return;
    }

    const settings = getCashboxSettings();
    settings.opening_balance = val;
    saveCashboxSettings(settings);

    closeModal('cashboxOpeningModal');
    showToast(`✅ تم تحديث الرصيد الافتتاحي للصندوق إلى ₪${val.toFixed(2)}`, 'success');
    loadCashboxData();
}
window.saveCashboxOpening = saveCashboxOpening;

function openCashboxEntryModal(type = 'in') {
    const typeSelect = document.getElementById('cbEntryTypeSelect');
    const typeHidden = document.getElementById('cbEntryType');
    const title = document.getElementById('cbEntryModalTitle');
    const reasonInput = document.getElementById('cbEntryReason');
    const amountInput = document.getElementById('cbEntryAmount');

    if (typeSelect) typeSelect.value = type;
    if (typeHidden) typeHidden.value = type;
    if (amountInput) amountInput.value = '';

    if (type === 'in') {
        if (title) title.innerHTML = '<i class="fas fa-arrow-down text-success"></i> إيداع نقدي / تغذية فكة للدرج';
        if (reasonInput) reasonInput.value = 'تغذية فكة صباحية';
    } else {
        if (title) title.innerHTML = '<i class="fas fa-arrow-up text-danger"></i> سحب نقدي / توريد للبنك';
        if (reasonInput) reasonInput.value = 'سحب أمانات المالك / إيداع بنكي';
    }

    openModal('cashboxEntryModal');
}
window.openCashboxEntryModal = openCashboxEntryModal;

function onCbEntryTypeChange(val) {
    const hidden = document.getElementById('cbEntryType');
    if (hidden) hidden.value = val;
}
window.onCbEntryTypeChange = onCbEntryTypeChange;

function saveCashboxEntry() {
    const typeSelect = document.getElementById('cbEntryTypeSelect');
    const type = typeSelect ? typeSelect.value : 'in';
    const amount = parseFloat(document.getElementById('cbEntryAmount')?.value || 0);
    const reason = (document.getElementById('cbEntryReason')?.value || '').trim();
    const note = (document.getElementById('cbEntryNote')?.value || '').trim();

    if (isNaN(amount) || amount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    if (!reason) {
        showToast('يرجى إدخال سبب أو بيان الحركة', 'error');
        return;
    }

    const user = getCurrentUser();
    const entries = getCashboxEntries();
    const newEntry = {
        id: 'CBE-' + Date.now(),
        type: type,
        amount: amount,
        reason: reason,
        note: note,
        user_name: user ? user.name : 'الكاشير',
        created_at: new Date().toISOString()
    };

    entries.unshift(newEntry);
    saveCashboxEntries(entries);

    closeModal('cashboxEntryModal');
    showToast(`✅ تم حفظ ${type === 'in' ? 'الإيداع النقدي' : 'السحب النقدي'} بمبلغ ₪${amount.toFixed(2)}`, 'success');
    loadCashboxData();
    renderCashJournal();
}
window.saveCashboxEntry = saveCashboxEntry;

function loadCashboxReconciliation() {
    const data = loadCashboxData();
    const expEl = document.getElementById('cbReconcileExpectedView');
    if (expEl) expEl.textContent = '₪' + data.expectedCash.toFixed(2);
    calculateCashDiscrepancy();
    loadCashClosingsTable();
}
window.loadCashboxReconciliation = loadCashboxReconciliation;

function calculateCashDiscrepancy() {
    const data = loadCashboxData();
    const input = document.getElementById('cbActualCountInput');
    const resultBox = document.getElementById('cbReconcileResultBox');
    const statusTitle = document.getElementById('cbReconcileStatusTitle');
    const statusDesc = document.getElementById('cbReconcileStatusDesc');

    if (!input || !resultBox || !statusTitle || !statusDesc) return;

    const actualStr = input.value.trim();
    if (!actualStr) {
        resultBox.className = 'cash-reconcile-result matched';
        resultBox.innerHTML = `
            <i class="fas fa-info-circle" style="font-size:1.8rem;color:#0284c7;"></i>
            <div>
                <div style="font-size:1rem;color:#0369a1;">أدخل المبلغ الفعلي للمقارنة</div>
                <div style="font-size:0.82rem;font-weight:normal;color:#0284c7;">قم بعد النقد في الدرج وأدخل الإجمالي أعلاه أو استخدم حاسبة الفئات السريعة.</div>
            </div>
        `;
        return;
    }

    const actual = parseFloat(actualStr) || 0;
    const diff = actual - data.expectedCash;

    if (Math.abs(diff) < 0.05) {
        resultBox.className = 'cash-reconcile-result matched';
        resultBox.innerHTML = `
            <i class="fas fa-check-circle" style="font-size:1.8rem;color:#047857;"></i>
            <div>
                <div style="font-size:1rem;color:#065f46;">الصندوق متطابق تماماً (مطابقة 100%)</div>
                <div style="font-size:0.82rem;font-weight:normal;color:#047857;">الرصيد الفعلي ₪${actual.toFixed(2)} يطابق تماماً الرصيد المتوقع ₪${data.expectedCash.toFixed(2)}. لا يوجد عجز أو فائض.</div>
            </div>
        `;
    } else if (diff < 0) {
        resultBox.className = 'cash-reconcile-result deficit';
        resultBox.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size:1.8rem;color:#b91c1c;"></i>
            <div>
                <div style="font-size:1rem;color:#991b1b;">عجز في الصندوق بمبلغ: ₪${Math.abs(diff).toFixed(2)}</div>
                <div style="font-size:0.82rem;font-weight:normal;color:#b91c1c;">المتوقع: ₪${data.expectedCash.toFixed(2)} | الفعلي: ₪${actual.toFixed(2)} (النقص: ₪${Math.abs(diff).toFixed(2)})</div>
            </div>
        `;
    } else {
        resultBox.className = 'cash-reconcile-result surplus';
        resultBox.innerHTML = `
            <i class="fas fa-plus-circle" style="font-size:1.8rem;color:#1d4ed8;"></i>
            <div>
                <div style="font-size:1rem;color:#1e40af;">فائض إضافي في الصندوق بمبلغ: ₪${diff.toFixed(2)}</div>
                <div style="font-size:0.82rem;font-weight:normal;color:#1d4ed8;">المتوقع: ₪${data.expectedCash.toFixed(2)} | الفعلي: ₪${actual.toFixed(2)} (الزيادة: ₪${diff.toFixed(2)})</div>
            </div>
        `;
    }
}
window.calculateCashDiscrepancy = calculateCashDiscrepancy;

function calcDenominations() {
    let sum = 0;
    document.querySelectorAll('.cb-denom').forEach(input => {
        const val = parseFloat(input.dataset.val) || 0;
        const count = parseInt(input.value, 10) || 0;
        sum += val * count;
    });

    const coins = parseFloat(document.getElementById('cb-denom-coins')?.value || 0) || 0;
    sum += coins;

    const totalEl = document.getElementById('cbDenomTotal');
    if (totalEl) totalEl.textContent = '₪' + sum.toFixed(2);
    return sum;
}
window.calcDenominations = calcDenominations;

function applyDenomToActual() {
    const sum = calcDenominations();
    const actualInput = document.getElementById('cbActualCountInput');
    if (actualInput) {
        actualInput.value = sum;
        calculateCashDiscrepancy();
        showToast(`تم نسخ إجمالي الفئات (₪${sum.toFixed(2)}) للرصيد الفعلي`);
    }
}
window.applyDenomToActual = applyDenomToActual;

function submitCashClosing() {
    const data = loadCashboxData();
    const actualInput = document.getElementById('cbActualCountInput');
    const noteInput = document.getElementById('cbClosingNoteInput');

    const actualStr = actualInput ? actualInput.value.trim() : '';
    if (!actualStr) {
        showToast('يرجى إدخال المبلغ الفعلي المعدود بالدرج', 'error');
        return;
    }

    const actual = parseFloat(actualStr) || 0;
    const diff = actual - data.expectedCash;
    const user = getCurrentUser();
    const note = (noteInput ? noteInput.value.trim() : '') || 'إغلاق وردية وجرد الصندوق';

    let status = 'matched';
    if (diff < -0.05) status = 'deficit';
    else if (diff > 0.05) status = 'surplus';

    const closings = getCashboxClosings();
    const closingRecord = {
        id: 'CLS-' + Date.now(),
        date: new Date().toISOString(),
        target_date: data.targetDate,
        expected_cash: data.expectedCash,
        actual_cash: actual,
        discrepancy: diff,
        status: status,
        user_name: user ? user.name : 'الكاشير',
        note: note
    };

    closings.unshift(closingRecord);
    saveCashboxClosings(closings);

    if (actualInput) actualInput.value = '';
    if (noteInput) noteInput.value = '';
    calculateCashDiscrepancy();
    loadCashClosingsTable();

    showToast(`✅ تم اعتماد جرد وإغلاق وردية الصندوق بنجاح`, 'success');
}
window.submitCashClosing = submitCashClosing;

function loadCashClosingsTable() {
    const tbody = document.getElementById('cbClosingsTableBody');
    if (!tbody) return;

    const closings = getCashboxClosings();
    if (closings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding:20px;color:#94a3b8;">
                    لا توجد سجلات إغلاق سابقة مسجلة
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = closings.map((c, i) => {
        let statusBadge = '';
        if (c.status === 'matched') {
            statusBadge = '<span class="badge success"><i class="fas fa-check"></i> متطابق (0 ₪)</span>';
        } else if (c.status === 'deficit') {
            statusBadge = `<span class="badge danger"><i class="fas fa-arrow-down"></i> عجز ₪${Math.abs(c.discrepancy).toFixed(2)}</span>`;
        } else {
            statusBadge = `<span class="badge info"><i class="fas fa-arrow-up"></i> فائض ₪${Number(c.discrepancy).toFixed(2)}</span>`;
        }

        return `
            <tr>
                <td><strong>#${escapeHtml(c.id)}</strong></td>
                <td>
                    <div>${new Date(c.date).toLocaleDateString('ar-EG')}</div>
                    <small style="color:#64748b;">${new Date(c.date).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</small>
                </td>
                <td>₪${Number(c.expected_cash).toFixed(2)}</td>
                <td><strong>₪${Number(c.actual_cash).toFixed(2)}</strong></td>
                <td>${statusBadge}</td>
                <td>${escapeHtml(c.user_name || 'الكاشير')}</td>
                <td><small>${escapeHtml(c.note || '-')}</small></td>
            </tr>
        `;
    }).join('');
}
window.loadCashClosingsTable = loadCashClosingsTable;

function renderCashJournal() {
    const tbody = document.getElementById('cbJournalTableBody');
    if (!tbody) return;

    const filterType = document.getElementById('cbJournalFilter')?.value || 'all';
    const targetDate = currentCashboxDate || new Date().toISOString().split('T')[0];

    // تجميع الحركات
    const journalEntries = [];

    // مبيعات نقدية ورقمية
    getActiveSales().forEach(s => {
        if (!s.created_at || !s.created_at.startsWith(targetDate)) return;
        const p = s.payment || {};
        if (p.paid_cash !== undefined || p.paid_digital !== undefined) {
            if (Number(p.paid_cash || 0) > 0) {
                journalEntries.push({
                    time: s.created_at,
                    type: 'in',
                    typeLabel: p.tender === 'split' ? 'مبيعات (جزء كاش)' : (p.debt_remaining > 0 ? 'دفعة مبيعات كاش' : 'مبيعات كاش'),
                    typeIcon: 'fas fa-shopping-bag text-success',
                    desc: `مبيعات نقدية - عميل: (${s.customer || 'نقدي'})` + (p.debt_remaining > 0 ? ` [متبقي دين ₪${p.debt_remaining.toFixed(2)}]` : ''),
                    ref: '#' + s.id,
                    inAmt: Number(p.paid_cash),
                    outAmt: 0,
                    method: 'نقدي (درج)',
                    user: s.cashier_name || 'الكاشير'
                });
            }
            if (Number(p.paid_digital || 0) > 0) {
                journalEntries.push({
                    time: s.created_at,
                    type: 'digital',
                    typeLabel: p.tender === 'split' ? 'مبيعات (جزء محفظة)' : 'مبيعات محفظة/بنك',
                    typeIcon: 'fas fa-mobile-alt text-info',
                    desc: `تحويل إلكتروني (${p.app_name || 'محفظة'}) - عميل: ${s.customer}`,
                    ref: '#' + s.id,
                    inAmt: Number(p.paid_digital),
                    outAmt: 0,
                    method: p.app_name || 'محفظة',
                    user: s.cashier_name || 'الكاشير'
                });
            }
        } else {
            // Legacy sales
            const method = p.method || 'cash';
            if (method === 'cash') {
                journalEntries.push({
                    time: s.created_at,
                    type: 'in',
                    typeLabel: 'مبيعات كاش',
                    typeIcon: 'fas fa-shopping-bag text-success',
                    desc: `فاتورة مبيعات نقدية للعميل (${s.customer || 'نقدي'})`,
                    ref: '#' + s.id,
                    inAmt: Number(s.total || 0),
                    outAmt: 0,
                    method: 'نقدي (درج)',
                    user: s.cashier_name || 'الكاشير'
                });
            } else if (method === 'debt' && Number(p.paid_upfront || 0) > 0) {
                journalEntries.push({
                    time: s.created_at,
                    type: 'in',
                    typeLabel: 'دفعة أولى كاش',
                    typeIcon: 'fas fa-money-check text-success',
                    desc: `دفعة أولى لفاتورة دين (${s.customer})`,
                    ref: '#' + s.id,
                    inAmt: Number(p.paid_upfront || 0),
                    outAmt: 0,
                    method: 'نقدي (درج)',
                    user: s.cashier_name || 'الكاشير'
                });
            } else if (method === 'app') {
                journalEntries.push({
                    time: s.created_at,
                    type: 'digital',
                    typeLabel: 'مبيعات محفظة/بنك',
                    typeIcon: 'fas fa-mobile-alt text-info',
                    desc: `تحويل إلكتروني (${p.app_name || 'تطبيق'}) - عميل: ${s.customer}`,
                    ref: '#' + s.id,
                    inAmt: Number(s.total || 0),
                    outAmt: 0,
                    method: p.app_name || 'محفظة',
                    user: s.cashier_name || 'الكاشير'
                });
            }
        }
    });

    // سداد ديون العملاء
    getCustomerDebts().forEach(d => {
        if (d.type !== 'payment') return;
        if (!d.created_at || !d.created_at.startsWith(targetDate)) return;
        if (d.note && d.note.includes('تخفيض دين مقابل سند إرجاع')) return;
        journalEntries.push({
            time: d.created_at,
            type: 'in',
            typeLabel: 'قبض دين عميل',
            typeIcon: 'fas fa-hand-holding-usd text-success',
            desc: `دفعة سداد نقدية من العميل (${d.customer_name})`,
            ref: d.sale_id ? '#' + d.sale_id : 'سداد',
            inAmt: Number(d.amount || 0),
            outAmt: 0,
            method: 'نقدي (درج)',
            user: 'الكاشير'
        });
    });

    // حركات الصندوق اليدوية (إيداع / سحب)
    getCashboxEntries().forEach(e => {
        if (!e.created_at || !e.created_at.startsWith(targetDate)) return;
        journalEntries.push({
            time: e.created_at,
            type: e.type,
            typeLabel: e.type === 'in' ? 'إيداع نقدي' : 'سحب نقدي',
            typeIcon: e.type === 'in' ? 'fas fa-arrow-down text-success' : 'fas fa-arrow-up text-danger',
            desc: e.reason + (e.note ? ` (${e.note})` : ''),
            ref: e.id,
            inAmt: e.type === 'in' ? Number(e.amount) : 0,
            outAmt: e.type === 'out' ? Number(e.amount) : 0,
            method: 'نقدي (درج)',
            user: e.user_name || 'الكاشير'
        });
    });

    // المصروفات
    getVariableExpenses().forEach(e => {
        if (!e.created_at || !e.created_at.startsWith(targetDate)) return;
        journalEntries.push({
            time: e.created_at,
            type: 'out',
            typeLabel: 'مصروفات',
            typeIcon: 'fas fa-receipt text-danger',
            desc: e.reason || e.category,
            ref: 'EXP-' + e.id,
            inAmt: 0,
            outAmt: Number(e.amount || 0),
            method: 'نقدي (درج)',
            user: 'الإدارة'
        });
    });

    // مدفوعات الموردين
    getMerchantTransactions().forEach(t => {
        if (t.type !== 'payment') return;
        if (!t.created_at || !t.created_at.startsWith(targetDate)) return;
        journalEntries.push({
            time: t.created_at,
            type: 'out',
            typeLabel: 'سداد مورد',
            typeIcon: 'fas fa-truck-loading text-danger',
            desc: `دفعة للمورد (${t.merchant_name}) - ${t.note || ''}`,
            ref: t.reference || 'PAY',
            inAmt: 0,
            outAmt: Number(t.amount || 0),
            method: 'نقدي (درج)',
            user: 'الإدارة'
        });
    });

    // المرتجعات والتبديل
    getReturns().forEach(r => {
        if (r.status === 'cancelled') return;
        if (!r.created_at || !r.created_at.startsWith(targetDate)) return;
        if (r.financial_action === 'cash_refund') {
            journalEntries.push({
                time: r.created_at,
                type: 'out',
                typeLabel: 'إرجاع كاش',
                typeIcon: 'fas fa-undo-alt text-danger',
                desc: `إرجاع نقدي للزبون (${r.customer_name}) - فاتورة #${r.sale_id}`,
                ref: '#' + r.id,
                inAmt: 0,
                outAmt: Math.abs(Number(r.net_diff || 0)),
                method: 'نقدي (درج)',
                user: r.user_name || 'الكاشير'
            });
        } else if (r.financial_action === 'collected_cash') {
            journalEntries.push({
                time: r.created_at,
                type: 'in',
                typeLabel: 'فرق تبديل كاش',
                typeIcon: 'fas fa-sync-alt text-success',
                desc: `تحصيل فرق سعر تبديل من الزبون (${r.customer_name})`,
                ref: '#' + r.id,
                inAmt: Number(r.net_diff || 0),
                outAmt: 0,
                method: 'نقدي (درج)',
                user: r.user_name || 'الكاشير'
            });
        }
    });

    // ترتيب الحركات تنازلياً حسب الوقت
    journalEntries.sort((a, b) => new Date(b.time) - new Date(a.time));

    const filtered = journalEntries.filter(entry => {
        if (filterType === 'all') return true;
        if (filterType === 'in') return entry.type === 'in';
        if (filterType === 'out') return entry.type === 'out';
        if (filterType === 'digital') return entry.type === 'digital';
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding:22px;color:#94a3b8;">
                    لا توجد حركات مالية مسجلة لتاريخ اليوم (${targetDate})
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(e => `
        <tr>
            <td>
                <div>${new Date(e.time).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</div>
                <small style="color:#64748b;">${new Date(e.time).toLocaleDateString('ar-EG')}</small>
            </td>
            <td><i class="${e.typeIcon}"></i> ${escapeHtml(e.typeLabel)}</td>
            <td><strong>${escapeHtml(e.desc)}</strong></td>
            <td><span class="badge secondary">${escapeHtml(e.ref)}</span></td>
            <td style="color:#16a34a;font-weight:700;">${e.inAmt > 0 ? `+₪${e.inAmt.toFixed(2)}` : '-'}</td>
            <td style="color:#dc2626;font-weight:700;">${e.outAmt > 0 ? `-₪${e.outAmt.toFixed(2)}` : '-'}</td>
            <td><small>${escapeHtml(e.method)}</small></td>
            <td>${escapeHtml(e.user)}</td>
        </tr>
    `).join('');
}
window.renderCashJournal = renderCashJournal;

function renderCashDigitalTable() {
    const tbody = document.getElementById('cbDigitalTableBody');
    if (!tbody) return;

    const digitalSales = getActiveSales().filter(s => {
        const p = s.payment || {};
        return (p.paid_digital > 0 || p.method === 'app');
    });
    if (digitalSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding:24px;color:#94a3b8;">
                    لا توجد مدفوعات إلكترونية مسجلة حتى الآن
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = digitalSales.map(s => {
        const p = s.payment || {};
        const screenshotBtn = p.screenshot ? `
            <button type="button" class="btn btn-outline btn-sm" onclick="previewPurchVariantImage(${jsArg(p.screenshot)}, 'إشعار الحوالة لفاتورة #${s.id}')">
                <i class="fas fa-image text-info"></i> عرض الإشعار
            </button>
        ` : '<span style="color:#94a3b8;font-size:0.75rem;">لا يوجد مرفق</span>';

        return `
            <tr>
                <td><strong>#${escapeHtml(s.id)}</strong></td>
                <td>${new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                <td><span class="badge info"><i class="fas fa-university"></i> ${escapeHtml(p.app_name || 'محفظة إلكترونية')}</span></td>
                <td>${escapeHtml(p.sender_name || s.customer || '-')}</td>
                <td style="direction:ltr;text-align:right;">${escapeHtml(p.sender_phone || '-')}</td>
                <td><strong style="color:var(--primary);font-size:1.05rem;">₪${(p.paid_digital !== undefined ? Number(p.paid_digital) : Number(s.total)).toFixed(2)}</strong></td>
                <td>${screenshotBtn}</td>
            </tr>
        `;
    }).join('');
}
window.renderCashDigitalTable = renderCashDigitalTable;

function printCashboxDailyReport() {
    const data = loadCashboxData();
    const dateFormatted = new Date(data.targetDate).toLocaleDateString('ar-EG');

    const inBreakdown = document.getElementById('cbCashInBreakdown')?.innerHTML || '';
    const outBreakdown = document.getElementById('cbCashOutBreakdown')?.innerHTML || '';

    const win = window.open('', '_blank', 'width=800,height=700');
    win.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>كشف يومية الصندوق - ${dateFormatted}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; margin: 0; color: #1e293b; }
                .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
                .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
                .kpi-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; background: #f8fafc; }
                .kpi-title { font-size: 0.8rem; color: #64748b; margin-bottom: 4px; }
                .kpi-val { font-size: 1.3rem; font-weight: 800; }
                .section-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
                .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; font-weight: bold; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="header">
                <h2 style="margin:0 0 6px;">متجر الألبسة والأناقة</h2>
                <h4 style="margin:0;color:#475569;">تقرير حركة وإغلاق الصندوق اليومي (Cash Drawer Daily Report)</h4>
                <div style="font-size:0.9rem;margin-top:6px;color:#0f172a;">التاريخ: <strong>${dateFormatted}</strong></div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-box">
                    <div class="kpi-title">الرصيد الافتتاحي</div>
                    <div class="kpi-val">₪${data.openingCash.toFixed(2)}</div>
                </div>
                <div class="kpi-box">
                    <div class="kpi-title">إجمالي المقبوض النقدي (كاش)</div>
                    <div class="kpi-val" style="color:#15803d;">₪${data.totalCashIn.toFixed(2)}</div>
                </div>
                <div class="kpi-box">
                    <div class="kpi-title">مقبوضات المحافظ والبنوك</div>
                    <div class="kpi-val" style="color:#0284c7;">₪${data.totalDigitalIn.toFixed(2)}</div>
                </div>
                <div class="kpi-box">
                    <div class="kpi-title">إجمالي المصروفات والمدفوعات</div>
                    <div class="kpi-val" style="color:#b91c1c;">₪${data.totalCashOut.toFixed(2)}</div>
                </div>
                <div class="kpi-box" style="grid-column: span 2; background:#e0e7ff; border-color:#818cf8;">
                    <div class="kpi-title" style="color:#3730a3;font-weight:700;">الرصيد المتوقع الفعلي في الدرج</div>
                    <div class="kpi-val" style="color:#312e81;font-size:1.6rem;">₪${data.expectedCash.toFixed(2)}</div>
                </div>
            </div>

            <div class="section-box">
                <h4 style="margin:0 0 8px;color:#15803d;">تفصيل المقبوضات النقدية (داخل الدرج):</h4>
                ${inBreakdown}
            </div>

            <div class="section-box">
                <h4 style="margin:0 0 8px;color:#b91c1c;">تفصيل المصروفات والمدفوعات (خارج الدرج):</h4>
                ${outBreakdown}
            </div>

            <div class="signatures">
                <div>توقيع الكاشير المسؤول: ....................</div>
                <div>توقيع مدير الفرع / المالك: ....................</div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}
window.printCashboxDailyReport = printCashboxDailyReport;
window.checkout = checkout;
window.updateStoreAccountDisplay = updateStoreAccountDisplay;
window.copyStoreAccNo = copyStoreAccNo;
if (typeof copyStoreIban === 'function') window.copyStoreIban = copyStoreIban;
