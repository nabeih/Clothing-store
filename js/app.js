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

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';

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

    loadDashboard();
    loadInventoryTable();
    loadPosProducts();
    loadSalesHistory();
    loadPurchasesTable();
    loadDebtsTable();
    loadEmployeesTable();
    loadBranchesTable();
    loadMerchantsTable();
    loadExpensesTable();
    loadReports();

    if (user.role === 'cashier') switchScreen('pos');
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
function buildSidebar() {
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
            <i class="fas fa-cash-register"></i><span>نقطة البيع</span>
        </div>
        <div class="nav-item" onclick="switchScreen('sales-record')">
            <i class="fas fa-history"></i><span>سجل المبيعات</span>
        </div>
    `;

    if (!isCashier) {
        nav += `
            <div class="nav-item" onclick="switchScreen('inventory')">
                <i class="fas fa-boxes"></i><span>المنتجات والمخزون</span>
            </div>
            <div class="nav-item" onclick="switchScreen('categories')">
                <i class="fas fa-tags"></i><span>التصنيفات</span>
            </div>
            <div class="nav-item" onclick="switchScreen('purchases')">
                <i class="fas fa-truck"></i><span>المشتريات</span>
            </div>

            <div class="nav-title">الإدارة</div>
            <div class="nav-item" onclick="switchScreen('branches')">
                <i class="fas fa-store"></i><span>الفروع</span>
            </div>
            <div class="nav-item" onclick="switchScreen('employees')">
                <i class="fas fa-users"></i><span>الموظفين</span>
            </div>
            <div class="nav-item" onclick="switchScreen('merchants')">
                <i class="fas fa-handshake"></i><span>حسابات التجار</span>
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

/* ============================================
   4. التنقل بين الشاشات
   ============================================ */
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + screenId);
    if (screen) screen.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
        const onclick = n.getAttribute('onclick') || '';
        if (onclick.includes(`'${screenId}'`)) n.classList.add('active');
    });

    if (screenId === 'dashboard') loadDashboard();
    if (screenId === 'inventory') loadInventoryTable();
    if (screenId === 'categories') loadCategoriesTable();
    if (screenId === 'pos') loadPosProducts();
    if (screenId === 'sales-record') loadSalesHistory();
    if (screenId === 'purchases') loadPurchasesTable();
    if (screenId === 'debts') loadDebtsTable();
    if (screenId === 'employees') loadEmployeesTable();
    if (screenId === 'branches') loadBranchesTable();
    if (screenId === 'merchants') loadMerchantsTable();
    if (screenId === 'expenses') loadExpensesTable();
    if (screenId === 'reports') loadReports();

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
            getCategories().map(c => `<option value="${c}">${c}</option>`).join('');
    }

    const restockSelect = document.getElementById('restockProduct');
    if (restockSelect) {
        restockSelect.innerHTML = '<option value="">-- اختر منتج --</option>' +
            getProducts().map(p =>
                `<option value="${p.id}">${p.name} (${p.size || '-'}) - متوفر: ${getProductQuantity(p.id)}</option>`
            ).join('');
    }

    const branchSelect = document.getElementById('emp-branch');
    if (branchSelect) {
        branchSelect.innerHTML = '<option value="">بدون</option>' +
            getBranches().map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
}

/* ============================================
   6. لوحة التحكم
   ============================================ */
function loadDashboard() {
    const todaySales = getTodaySales();
    const netProfit = getNetProfit();
    const revenue = getAccruedRevenue();
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
            <div class="stat-label">إجمالي الإيرادات</div>
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
                <td><strong>#${s.id}</strong></td>
                <td>${s.customer}</td>
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

        return `
            <tr>
                <td><span class="badge primary">${p.code || '-'}</span></td>
                <td><strong>${p.name}</strong>${isLoss ? ' <span class="badge danger">خاسر</span>' : ''}</td>
                <td>${p.category}</td>
                <td>${p.size || '-'} ${p.color ? '• ' + p.color : ''}</td>
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
    const size = document.getElementById('p-size').value.trim();
    const color = document.getElementById('p-color').value.trim();
    const cost = parseFloat(document.getElementById('p-cost').value);
    const price = parseFloat(document.getElementById('p-price').value);
    const qty = parseInt(document.getElementById('p-qty').value) || 0;

    if (!name || !category || isNaN(cost) || isNaN(price)) {
        showToast('يرجى تعبئة الحقول المطلوبة', 'error');
        return;
    }

    const products = getProducts();

    if (editId) {
        const id = parseInt(editId);
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                code: code || products[index].code,
                name, category, size, color,
                base_cost: cost, price
            };
        }
        saveProducts(products);
        showToast('تم تحديث المنتج');
    } else {
        if (IS_DEMO && products.length >= DEMO_LIMITS.products) {
            showDemoLimit('منتج', DEMO_LIMITS.products);
            return;
        }

        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newCode = code || '#' + (100 + newId);

        products.push({ id: newId, code: newCode, name, category, size, color, base_cost: cost, price });
        saveProducts(products);

        if (qty > 0) {
            const purchases = getPurchases();
            purchases.push({
                id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
                product_id: newId,
                product_name: name,
                size,
                quantity: qty,
                unit_cost: cost,
                total_cost: qty * cost,
                supplier: 'رصيد افتتاحي',
                note: 'كمية أولية',
                created_at: new Date().toISOString(),
            });
            savePurchases(purchases);
        }

        showToast('تمت إضافة المنتج');
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
    document.getElementById('p-size').value = p.size || '';
    document.getElementById('p-color').value = p.color || '';
    document.getElementById('p-cost').value = p.base_cost || 0;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-qty').value = getProductQuantity(p.id);

    document.getElementById('productFormTitle').innerHTML = '<i class="fas fa-edit text-warning"></i> تعديل المنتج';
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
    switchScreen('add-product');
}

function cancelProductEdit() {
    document.getElementById('editingProductId').value = '';
    ['p-code', 'p-name', 'p-category', 'p-size', 'p-color', 'p-cost', 'p-price'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
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
                <td><strong>${cat}</strong></td>
                <td><span class="badge primary">${count} منتج</span></td>
                <td>
                    <button class="btn-icon" onclick="editCategory('${cat}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon danger" onclick="deleteCategory('${cat}')"><i class="fas fa-trash"></i></button>
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
                <div class="product-img"><i class="fas fa-tshirt"></i></div>
                <h6>${p.name}</h6>
                <span class="code">${p.size || '-'} ${p.color ? '• ' + p.color : ''}</span>
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

        return `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-name">${item.name} <small style="color:var(--gray);">(${item.size || '-'})</small></div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.product_id})">
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
            </div>
        `;
    }).join('');

    updateCartTotals();
}

function updateCartTotals() {
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const discount = parseFloat(document.getElementById('cartDiscount').value) || 0;
    const total = Math.max(0, subtotal - discount);

    document.getElementById('cartSubtotal').textContent = '₪' + subtotal.toFixed(2);
    document.getElementById('cartTotal').textContent = '₪' + total.toFixed(2);
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
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderColor = '#e2e8f0';
        btn.style.background = '#fff';
        btn.style.color = 'var(--gray)';
    });

    const activeBtn = document.querySelector(`.payment-btn[data-method="${method}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const appFields = document.getElementById('appPaymentFields');
    const debtFields = document.getElementById('debtFields');

    appFields.style.display = 'none';
    debtFields.style.display = 'none';

    if (method === 'app') {
        appFields.style.display = 'block';
    } else if (method === 'debt') {
        debtFields.style.display = 'block';
    }
}

function removeScreenshot() {
    paymentScreenshotData = null;
    const preview = document.getElementById('screenshotPreview');
    const input = document.getElementById('paymentScreenshot');
    if (preview) preview.style.display = 'none';
    if (input) input.value = '';
}

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
            document.getElementById('previewImg').src = paymentScreenshotData;
            document.getElementById('screenshotPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

/* ============================================
   12. إتمام البيع
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

    let paymentData = null;
    let debtCustomerName = null;
    let debtCustomerPhone = null;
    let debtNote = null;

    if (selectedPaymentMethod === 'app') {
        const senderName = document.getElementById('senderName').value.trim();
        const senderPhone = document.getElementById('senderPhone').value.trim();
        const appName = document.getElementById('appName').value;

        if (!senderName || senderName.length < 3) {
            showToast('يرجى إدخال اسم المرسل', 'error');
            return;
        }
        if (!senderPhone || senderPhone.length < 8) {
            showToast('يرجى إدخال رقم هاتف المرسل', 'error');
            return;
        }

        paymentData = {
            method: 'app',
            app_name: appName,
            sender_name: senderName,
            sender_phone: senderPhone,
            screenshot: paymentScreenshotData || null,
        };
    } else if (selectedPaymentMethod === 'debt') {
        debtCustomerName = document.getElementById('debtCustomerName').value.trim();
        debtCustomerPhone = document.getElementById('debtCustomerPhone').value.trim();
        debtNote = document.getElementById('debtNote').value.trim();

        if (!debtCustomerName || debtCustomerName.length < 3) {
            showToast('يرجى إدخال اسم العميل', 'error');
            return;
        }
        if (!debtCustomerPhone || debtCustomerPhone.length < 8) {
            showToast('يرجى إدخال رقم هاتف العميل', 'error');
            return;
        }

        paymentData = { method: 'debt' };
    } else {
        paymentData = { method: 'cash' };
    }

    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const discount = parseFloat(document.getElementById('cartDiscount').value) || 0;
    const total = Math.max(0, subtotal - discount);

    const user = getCurrentUser();

    const sale = {
        id: Math.floor(Math.random() * 90000) + 10000,
        customer: debtCustomerName || document.getElementById('customerName').value.trim() || 'عميل نقدي',
        items: cart.map(i => ({ ...i })),
        subtotal, discount, total,
        payment: paymentData,
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

    if (selectedPaymentMethod === 'debt') {
        const debts = getCustomerDebts();
        debts.push({
            id: debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1,
            customer_name: debtCustomerName,
            customer_phone: debtCustomerPhone,
            type: 'invoice',
            amount: total,
            sale_id: sale.id,
            note: debtNote || 'دين فاتورة #' + sale.id,
            created_at: new Date().toISOString(),
        });
        saveCustomerDebts(debts);
    }

    printInvoice(sale);

    cart = [];
    document.getElementById('cartDiscount').value = 0;
    document.getElementById('customerName').value = '';
    document.getElementById('senderName').value = '';
    document.getElementById('senderPhone').value = '';
    document.getElementById('debtCustomerName').value = '';
    document.getElementById('debtCustomerPhone').value = '';
    document.getElementById('debtNote').value = '';
    document.getElementById('paymentScreenshot').value = '';
    removeScreenshot();
    selectPaymentMethod('cash');
    renderCart();
    loadPosProducts();

    showToast(`✅ تم البيع بنجاح! ₪${total.toFixed(2)}`);
}

/* ============================================
   13. طباعة الفاتورة
   ============================================ */
function printInvoice(sale) {
    const itemsHTML = sale.items.map(item => `
        <tr>
            <td>${item.name} (${item.size || '-'})</td>
            <td>${item.quantity}</td>
            <td>₪${item.sold_price.toFixed(2)}</td>
            <td>₪${item.subtotal.toFixed(2)}</td>
        </tr>
    `).join('');

    const paymentInfo = sale.payment && sale.payment.method === 'app'
        ? `<div style="text-align:center;font-size:12px;margin:10px 0;padding:8px;background:#fffbeb;border-radius:6px;"><strong>دفع عبر ${sale.payment.app_name}</strong><br>المرسل: ${sale.payment.sender_name}<br>الهاتف: ${sale.payment.sender_phone}</div>`
        : '';

    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة #${sale.id}</title>
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
                فاتورة #${sale.id}<br>
                ${new Date(sale.created_at).toLocaleString('ar-EG')}<br>
                الكاشير: ${sale.cashier_name}<br>
                العميل: ${sale.customer}
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
        const isAppPayment = s.payment && s.payment.method === 'app';
        const isDebtPayment = s.payment && s.payment.method === 'debt';

        let paymentIcon = '<i class="fas fa-money-bill-wave" style="color:var(--success);"></i> كاش';
        if (isAppPayment) paymentIcon = '<i class="fas fa-mobile-alt" style="color:var(--warning);"></i> تطبيق';
        if (isDebtPayment) paymentIcon = '<i class="fas fa-hand-holding-usd" style="color:var(--danger);"></i> دين';

        return `
            <tr style="${isVoided ? 'opacity:0.55;background:#fef2f2;' : ''}">
                <td>
                    <strong>#${s.id}</strong>
                    ${isVoided ? '<br><span class="badge danger" style="font-size:0.65rem;">ملغاة</span>' : ''}
                </td>
                <td style="font-size:.8rem;">${new Date(s.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>${s.customer}</td>
                <td style="font-size:0.8rem;"><strong><i class="fas fa-user-tie"></i> ${s.cashier_name || '-'}</strong></td>
                <td style="font-size:.8rem;color:var(--gray);max-width:230px;">
                    ${itemsSummary}
                    ${hasPriceChange ? '<br><span style="color:var(--warning);font-weight:700;font-size:.72rem;"><i class="fas fa-tag"></i> تعديل أسعار</span>' : ''}
                    ${isVoided ? `<br><span style="color:var(--danger);font-size:0.7rem;"><i class="fas fa-ban"></i> السبب: ${s.voided_reason}</span>` : ''}
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
                    <strong style="color:#78350f;">${p.app_name}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #fcd34d;">
                    <span style="color:#92400e;font-weight:700;">المرسل:</span>
                    <strong style="color:#78350f;">${p.sender_name}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #fcd34d;">
                    <span style="color:#92400e;font-weight:700;">الهاتف:</span>
                    <strong style="color:#78350f;" dir="ltr">${p.sender_phone}</strong>
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
                <img src="${p.screenshot}" style="width:100%;border-radius:12px;border:2px solid #e2e8f0;cursor:pointer;" onclick="window.open('${p.screenshot}','_blank')">
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
                    <strong>${sale.cashier_name || '-'}</strong>
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
                <h5><i class="fas fa-receipt"></i> بيانات الدفع - #${sale.id}</h5>
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
   18. المشتريات
   ============================================ */
function onRestockProductChange() {
    const productId = parseInt(document.getElementById('restockProduct').value);
    const infoEl = document.getElementById('restockCurrentInfo');

    if (!productId) {
        infoEl.textContent = '';
        document.getElementById('restockPreview').style.display = 'none';
        return;
    }

    const p = getProductById(productId);
    if (!p) return;

    infoEl.innerHTML = `
        <i class="fas fa-info-circle text-info"></i> 
        الكمية: <strong>${getProductQuantity(p.id)}</strong> • 
        التكلفة: <strong>₪${getProductAvgCost(p.id).toFixed(2)}</strong> • 
        سعر البيع: <strong>₪${Number(p.price).toFixed(2)}</strong>
    `;

    previewRestock();
}

function previewRestock() {
    const productId = parseInt(document.getElementById('restockProduct').value);
    const qty = parseInt(document.getElementById('restockQty').value) || 0;
    const cost = parseFloat(document.getElementById('restockCost').value) || 0;
    const editingId = document.getElementById('restockProduct').dataset.editingId;
    const previewEl = document.getElementById('restockPreview');

    if (!productId || qty <= 0 || cost <= 0) {
        previewEl.style.display = 'none';
        return;
    }

    let purchases = getPurchases().filter(x => x.product_id === productId);
    if (editingId) {
        purchases = purchases.filter(x => x.id !== parseInt(editingId));
    }

    const oldQty = purchases.reduce((s, x) => s + Number(x.quantity), 0);
    const oldValue = purchases.reduce((s, x) => s + (Number(x.quantity) * Number(x.unit_cost)), 0);
    const oldAvgCost = oldQty > 0 ? oldValue / oldQty : 0;

    const newTotalQty = oldQty + qty;
    const newTotalValue = oldValue + (qty * cost);
    const newAvgCost = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;

    document.getElementById('previewCurrentQty').textContent = oldQty;
    document.getElementById('previewCurrentCost').textContent = '₪' + oldAvgCost.toFixed(2);
    document.getElementById('previewNewTotalQty').textContent = newTotalQty;
    document.getElementById('previewNewCost').textContent = '₪' + newAvgCost.toFixed(2);

    previewEl.style.display = 'block';
}

function saveRestock() {
    const productId = parseInt(document.getElementById('restockProduct').value);
    const qty = parseInt(document.getElementById('restockQty').value);
    const cost = parseFloat(document.getElementById('restockCost').value);
    const supplier = document.getElementById('restockSupplier').value.trim();
    const note = document.getElementById('restockNote').value.trim();
    const editingId = document.getElementById('restockProduct').dataset.editingId;

    if (!productId || !qty || qty <= 0 || !cost || cost < 0) {
        showToast('يرجى ملء الحقول المطلوبة', 'error');
        return;
    }

    const p = getProductById(productId);
    if (!p) return;

    const purchases = getPurchases();

    if (editingId) {
        const index = purchases.findIndex(x => x.id === parseInt(editingId));
        if (index !== -1) {
            purchases[index] = {
                ...purchases[index],
                product_id: productId,
                product_name: p.name,
                size: p.size,
                quantity: qty,
                unit_cost: cost,
                total_cost: qty * cost,
                supplier,
                note,
                updated_at: new Date().toISOString(),
            };
        }
        showToast('✅ تم تعديل الفاتورة');
    } else {
        if (IS_DEMO && purchases.length >= DEMO_LIMITS.purchases) {
            showDemoLimit('فاتورة توريد', DEMO_LIMITS.purchases);
            return;
        }

        purchases.push({
            id: purchases.length > 0 ? Math.max(...purchases.map(x => x.id)) + 1 : 1,
            product_id: productId,
            product_name: p.name,
            size: p.size,
            quantity: qty,
            unit_cost: cost,
            total_cost: qty * cost,
            supplier,
            note,
            created_at: new Date().toISOString(),
        });
        showToast('✅ تم تسجيل التوريد');
    }

    savePurchases(purchases);

    document.getElementById('restockProduct').value = '';
    document.getElementById('restockProduct').dataset.editingId = '';
    ['restockQty', 'restockCost', 'restockSupplier', 'restockNote'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('restockCurrentInfo').textContent = '';
    document.getElementById('restockPreview').style.display = 'none';

    fillAllDropdowns();
    loadPurchasesTable();
    loadInventoryTable();
    loadPosProducts();
    loadDashboard();
}

function editPurchase(id) {
    const purchase = getPurchases().find(p => p.id === id);
    if (!purchase) return;

    document.getElementById('restockProduct').value = purchase.product_id;
    document.getElementById('restockQty').value = purchase.quantity;
    document.getElementById('restockCost').value = purchase.unit_cost;
    document.getElementById('restockSupplier').value = purchase.supplier || '';
    document.getElementById('restockNote').value = purchase.note || '';
    document.getElementById('restockProduct').dataset.editingId = id;

    onRestockProductChange();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('وضع تعديل الفاتورة #' + id, 'warning');
}

function deletePurchase(id) {
    const p = getPurchases().find(x => x.id === id);
    if (!p) return;

    if (!confirm(`حذف فاتورة التوريد #${p.id}؟\n\nسيتم إعادة حساب المخزون.`)) return;

    savePurchases(getPurchases().filter(x => x.id !== id));
    showToast('✅ تم حذف الفاتورة');
    fillAllDropdowns();
    loadPurchasesTable();
    loadInventoryTable();
    loadPosProducts();
    loadDashboard();
}

function loadPurchasesTable() {
    const tbody = document.getElementById('purchasesTableBody');
    const purchases = getPurchases().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty">لا توجد مشتريات</td></tr>';
        return;
    }

    tbody.innerHTML = purchases.map((p, i) => `
        <tr>
            <td>${purchases.length - i}</td>
            <td style="font-size:.8rem;">${new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
            <td><strong>${p.product_name}</strong> ${p.size ? `(${p.size})` : ''}</td>
            <td><span class="badge success">${p.quantity}</span></td>
            <td>₪${Number(p.unit_cost).toFixed(2)}</td>
            <td><strong>₪${Number(p.total_cost).toFixed(2)}</strong></td>
            <td>${p.supplier || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editPurchase(${p.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="btn-icon danger" onclick="deletePurchase(${p.id})" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
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
            .map(c => `<option value="${c.name}">${c.phone}</option>`)
            .join('');
    }

    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">لا توجد ديون</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td dir="ltr">${c.phone}</td>
            <td>₪${c.totalDebt.toFixed(2)}</td>
            <td style="color:var(--success);">₪${c.totalPaid.toFixed(2)}</td>
            <td><strong style="color:var(--danger);font-size:1.05rem;">₪${c.balance.toFixed(2)}</strong></td>
            <td>
                <button class="btn-icon" onclick="viewCustomerStatement('${c.name}', '${c.phone}')" title="كشف حساب">
                    <i class="fas fa-file-alt"></i>
                </button>
                <button class="btn-icon success" onclick="quickPay('${c.name}', ${c.balance})" title="دفعة سريعة">
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
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'manager' ? 'info' : 'primary'}">${u.role === 'manager' ? 'مدير فرع' : 'كاشير'}</span></td>
            <td>${u.branch_id ? getBranchName(u.branch_id) : '-'}</td>
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
            <td><strong>${b.name}</strong></td>
            <td><span class="badge primary">${b.code || '-'}</span></td>
            <td>${b.phone || '-'}</td>
            <td>${b.address || '-'}</td>
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
   22. حسابات التجار
   ============================================ */
function loadMerchantsTable() {
    const summary = getMerchantSummary();
    const tbody = document.getElementById('merchantsTableBody');

    const totalInvoices = Object.values(summary).reduce((s, m) => s + m.totalInvoices, 0);
    const totalPaid = Object.values(summary).reduce((s, m) => s + m.totalPaid, 0);
    const totalBalance = totalInvoices - totalPaid;

    document.getElementById('merchantStatsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-file-invoice"></i></div><div class="stat-label">إجمالي الفواتير</div><div class="stat-value">₪${totalInvoices.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-icon success"><i class="fas fa-check-circle"></i></div><div class="stat-label">المدفوعات</div><div class="stat-value">₪${totalPaid.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-hourglass-half"></i></div><div class="stat-label">الرصيد المتبقي</div><div class="stat-value" style="color:var(--danger);">₪${totalBalance.toFixed(2)}</div></div>
    `;

    const merchants = Object.values(summary);

    if (merchants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">لا توجد حسابات تجار</td></tr>';
        return;
    }

    tbody.innerHTML = merchants.map(m => `
        <tr>
            <td><strong>${m.name}</strong></td>
            <td>₪${m.totalInvoices.toFixed(2)}</td>
            <td>₪${m.totalPaid.toFixed(2)}</td>
            <td><strong style="color:${m.balance > 0 ? 'var(--danger)' : 'var(--success)'};">₪${m.balance.toFixed(2)}</strong></td>
            <td>
                <button class="btn-icon" onclick="viewMerchantStatement('${m.name}')" title="كشف حساب">
                    <i class="fas fa-file-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function saveMerchantInvoice() {
    const name = document.getElementById('m-name').value.trim();
    const ref = document.getElementById('m-ref').value.trim() || 'INV-' + Date.now();
    const amount = parseFloat(document.getElementById('m-amount').value);
    const note = document.getElementById('m-note').value.trim();

    if (!name || isNaN(amount) || amount <= 0) {
        showToast('يرجى ملء الحقول', 'error');
        return;
    }

    const tx = getMerchantTx();
    if (IS_DEMO && tx.length >= DEMO_LIMITS.merchants) {
        showDemoLimit('معاملة تاجر', DEMO_LIMITS.merchants);
        return;
    }

    tx.push({
        id: tx.length > 0 ? Math.max(...tx.map(t => t.id)) + 1 : 1,
        merchant_name: name,
        type: 'invoice',
        reference: ref,
        amount,
        note,
        created_at: new Date().toISOString(),
    });
    saveMerchantTx(tx);

    ['m-name', 'm-ref', 'm-amount', 'm-note'].forEach(id => {
        document.getElementById(id).value = '';
    });

    showToast('تم تسجيل الفاتورة');
    loadMerchantsTable();
}

function saveMerchantPayment() {
    const name = document.getElementById('pay-name').value.trim();
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const note = document.getElementById('pay-note').value.trim();

    if (!name || isNaN(amount) || amount <= 0) {
        showToast('يرجى ملء الحقول', 'error');
        return;
    }

    const tx = getMerchantTx();
    tx.push({
        id: tx.length > 0 ? Math.max(...tx.map(t => t.id)) + 1 : 1,
        merchant_name: name,
        type: 'payment',
        reference: 'PAY-' + Date.now(),
        amount,
        note,
        created_at: new Date().toISOString(),
    });
    saveMerchantTx(tx);

    ['pay-name', 'pay-amount', 'pay-note'].forEach(id => {
        document.getElementById(id).value = '';
    });

    showToast('تم تسجيل الدفعة');
    loadMerchantsTable();
}

function viewMerchantStatement(name) {
    const transactions = getMerchantTx()
        .filter(t => t.merchant_name === name)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let running = 0;
    let html = `كشف حساب التاجر: ${name}\n\n━━━━━━━━━━━━━━━━\n\n`;

    transactions.forEach(t => {
        if (t.type === 'invoice') running += Number(t.amount);
        else running -= Number(t.amount);

        html += `📅 ${new Date(t.created_at).toLocaleDateString('ar-EG')}\n`;
        html += `${t.type === 'invoice' ? '📄 فاتورة' : '💰 دفعة'}: ₪${Number(t.amount).toFixed(2)}\n`;
        html += `الرصيد: ₪${running.toFixed(2)}\n\n`;
    });

    html += `━━━━━━━━━━━━━━━━\n`;
    html += `الرصيد النهائي: ₪${running.toFixed(2)}`;

    alert(html);
}

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
            <td>${e._label}</td>
            <td><strong>₪${Number(e.amount).toFixed(2)}</strong></td>
            <td>
                <button class="btn-icon danger" onclick="deleteExpense('${e._type}', ${e.id})">
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
    const accrued = getAccruedRevenue();
    const cash = getCashRevenue();
    const receivables = getReceivables();
    const debtSales = getDebtSalesRevenue();

    const cogs = getCOGS();
    const expenses = getTotalExpenses();
    const netProfit = accrued - cogs - expenses.total;

    document.getElementById('repRevenue').textContent = '₪' + accrued.toFixed(2);
    document.getElementById('repCOGS').textContent = '₪' + cogs.toFixed(2);
    document.getElementById('repExpenses').textContent = '₪' + expenses.total.toFixed(2);
    document.getElementById('repNetProfit').textContent = '₪' + netProfit.toFixed(2);

    if (document.getElementById('repCashRevenue')) {
        document.getElementById('repCashRevenue').textContent = '₪' + cash.toFixed(2);
    }
    if (document.getElementById('repDebtSales')) {
        document.getElementById('repDebtSales').textContent = '₪' + debtSales.toFixed(2);
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
   25. بدء التشغيل
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        startApp();
    }
});