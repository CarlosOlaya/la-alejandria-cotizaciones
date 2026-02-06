/**
 * Autocomplete utilities para clientes y productos
 */

class AutocompleteManager {
    constructor(inputSelector, listSelector, apiEndpoint, onSelect) {
        this.input = document.querySelector(inputSelector);
        this.list = document.querySelector(listSelector);
        this.apiEndpoint = apiEndpoint;
        this.onSelect = onSelect;
        this.debounceTimer = null;

        if (this.input) {
            this.input.addEventListener('input', (e) => this.handleInput(e));
            this.input.addEventListener('blur', () => this.hideList());
        }
    }

    async handleInput(event) {
        const query = event.target.value.trim();

        clearTimeout(this.debounceTimer);

        if (query.length < 2) {
            this.hideList();
            return;
        }

        this.debounceTimer = setTimeout(async () => {
            await this.search(query);
        }, 300);
    }

    async search(query) {
        try {
            const response = await fetch(`${this.apiEndpoint}/search/${encodeURIComponent(query)}`);
            const results = await response.json();

            if (results.length > 0) {
                this.showList(results);
            } else {
                this.hideList();
            }
        } catch (err) {
            console.error('Error searching:', err);
        }
    }

    showList(results) {
        if (!this.list) return;

        this.list.innerHTML = results
            .map(
                (item) => `
            <div class="autocomplete-item" data-id="${item.id}" data-json='${JSON.stringify(item)}'>
                <strong>${item.name}</strong>
                ${item.price ? `<span class="price">$ ${item.price.toLocaleString('es-CO')}</span>` : ''}
            </div>
        `
            )
            .join('');

        this.list.style.display = 'block';

        document.querySelectorAll('.autocomplete-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                const data = JSON.parse(e.currentTarget.dataset.json);
                this.selectItem(data);
            });
        });
    }

    selectItem(data) {
        this.input.value = data.name;
        this.hideList();

        if (this.onSelect) {
            this.onSelect(data);
        }
    }

    hideList() {
        if (this.list) {
            this.list.style.display = 'none';
        }
    }
}
