// ==================== SISTEMA DE COTIZACIONES CON API ====================

const API_URL = '/api';

class QuotationSystem {
    constructor() {
        this.quotations = [];
        this.currentQuotation = null;
        this.filteredQuotations = [];
        this.searchTerm = '';
        this.currentPage = 1;
        this.itemsPerPage = 6; // 6 tarjetas por página
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
        // Mostrar loading
        Swal.fire({
            title: 'Guardando cotización...',
            html: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const method = data.id ? 'PUT' : 'POST';
            const url = data.id ? `${API_URL}/quotations/${data.id}` : `${API_URL}/quotations`;

            // Convertir fechas de DD/MM/YY a YYYY-MM-DD
            const convertDateToISO = (dateStr) => {
                const [day, month, year] = dateStr.split('/');
                const fullYear = year.length === 2 ? `20${year}` : year;
                return `${fullYear}-${month}-${day}`;
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quotationNumber: parseInt(data.number),
                    dateExp: convertDateToISO(data.date),
                    dateValid: convertDateToISO(data.validUntil),
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
            
            // Mostrar éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: `Cotización #${data.number} ${message} exitosamente`,
                confirmButtonColor: '#8D6E63',
                timer: 2000
            });
            
            return quotation;
        } catch (err) {
            console.error('Error saving quotation:', err);
            
            // Mostrar error
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar la cotización: ' + err.message,
                confirmButtonColor: '#8D6E63'
            });
            
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

            // Convertir fechas de YYYY-MM-DD a DD/MM/YY
            const convertDateFromISO = (dateStr) => {
                if (!dateStr) return '';
                // Manejar formato con tiempo (2026-02-05T00:00:00.000Z) o sin tiempo (2026-02-05)
                const datePart = dateStr.split('T')[0];
                const [year, month, day] = datePart.split('-');
                const shortYear = year.slice(-2);
                return `${day}/${month}/${shortYear}`;
            };

            document.getElementById('quotationNumber').value = quotation.id;
            document.getElementById('quotNumDisplay').textContent = quotation.quotation_number;
            document.getElementById('dateExp').textContent = convertDateFromISO(quotation.date_exp);
            document.getElementById('dateValid').textContent = convertDateFromISO(quotation.date_valid);
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
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la cotización: ' + err.message,
                confirmButtonColor: '#8D6E63'
            });
        }
    }

    async deleteQuotation(id) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8D6E63',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Mostrar loading
            Swal.fire({
                title: 'Eliminando...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await fetch(`${API_URL}/quotations/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar la cotización');
                }

                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminada!',
                    text: 'La cotización ha sido eliminada',
                    confirmButtonColor: '#8D6E63',
                    timer: 1500
                });

                // Refrescar después de que el alert desaparezca
                setTimeout(() => {
                    this.refreshDashboard();
                }, 1600);
            } catch (err) {
                console.error('Error deleting quotation:', err);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar la cotización: ' + err.message,
                    confirmButtonColor: '#8D6E63'
                });
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

        this.quotations = await this.getAllQuotations();
        this.applyFiltersAndSearch();
        this.renderQuotations();
        this.setupSearchAndFilterListeners();
    }

    applyFiltersAndSearch() {
        let filtered = [...this.quotations];

        // Aplicar búsqueda
        if (this.searchTerm.trim()) {
            const search = this.searchTerm.toLowerCase();
            filtered = filtered.filter(q => {
                return (
                    q.client_name.toLowerCase().includes(search) ||
                    q.quotation_number.toString().includes(search) ||
                    (q.client_email && q.client_email.toLowerCase().includes(search)) ||
                    (q.client_phone && q.client_phone.includes(search))
                );
            });
        }

        this.filteredQuotations = filtered;
        this.currentPage = 1; // Reiniciar a página 1 cuando se busca
    }

    getPaginatedQuotations() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.filteredQuotations.slice(start, end);
    }

    getTotalPages() {
        return Math.ceil(this.filteredQuotations.length / this.itemsPerPage);
    }

    renderQuotations() {
        const container = document.getElementById('dashboardItems');
        if (!container) return;

        const paginatedQuotations = this.getPaginatedQuotations();

        if (this.filteredQuotations.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-secondary); grid-column: 1/-1; text-align: center; padding: 40px 20px;">No hay cotizaciones que coincidan con tu búsqueda</p>';
            this.updatePaginationControls();
            return;
        }

        // Convertir fechas de YYYY-MM-DD a DD/MM/YY
        const convertDateFromISO = (dateStr) => {
            if (!dateStr) return '';
            const datePart = dateStr.split('T')[0];
            const [year, month, day] = datePart.split('-');
            const shortYear = year.slice(-2);
            return `${day}/${month}/${shortYear}`;
        };

        container.innerHTML = paginatedQuotations.map(q => `
            <div class="dashboard-card">
                <div class="card-header">
                    <div>
                        <div class="card-number">#${q.quotation_number}</div>
                        <div class="card-date">${convertDateFromISO(q.date_exp)}</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-client">${q.client_name || 'Sin cliente'}</div>
                    <div class="card-email">${q.client_email || 'sin@email.com'}</div>
                    <div class="card-items">
                        <strong>Válido hasta:</strong> ${convertDateFromISO(q.date_valid)}
                    </div>
                    <div class="card-amount">$ ${q.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="card-actions">
                    <button title="Editar cotización" onclick="window.location.href='cotizacion.html?id=${q.id}'">✏️ Editar</button>
                    <button title="Imprimir cotización" onclick="window.location.href='cotizacion.html?id=${q.id}&print=true'">🖨️ Imprimir</button>
                    <button title="Eliminar" class="danger" onclick="quotationSystem.deleteQuotation(${q.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');

        this.updatePaginationControls();
    }

    updatePaginationControls() {
        const totalPages = this.getTotalPages();
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (pageInfo) {
            pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderQuotations();
            window.scrollTo(0, 0);
        }
    }

    nextPage() {
        const totalPages = this.getTotalPages();
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderQuotations();
            window.scrollTo(0, 0);
        }
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
        const y = date.getFullYear().toString().slice(-2);
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
        <td>
            <div class="autocomplete-wrapper" style="position: relative;">
                <input type="text" class="item-description autocomplete-input" value="${description}" placeholder="Escriba producto o seleccione" data-row-index="${rowIndex}">
                <div class="autocomplete-list" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; display: none; max-height: 150px; overflow-y: auto; z-index: 100;"></div>
            </div>
        </td>
        <td class="text-right"><input type="number" class="item-unit" value="${unit}" min="0" onchange="calculateRowTotal(${rowIndex})" placeholder="0" step="0.01"></td>
        <td class="text-right"><input type="number" class="item-discount" value="${discountUnit}" min="0" onchange="calculateRowTotal(${rowIndex})" placeholder="0" step="0.01"></td>
        <td class="text-right"><input type="text" class="item-total" value="${total}" readonly style="background-color: #efebe9;"></td>
        <td class="text-center"><button class="delete-row" onclick="deleteItemRow(${rowIndex})">Eliminar</button></td>
    `;
    tbody.appendChild(row);
    
    // Inicializar autocomplete para este item
    const descriptionInput = row.querySelector('.item-description');
    const autocompleteList = row.querySelector('.autocomplete-list');
    initProductAutocomplete(descriptionInput, autocompleteList, rowIndex);
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
    // Validar que los elementos existan antes de acceder
    const subtotalInput = document.getElementById('subtotal');
    const discountInput = document.getElementById('discount');
    const totalInput = document.getElementById('total');
    
    if (!subtotalInput || !discountInput || !totalInput) {
        return; // Salir si los elementos no existen
    }

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

    subtotalInput.value = '$ ' + subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    discountInput.value = '$ ' + discountTotal.toLocaleString('es-CO', { minimumFractionDigits: 0 });
    totalInput.value = '$ ' + total.toLocaleString('es-CO', { minimumFractionDigits: 0 });
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
        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'Agregue al menos un producto',
            confirmButtonColor: '#8D6E63'
        });
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
        window.location.href = 'index.html';
    }
}

// Inicializar cálculos cuando la página cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        calculateTotals();
    }, 100);
});

// Función para autocomplete de productos
function initProductAutocomplete(inputElement, listElement, rowIndex) {
    let debounceTimer;
    
    inputElement.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (query.length < 1) {
            listElement.style.display = 'none';
            return;
        }
        
        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/products/search/${encodeURIComponent(query)}`);
                const products = await response.json();
                
                if (products.length === 0) {
                    listElement.style.display = 'none';
                    return;
                }
                
                listElement.innerHTML = products.map(product => `
                    <div class="autocomplete-item" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;" data-product='${JSON.stringify(product)}'>
                        <strong>${product.name}</strong><br>
                        <small style="color: #666;">Precio: <span class="price" style="color: #4CAF50;">$ ${product.price.toLocaleString('es-CO', {minimumFractionDigits: 2})}</span></small>
                    </div>
                `).join('');
                
                listElement.style.display = 'block';
                
                // Agregar listeners a los items
                listElement.querySelectorAll('.autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const product = JSON.parse(item.getAttribute('data-product'));
                        selectProductForRow(rowIndex, product);
                    });
                });
            } catch (error) {
                console.error('Error al buscar productos:', error);
            }
        }, 300);
    });
    
    // Cerrar dropdown al perder foco
    inputElement.addEventListener('blur', () => {
        setTimeout(() => {
            listElement.style.display = 'none';
        }, 200);
    });
    
    // Abrir dropdown al hacer focus si hay texto
    inputElement.addEventListener('focus', () => {
        if (inputElement.value.trim().length > 0 && listElement.innerHTML) {
            listElement.style.display = 'block';
        }
    });
}

// Función para seleccionar un producto y rellenar el precio
function selectProductForRow(rowIndex, product) {
    const row = document.getElementById('row-' + rowIndex);
    const descriptionInput = row.querySelector('.item-description');
    const unitInput = row.querySelector('.item-unit');
    const autocompleteList = row.querySelector('.autocomplete-list');
    
    // Rellenar descripción y precio
    descriptionInput.value = product.name;
    unitInput.value = product.price;
    
    // Cerrar dropdown
    autocompleteList.style.display = 'none';
    
    // Recalcular el total de la fila
    calculateRowTotal(rowIndex);
}

