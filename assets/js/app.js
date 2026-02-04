// ==================== SISTEMA DE COTIZACIONES ====================

class QuotationSystem {
    constructor() {
        this.quotations = JSON.parse(localStorage.getItem('quotations')) || [];
        this.currentQuotation = null;
        this.quotationCounter = parseInt(localStorage.getItem('quotationCounter')) || 1000;
        this.init();
    }

    init() {
        generateNewQuotation();
        this.refreshQuotationsList();
        setDefaultDates();
        addItemRow();
        addItemRow();
    }

    generateQuotationNumber() {
        this.quotationCounter++;
        localStorage.setItem('quotationCounter', this.quotationCounter);
        return this.quotationCounter;
    }

    saveQuotation(data) {
        const quotation = {
            id: data.number,
            number: data.number,
            date: data.date,
            validUntil: data.validUntil,
            client: {
                name: data.clientName,
                ccnit: data.clientCCNIT,
                address: data.clientAddress,
                phone: data.clientPhone,
                email: data.clientEmail
            },
            items: data.items,
            subtotal: data.subtotal,
            discount: data.discount,
            total: data.total,
            savedDate: new Date().toLocaleString('es-CO')
        };

        this.quotations.push(quotation);
        localStorage.setItem('quotations', JSON.stringify(this.quotations));
        alert('✅ Cotización #' + data.number + ' guardada exitosamente');
        this.refreshQuotationsList();
    }

    loadQuotation(id) {
        const quotation = this.quotations.find(q => q.id === id);
        if (quotation) {
            document.getElementById('quotationNumber').value = quotation.number;
            document.getElementById('quotNumDisplay').textContent = quotation.number;
            document.getElementById('dateExp').textContent = quotation.date;
            document.getElementById('dateValid').textContent = quotation.validUntil;
            document.getElementById('clientName').value = quotation.client.name;
            document.getElementById('clientCCNIT').value = quotation.client.ccnit;
            document.getElementById('clientAddress').value = quotation.client.address;
            document.getElementById('clientPhone').value = quotation.client.phone;
            document.getElementById('clientEmail').value = quotation.client.email;

            // Limpiar tabla de items
            document.getElementById('itemsTableBody').innerHTML = '';

            // Agregar items
            quotation.items.forEach(item => {
                if (item.quantity || item.description) {
                    addItemRow(item.quantity, item.description, item.unit, item.total);
                }
            });

            document.getElementById('subtotal').value = quotation.subtotal;
            document.getElementById('discount').value = quotation.discount;
            document.getElementById('total').value = quotation.total;
        }
    }

    deleteQuotation(id) {
        if (confirm('¿Eliminar esta cotización?')) {
            this.quotations = this.quotations.filter(q => q.id !== id);
            localStorage.setItem('quotations', JSON.stringify(this.quotations));
            this.refreshQuotationsList();
            alert('✅ Cotización eliminada');
        }
    }

    refreshQuotationsList() {
        const container = document.getElementById('savedQuotations');
        if (this.quotations.length === 0) {
            container.innerHTML = '<p style="color: #ccc;">No hay cotizaciones guardadas</p>';
            return;
        }

        container.innerHTML = this.quotations.map(q => `
            <div style="background: #5D4037; padding: 8px; margin: 5px 0; border-radius: 4px; cursor: pointer;">
                <div onclick="quotationSystem.loadQuotation(${q.id})" style="cursor: pointer; flex: 1;">
                    <strong>#${q.number}</strong><br>
                    📅 ${q.date}<br>
                    👤 ${q.client.name || 'Sin cliente'}<br>
                    <span style="color: #FFD54F;">$ ${parseFloat(q.total.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0}</span>
                </div>
                <button style="width: 100%; margin-top: 5px; padding: 4px; background: #c62828; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;" onclick="quotationSystem.deleteQuotation(${q.id})">🗑️ Eliminar</button>
            </div>
        `).join('');
    }
}

// ==================== FUNCIONES GLOBALES ====================

const quotationSystem = new QuotationSystem();

function generateNewQuotation() {
    const number = quotationSystem.generateQuotationNumber();
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

function addItemRow(quantity = '', description = '', unit = '', total = '') {
    const tbody = document.getElementById('itemsTableBody');
    const rowIndex = tbody.children.length;

    const row = document.createElement('tr');
    row.id = 'row-' + rowIndex;
    row.innerHTML = `
        <td class="text-center"><input type="number" class="item-quantity" value="${quantity}" min="0" onchange="calculateRowTotal(${rowIndex})" step="0.01"></td>
        <td><input type="text" class="item-description" value="${description}" placeholder="Descripción del producto"></td>
        <td class="text-right"><input type="number" class="item-unit" value="${unit}" min="0" onchange="calculateRowTotal(${rowIndex})" placeholder="0" step="0.01"></td>
        <td class="text-right"><input type="text" class="item-total" value="${total}" readonly style="background-color: #efebe9;"></td>
        <td class="text-center"><button class="delete-row" onclick="deleteItemRow(${rowIndex})">Eliminar</button></td>
    `;
    tbody.appendChild(row);
}

function calculateRowTotal(rowIndex) {
    const row = document.getElementById('row-' + rowIndex);
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const unit = parseFloat(row.querySelector('.item-unit').value) || 0;
    const total = quantity * unit;

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

    rows.forEach(row => {
        const totalText = row.querySelector('.item-total').value;
        const value = parseFloat(totalText.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
        subtotal += value;
    });

    const discountText = document.getElementById('discount').value;
    const discount = parseFloat(discountText.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    const total = subtotal - discount;

    document.getElementById('subtotal').value = '$ ' + subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    document.getElementById('total').value = '$ ' + total.toLocaleString('es-CO', { minimumFractionDigits: 0 });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('discount').addEventListener('change', calculateTotals);
});

function saveQuotation() {
    const items = [];
    document.querySelectorAll('#itemsTableBody tr').forEach(row => {
        const quantity = row.querySelector('.item-quantity').value;
        const description = row.querySelector('.item-description').value;
        const unit = row.querySelector('.item-unit').value;
        const total = row.querySelector('.item-total').value;

        if (quantity || description) {
            items.push({ quantity, description, unit, total });
        }
    });

    if (items.length === 0) {
        alert('⚠️ Agregue al menos un producto');
        return;
    }

    const data = {
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

    quotationSystem.saveQuotation(data);
}

function deleteAllData() {
    if (confirm('⚠️ ¿Eliminar TODAS las cotizaciones guardadas? Esta acción no se puede deshacer.')) {
        localStorage.clear();
        quotationSystem.quotations = [];
        quotationSystem.refreshQuotationsList();
        alert('✅ Todos los datos han sido eliminados');
    }
}

// Inicializar cálculos cuando la página cargue
window.addEventListener('load', () => {
    calculateTotals();
});
