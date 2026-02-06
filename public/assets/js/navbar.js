// Componente de Navbar reutilizable
function renderNavbar() {
    const currentPath = window.location.pathname;
    
    // Configuración del sidebar según la página
    const sidebarConfig = getSidebarConfig(currentPath);
    
    const navbarHTML = `
    <header>
        <div class="header-content">
            <button class="hamburger" id="hamburger-btn" aria-label="Menú" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
            
            <div class="logo">
                <div class="logo-icon"><img src="icon.png" alt="Logo La Alejandría"></div>
                <div class="logo-text">
                    <h1>La Alejandría</h1>
                    <p>Café Especial</p>
                </div>
            </div>
            
            <div class="header-spacer"></div>
            
            <div class="header-actions">
                <button class="btn" id="dashboard-btn" title="Dashboard">
                    <span class="btn-icon">📊</span><span class="btn-text">Dashboard</span>
                </button>
                <button class="btn" id="new-quotation-btn" title="Nueva cotización">
                    <span class="btn-icon">📝</span><span class="btn-text">Nueva Cotización</span>
                </button>
                <button class="btn" id="products-btn" title="Gestionar productos">
                    <span class="btn-icon">📦</span><span class="btn-text">Gestionar Productos</span>
                </button>
            </div>
        </div>
    </header>

    <nav class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <h2>${sidebarConfig.title}</h2>
            <button class="btn-close" id="sidebar-close" aria-label="Cerrar menú">&times;</button>
        </div>
        <div class="sidebar-search">
            <input type="text" id="${sidebarConfig.searchId}" placeholder="${sidebarConfig.searchPlaceholder}" aria-label="Buscar">
        </div>
        <div class="fermentations-list" id="${sidebarConfig.listId}">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Cargando...</p>
            </div>
        </div>
    </nav>

    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    initNavbarEvents();
}

function getSidebarConfig(currentPath) {
    const configs = {
        '/': {
            title: '📋 Cotizaciones',
            searchPlaceholder: '🔍 Buscar cotización...',
            searchId: 'search-quotations',
            listId: 'quotations-list'
        },
        '/dashboard': {
            title: '📋 Cotizaciones',
            searchPlaceholder: '🔍 Buscar cotización...',
            searchId: 'search-quotations',
            listId: 'quotations-list'
        }
    };
    
    return configs[currentPath] || configs['/'];
}

function initNavbarEvents() {
    const dashboardBtn = document.getElementById('dashboard-btn');
    const newQuotationBtn = document.getElementById('new-quotation-btn');
    const productsBtn = document.getElementById('products-btn');

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => navigateWithTransition('/dashboard'));
    }

    if (newQuotationBtn) {
        newQuotationBtn.addEventListener('click', () => navigateWithTransition('/cotizacion'));
    }

    if (productsBtn) {
        productsBtn.addEventListener('click', () => navigateWithTransition('/productos'));
    }

    highlightActiveButton();
}

function navigateWithTransition(url) {
    document.body.classList.add('page-transition');
    setTimeout(() => window.location.href = url, 200);
}

function highlightActiveButton() {
    const currentPath = window.location.pathname;
    const buttons = {
        '/': document.getElementById('dashboard-btn'),
        '/dashboard': document.getElementById('dashboard-btn'),
        '/cotizacion': document.getElementById('new-quotation-btn'),
        '/productos': document.getElementById('products-btn')
    };

    Object.values(buttons).forEach(btn => btn?.classList.remove('btn-active'));
    buttons[currentPath]?.classList.add('btn-active');
}

// Inicialización
(function() {
    if (document.body) {
        renderNavbar();
    } else {
        document.addEventListener('DOMContentLoaded', renderNavbar);
    }
})();
