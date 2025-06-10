(function () {
  // --- DATA STORAGE KEYS ---
  const PRODUCTS_KEY = "gsms_products";
  const STOCK_KEY = "gsms_stock";
  const CUSTOMERS_KEY = "gsms_customers";
  const SALES_LEDGER_KEY = "gsms_sales_ledger";
  const CASH_LEDGER_KEY = "gsms_cash_ledger";
  const MOMO_LEDGER_KEY = "gsms_momo_ledger";
  const WITHDRAW_LEDGER_KEY = "gsms_withdraw_ledger";

  // --- INITIAL SETUP ---

  // Sample starting products with starting inventory count
  let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [
    { id: "cylinder-standard", name: "Standard Cylinder", startingStock: 200 },
    { id: "cylinder-heavy", name: "Heavy Cylinder", startingStock: 100 },
  ];

  // Stock currently available, keyed by product id with quantity
  let stock = JSON.parse(localStorage.getItem(STOCK_KEY)) || {};

  // Customers list
  let customers = JSON.parse(localStorage.getItem(CUSTOMERS_KEY)) || [];

  // Ledgers
  let salesLedger = JSON.parse(localStorage.getItem(SALES_LEDGER_KEY)) || [];
  let cashLedger = JSON.parse(localStorage.getItem(CASH_LEDGER_KEY)) || [];
  let momoLedger = JSON.parse(localStorage.getItem(MOMO_LEDGER_KEY)) || [];
  let withdrawLedger =
    JSON.parse(localStorage.getItem(WITHDRAW_LEDGER_KEY)) || [];

  // --- UTILS ---
  function saveData() {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    localStorage.setItem(SALES_LEDGER_KEY, JSON.stringify(salesLedger));
    localStorage.setItem(CASH_LEDGER_KEY, JSON.stringify(cashLedger));
    localStorage.setItem(MOMO_LEDGER_KEY, JSON.stringify(momoLedger));
    localStorage.setItem(WITHDRAW_LEDGER_KEY, JSON.stringify(withdrawLedger));
  }

  function formatCurrency(value) {
    return `$${value.toFixed(2)}`;
  }

  function getNowDateTime() {
    return new Date().toLocaleString();
  }

  // Generate unique ID for transactions
  function generateId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  // --- NAVIGATION ---
  const pages = document.querySelectorAll(".section-content");
  const navButtons = document.querySelectorAll("nav button");
  function showPage(pageId) {
    pages.forEach((p) => p.classList.remove("active"));
    navButtons.forEach((btn) => btn.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
    // Activate corresponding button
    navButtons.forEach((btn) => {
      if (
        btn.textContent
          .replace(/\s/g, "")
          .toLowerCase()
          .includes(pageId.replace("-", ""))
      ) {
        btn.classList.add("active");
      }
    });
    // Special cases for tab-summary button and others:
    if (pageId === "summary") {
      document.getElementById("tab-summary").classList.add("active");
    }
  }

  // --- PRODUCT SELECTS POPULATION ---
  function populateProductSelects() {
    const selects = ["product", "stock-product", "edit-product"];
    selects.forEach((id) => {
      const selectEl = document.getElementById(id);
      selectEl.innerHTML = "";
      products.forEach((prod) => {
        const option = document.createElement("option");
        option.value = prod.id;
        option.textContent = prod.name;
        selectEl.appendChild(option);
      });
    });
  }

  // --- CUSTOMER MANAGEMENT ---
  function loadCustomers() {
    const custSelects = ["customer", "edit-customer"];
    custSelects.forEach((id) => {
      const selectEl = document.getElementById(id);
      selectEl.innerHTML = "";
      // Add empty option
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "Select Customer (optional)";
      selectEl.appendChild(emptyOption);
      customers.forEach((cust) => {
        const option = document.createElement("option");
        option.value = cust;
        option.textContent = cust;
        selectEl.appendChild(option);
      });
    });

    const custList = document.getElementById("customer-list");
    custList.innerHTML = "";
    customers.forEach((cust, idx) => {
      const li = document.createElement("li");
      li.textContent = cust + " ";
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.classList.add("btn-small", "btn-delete");
      delBtn.onclick = () => {
        if (
          confirm(
            `Delete customer "${cust}"? This will NOT remove their past sales.`
          )
        ) {
          customers.splice(idx, 1);
          saveData();
          loadCustomers();
        }
      };
      li.appendChild(delBtn);
      custList.appendChild(li);
    });
  }

  document.getElementById("customer-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("customer-name");
    const name = nameInput.value.trim();
    if (name && !customers.includes(name)) {
      customers.push(name);
      saveData();
      loadCustomers();
      nameInput.value = "";
      alert("Customer added successfully.");
    } else {
      alert("Please enter a valid and unique customer name.");
    }
  });

  // --- STOCK MANAGEMENT ---
  function loadStockList() {
    const stockListDiv = document.getElementById("stock-list");
    stockListDiv.innerHTML = "";
    products.forEach((prod) => {
      const currentStock = stock[prod.id] ?? 0;
      const div = document.createElement("div");
      div.textContent = `${prod.name}: ${currentStock} units`;
      stockListDiv.appendChild(div);
    });
  }

  document.getElementById("stock-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const productId = document.getElementById("stock-product").value;
    const qty = Number(document.getElementById("stock-quantity").value);
    if (qty > 0) {
      stock[productId] = (stock[productId] || 0) + qty;
      saveData();
      loadStockList();
      alert("Stock updated successfully.");
      e.target.reset();
      updateSummary();
    } else {
      alert("Quantity must be greater than zero.");
    }
  });

  // --- SALES FORM ---
  document.getElementById("sales-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const productId = document.getElementById("product").value;
    const quantity = Number(document.getElementById("quantity").value);
    const price = Number(document.getElementById("price").value);
    const paymentMethod = document.getElementById("payment-method").value;
    const momoId = document.getElementById("momo-id").value.trim();
    const customer = document.getElementById("customer").value;

    if (quantity <= 0 || price <= 0) {
      alert("Quantity and Price must be greater than zero.");
      return;
    }
    if (paymentMethod === "momo" && !momoId) {
      alert("Please enter the Momo Pay ID for Mobile Money payments.");
      return;
    }
    if ((stock[productId] || 0) < quantity) {
      alert("Insufficient stock to complete this sale.");
      return;
    }

    const now = getNowDateTime();
    const saleId = generateId();
    const totalAmount = price * quantity;

    // Deduct stock
    stock[productId] -= quantity;

    // Save sale ledger
    const saleEntry = {
      id: saleId,
      dateTime: now,
      productId,
      quantity,
      price,
      totalAmount,
      paymentMethod,
      momoId: paymentMethod === "momo" ? momoId : "",
      customer,
    };
    salesLedger.push(saleEntry);

    // Update payment ledger
    if (paymentMethod === "cash") {
      cashLedger.push({
        id: saleId,
        dateTime: now,
        amount: totalAmount,
        customer,
        note: `Sale of ${products.find((p) => p.id === productId).name}`,
      });
    } else if (paymentMethod === "momo") {
      momoLedger.push({
        id: saleId,
        dateTime: now,
        amount: totalAmount,
        momoId,
        customer,
        note: `Sale of ${products.find((p) => p.id === productId).name}`,
      });
    }

    saveData();
    alert("Sale recorded successfully!");
    e.target.reset();
    loadStockList();
    renderSalesLedger();
    renderCashLedger();
    renderMomoLedger();
    updateSummary();
  });

  // --- LEDGER RENDERING ---
  function renderSalesLedger() {
    const tbody = document.getElementById("sales-ledger-body");
    tbody.innerHTML = "";
    salesLedger.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.dateTime}</td>
        <td>${
          products.find((p) => p.id === entry.productId)?.name || "Unknown"
        }</td>
        <td>${entry.quantity}</td>
        <td>${formatCurrency(entry.totalAmount)}</td>
        <td>${entry.paymentMethod}</td>
        <td>${entry.customer || ""}</td>
        <td>
          <button class="btn-small btn-edit" onclick="openEditModal('sales', '${
            entry.id
          }')">Edit</button>
          <button class="btn-small btn-delete" onclick="deleteTransaction('sales', '${
            entry.id
          }')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderCashLedger() {
    const tbody = document.getElementById("cash-ledger-body");
    tbody.innerHTML = "";
    cashLedger.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.dateTime}</td>
        <td>${formatCurrency(entry.amount)}</td>
        <td>${entry.customer || ""}</td>
        <td>${entry.note || ""}</td>
        <td>
          <button class="btn-small btn-edit" onclick="openEditModal('cash', '${
            entry.id
          }')">Edit</button>
          <button class="btn-small btn-delete" onclick="deleteTransaction('cash', '${
            entry.id
          }')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderMomoLedger() {
    const tbody = document.getElementById("momo-ledger-body");
    tbody.innerHTML = "";
    momoLedger.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.dateTime}</td>
        <td>${formatCurrency(entry.amount)}</td>
        <td>${entry.momoId}</td>
        <td>${entry.customer || ""}</td>
        <td>${entry.note || ""}</td>
        <td>
          <button class="btn-small btn-edit" onclick="openEditModal('momo', '${
            entry.id
          }')">Edit</button>
          <button class="btn-small btn-delete" onclick="deleteTransaction('momo', '${
            entry.id
          }')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderWithdrawLedger() {
    const tbody = document.getElementById("withdraw-ledger-body");
    tbody.innerHTML = "";
    withdrawLedger.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.dateTime}</td>
        <td>${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</td>
        <td>${formatCurrency(entry.amount)}</td>
        <td>${entry.note || ""}</td>
        <td>
          <button class="btn-small btn-edit" onclick="openEditModal('withdraw', '${
            entry.id
          }')">Edit</button>
          <button class="btn-small btn-delete" onclick="deleteTransaction('withdraw', '${
            entry.id
          }')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- DELETE TRANSACTIONS ---
  function deleteTransaction(type, id) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    if (type === "sales") {
      // Find sale
      const saleIndex = salesLedger.findIndex((e) => e.id === id);
      if (saleIndex === -1) return;

      // Restore stock
      const sale = salesLedger[saleIndex];
      stock[sale.productId] = (stock[sale.productId] || 0) + sale.quantity;

      // Remove from sales ledger
      salesLedger.splice(saleIndex, 1);

      // Remove from cash or momo ledger
      if (sale.paymentMethod === "cash") {
        const idx = cashLedger.findIndex((e) => e.id === id);
        if (idx !== -1) cashLedger.splice(idx, 1);
      } else if (sale.paymentMethod === "momo") {
        const idx = momoLedger.findIndex((e) => e.id === id);
        if (idx !== -1) momoLedger.splice(idx, 1);
      }
    } else if (type === "cash") {
      const idx = cashLedger.findIndex((e) => e.id === id);
      if (idx !== -1) cashLedger.splice(idx, 1);
    } else if (type === "momo") {
      const idx = momoLedger.findIndex((e) => e.id === id);
      if (idx !== -1) momoLedger.splice(idx, 1);
    } else if (type === "withdraw") {
      const idx = withdrawLedger.findIndex((e) => e.id === id);
      if (idx !== -1) withdrawLedger.splice(idx, 1);
    }
    saveData();
    loadStockList();
    renderSalesLedger();
    renderCashLedger();
    renderMomoLedger();
    renderWithdrawLedger();
    updateSummary();
  }

  // --- EDIT TRANSACTIONS ---

  // Modal elements
  const editModal = document.getElementById("edit-modal");
  const editTransactionForm = document.getElementById("edit-transaction-form");

  // Open edit modal with data loaded
  function openEditModal(type, id) {
    editModal.classList.remove("hidden");
    document.getElementById("edit-ledger-type").value = type;
    document.getElementById("edit-transaction-id").value = id;

    // Populate selects for products and customers first
    populateProductSelects();
    loadCustomers();

    if (type === "sales") {
      const sale = salesLedger.find((e) => e.id === id);
      if (!sale) return alert("Sale transaction not found.");

      document.getElementById("edit-product").value = sale.productId;
      document.getElementById("edit-quantity").value = sale.quantity;
      document.getElementById("edit-price").value = sale.price;
      document.getElementById("edit-payment-method").value = sale.paymentMethod;
      document.getElementById("edit-momo-id").value = sale.momoId || "";
      document.getElementById("edit-customer").value = sale.customer || "";
    } else if (type === "cash") {
      const entry = cashLedger.find((e) => e.id === id);
      if (!entry) return alert("Cash ledger entry not found.");

      // We only allow editing amount and note
      document.getElementById("edit-product").innerHTML = "";
      document
        .getElementById("edit-product")
        .appendChild(new Option("N/A", ""));
      document.getElementById("edit-product").value = "";

      document.getElementById("edit-quantity").value = 1;
      document.getElementById("edit-price").value = entry.amount;
      document.getElementById("edit-payment-method").value = "cash";
      document.getElementById("edit-momo-id").value = "";
      document.getElementById("edit-customer").value = entry.customer || "";
    } else if (type === "momo") {
      const entry = momoLedger.find((e) => e.id === id);
      if (!entry) return alert("Momo ledger entry not found.");

      document.getElementById("edit-product").innerHTML = "";
      document
        .getElementById("edit-product")
        .appendChild(new Option("N/A", ""));
      document.getElementById("edit-product").value = "";

      document.getElementById("edit-quantity").value = 1;
      document.getElementById("edit-price").value = entry.amount;
      document.getElementById("edit-payment-method").value = "momo";
      document.getElementById("edit-momo-id").value = entry.momoId || "";
      document.getElementById("edit-customer").value = entry.customer || "";
    } else if (type === "withdraw") {
      const entry = withdrawLedger.find((e) => e.id === id);
      if (!entry) return alert("Withdraw ledger entry not found.");

      document.getElementById("edit-product").innerHTML = "";
      document
        .getElementById("edit-product")
        .appendChild(new Option("N/A", ""));
      document.getElementById("edit-product").value = "";

      document.getElementById("edit-quantity").value = 1;
      document.getElementById("edit-price").value = entry.amount;
      document.getElementById("edit-payment-method").value = "";
      document.getElementById("edit-momo-id").value = "";
      document.getElementById("edit-customer").value = "";
      document.getElementById("edit-withdraw-type").value = entry.type;
      document.getElementById("edit-note").value = entry.note || "";
    }
  }

  editTransactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = document.getElementById("edit-ledger-type").value;
    const id = document.getElementById("edit-transaction-id").value;

    if (type === "sales") {
      const sale = salesLedger.find((e) => e.id === id);
      if (!sale) return alert("Sale transaction not found.");

      const newProductId = document.getElementById("edit-product").value;
      const newQuantity = Number(
        document.getElementById("edit-quantity").value
      );
      const newPrice = Number(document.getElementById("edit-price").value);
      const newPaymentMethod = document.getElementById(
        "edit-payment-method"
      ).value;
      const newMomoId = document.getElementById("edit-momo-id").value.trim();
      const newCustomer = document.getElementById("edit-customer").value;

      if (newQuantity <= 0 || newPrice <= 0) {
        return alert("Quantity and Price must be greater than zero.");
      }
      if (newPaymentMethod === "momo" && !newMomoId) {
        return alert("Please enter the Momo Pay ID for Mobile Money payments.");
      }

      // Adjust stock based on change
      if (sale.productId !== newProductId) {
        // Return old stock
        stock[sale.productId] = (stock[sale.productId] || 0) + sale.quantity;
        // Deduct new stock
        if ((stock[newProductId] || 0) < newQuantity) {
          return alert("Insufficient stock for the new product and quantity.");
        }
        stock[newProductId] -= newQuantity;
      } else {
        // Same product: adjust stock difference
        const diff = newQuantity - sale.quantity;
        if (diff > 0 && (stock[newProductId] || 0) < diff) {
          return alert("Insufficient stock for the increased quantity.");
        }
        stock[newProductId] -= diff;
      }

      sale.productId = newProductId;
      sale.quantity = newQuantity;
      sale.price = newPrice;
      sale.totalAmount = newPrice * newQuantity;
      sale.paymentMethod = newPaymentMethod;
      sale.momoId = newPaymentMethod === "momo" ? newMomoId : "";
      sale.customer = newCustomer;

      // Update payment ledgers
      // Remove old payment entry
      if (sale.paymentMethod === "cash") {
        const idx = cashLedger.findIndex((e) => e.id === id);
        if (idx !== -1) cashLedger.splice(idx, 1);
      } else if (sale.paymentMethod === "momo") {
        const idx = momoLedger.findIndex((e) => e.id === id);
        if (idx !== -1) momoLedger.splice(idx, 1);
      }
      // Add updated payment entry
      if (newPaymentMethod === "cash") {
        cashLedger.push({
          id,
          dateTime: sale.dateTime,
          amount: sale.totalAmount,
          customer: newCustomer,
          note: `Sale of ${products.find((p) => p.id === newProductId).name}`,
        });
      } else if (newPaymentMethod === "momo") {
        momoLedger.push({
          id,
          dateTime: sale.dateTime,
          amount: sale.totalAmount,
          momoId: newMomoId,
          customer: newCustomer,
          note: `Sale of ${products.find((p) => p.id === newProductId).name}`,
        });
      }
    } else if (type === "cash") {
      const entry = cashLedger.find((e) => e.id === id);
      if (!entry) return alert("Cash ledger entry not found.");
      const newAmount = Number(document.getElementById("edit-price").value);
      const newCustomer = document.getElementById("edit-customer").value;
      const newNote = document.getElementById("edit-note").value;

      if (newAmount <= 0) return alert("Amount must be greater than zero.");

      entry.amount = newAmount;
      entry.customer = newCustomer;
      entry.note = newNote;
    } else if (type === "momo") {
      const entry = momoLedger.find((e) => e.id === id);
      if (!entry) return alert("Momo ledger entry not found.");
      const newAmount = Number(document.getElementById("edit-price").value);
      const newMomoId = document.getElementById("edit-momo-id").value.trim();
      const newCustomer = document.getElementById("edit-customer").value;
      const newNote = document.getElementById("edit-note").value;

      if (newAmount <= 0) return alert("Amount must be greater than zero.");
      if (!newMomoId) return alert("Momo Pay ID cannot be empty.");

      entry.amount = newAmount;
      entry.momoId = newMomoId;
      entry.customer = newCustomer;
      entry.note = newNote;
    } else if (type === "withdraw") {
      const entry = withdrawLedger.find((e) => e.id === id);
      if (!entry) return alert("Withdraw ledger entry not found.");
      const newType = document.getElementById("edit-withdraw-type").value;
      const newAmount = Number(document.getElementById("edit-price").value);
      const newNote = document.getElementById("edit-note").value;

      if (newAmount <= 0) return alert("Amount must be greater than zero.");

      entry.type = newType;
      entry.amount = newAmount;
      entry.note = newNote;
    }

    saveData();
    loadStockList();
    renderSalesLedger();
    renderCashLedger();
    renderMomoLedger();
    renderWithdrawLedger();
    updateSummary();
    closeEditModal();
  });

  function closeEditModal() {
    editModal.classList.add("hidden");
  }

  document
    .getElementById("edit-close-btn")
    .addEventListener("click", closeEditModal);

  // --- SUMMARY UPDATE ---
  function updateSummary() {
    const totalSales = salesLedger.reduce((sum, e) => sum + e.totalAmount, 0);
    const totalCash = cashLedger.reduce((sum, e) => sum + e.amount, 0);
    const totalMomo = momoLedger.reduce((sum, e) => sum + e.amount, 0);
    const totalWithdraw = withdrawLedger.reduce((sum, e) => sum + e.amount, 0);
    const totalStockValue = products.reduce(
      (sum, p) => sum + (stock[p.id] || 0) * p.price,
      0
    );

    document.getElementById("summary-total-sales").textContent =
      formatCurrency(totalSales);
    document.getElementById("summary-total-cash").textContent =
      formatCurrency(totalCash);
    document.getElementById("summary-total-momo").textContent =
      formatCurrency(totalMomo);
    document.getElementById("summary-total-withdraw").textContent =
      formatCurrency(totalWithdraw);
    document.getElementById("summary-stock-value").textContent =
      formatCurrency(totalStockValue);
  }

  // --- INIT ---
  function init() {
    loadData();
    populateProductSelects();
    loadCustomers();
    loadStockList();
    renderSalesLedger();
    renderCashLedger();
    renderMomoLedger();
    renderWithdrawLedger();
    updateSummary();
  }

  init();
})();
