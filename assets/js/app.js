// ==================== SISTEMA DE COTIZACIONES ====================

class QuotationSystem {
    constructor() {
        this.quotations = JSON.parse(localStorage.getItem('quotations')) || [];
        this.currentQuotation = null;
        this.quotationCounter = parseInt(localStorage.getItem('quotationCounter')) || 1000;
    }

    init() {
        // Solo ejecutar si el elemento existe
        const container = document.getElementById('savedQuotations');
        if (container) {
            this.refreshQuotationsList();
        }
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

        // Verificar si ya existe la cotización
        const existingIndex = this.quotations.findIndex(q => q.id === quotation.id);
        if (existingIndex >= 0) {
            this.quotations[existingIndex] = quotation;
            alert('✅ Cotización #' + data.number + ' actualizada exitosamente');
        } else {
            this.quotations.push(quotation);
            alert('✅ Cotización #' + data.number + ' guardada exitosamente');
        }
        
        localStorage.setItem('quotations', JSON.stringify(this.quotations));
        this.refreshQuotationsList();
        this.refreshDashboard();
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
                    addItemRow(item.quantity, item.description, item.unit, item.discountUnit, item.total);
                }
            });

            document.getElementById('subtotal').value = quotation.subtotal;
            document.getElementById('discount').value = quotation.discount;
            document.getElementById('total').value = quotation.total;
        }
    }

    deleteQuotation(id) {
        if (confirm('¿Eliminar esta cotización?')) {
            const initialLength = this.quotations.length;
            this.quotations = this.quotations.filter(q => q.id !== id);
            
            if (this.quotations.length < initialLength) {
                localStorage.setItem('quotations', JSON.stringify(this.quotations));
                this.quotations = JSON.parse(localStorage.getItem('quotations')) || [];
                this.refreshQuotationsList();
                this.refreshDashboard();
                alert('✅ Cotización eliminada');
            } else {
                alert('⚠️ No se encontró la cotización para eliminar');
            }
        }
    }

    refreshQuotationsList() {
        const container = document.getElementById('savedQuotations');
        if (this.quotations.length === 0) {
            container.innerHTML = '<p style="color: #ccc;">No hay cotizaciones guardadas</p>';
            return;
        }

        container.innerHTML = this.quotations.map(q => `
            <div style="background: #5D4037; padding: 8px; margin: 5px 0; border-radius: 4px;">
                <div onclick="quotationSystem.loadQuotation(${q.id}); showFormView();" style="cursor: pointer; padding: 5px; margin-bottom: 5px;">
                    <strong>#${q.number}</strong><br>
                    📅 ${q.date}<br>
                    👤 ${q.client.name || 'Sin cliente'}<br>
                    <span style="color: #FFD54F;">$ ${parseFloat(q.total.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0}</span>
                </div>
                <button style="width: 100%; padding: 4px; background: #c62828; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;" onclick="quotationSystem.deleteQuotation(${q.id})">🗑️ Eliminar</button>
            </div>
        `).join('');
    }

    refreshDashboard() {
        const container = document.getElementById('dashboardItems');
        if (this.quotations.length === 0) {
            container.innerHTML = '<p style="color: #ccc; grid-column: 1/-1; text-align: center;">No hay cotizaciones guardadas</p>';
            return;
        }

        container.innerHTML = this.quotations.map(q => `
            <div class="dashboard-card">
                <div class="card-header">
                    <h4>#${q.number}</h4>
                    <span class="card-date">${q.date}</span>
                </div>
                <div class="card-body">
                    <p class="client-name">${q.client.name || 'Sin cliente'}</p>
                    <div class="card-meta">
                        <small>Válido: ${q.validUntil}</small>
                    </div>
                </div>
                <div class="card-footer">
                    <p class="total-amount">$ ${parseFloat(q.total.replace(/[\$ ]/g, '').replace(/\./g, '').replace(',', '.')) || 0}</p>
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

function saveQuotation() {
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
    
    // Redirigir al dashboard después de guardar
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
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
