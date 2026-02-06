// ==================== GESTIÓN DE PRODUCTOS ====================

class ProductManager {
    async getAllProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            return await response.json();
        } catch (err) {
            console.error('Error fetching products:', err);
            return [];
        }
    }

    async saveProduct(data) {
        try {
            const method = data.id ? 'PUT' : 'POST';
            const url = data.id ? `${API_URL}/products/${data.id}` : `${API_URL}/products`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: data.name,
                    price: parseFloat(data.price),
                    description: data.description || ''
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar producto');
            }

            return await response.json();
        } catch (err) {
            console.error('Error saving product:', err);
            throw err;
        }
    }

    async deleteProduct(id) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar producto');
            }

            return true;
        } catch (err) {
            console.error('Error deleting product:', err);
            throw err;
        }
    }

    async refreshProducts() {
        const products = await this.getAllProducts();
        const container = document.getElementById('productsContainer');
        
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<p style="color: #ccc; text-align: center; padding: 20px;">No hay productos registrados</p>';
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="product-card">
                <h4>${p.name}</h4>
                <p>${p.description || 'Sin descripción'}</p>
                <div class="product-price">$ ${p.price.toLocaleString('es-CO', {minimumFractionDigits: 2})}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" style="flex: 1;" onclick="editProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${(p.description || '').replace(/'/g, "\\'")}')" title="Editar">✏️ Editar</button>
                    <button class="btn btn-danger" style="flex: 1;" onclick="deleteProductItem(${p.id})" title="Eliminar">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
    }
}

const productManager = new ProductManager();

function startNewProduct() {
    resetProductForm();
    const formTitle = document.querySelector('.dashboard-section h3');
    if (formTitle) formTitle.textContent = 'Crear / Editar Producto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetProductForm() {
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
}

function editProduct(id, name, price, description) {
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = name;
    document.getElementById('productPrice').value = price;
    document.getElementById('productDescription').value = description;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveProduct(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value.trim();
    const productPrice = document.getElementById('productPrice').value;
    const productDescription = document.getElementById('productDescription').value.trim();

    if (!productName || !productPrice) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Nombre y precio son obligatorios',
            confirmButtonColor: '#8D6E63'
        });
        return;
    }

    Swal.fire({
        title: 'Guardando...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        await productManager.saveProduct({
            id: productId ? parseInt(productId) : null,
            name: productName,
            price: productPrice,
            description: productDescription
        });

        await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Producto guardado correctamente',
            confirmButtonColor: '#8D6E63',
            timer: 2000
        });

        resetProductForm();
        productManager.refreshProducts();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#8D6E63'
        });
    }
}

async function deleteProductItem(id) {
    const confirm = await Swal.fire({
        icon: 'warning',
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        cancelButtonColor: '#8D6E63',
        confirmButtonText: 'Sí, eliminar'
    });

    if (!confirm.isConfirmed) return;

    try {
        await productManager.deleteProduct(id);
        Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'Producto eliminado correctamente',
            confirmButtonColor: '#8D6E63',
            timer: 2000
        });
        productManager.refreshProducts();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#8D6E63'
        });
    }
}
