// ==================== SISTEMA DE COTIZACIONES CON API ====================

const API_URL = '/api';

class QuotationSystem {
    constructor() {
        this.quotations = [];
        this.currentQuotation = null;
    }

    async init() {
        // Solo ejecutar si el elemento existe
        const container = document.getElementById('dashboardItems');
        if (container) {
            await this.refreshDashboard();
        }
    }

    async getNextQuotationNumber() {
        try {
            const response = await fetch(`${API_URL}/quotations/next/number`);
            const data = await response.json();
            return data.nextNumber;
        } catch (err) {
            console.error('Error getting next quotation number:', err);
            return 1000;
        }
    }

    async saveQuotation(data) {
        try {
            const method = data.id ? 'PUT' : 'POST';
            const url = data.id ? `${API_URL}/quotations/${data.id}` : `${API_URL}/quotations`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quotationNumber: parseInt(data.number),
                    dateExp: data.date,
                    dateValid: data.validUntil,
                    clientName: data.clientName || 'Sin especificar',
                    clientCCNIT: data.clientCCNIT,
                    clientAddress: data.clientAddress,
                    clientPhone: data.clientPhone,
                    clientEmail: data.clientEmail,
                    items: data.items,
                    subtotal: parseFloat(data.subtotal.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0,
                    discount: parseFloat(data.discount.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0,
                    total: parseFloat(data.total.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0
                })
            });

            if (!response.ok) {
                throw new Error('Error al guardar la cotización');
            }

            const quotation = await response.json();
            const message = method === 'PUT' ? 'actualizada' : 'guardada';
            alert(`✅ Cotización #${data.number} ${message} exitosamente`);
            
            return quotation;
        } catch (err) {
            console.error('Error saving quotation:', err);
            alert('❌ Error al guardar la cotización: ' + err.message);
            return null;
        }
    }

    async loadQuotation(id) {
        try {
            const response = await fetch(`${API_URL}/quotations/${id}`);
            if (!response.ok) {
                throw new Error('Cotización no encontrada');
            }

            const quotation = await response.json();

            document.getElementById('quotationNumber').value = quotation.id;
            document.getElementById('quotNumDisplay').textContent = quotation.quotation_number;
            document.getElementById('dateExp').textContent = quotation.date_exp;
            document.getElementById('dateValid').textContent = quotation.date_valid;
            document.getElementById('clientName').value = quotation.client_name;
            document.getElementById('clientCCNIT').value = quotation.client_cc_nit;
            document.getElementById('clientAddress').value = quotation.client_address || '';
            document.getElementById('clientPhone').value = quotation.client_phone || '';
            document.getElementById('clientEmail').value = quotation.client_email || '';

            // Limpiar tabla de items
            document.getElementById('itemsTableBody').innerHTML = '';

            // Agregar items
            const items = Array.isArray(quotation.items) ? quotation.items : JSON.parse(quotation.items || '[]');
            items.forEach(item => {
                if (item.quantity || item.description) {
                    addItemRow(item.quantity, item.description, item.unit, item.discountUnit, item.total);
                }
            });

            document.getElementById('subtotal').value = `$ ${quotation.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
            document.getElementById('discount').value = `$ ${quotation.discount.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
            document.getElementById('total').value = `$ ${quotation.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

            this.currentQuotation = quotation;
        } catch (err) {
            console.error('Error loading quotation:', err);
            alert('❌ Error al cargar la cotización: ' + err.message);
        }
    }

    async deleteQuotation(id) {
        if (confirm('¿Eliminar esta cotización?')) {
            try {
                const response = await fetch(`${API_URL}/quotations/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar la cotización');
                }

                alert('✅ Cotización eliminada');
                await this.refreshDashboard();
            } catch (err) {
                console.error('Error deleting quotation:', err);
                alert('❌ Error al eliminar la cotización: ' + err.message);
            }
        }
    }

    async getAllQuotations() {
        try {
            const response = await fetch(`${API_URL}/quotations`);
            if (!response.ok) {
                throw new Error('Error fetching quotations');
            }
            this.quotations = await response.json();
            return this.quotations;
        } catch (err) {
            console.error('Error fetching quotations:', err);
            return [];
        }
    }

    async refreshDashboard() {
        const container = document.getElementById('dashboardItems');
        if (!container) return;

        const quotations = await this.getAllQuotations();

        if (quotations.length === 0) {
            container.innerHTML = '<p style="color: #ccc; grid-column: 1/-1; text-align: center;">No hay cotizaciones guardadas</p>';
            return;
        }

        container.innerHTML = quotations.map(q => `
            <div class="dashboard-card">
                <div class="card-header">
                    <h4>#${q.quotation_number}</h4>
                    <span class="card-date">${q.date_exp}</span>
                </div>
                <div class="card-body">
                    <p class="client-name">${q.client_name || 'Sin cliente'}</p>
                    <div class="card-meta">
                        <small>Válido: ${q.date_valid}</small>
                    </div>
                </div>
                <div class="card-footer">
                    <p class="total-amount">$ ${q.total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</p>
                </div>
                <div class="dashboard-card-actions">
                    <button title="Editar cotización" onclick="window.location.href='cotizacion.html?id=${q.id}'">✏️ Editar</button>
                    <button title="Imprimir cotización" onclick="window.location.href='cotizacion.html?id=${q.id}&print=true'">🖨️ Imprimir</button>
                    <button title="Eliminar cotización" onclick="quotationSystem.deleteQuotation(${q.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
    }
}

// ==================== FUNCIONES GLOBALES ====================

const quotationSystem = new QuotationSystem();

function showDashboard() {
    window.location.href = 'index.html';
}

async function generateNewQuotation() {
    const number = await quotationSystem.getNextQuotationNumber();
    document.getElementById('quotationNumber').value = number;
    document.getElementById('quotNumDisplay').textContent = number;

    // Limpiar formulario
    document.getElementById('clientName').value = '';
    document.getElementById('clientCCNIT').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('itemsTableBody').innerHTML = '';
    document.getElementById('subtotal').value = '$ 0';
    document.getElementById('discount').value = '$ 0';
    document.getElementById('total').value = '$ 0';

    setDefaultDates();
    addItemRow();
}

function setDefaultDates() {
    const today = new Date();
    const validUntil = new Date(today.getTime() + (15 * 24 * 60 * 60 * 1000));

    const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    document.getElementById('dateExp').textContent = formatDate(today);
    document.getElementById('dateValid').textContent = formatDate(validUntil);
}

function addItemRow(quantity = '', description = '', unit = '', discountUnit = '', total = '') {
    const tbody = document.getElementById('itemsTableBody');
    const rowIndex = tbody.children.length;

    const row = document.createElement('tr');
    row.id = 'row-' + rowIndex;
    row.innerHTML = `
        <td class="text-center"><input type="number" class="item-quantity" value="${quantity}" min="0" onchange="calculateRowTotal(${rowIndex})" step="0.01"></td>
        <td><input type="text" class="item-description" value="${description}" placeholder="Descripción del producto"></td>
        <td class="text-right"><input type="number" class="item-unit" value="${unit}" min="0" onchange="calculateRowTotal(${rowIndex})" placeholder="0" step="0.01"></td>
        <td class="text-right"><input type="number" class="item-discount" value="${discountUnit}" min="0" onchange="calculateRowTotal(${rowIndex})" placeholder="0" step="0.01"></td>
        <td class="text-right"><input type="text" class="item-total" value="${total}" readonly style="background-color: #efebe9;"></td>
        <td class="text-center"><button class="delete-row" onclick="deleteItemRow(${rowIndex})">Eliminar</button></td>
    `;
    tbody.appendChild(row);
}

function calculateRowTotal(rowIndex) {
    const row = document.getElementById('row-' + rowIndex);
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const unit = parseFloat(row.querySelector('.item-unit').value) || 0;
    const discountUnit = parseFloat(row.querySelector('.item-discount').value) || 0;
    const netUnit = Math.max(unit - discountUnit, 0);
    const total = quantity * netUnit;

    row.querySelector('.item-total').value = '$ ' + total.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    calculateTotals();
}

function deleteItemRow(rowIndex) {
    const row = document.getElementById('row-' + rowIndex);
    row.remove();
    calculateTotals();
}

function calculateTotals() {
    const rows = document.querySelectorAll('#itemsTableBody tr');
    let subtotal = 0;
    let discountTotal = 0;

    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unit = parseFloat(row.querySelector('.item-unit').value) || 0;
        const discountUnit = parseFloat(row.querySelector('.item-discount').value) || 0;
        const lineSubtotal = quantity * unit;
        const lineDiscount = quantity * discountUnit;
        subtotal += lineSubtotal;
        discountTotal += lineDiscount;
    });

    const total = subtotal - discountTotal;

    document.getElementById('subtotal').value = '$ ' + subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    document.getElementById('discount').value = '$ ' + discountTotal.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    document.getElementById('total').value = '$ ' + total.toLocaleString('es-CO', { minimumFractionDigits: 0 });
}

document.addEventListener('DOMContentLoaded', () => {
    quotationSystem.init();
});

async function saveQuotation() {
    const items = [];
    document.querySelectorAll('#itemsTableBody tr').forEach(row => {
        const quantity = row.querySelector('.item-quantity').value;
        const description = row.querySelector('.item-description').value;
        const unit = row.querySelector('.item-unit').value;
        const discountUnit = row.querySelector('.item-discount').value;
        const total = row.querySelector('.item-total').value;

        if (quantity || description) {
            items.push({ quantity, description, unit, discountUnit, total });
        }
    });

    if (items.length === 0) {
        alert('⚠️ Agregue al menos un producto');
        return;
    }

    const data = {
        id: quotationSystem.currentQuotation?.id || null,
        number: document.getElementById('quotationNumber').value,
        date: document.getElementById('dateExp').textContent,
        validUntil: document.getElementById('dateValid').textContent,
        clientName: document.getElementById('clientName').value || 'Sin especificar',
        clientCCNIT: document.getElementById('clientCCNIT').value,
        clientAddress: document.getElementById('clientAddress').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientEmail: document.getElementById('clientEmail').value,
        items: items,
        subtotal: document.getElementById('subtotal').value,
        discount: document.getElementById('discount').value,
        total: document.getElementById('total').value
    };

    const result = await quotationSystem.saveQuotation(data);
    
    if (result) {
        // Redirigir al dashboard después de guardar
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// Inicializar cálculos cuando la página cargue
window.addEventListener('load', () => {
    calculateTotals();
});
