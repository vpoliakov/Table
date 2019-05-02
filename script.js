/*
 * I could have set up ag-grid to do everything, but I assumed you would be
 * more interested to see my implementation than my configuration of ag-grid.
 * In certain places, this code might seem a bit bulky, but this is mainly
 * due to all the specifications and features of the table.
 * Enjoy!
 * 
 * Features:
 * Adding a new row: 
 *  1) Click 'New row'
 *  2) Type in the values
 *  3) Click 'Add row' once all fields are set
 *  4) If the values are not valid, you'll see an alert. Adjust the values
 * 
 * Deleting a row:
 *  1) Click on the X of respective row
 * 
 * Sorting:
 *  1) Click on the header of the column you want to sort.
 *  2) By default, it's sorted in ascending order. Click again for descending order.
 * 
 * Filter:
 *  1) Click 'Filters'
 *  2) Type in the values
 *  3) Numeric fields support > and < filters (e.g. > 100)
 *  4) Alphanumeric fields are case insensitive
 */

"use strict";

// General-purpose table row class
class Row extends HTMLTableRowElement {
    constructor (parent, data) {
        super();
        this.data = data; // Object with relevant row data (id, product, etc.)
        this.parent = parent; // link to the parent table (instead of tbody)

        const deleteRowButton = document.createElement('td');
        deleteRowButton.textContent = '✖';
        deleteRowButton.addEventListener('click', () => { this.delete() });
        deleteRowButton.classList.add('deleteRowButton');
        this.appendChild(deleteRowButton);

        // create a cell for each data point
        for (const property in data) {
            const td = document.createElement('td');
            td.textContent = data[property];
            this.appendChild(td);
        }
    }

    filter(filters) {
        let matchesFilters = true;

        for (const property in filters) {
            let filterValue = filters[property];

            if (filterValue === '') continue;
            
            // numeric values filter
            if (property == 'id' || property == 'price' || property == 'rating') {
                let dataValue = this.data[property];
                if (property == 'price') dataValue = Number(dataValue.substring(1));
                if (property == 'rating') dataValue = Number(dataValue);

                // support for > value and < value filters
                if (filterValue[0] == '>') {
                    filterValue = filterValue.substring(1).trim();
                    matchesFilters = dataValue > filterValue;
                } else if (filterValue[0] == '<') {
                    filterValue = filterValue.substring(1).trim();
                    matchesFilters = dataValue < filterValue;
                } else {
                    matchesFilters = dataValue == filterValue;
                }
            } else {
                if (!this.data[property].toLowerCase().includes(filterValue.toLowerCase())) matchesFilters = false;
            }

            if (!matchesFilters) break; // one failed filter is enough to filter out
        }

        this.style.display = matchesFilters ? 'table-row' : 'none';
    }

    delete() {
        this.parent.ids.delete(this.data.id);
        this.remove();
    }
}

// Implementation of the table described in the specs
class ProductTable extends HTMLTableElement {
    constructor() {
        super();
        this.ids = new Set(); // keeps track of products' IDs

        // table header
        const header = document.createElement('thead');
        const headerRow = document.createElement('tr');

        for (const title of ['', 'ID', 'Product', 'Brand', 'Category', 'Price', 'In Stock', 'Rating']) {
            const th = document.createElement('th');
            th.textContent = title;

            // add a listener for sorting on the column
            if (title != '') {
                th.addEventListener('click', () => {
                    const property = title == 'In Stock' ? 'inStock' : title.toLowerCase();
                    const sortingDirection = th.sorted == 'descending' ? 'ascending' : 'descending';
                    this.sort(property, sortingDirection == 'descending');
                    th.sorted = sortingDirection;
                });
            }

            headerRow.appendChild(th);
        }

        header.appendChild(headerRow);
        this.appendChild(header);

        // table body
        this.body = document.createElement('tbody');
        this.appendChild(this.body);

        // table footer, responsible for add-row functionality and filtering
        const footer = document.createElement('tfoot');
        const buttonsRow = document.createElement('tr'); // row with a button to add a new row
        const newRowButton = document.createElement('td');
        const filtersButton = document.createElement('td');
        newRowButton.id = 'newRowButton';
        filtersButton.id = 'filtersButton';
        newRowButton.textContent = 'New row';
        filtersButton.textContent = 'Filters';
        buttonsRow.appendChild(newRowButton);
        buttonsRow.appendChild(filtersButton);

        // Renders a form for adding a new row
        newRowButton.addEventListener('click', () => {
            // do not create a new addRow if there is one already
            if (document.getElementById('addRowButton')) {
                document.getElementById('addRowButton').parentNode.remove();
                return;
            };

            const addRowButtonRow = document.createElement('tr');
            const addRowButton = document.createElement('td');
            addRowButton.id = 'addRowButton';
            addRowButton.textContent = 'Add row';
            addRowButtonRow.appendChild(addRowButton);
            addRowButtonRow.inputs = {};

            // add input cells for each property
            for (const property of ['id', 'product', 'brand', 'category', 'price', 'inStock', 'rating']) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                td.appendChild(input);
                addRowButtonRow.appendChild(td);
                addRowButtonRow.inputs[property] = input;
            }

            // submit the input data to create a new row
            addRowButton.addEventListener('click', () => {
                const data = [];

                for (const property of ['id', 'product', 'brand', 'category', 'price', 'inStock', 'rating']) {
                    data.push(addRowButtonRow.inputs[property].value);
                }

                this.addRow.apply(this, data);
            });

            footer.insertBefore(addRowButtonRow, buttonsRow);
        });

        // Renders a form for adding filters
        filtersButton.addEventListener('click', () => {
            // do not create a new filtersRow if there is one already
            if (document.getElementById('filtersRow')) {
                document.getElementById('filtersRow').remove();
                return;
            };

            const filtersRow = document.createElement('tr');
            filtersRow.id = 'filtersRow';
            filtersRow.appendChild(document.createElement('td'));
            filtersRow.filters = {};

            // add filter input cells for each property
            for (const property of ['id', 'product', 'brand', 'category', 'price', 'inStock', 'rating']) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                td.appendChild(input);
                filtersRow.appendChild(td);

                input.addEventListener('keyup', () => {
                    filtersRow.filters[property] = input.value;
                    this.filter(filtersRow.filters);
                });
            }

            footer.insertBefore(filtersRow, buttonsRow);
        });

        footer.appendChild(buttonsRow);
        this.appendChild(footer);
    }

    addRow(id, product, brand, category, price, inStock, rating) {
        try { // input validation according to the reqs
            if (isNaN(id)) {
                throw `ID must be a number. ${id} is not.`;
            } if (this.ids.has(Number(id))) {
                throw `This ID (${id}) already exists in the table`;
            }
            id = Number(id);

            if (product.length > 50) product = product.substring(0, 50);

            if (brand.length > 50) brand = brand.substring(0, 50);

            if (!['Computers', 'TVs', 'Phones', 'Cameras', 'Smart Home Devices', 'Video Games'].includes(category)) {
                throw `${category} is not a supported category`;
            }

            if (isNaN(price)) {
                throw `Price must be a number. ${price} is not.`;
            } else {
                price = `$${Number(price).toFixed(2)}`;
            }

            inStock = inStock.toString();
            if (inStock.toLowerCase() === 'yes' || inStock.toLowerCase() === 'true') {
                inStock = 'Yes';
            } else if (inStock.toLowerCase() === 'no' || inStock.toLowerCase() === 'false') {
                inStock = 'No';
            } else {
                throw `inStock must be a boolean. ${inStock} is not.`;
            }

            if (isNaN(rating)) {
                throw `Rating must be a number. ${rating} is not`;
            } else if (Number(rating) < 1 || Number(rating) > 5) {
                throw `Rating must be between 1 and 5. ${rating} is not`;
            } else {
                rating = Number(rating).toFixed(1);
            }
        } catch (error) {
            alert(error);
            return;
        }

        const row = new Row(this, {
            id,
            product,
            brand,
            category,
            price,
            inStock,
            rating
        });

        this.ids.add(id); // add the ID to the IDs holder
        this.body.appendChild(row);
    }

    filter(filters) {
        for (const row of this.body.children) {
            row.filter(filters);
        }
    }

    sort(property, descending = false) {
        const rows = Array.from(this.body.children);

        rows.sort((a, b) => {
            if (property == 'id' || property == 'price' || property == 'rating') {
                let aPrice = a.data[property];
                let bPrice = b.data[property];

                if (property == 'price') {
                    aPrice = aPrice.substring(1); // to sort prices as numbers (not strings)
                    bPrice = bPrice.substring(1);
                }

                aPrice = Number(aPrice);
                bPrice = Number(bPrice);

                return descending ? aPrice - bPrice : bPrice - aPrice;
            }

            return descending ? a.data[property].localeCompare(b.data[property]) : b.data[property].localeCompare(a.data[property]);
        });

        for (const [i, row] of rows.entries()) {
            this.body.insertBefore(row, this.body.children[i]);
        }
    }
}

customElements.define('product-table', ProductTable, { extends: 'table' });
customElements.define('table-row', Row, { extends: 'tr' });

const table = new ProductTable();
const devices = [ // example values
    [1, 'iPhone X', 'Apple', 'Phones', 749.99, true, 4],
    [2, 'Inspiron 15', 'Dell', 'Computers', 1400, false, 3],
    [3, 'Pixel 2 XL', 'Google', 'Phones', 600, false, 4],
    [4, 'EOS Rebel', 'Canon', 'Cameras', 345.49, true, 5]
]

for (const device of devices) {
    table.addRow.apply(table, device);
}

document.body.insertBefore(table, document.body.firstChild);