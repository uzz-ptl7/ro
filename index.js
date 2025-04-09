// Helper function to convert array of objects to CSV format
function convertToCSV(data) {
  const header = Object.keys(data[0]).join(",");
  const rows = data.map((item) => Object.values(item).join(",")).join("\n");
  return `${header}\n${rows}`;
}

// Helper function to trigger a CSV download
function downloadCSV(filename, data) {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// Load customer names from localStorage into the dropdown
function loadCustomers() {
  const customers = JSON.parse(localStorage.getItem("customers")) || [];
  const customerDropdown = document.getElementById("customer");
  customerDropdown.innerHTML = '<option value="">Select Customer</option>'; // Clear previous options

  customers.forEach((customer) => {
    const option = document.createElement("option");
    option.value = customer.name;
    option.textContent = customer.name;
    customerDropdown.appendChild(option);
  });
}

// Add a new customer to localStorage
function addCustomer(name) {
  let customers = JSON.parse(localStorage.getItem("customers")) || [];
  customers.push({ name });
  localStorage.setItem("customers", JSON.stringify(customers));
  loadCustomers();
}

// Function to record a transaction to the ledger
function recordTransaction(
  paymentMethod,
  product,
  quantity,
  amount,
  customerName
) {
  const transaction = {
    date: new Date().toLocaleString(),
    product,
    quantity,
    amount,
    customer: customerName,
  };

  let ledger =
    JSON.parse(localStorage.getItem(`${paymentMethod}-ledger`)) || [];
  ledger.push(transaction);
  localStorage.setItem(`${paymentMethod}-ledger`, JSON.stringify(ledger));

  // Update the UI for ledgers
  updateLedgers();
}

// Function to update the UI for both ledgers
function updateLedgers() {
  // Get the cash and momo ledgers from localStorage
  const cashLedger = JSON.parse(localStorage.getItem("cash-ledger")) || [];
  const momoLedger = JSON.parse(localStorage.getItem("momo-ledger")) || [];

  const cashLedgerBody = document.getElementById("cash-ledger-body");
  const momoLedgerBody = document.getElementById("momo-ledger-body");
  cashLedgerBody.innerHTML = "";
  momoLedgerBody.innerHTML = "";

  cashLedger.forEach((transaction) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td class="border p-2">${transaction.date}</td>
          <td class="border p-2">${transaction.product}</td>
          <td class="border p-2">${transaction.quantity}</td>
          <td class="border p-2">$${transaction.amount.toFixed(2)}</td>
          <td class="border p-2">${transaction.customer}</td>
      `;
    cashLedgerBody.appendChild(row);
  });

  momoLedger.forEach((transaction) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td class="border p-2">${transaction.date}</td>
          <td class="border p-2">${transaction.product}</td>
          <td class="border p-2">${transaction.quantity}</td>
          <td class="border p-2">$${transaction.amount.toFixed(2)}</td>
          <td class="border p-2">${transaction.customer}</td>
      `;
    momoLedgerBody.appendChild(row);
  });
}

// Update total sales, balances, and stock
function loadData() {
  // Update total sales
  const totalSales = parseFloat(localStorage.getItem("totalSales")) || 0;
  document.getElementById(
    "total-sales"
  ).textContent = `Total Sales: $${totalSales.toFixed(2)}`;

  // Update balances
  const cashBalance = parseFloat(localStorage.getItem("cashBalance")) || 0;
  const mobileMoneyBalance =
    parseFloat(localStorage.getItem("mobileMoneyBalance")) || 0;
  document.getElementById(
    "cash-balance"
  ).textContent = `Cash Balance: $${cashBalance.toFixed(2)}`;
  document.getElementById(
    "momo-balance"
  ).textContent = `Mobile Money Balance: $${mobileMoneyBalance.toFixed(2)}`;

  // Update stock
  const stockContainer = document.getElementById("product-stock");
  stockContainer.innerHTML = ""; // Clear previous stock
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("stock") && !key.includes("ledger")) {
      const product = key.replace("stock", "");
      const stock = parseInt(localStorage.getItem(key)) || 0;
      const productStock = document.createElement("p");
      productStock.textContent = `${product} Stock: ${stock}`;
      stockContainer.appendChild(productStock);
    }
  });
}

// Sales form submission handler
document
  .getElementById("sales-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const product = document.getElementById("product").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const paymentMethod = document.getElementById("payment-method").value;
    const customerName = document.getElementById("customer").value;

    if (!customerName) {
      alert("Please select or enter a customer.");
      return;
    }

    // Validate sale
    const currentStock = parseInt(localStorage.getItem(`stock${product}`)) || 0;
    if (quantity <= 0 || quantity > currentStock) {
      alert("Invalid sale quantity");
      return;
    }

    const saleAmount = quantity * 10; // Example: $10 per unit
    let totalSales = parseFloat(localStorage.getItem("totalSales")) || 0;
    totalSales += saleAmount;

    if (paymentMethod === "cash") {
      let cashBalance = parseFloat(localStorage.getItem("cashBalance")) || 0;
      cashBalance += saleAmount;
      localStorage.setItem("cashBalance", cashBalance);
    } else if (paymentMethod === "momo") {
      let momoBalance =
        parseFloat(localStorage.getItem("mobileMoneyBalance")) || 0;
      momoBalance += saleAmount;
      localStorage.setItem("mobileMoneyBalance", momoBalance);
    }

    // Update localStorage
    localStorage.setItem("totalSales", totalSales);
    localStorage.setItem(`stock${product}`, currentStock - quantity);

    // Record the transaction
    recordTransaction(
      paymentMethod,
      product,
      quantity,
      saleAmount,
      customerName
    );

    // Show success message
    alert(
      `Sale recorded for ${customerName}: ${quantity} ${product} sold for $${saleAmount}`
    );

    loadData(); // Reload the summary page with updated data
  });

// Add customer form handler
function addCustomerHandler() {
  const customerName = prompt("Enter customer name:");
  if (customerName) {
    addCustomer(customerName);
  }
}

// Initial Load of Customers
loadCustomers();

// Button to add a new customer
const addCustomerButton = document.createElement("button");
addCustomerButton.textContent = "Add Customer";
addCustomerButton.className =
  "bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500";
addCustomerButton.onclick = addCustomerHandler;
document.body.appendChild(addCustomerButton);
