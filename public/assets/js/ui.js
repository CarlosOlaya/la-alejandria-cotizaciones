/**
 * UI.js - Interfaz de usuario
 * Maneja: hamburguesa, sidebar, alertas
 */

// ============================================================================
// HAMBURGUESA Y SIDEBAR
// ============================================================================

function initHamburger() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');
    
    if (!hamburgerBtn || !sidebar) return;
    
    // Abrir/cerrar sidebar
    hamburgerBtn.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('open');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
        hamburgerBtn.setAttribute('aria-expanded', !isOpen);
    });
    
    // Cerrar con botón X
    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        });
    }
    
    // Cerrar al clickear overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    });
    
    // Cerrar sidebar al clickear un link
    const sidebarLinks = sidebar.querySelectorAll('a, button');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        });
    });
}

// ============================================================================
// CARGAR COTIZACIONES EN SIDEBAR
// ============================================================================

async function loadQuotationsToSidebar() {
    const quotationsList = document.getElementById('quotations-list');
    if (!quotationsList) return;
    
    try {
        const response = await fetch('/api/quotations', {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (!data.success || !data.quotations.length) {
            quotationsList.innerHTML = '<p style="padding: 1rem; color: #999;">No hay cotizaciones</p>';
            return;
        }
        
        const sortedQuotations = data.quotations.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        ).slice(0, 20);
        
        quotationsList.innerHTML = sortedQuotations.map(q => `
            <div class="quotation-item" data-id="${q.id}">
                <div class="quotation-title">
                    <strong>#${q.quotation_number}</strong>
                    <span class="quotation-date">${formatDate(q.created_at)}</span>
                </div>
                <div class="quotation-client">${q.client_name || 'Cliente'}</div>
                <div class="quotation-amount">$ ${parseFloat(q.total_amount || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
                <div class="quotation-actions">
                    <button class="action-btn" onclick="viewQuotation(${q.id})" title="Ver">👁️</button>
                    <button class="action-btn" onclick="editQuotation(${q.id})" title="Editar">✏️</button>
                    <button class="action-btn delete" onclick="deleteQuotation(${q.id})" title="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando cotizaciones:', error);
        quotationsList.innerHTML = '<p style="padding: 1rem; color: #f56565;">Error al cargar cotizaciones</p>';
    }
}

// ============================================================================
// BÚSQUEDA EN SIDEBAR
// ============================================================================

function initSidebarSearch() {
    const searchInput = document.getElementById('search-quotations');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.quotation-item');
        
        items.forEach(item => {
            const title = item.querySelector('.quotation-title strong').textContent.toLowerCase();
            const client = item.querySelector('.quotation-client').textContent.toLowerCase();
            
            const matches = title.includes(searchTerm) || client.includes(searchTerm);
            item.style.display = matches ? 'block' : 'none';
        });
    });
}

// ============================================================================
// BOTONES DEL HEADER
// ============================================================================

function initHeaderButtons() {
    const newQuotationBtn = document.getElementById('new-quotation-btn');
    const productsBtn = document.getElementById('products-btn');
    
    if (newQuotationBtn) {
        newQuotationBtn.addEventListener('click', () => {
            window.location.href = 'cotizacion.html';
        });
    }
    
    if (productsBtn) {
        productsBtn.addEventListener('click', () => {
            window.location.href = 'productos.html';
        });
    }
}

// ============================================================================
// INFORMACIÓN DEL PROCESO (ESTADÍSTICAS)
// ============================================================================

async function updateProcessInfo() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/quotations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Error obteniendo datos');
            return;
        }
        
        const quotations = await response.json();
        
        if (!Array.isArray(quotations)) {
            console.error('Formato de datos incorrecto');
            return;
        }
        
        const totalQuotations = quotations.length;
        const totalAmount = quotations.reduce((sum, q) => sum + parseFloat(q.total_amount || 0), 0);
        const averageAmount = totalQuotations > 0 ? totalAmount / totalQuotations : 0;
        
        // Obtener mes actual
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentMonth = monthNames[new Date().getMonth()];
        
        // Actualizar DOM
        const totalQuotationsEl = document.getElementById('total-quotations');
        const currentMonthEl = document.getElementById('current-month');
        const totalAmountEl = document.getElementById('total-amount');
        const averageAmountEl = document.getElementById('average-amount');
        
        if (totalQuotationsEl) totalQuotationsEl.textContent = totalQuotations;
        if (currentMonthEl) currentMonthEl.textContent = currentMonth + ' 2026';
        if (totalAmountEl) totalAmountEl.textContent = `$ ${totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
        if (averageAmountEl) averageAmountEl.textContent = `$ ${averageAmount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
        
    } catch (error) {
        console.error('Error actualizando información:', error);
    }
}

// ============================================================================
// UTILIDADES
// ============================================================================

function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
    } else {
        return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    }
}

function viewQuotation(id) {
    window.location.href = `cotizacion.html?id=${id}`;
}

function editQuotation(id) {
    window.location.href = `cotizacion.html?edit=${id}`;
}

async function deleteQuotation(id) {
    const confirmed = await Swal.fire({
        title: '¿Eliminar cotización?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (!confirmed.isConfirmed) return;
    
    try {
        const response = await fetch(`/api/quotations/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            await Swal.fire('Eliminado', 'Cotización eliminada correctamente', 'success');
            loadQuotationsToSidebar();
            if (window.quotationSystem) {
                quotationSystem.refreshDashboard();
            }
        } else {
            await Swal.fire('Error', data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        await Swal.fire('Error', 'Error al eliminar cotización', 'error');
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

function initUI() {
    initHamburger();
    initHeaderButtons();
    loadQuotationsToSidebar();
    initSidebarSearch();
    
    // Recargar sidebar cada 30 segundos
    setInterval(loadQuotationsToSidebar, 30000);
}

// Auto-init si está disponible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}
