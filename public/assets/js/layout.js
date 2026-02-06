// Navbar reutilizable
document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('appNavbar');
    if (!mount) return;

    const path = window.location.pathname.split('/').pop();

    mount.innerHTML = `
        <nav class="app-navbar">
            <div class="nav-left">
                <button class="nav-icon" aria-label="Menú">☰</button>
                <div class="nav-brand">
                    <img src="icon.png" alt="Logo La Alejandría">
                    <span>La Alejandría</span>
                </div>
            </div>
            <div class="nav-right">
                <a href="index.html" class="nav-pill ${path === 'index.html' || path === '' ? 'nav-pill-active' : ''}">Dashboard</a>
                <a href="productos.html" class="nav-pill ${path === 'productos.html' ? 'nav-pill-active' : ''}">Productos</a>
                <a href="cotizacion.html" class="nav-pill nav-pill-primary ${path === 'cotizacion.html' ? 'nav-pill-active' : ''}">+ Nueva Cotización</a>
            </div>
        </nav>
    `;
});