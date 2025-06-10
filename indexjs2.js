import React, { useState, useEffect, createContext, useContext } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "tailwindcss/tailwind.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- Context for Global State ---
const AppContext = createContext();

function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("inventory");

  // Inventory Data State
  const [inventory, setInventory] = useState([]);
  // Customers Data State
  const [customers, setCustomers] = useState([]);
  // Sales and Expenses (for charts & accounts)
  const [sales, setSales] = useState(0);
  const [expenses, setExpenses] = useState(1200);

  // Loading state simulating async fetch
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modal, setModal] = useState({ open: false, type: null, data: null });

  // Simulated fetch from "backend" on mount
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // Mock inventory data
      setInventory([
        {
          id: 1,
          name: "Product A",
          category: "Category 1",
          stock: 25,
          price: 9.99,
        },
        {
          id: 2,
          name: "Product B",
          category: "Category 2",
          stock: 15,
          price: 19.99,
        },
      ]);

      // Mock customers data
      setCustomers([
        {
          id: 1,
          name: "Alice Johnson",
          email: "alice@example.com",
          phone: "123-456-7890",
          orders: 5,
          lastOrder: "2025-06-05",
        },
        {
          id: 2,
          name: "Bob Smith",
          email: "bob@example.com",
          phone: "987-654-3210",
          orders: 2,
          lastOrder: "2025-05-20",
        },
      ]);

      // Mock sales
      setSales(5500.5);

      setLoading(false);
    }, 1000);
  }, []);

  // Add or Edit Inventory Item
  const saveInventoryItem = (item) => {
    if (item.id) {
      // Edit existing
      setInventory((inv) =>
        inv.map((i) => (i.id === item.id ? { ...item } : i))
      );
    } else {
      // Add new
      const newItem = { ...item, id: Date.now() };
      setInventory((inv) => [...inv, newItem]);
    }
    setModal({ open: false, type: null, data: null });
  };

  // Delete Inventory Item
  const deleteInventoryItem = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setInventory((inv) => inv.filter((item) => item.id !== id));
    }
  };

  // Add or Edit Customer
  const saveCustomer = (customer) => {
    if (customer.id) {
      setCustomers((custs) =>
        custs.map((c) => (c.id === customer.id ? { ...customer } : c))
      );
    } else {
      const newCustomer = { ...customer, id: Date.now() };
      setCustomers((custs) => [...custs, newCustomer]);
    }
    setModal({ open: false, type: null, data: null });
  };

  // Delete Customer
  const deleteCustomer = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      setCustomers((custs) => custs.filter((c) => c.id !== id));
    }
  };

  // Context value
  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        inventory,
        customers,
        sales,
        expenses,
        loading,
        modal,
        setModal,
        saveInventoryItem,
        deleteInventoryItem,
        saveCustomer,
        deleteCustomer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// --- Modal for Add/Edit Forms ---
function Modal() {
  const { modal, setModal, saveInventoryItem, saveCustomer } =
    useContext(AppContext);

  if (!modal.open) return null;

  const closeModal = () => setModal({ open: false, type: null, data: null });

  // Form state local to modal
  const [formData, setFormData] = useState(
    modal.data || {
      name: "",
      category: "",
      stock: "",
      price: "",
      email: "",
      phone: "",
      orders: "",
      lastOrder: "",
    }
  );

  useEffect(() => {
    setFormData(
      modal.data || {
        name: "",
        category: "",
        stock: "",
        price: "",
        email: "",
        phone: "",
        orders: "",
        lastOrder: "",
      }
    );
  }, [modal.data]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (modal.type === "inventory") {
      // Validate inventory form
      if (
        !formData.name ||
        !formData.category ||
        formData.stock === "" ||
        formData.price === ""
      ) {
        alert("Please fill all inventory fields.");
        return;
      }
      saveInventoryItem({
        id: modal.data?.id,
        name: formData.name,
        category: formData.category,
        stock: Number(formData.stock),
        price: Number(formData.price),
      });
    }

    if (modal.type === "customer") {
      // Validate customer form
      if (
        !formData.name ||
        !formData.email ||
        !formData.phone ||
        formData.orders === "" ||
        !formData.lastOrder
      ) {
        alert("Please fill all customer fields.");
        return;
      }
      saveCustomer({
        id: modal.data?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        orders: Number(formData.orders),
        lastOrder: formData.lastOrder,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h3
          className="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
          id="modal-title"
        >
          {modal.type === "inventory"
            ? modal.data
              ? "Edit Product"
              : "Add Product"
            : modal.type === "customer"
            ? modal.data
              ? "Edit Customer"
              : "Add Customer"
            : ""}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {modal.type === "inventory" && (
            <>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Product Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="stock"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Stock
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Price
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </>
          )}

          {modal.type === "customer" && (
            <>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="orders"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Number of Orders
                </label>
                <input
                  id="orders"
                  name="orders"
                  type="number"
                  min="0"
                  value={formData.orders}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastOrder"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Last Order Date
                </label>
                <input
                  id="lastOrder"
                  name="lastOrder"
                  type="date"
                  value={formData.lastOrder}
                  onChange={onChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Tabs ---
function Tabs() {
  const { activeTab, setActiveTab } = useContext(AppContext);

  const tabs = [
    { key: "inventory", label: "Inventory" },
    { key: "customers", label: "Customers" },
    { key: "accounts", label: "Accounts" },
  ];

  return (
    <nav
      className="flex space-x-4 border-b border-gray-300 dark:border-gray-700"
      aria-label="Primary"
    >
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`py-2 px-4 -mb-px border-b-2 font-medium text-sm ${
            activeTab === key
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 dark:text-gray-300 hover:text-indigo-600"
          }`}
          aria-current={activeTab === key ? "page" : undefined}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

// --- Inventory Tab ---
function Inventory() {
  const { inventory, loading, setModal, deleteInventoryItem } =
    useContext(AppContext);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Inventory
        </h2>
        <button
          onClick={() =>
            setModal({ open: true, type: "inventory", data: null })
          }
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + Add Product
        </button>
      </div>
      {loading ? (
        <p className="text-gray-700 dark:text-gray-300">Loading inventory...</p>
      ) : inventory.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">
          No products available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-900 rounded-md">
            <thead>
              <tr className="text-left border-b border-gray-300 dark:border-gray-700">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Price ($)</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.category}</td>
                  <td className="px-4 py-2">{item.stock}</td>
                  <td className="px-4 py-2">{item.price.toFixed(2)}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() =>
                        setModal({ open: true, type: "inventory", data: item })
                      }
                      className="text-indigo-600 hover:underline"
                      aria-label={`Edit product ${item.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteInventoryItem(item.id)}
                      className="text-red-600 hover:underline"
                      aria-label={`Delete product ${item.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Customers Tab ---
function Customers() {
  const { customers, loading, setModal, deleteCustomer } =
    useContext(AppContext);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Customers
        </h2>
        <button
          onClick={() => setModal({ open: true, type: "customer", data: null })}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + Add Customer
        </button>
      </div>
      {loading ? (
        <p className="text-gray-700 dark:text-gray-300">Loading customers...</p>
      ) : customers.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">
          No customers available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-900 rounded-md">
            <thead>
              <tr className="text-left border-b border-gray-300 dark:border-gray-700">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Orders</th>
                <th className="px-4 py-2">Last Order</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2">{c.orders}</td>
                  <td className="px-4 py-2">{c.lastOrder}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() =>
                        setModal({ open: true, type: "customer", data: c })
                      }
                      className="text-indigo-600 hover:underline"
                      aria-label={`Edit customer ${c.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCustomer(c.id)}
                      className="text-red-600 hover:underline"
                      aria-label={`Delete customer ${c.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Accounts Tab (charts & balances) ---
function Accounts() {
  const { sales, expenses } = useContext(AppContext);

  // Monthly Sales Data (mock)
  const monthlySales = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Sales ($)",
        data: [
          400, 450, 500, 600, 750, 900, 1100, 1200, 1300, 1500, 1600, 1700,
        ],
        fill: false,
        borderColor: "rgba(99,102,241,1)",
        backgroundColor: "rgba(99,102,241,0.5)",
        tension: 0.3,
      },
    ],
  };

  // Expense breakdown (mock)
  const expenseData = {
    labels: ["Rent", "Salaries", "Utilities", "Marketing", "Other"],
    datasets: [
      {
        data: [400, 300, 200, 150, 150],
        backgroundColor: [
          "#6366F1",
          "#F59E0B",
          "#10B981",
          "#EF4444",
          "#8B5CF6",
        ],
      },
    ],
  };

  return (
    <div className="p-4 space-y-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Accounts Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section
          aria-labelledby="sales-chart-title"
          className="bg-white dark:bg-gray-900 p-4 rounded shadow"
        >
          <h3
            id="sales-chart-title"
            className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-2"
          >
            Monthly Sales
          </h3>
          <Line data={monthlySales} />
        </section>

        <section
          aria-labelledby="expenses-chart-title"
          className="bg-white dark:bg-gray-900 p-4 rounded shadow"
        >
          <h3
            id="expenses-chart-title"
            className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-2"
          >
            Expense Breakdown
          </h3>
          <Pie data={expenseData} />
        </section>
      </div>

      <div
        className="bg-white dark:bg-gray-900 p-4 rounded shadow max-w-md"
        aria-label="Sales and expenses summary"
      >
        <p className="text-gray-800 dark:text-gray-300 text-lg font-semibold">
          Total Sales:{" "}
          <span className="text-green-600 dark:text-green-400">
            ${sales.toFixed(2)}
          </span>
        </p>
        <p className="text-gray-800 dark:text-gray-300 text-lg font-semibold">
          Total Expenses:{" "}
          <span className="text-red-600 dark:text-red-400">
            ${expenses.toFixed(2)}
          </span>
        </p>
        <p className="text-gray-800 dark:text-gray-300 text-lg font-semibold">
          Net Income:{" "}
          <span
            className={
              sales - expenses >= 0
                ? "text-green-700 dark:text-green-500"
                : "text-red-700 dark:text-red-500"
            }
          >
            ${(sales - expenses).toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <header className="bg-white dark:bg-gray-800 shadow p-4">
          <h1 className="text-2xl font-bold">Business Dashboard</h1>
        </header>

        <main className="max-w-7xl mx-auto mt-6">
          <Tabs />
          <Content />
          <Modal />
        </main>
      </div>
    </AppProvider>
  );
}

function Content() {
  const { activeTab } = useContext(AppContext);

  switch (activeTab) {
    case "inventory":
      return <Inventory />;
    case "customers":
      return <Customers />;
    case "accounts":
      return <Accounts />;
    default:
      return null;
  }
}
