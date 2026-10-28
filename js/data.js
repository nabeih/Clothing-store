/* ============================================
   نظام إدارة المتجر - طبقة البيانات
   ============================================ */

const KEYS = {
    USERS: 'store_users_v6',
    BRANCHES: 'store_branches_v6',
    CATEGORIES: 'store_categories_v6',
    COLORS: 'store_colors_v6',
    SIZES: 'store_sizes_v6',
    PRODUCTS: 'store_products_v6',
    SALES: 'store_sales_v6',
    PURCHASES: 'store_purchases_v6',
    FIXED_EXPENSES: 'store_fixed_expenses_v6',
    VARIABLE_EXPENSES: 'store_variable_expenses_v6',
    MERCHANTS: 'store_merchants_v6',
    MERCHANT_TRANSACTIONS: 'store_merchant_tx_v6',
    CUSTOMER_DEBTS: 'store_customer_debts_v6',
    CUSTOMERS: 'store_customers_v6',
    RETURNS: 'store_returns_v6',
    CASHBOX_ENTRIES: 'store_cashbox_entries_v6',
    CASHBOX_SETTINGS: 'store_cashbox_settings_v6',
    CASHBOX_CLOSINGS: 'store_cashbox_closings_v6',
    AUDIT_LOG: 'store_audit_log_v6',
    CURRENT_USER: 'store_current_user_v6',
};

/* ============================================
   أدوات الحماية عند بناء HTML من بيانات المستخدم
   ============================================ */
// تهريب النص قبل إدراجه داخل innerHTML أو قيمة attribute
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// تمرير نص كوسيط آمن لدالة داخل onclick/onchange، مثل: onclick="fn(${jsArg(name)})"
function jsArg(value) {
    return escapeHtml(JSON.stringify(String(value ?? '')));
}

const IS_DEMO = true;
const LOW_STOCK = 5;

const DEMO_LIMITS = {
    products: 10,
    categories: 5,
    sales: 20,
    purchases: 20,
    employees: 3,
    branches: 2,
    merchants: 10,
    expenses: 15,
};

/* ============================================
   تهيئة البيانات الأولية
   ============================================ */
function initData() {
    if (localStorage.getItem(KEYS.USERS)) return;

    const users = [
        { id: 1, name: 'محمد المالك', email: 'owner@store.com', password: '123456', role: 'owner', branch_id: null },
        { id: 2, name: 'أحمد المدير', email: 'manager@store.com', password: '123456', role: 'manager', branch_id: 1 },
        { id: 3, name: 'علي الكاشير', email: 'cashier@store.com', password: '123456', role: 'cashier', branch_id: 1 },
    ];

    const branches = [
        { id: 1, name: 'الفرع الرئيسي', code: 'MAIN-01', phone: '0501234567', address: 'الرياض' },
    ];

    const categories = ['أطفال', 'بناتي', 'أولادي', 'أحذية'];
    const colors = ['أبيض', 'أسود', 'أحمر', 'أزرق', 'وردي', 'رمادي'];
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', '38', '39', '40'];

    const products = [
        { id: 1, code: '#101', name: 'قميص أطفال', category: 'أطفال', size: 'M', color: 'أبيض', base_cost: 10, price: 25 },
        { id: 2, code: '#102', name: 'فستان بناتي', category: 'بناتي', size: 'S', color: 'وردي', base_cost: 15, price: 35 },
        { id: 3, code: '#103', name: 'بنطال جينز', category: 'أولادي', size: 'L', color: 'أزرق', base_cost: 12, price: 30 },
        { id: 4, code: '#104', name: 'حذاء رياضي', category: 'أحذية', size: '38', color: 'أسود', base_cost: 20, price: 45 },
        { id: 5, code: '#105', name: 'تيشيرت صيفي', category: 'أطفال', size: 'M', color: 'أزرق', base_cost: 8, price: 20 },
    ];

    const purchases = [
        { id: 1, product_id: 1, product_name: 'قميص أطفال', size: 'M', quantity: 20, unit_cost: 10, total_cost: 200, supplier: 'مصنع الأمل', note: '', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
        { id: 2, product_id: 2, product_name: 'فستان بناتي', size: 'S', quantity: 10, unit_cost: 15, total_cost: 150, supplier: 'مصنع الأمل', note: '', created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
        { id: 3, product_id: 3, product_name: 'بنطال جينز', size: 'L', quantity: 15, unit_cost: 12, total_cost: 180, supplier: 'مصنع الجينز', note: '', created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
        { id: 4, product_id: 4, product_name: 'حذاء رياضي', size: '38', quantity: 5, unit_cost: 20, total_cost: 100, supplier: 'شركة الأحذية', note: '', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 5, product_id: 5, product_name: 'تيشيرت صيفي', size: 'M', quantity: 40, unit_cost: 8, total_cost: 320, supplier: 'مصنع الأمل', note: '', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
        { id: 6, product_id: 1, product_name: 'قميص أطفال', size: 'M', quantity: 10, unit_cost: 12, total_cost: 120, supplier: 'مصنع الأمل', note: 'دفعة ثانية', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    ];

    const sales = [
        {
            id: 1001, customer: 'عميل نقدي',
            items: [
                { product_id: 1, name: 'قميص أطفال', size: 'M', quantity: 2, base_price: 25, sold_price: 25, cost_at_sale: 10.67, subtotal: 50 },
                { product_id: 5, name: 'تيشيرت صيفي', size: 'M', quantity: 1, base_price: 20, sold_price: 20, cost_at_sale: 8, subtotal: 20 },
            ],
            subtotal: 70, discount: 0, total: 70,
            payment: { method: 'cash' },
            cashier_id: 3, cashier_name: 'علي الكاشير',
            status: 'completed', voided_reason: null, voided_by: null, voided_at: null,
            created_at: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
            id: 1002, customer: 'عميل نقدي',
            items: [
                { product_id: 2, name: 'فستان بناتي', size: 'S', quantity: 1, base_price: 35, sold_price: 30, cost_at_sale: 15, subtotal: 30 },
            ],
            subtotal: 30, discount: 0, total: 30,
            payment: { method: 'app', app_name: 'PalPay', sender_name: 'سارة أحمد', sender_phone: '0598765432', screenshot: null },
            cashier_id: 3, cashier_name: 'علي الكاشير',
            status: 'completed', voided_reason: null, voided_by: null, voided_at: null,
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
    ];

    const fixedExpenses = [
        { id: 1, type: 'إيجار المحل', amount: 500, period: 'يناير 2026', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
        { id: 2, type: 'رواتب موظفين', amount: 1200, period: 'يناير 2026', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
    ];

    const variableExpenses = [
        { id: 1, category: 'مواصلات وشحن', reason: 'شحن بضاعة', amount: 80, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 2, category: 'كهرباء وماء', reason: 'فاتورة شهرية', amount: 120, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    ];

    const merchantTransactions = [
        { id: 1, merchant_name: 'مصنع الأمل', type: 'invoice', reference: 'INV-001', amount: 350, note: 'فاتورة توريد', created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
        { id: 2, merchant_name: 'مصنع الأمل', type: 'payment', reference: 'PAY-001', amount: 200, note: 'دفعة جزئية', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
        { id: 3, merchant_name: 'مصنع الجينز', type: 'invoice', reference: 'INV-002', amount: 500, note: 'فاتورة جينز', created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
    ];

    const customerDebts = [
        { id: 1, customer_name: 'خالد محمود', customer_phone: '0599111111', type: 'invoice', amount: 150, sale_id: null, note: 'دين فاتورة سابقة', created_at: new Date(Date.now() - 12 * 86400000).toISOString() },
        { id: 2, customer_name: 'خالد محمود', customer_phone: '0599111111', type: 'payment', amount: 50, note: 'دفعة جزئية', created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
        { id: 3, customer_name: 'ريم سعيد', customer_phone: '0599222222', type: 'invoice', amount: 80, sale_id: null, note: 'دين', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    ];

    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.BRANCHES, JSON.stringify(branches));
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(KEYS.COLORS, JSON.stringify(colors));
    localStorage.setItem(KEYS.SIZES, JSON.stringify(sizes));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
    localStorage.setItem(KEYS.FIXED_EXPENSES, JSON.stringify(fixedExpenses));
    localStorage.setItem(KEYS.VARIABLE_EXPENSES, JSON.stringify(variableExpenses));
    localStorage.setItem(KEYS.MERCHANT_TRANSACTIONS, JSON.stringify(merchantTransactions));
    localStorage.setItem(KEYS.CUSTOMER_DEBTS, JSON.stringify(customerDebts));
    localStorage.setItem(KEYS.AUDIT_LOG, JSON.stringify([]));

    console.log('✅ تمت تهيئة البيانات');
}

/* ============================================
   دوال القراءة والكتابة (CRUD)
   ============================================ */

const getUsers = () => JSON.parse(localStorage.getItem(KEYS.USERS)) || [];
const saveUsers = (x) => localStorage.setItem(KEYS.USERS, JSON.stringify(x));

const getBranches = () => JSON.parse(localStorage.getItem(KEYS.BRANCHES)) || [];
const saveBranches = (x) => localStorage.setItem(KEYS.BRANCHES, JSON.stringify(x));

const getCategories = () => JSON.parse(localStorage.getItem(KEYS.CATEGORIES)) || [];
const saveCategories = (x) => localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(x));

const getColors = () => {
    let colors = JSON.parse(localStorage.getItem(KEYS.COLORS));
    if (!colors || colors.length === 0) {
        colors = ['أبيض', 'أسود', 'أحمر', 'أزرق', 'وردي', 'رمادي'];
        saveColors(colors);
    }
    return colors;
};
const saveColors = (x) => localStorage.setItem(KEYS.COLORS, JSON.stringify(x));

const getSizes = () => {
    let sizes = JSON.parse(localStorage.getItem(KEYS.SIZES));
    if (!sizes || sizes.length === 0) {
        sizes = ['S', 'M', 'L', 'XL', 'XXL', '38', '39', '40'];
        saveSizes(sizes);
    }
    return sizes;
};
const saveSizes = (x) => localStorage.setItem(KEYS.SIZES, JSON.stringify(x));

const getProducts = () => JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
const saveProducts = (x) => localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(x));

const getSales = () => JSON.parse(localStorage.getItem(KEYS.SALES)) || [];
const saveSales = (x) => localStorage.setItem(KEYS.SALES, JSON.stringify(x));

const getActiveSales = () => getSales().filter(s => s.status !== 'voided');

const getPurchases = () => JSON.parse(localStorage.getItem(KEYS.PURCHASES)) || [];
const savePurchases = (x) => localStorage.setItem(KEYS.PURCHASES, JSON.stringify(x));

const getFixedExpenses = () => JSON.parse(localStorage.getItem(KEYS.FIXED_EXPENSES)) || [];
const saveFixedExpenses = (x) => localStorage.setItem(KEYS.FIXED_EXPENSES, JSON.stringify(x));

const getVariableExpenses = () => JSON.parse(localStorage.getItem(KEYS.VARIABLE_EXPENSES)) || [];
const saveVariableExpenses = (x) => localStorage.setItem(KEYS.VARIABLE_EXPENSES, JSON.stringify(x));

const getMerchantTx = () => JSON.parse(localStorage.getItem(KEYS.MERCHANT_TRANSACTIONS)) || [];
const saveMerchantTx = (x) => localStorage.setItem(KEYS.MERCHANT_TRANSACTIONS, JSON.stringify(x));

const getMerchants = () => {
    let list = JSON.parse(localStorage.getItem(KEYS.MERCHANTS || 'store_merchants_v6'));
    if (!list || !Array.isArray(list) || list.length === 0) {
        let defaults = [
            { id: 1, name: 'مصنع الأمل', phone: '0599112233', balance: 0 },
            { id: 2, name: 'مصنع الجينز', phone: '0599445566', balance: 0 },
            { id: 3, name: 'شركة الأحذية', phone: '0599778899', balance: 0 },
            { id: 4, name: 'شركة الملابس المتحدة', phone: '0598123456', balance: 0 },
            { id: 5, name: 'مؤسسة النور للأقمشة', phone: '0597654321', balance: 0 }
        ];
        try {
            const existingPurchases = typeof getPurchases === 'function' ? getPurchases() : [];
            const existingTx = typeof getMerchantTx === 'function' ? getMerchantTx() : [];
            const names = new Set(defaults.map(d => d.name));
            existingPurchases.forEach(p => {
                if (p.supplier && !names.has(p.supplier)) {
                    names.add(p.supplier);
                    defaults.push({ id: defaults.length + 1, name: p.supplier, phone: '', balance: 0 });
                }
            });
            existingTx.forEach(t => {
                if (t.merchant_name && !names.has(t.merchant_name)) {
                    names.add(t.merchant_name);
                    defaults.push({ id: defaults.length + 1, name: t.merchant_name, phone: '', balance: 0 });
                }
            });
        } catch(e) {}
        localStorage.setItem(KEYS.MERCHANTS || 'store_merchants_v6', JSON.stringify(defaults));
        return defaults;
    }
    return list;
};
const saveMerchants = (x) => localStorage.setItem(KEYS.MERCHANTS || 'store_merchants_v6', JSON.stringify(x));
const getMerchantTransactions = () => getMerchantTx();
const saveMerchantTransactions = (x) => saveMerchantTx(x);


const getCustomerDebts = () => JSON.parse(localStorage.getItem(KEYS.CUSTOMER_DEBTS)) || [];
const saveCustomerDebts = (x) => localStorage.setItem(KEYS.CUSTOMER_DEBTS, JSON.stringify(x));

const getCustomers = () => {
    let list = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS || 'store_customers_v6'));
    if (!list || !Array.isArray(list) || list.length === 0) {
        list = [
            { id: 1, name: 'خالد محمود', phone: '0599111111', note: 'عميل دائم', source: 'pos', city: 'القدس', address: 'شارع صلاح الدين', createdAt: '2026-01-10T10:00:00Z' },
            { id: 2, name: 'ريم سعيد', phone: '0599222222', note: 'عميل مميز', source: 'pos', city: 'رام الله', address: 'شارع الإرسال', createdAt: '2026-02-15T11:30:00Z' },
            { id: 3, name: 'محمد خليل', phone: '0599333333', note: '', source: 'pos', city: 'نابلس', address: 'حي رفيديا', createdAt: '2026-03-01T14:20:00Z' }
        ];
        try {
            const debts = typeof getCustomerDebts === 'function' ? getCustomerDebts() : [];
            const names = new Set(list.map(d => d.name));
            debts.forEach(d => {
                if (d.customer_name && !names.has(d.customer_name)) {
                    names.add(d.customer_name);
                    list.push({
                        id: list.length + 1,
                        name: d.customer_name,
                        phone: d.customer_phone || '',
                        note: d.note || '',
                        source: 'pos',
                        createdAt: new Date().toISOString()
                    });
                }
            });
        } catch(e) {}
    }

    // مزامنة تلقائية مع عملاء المتجر الإلكتروني المسجلين أونلاين
    try {
        const onlineUsers = JSON.parse(localStorage.getItem('store_online_users_v1')) || [];
        let hasChanges = false;
        onlineUsers.forEach(u => {
            const existing = list.find(c => (u.phone && c.phone === u.phone) || (u.name && c.name && c.name.toLowerCase() === u.name.toLowerCase()));
            if (!existing) {
                const nextId = list.length > 0 ? Math.max(...list.map(c => Number(c.id) || 0)) + 1 : 1;
                list.push({
                    id: nextId,
                    name: u.name,
                    phone: u.phone,
                    city: u.city || '',
                    address: u.address || '',
                    source: 'online',
                    note: 'مسجل عبر المتجر الإلكتروني أونلاين',
                    createdAt: u.createdAt || new Date().toISOString()
                });
                hasChanges = true;
            } else {
                if (!existing.city && u.city) { existing.city = u.city; hasChanges = true; }
                if (!existing.address && u.address) { existing.address = u.address; hasChanges = true; }
                if (!existing.source) { existing.source = 'online'; hasChanges = true; }
            }
        });
        if (hasChanges) {
            localStorage.setItem(KEYS.CUSTOMERS || 'store_customers_v6', JSON.stringify(list));
        }
    } catch(e) {}

    return list;
};
const saveCustomers = (x) => localStorage.setItem(KEYS.CUSTOMERS || 'store_customers_v6', JSON.stringify(x));

const getReturns = () => {
    let list = JSON.parse(localStorage.getItem(KEYS.RETURNS));
    if (!list || !Array.isArray(list)) {
        list = [
            {
                id: 1,
                return_no: 'RET-1001',
                sale_id: 1001,
                customer_name: 'عميل نقدي',
                customer_phone: '-',
                type: 'return',
                return_items: [
                    { product_id: 5, name: 'تيشيرت صيفي', size: 'M', color: 'أزرق', quantity: 1, unit_price: 20, total: 20 }
                ],
                exchange_items: [],
                refund_amount: 20,
                difference_amount: 0,
                financial_action: 'cash_refund',
                cashier_id: 1,
                cashier_name: 'محمد المالك',
                reason: 'مقاس غير مناسب للزبون',
                note: 'تم إرجاع نقدي من الصندوق',
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
        saveReturns(list);
    }
    return list;
};
const saveReturns = (x) => localStorage.setItem(KEYS.RETURNS, JSON.stringify(x));

const getCashboxEntries = () => {
    let list = JSON.parse(localStorage.getItem(KEYS.CASHBOX_ENTRIES));
    if (!list || !Array.isArray(list)) {
        list = [
            {
                id: 1,
                type: 'in',
                amount: 100,
                reason: 'تغذية صندوق فكة صباحية',
                cashier_name: 'محمد المالك',
                created_at: new Date(Date.now() - 4 * 3600000).toISOString()
            }
        ];
        saveCashboxEntries(list);
    }
    return list;
};
const saveCashboxEntries = (x) => localStorage.setItem(KEYS.CASHBOX_ENTRIES, JSON.stringify(x));

const getCashboxSettings = () => {
    let settings = JSON.parse(localStorage.getItem(KEYS.CASHBOX_SETTINGS));
    if (!settings) {
        settings = { opening_balance: 200, last_opened_date: new Date().toISOString().slice(0, 10) };
        saveCashboxSettings(settings);
    }
    return settings;
};
const saveCashboxSettings = (x) => localStorage.setItem(KEYS.CASHBOX_SETTINGS, JSON.stringify(x));

const getCashboxClosings = () => JSON.parse(localStorage.getItem(KEYS.CASHBOX_CLOSINGS)) || [];
const saveCashboxClosings = (x) => localStorage.setItem(KEYS.CASHBOX_CLOSINGS, JSON.stringify(x));

function getProductReturnsQuantity(productId) {
    const allReturns = getReturns();
    let net = 0;
    allReturns.forEach(ret => {
        if (ret.status === 'cancelled') return;
        (ret.return_items || []).forEach(it => {
            if (Number(it.product_id) === Number(productId)) {
                net += Number(it.quantity || 0);
            }
        });
        (ret.exchange_items || []).forEach(it => {
            if (Number(it.product_id) === Number(productId)) {
                net -= Number(it.quantity || 0);
            }
        });
    });
    return net;
}

const getAuditLog = () => JSON.parse(localStorage.getItem(KEYS.AUDIT_LOG)) || [];
const saveAuditLog = (x) => localStorage.setItem(KEYS.AUDIT_LOG, JSON.stringify(x));

/* ============================================
   دوال مساعدة
   ============================================ */

function getCurrentUser() {
    const u = localStorage.getItem(KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
}

function getProductById(id) {
    return getProducts().find(p => p.id === id);
}

function getBranchName(id) {
    const b = getBranches().find(x => x.id === id);
    return b ? b.name : '-';
}

function getUserName(id) {
    const u = getUsers().find(x => x.id === id);
    return u ? u.name : '-';
}

/* ============================================
   الحسابات الآلية للمخزون
   ============================================ */

function getProductQuantity(productId) {
    const totalPurchased = getPurchases()
        .filter(p => p.product_id === productId)
        .reduce((sum, p) => sum + Number(p.quantity || 0), 0);

    const totalSold = getActiveSales()
        .reduce((sum, sale) => {
            const items = (sale.items || []).filter(i => i.product_id === productId);
            return sum + items.reduce((s, i) => s + Number(i.quantity || 0), 0);
        }, 0);

    const returnsAdjustment = (typeof getProductReturnsQuantity === 'function') ? getProductReturnsQuantity(productId) : 0;
    return totalPurchased - totalSold + returnsAdjustment;
}

function getProductAvgCost(productId) {
    const purchases = getPurchases().filter(p => p.product_id === productId);
    const totalQty = purchases.reduce((s, p) => s + Number(p.quantity || 0), 0);
    const totalValue = purchases.reduce((s, p) => s + (Number(p.quantity) * Number(p.unit_cost)), 0);
    return totalQty > 0 ? totalValue / totalQty : 0;
}

function getTotalStockValue() {
    return getProducts().reduce((sum, p) => {
        return sum + (getProductQuantity(p.id) * getProductAvgCost(p.id));
    }, 0);
}

/* ============================================
   الحسابات المالية الأساسية
   ============================================ */

function getAccruedRevenue() {
    return getActiveSales().reduce((s, x) => s + Number(x.total || 0), 0);
}

function getCashRevenue() {
    return getActiveSales()
        .filter(s => s.status !== 'voided')
        .reduce((s, x) => s + Number(x.payment && x.payment.total_paid !== undefined ? x.payment.total_paid : (x.payment && x.payment.method === 'debt' ? (x.payment.paid_upfront || 0) : x.total || 0)), 0);
}

function getDebtSalesRevenue() {
    return getActiveSales()
        .filter(s => s.payment && s.payment.method === 'debt')
        .reduce((s, x) => s + Number(x.total || 0), 0);
}

function getActualRevenue() {
    return getCashRevenue() + getDebtPaymentsReceived();
}

function getTotalRevenue() {
    return getActualRevenue();
}

function getCOGS() {
    let cogs = 0;
    getActiveSales().forEach(sale => {
        (sale.items || []).forEach(item => {
            cogs += Number(item.cost_at_sale || 0) * Number(item.quantity || 0);
        });
    });
    return cogs;
}

function getTotalExpenses() {
    const fixed = getFixedExpenses().reduce((s, e) => s + Number(e.amount || 0), 0);
    const variable = getVariableExpenses().reduce((s, e) => s + Number(e.amount || 0), 0);
    return { fixed, variable, total: fixed + variable };
}

function getNetProfit() {
    return getActualRevenue() - getCOGS() - getTotalExpenses().total;
}

function getNetProfitCash() {
    return getCashRevenue() - getCOGS() - getTotalExpenses().total;
}

function getTodaySales() {
    const today = new Date().toDateString();
    return getActiveSales()
        .filter(s => new Date(s.created_at).toDateString() === today)
        .reduce((sum, s) => sum + Number(s.total), 0);
}

function getOutOfStockProducts() {
    return getProducts().filter(p => getProductQuantity(p.id) <= 0);
}

function getLossProducts() {
    return getProducts().filter(p => Number(p.price) <= getProductAvgCost(p.id));
}

/* ============================================
   حسابات التجار
   ============================================ */
function getMerchantSummary() {
    const transactions = getMerchantTx();
    const summary = {};

    transactions.forEach(t => {
        const name = t.merchant_name;
        if (!summary[name]) {
            summary[name] = { name, totalInvoices: 0, totalPaid: 0, balance: 0, transactions: [] };
        }
        if (t.type === 'invoice') summary[name].totalInvoices += Number(t.amount);
        else if (t.type === 'payment') summary[name].totalPaid += Number(t.amount);
        summary[name].transactions.push(t);
    });

    Object.keys(summary).forEach(name => {
        summary[name].balance = summary[name].totalInvoices - summary[name].totalPaid;
        summary[name].transactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    return summary;
}

/* ============================================
   ديون العملاء
   ============================================ */
function getCustomerDebtSummary() {
    const debts = getCustomerDebts();
    const summary = {};

    debts.forEach(d => {
        const key = d.customer_name + '|' + (d.customer_phone || '');
        if (!summary[key]) {
            summary[key] = {
                name: d.customer_name,
                phone: d.customer_phone || '-',
                totalDebt: 0,
                totalPaid: 0,
                balance: 0,
                transactions: [],
            };
        }
        if (d.type === 'invoice') summary[key].totalDebt += Number(d.amount);
        else if (d.type === 'payment') summary[key].totalPaid += Number(d.amount);
        summary[key].transactions.push(d);
    });

    Object.keys(summary).forEach(key => {
        summary[key].balance = summary[key].totalDebt - summary[key].totalPaid;
        summary[key].transactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    return summary;
}

function getTotalCustomerDebt() {
    const summary = getCustomerDebtSummary();
    return Object.values(summary).reduce((s, c) => s + Math.max(0, c.balance), 0);
}

function getReceivables() {
    const summary = getCustomerDebtSummary();
    return Object.values(summary).reduce((s, c) => s + Math.max(0, c.balance), 0);
}

function getDebtPaymentsReceived() {
    return getCustomerDebts()
        .filter(d => d.type === 'payment')
        .reduce((s, d) => s + Number(d.amount || 0), 0);
}

/* ============================================
   التنبيهات
   ============================================ */

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function showDemoLimit(feature, limit) {
    const msgEl = document.getElementById('demoLimitMessage');
    if (msgEl) {
        msgEl.textContent = `وصلت للحد الأقصى: ${limit} ${feature}`;
    }
    const modal = document.getElementById('demoLimitModal');
    if (modal) modal.classList.add('show');
}

/* ============================================
   النوافذ المنبثقة (Modals)
   ============================================ */
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
   تشغيل التهيئة
   ============================================ */
initData();