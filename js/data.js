/* ============================================
   نظام إدارة المتجر - طبقة البيانات
   ============================================ */

const KEYS = {
    USERS: 'store_users_v6',
    BRANCHES: 'store_branches_v6',
    CATEGORIES: 'store_categories_v6',
    PRODUCTS: 'store_products_v6',
    SALES: 'store_sales_v6',
    PURCHASES: 'store_purchases_v6',
    FIXED_EXPENSES: 'store_fixed_expenses_v6',
    VARIABLE_EXPENSES: 'store_variable_expenses_v6',
    MERCHANT_TRANSACTIONS: 'store_merchant_tx_v6',
    CUSTOMER_DEBTS: 'store_customer_debts_v6',
    AUDIT_LOG: 'store_audit_log_v6',
    CURRENT_USER: 'store_current_user_v6',
};

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

const getCustomerDebts = () => JSON.parse(localStorage.getItem(KEYS.CUSTOMER_DEBTS)) || [];
const saveCustomerDebts = (x) => localStorage.setItem(KEYS.CUSTOMER_DEBTS, JSON.stringify(x));

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

    return totalPurchased - totalSold;
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
        .filter(s => s.payment && s.payment.method !== 'debt')
        .reduce((s, x) => s + Number(x.total || 0), 0);
}

function getDebtSalesRevenue() {
    return getActiveSales()
        .filter(s => s.payment && s.payment.method === 'debt')
        .reduce((s, x) => s + Number(x.total || 0), 0);
}

function getTotalRevenue() {
    return getAccruedRevenue();
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
    return getAccruedRevenue() - getCOGS() - getTotalExpenses().total;
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

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

/* ============================================
   تشغيل التهيئة
   ============================================ */
initData();