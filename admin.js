(function () {
  const store = window.AutoGearStore;
  const $ = selector => document.querySelector(selector);
  const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const categories = {
    "Bike Accessories": ["Bike helmets", "Bike covers", "Bike mirrors", "LED lights", "Bike gloves", "Mobile holders", "Bike seat covers"],
    "Car Accessories": ["Car seat covers", "Car mats", "Car perfumes", "Car chargers", "Dash cameras", "Steering covers", "Car vacuum cleaners"],
    "Helmets": ["Full-face helmets", "Open-face helmets", "Modular helmets", "Racing helmets"],
    "Spare Parts": ["Bike spare parts", "Car spare parts", "Brake pads", "Engine oil", "Air filters", "Headlights", "Batteries", "Tyres"]
  };
  const fallbackImage = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=85";
  let activeImageData = "";

  function notify(message) {
    const node = $(".admin-toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(node.timer);
    node.timer = setTimeout(() => node.classList.remove("show"), 2800);
  }

  function getAdminSession() {
    try { return JSON.parse(sessionStorage.getItem(store.KEYS.adminSession) || "null"); }
    catch (error) {
      console.error("Unable to read admin session:", error);
      return null;
    }
  }

  function persistAdminPreference(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=2592000; path=/; SameSite=Lax`;
  }

  function currentPrice(product) {
    return Number(product.discountPrice ?? (product.oldPrice ? product.price : 0)) || 0;
  }

  function listPrice(product) {
    return Number(product.listPrice ?? product.oldPrice ?? product.price) || 0;
  }

  function sortPrice(product) {
    return currentPrice(product) || listPrice(product);
  }

  function displayStatus(product) {
    return product.status === "Inactive" ? "Inactive" : "Active";
  }

  function revenueOrders() {
    return store.getList(store.KEYS.orders).filter(order => order.status !== "Cancelled");
  }

  function renderStats() {
    const products = store.getProducts();
    const orders = store.getList(store.KEYS.orders);
    const users = store.getList(store.KEYS.users);
    $("#stat-products").textContent = products.length;
    $("#stat-bike").textContent = products.filter(product => product.category === "Bike Accessories").length;
    $("#stat-car").textContent = products.filter(product => product.category === "Car Accessories").length;
    $("#stat-helmets").textContent = products.filter(product => product.category === "Helmets").length;
    $("#stat-parts").textContent = products.filter(product => product.category === "Spare Parts").length;
    $("#stat-orders").textContent = orders.length;
    $("#stat-customers").textContent = users.length;
    $("#stat-sales").textContent = money(revenueOrders().reduce((sum, order) => sum + Number(order.total), 0));
    $("#report-revenue").textContent = $("#stat-sales").textContent;
    $("#report-orders").textContent = revenueOrders().length;
    $("#report-average").textContent = money(revenueOrders().length
      ? revenueOrders().reduce((sum, order) => sum + Number(order.total), 0) / revenueOrders().length
      : 0);
  }

  function renderProductRows() {
    const search = ($("#admin-search").value || "").trim().toLowerCase();
    const category = $("#admin-category-filter").value;
    const sort = $("#admin-sort").value;
    let items = store.getProducts().filter(product => product.name.toLowerCase().includes(search));
    if (category) items = items.filter(product => product.category === category);
    if (sort === "price-low") items.sort((a, b) => sortPrice(a) - sortPrice(b));
    if (sort === "price-high") items.sort((a, b) => sortPrice(b) - sortPrice(a));
    $("#product-result-count").textContent = `(${items.length})`;
    $("#admin-product-rows").innerHTML = items.length ? items.map(product => {
      const base = listPrice(product);
      const discount = currentPrice(product);
      const price = discount ? `<strong>${money(discount)}</strong><small class="old-price">${money(base)}</small>` : `<strong>${money(base)}</strong>`;
      return `<tr>
        <td><div class="admin-product-cell"><img src="${escapeHtml(product.image || fallbackImage)}" alt=""><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.id)}</small></div></div></td>
        <td>${escapeHtml(product.category)}</td><td>${escapeHtml(product.brand || "—")}</td>
        <td>${price}</td><td><span class="${Number(product.stock) <= 5 ? "stock-low" : ""}">${Number(product.stock) || 0}</span></td>
        <td><span class="status-badge ${displayStatus(product) === "Active" ? "status-active" : "status-inactive"}">${displayStatus(product)}</span></td>
        <td><div class="row-actions"><button type="button" data-view-product="${escapeHtml(product.id)}">View</button><button type="button" data-edit="${escapeHtml(product.id)}">Edit</button><button type="button" class="danger" data-delete="${escapeHtml(product.id)}">Delete</button></div></td>
      </tr>`;
    }).join("") : '<tr><td colspan="7" class="table-empty">No products match your search.</td></tr>';
  }

  function orderStatus(order) {
    return order.status === "Confirmed" ? "Pending" : (order.status || "Pending");
  }

  function orderRows(orders, includePayment) {
    return orders.length ? orders.map(order => {
      const status = orderStatus(order);
      const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
      return `<tr><td><strong>${escapeHtml(order.id)}</strong><small>${new Date(order.createdAt).toLocaleDateString()}</small></td>
        <td>${escapeHtml(order.customer || order.userEmail || "Guest")}</td><td>${itemCount} items</td><td>${money(order.total)}</td>
        ${includePayment ? `<td>${escapeHtml(order.payment || "—")}</td>` : ""}
        <td><select data-order-status="${escapeHtml(order.id)}" aria-label="Order status for ${escapeHtml(order.id)}">
          ${["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(option => `<option ${status === option ? "selected" : ""}>${option}</option>`).join("")}
        </select></td></tr>`;
    }).join("") : `<tr><td colspan="${includePayment ? 6 : 5}" class="table-empty">Customer orders will appear here.</td></tr>`;
  }

  function renderOrders() {
    const orders = store.getList(store.KEYS.orders);
    const recent = orders.slice(0, 5);
    $("#overview-order-rows").innerHTML = orderRows(recent, false);
    $("#admin-order-rows").innerHTML = orderRows(orders, true);
  }

  function customerOrders(email) {
    return store.getList(store.KEYS.orders).filter(order => order.userEmail === email);
  }

  function renderCustomers() {
    const filter = ($("#customer-search").value || "").trim().toLowerCase();
    const users = store.getList(store.KEYS.users).filter(user => `${user.name} ${user.email}`.toLowerCase().includes(filter));
    $("#admin-customer-rows").innerHTML = users.length ? users.map(user => {
      const orders = customerOrders(user.email);
      const spent = orders.filter(order => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.total), 0);
      return `<tr><td><strong>${escapeHtml(user.name)}</strong></td><td>${escapeHtml(user.email)}</td><td>${orders.length}</td><td>${money(spent)}</td><td><div class="row-actions"><button type="button" data-customer-orders="${escapeHtml(user.email)}">View orders</button><button type="button" class="danger" data-delete-customer="${escapeHtml(user.email)}">Remove</button></div></td></tr>`;
    }).join("") : '<tr><td colspan="5" class="table-empty">No customers match your search.</td></tr>';
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function renderSalesReport() {
    const now = new Date();
    const months = [];
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      months.push({
        key: monthKey(date),
        label: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        fullLabel: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        orders: [],
        revenue: 0
      });
    }
    const monthsByKey = new Map(months.map(month => [month.key, month]));
    revenueOrders().forEach(order => {
      const date = new Date(order.createdAt);
      const month = monthsByKey.get(monthKey(date));
      if (month) {
        month.orders.push(order);
        month.revenue += Number(order.total) || 0;
      }
    });
    const max = Math.max(...months.map(month => month.revenue), 1);
    $("#sales-chart").innerHTML = months.map(month => `<div class="chart-column" title="${escapeHtml(month.fullLabel)}: ${money(month.revenue)}"><span>${money(month.revenue)}</span><div class="chart-track"><i style="height:${Math.max(3, month.revenue / max * 100)}%"></i></div><small>${escapeHtml(month.label)}</small></div>`).join("");
    $("#sales-report-rows").innerHTML = months.slice().reverse().map(month => `<tr><td>${escapeHtml(month.fullLabel)}</td><td>${month.orders.length}</td><td>${money(month.revenue)}</td></tr>`).join("");
  }

  function renderLowStock() {
    const lowStock = store.getProducts().filter(product => Number(product.stock) <= 5 && displayStatus(product) === "Active");
    $("#low-stock-count").textContent = lowStock.length;
    $("#low-stock-list").innerHTML = lowStock.length ? lowStock.slice(0, 7).map(product => `<div class="low-stock-item"><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)}</small></span><b>${Number(product.stock)} left</b></div>`).join("") : '<p class="low-stock-empty">All active products are stocked above the alert threshold.</p>';
  }

  function renderProfile() {
    const session = getAdminSession();
    const name = session?.name || "Store admin";
    $("#top-admin-name").textContent = name;
    $("#profile-name").textContent = name;
    $("#profile-email").textContent = session?.email || "admin@autogear.demo";
  }

  function renderAll() {
    renderStats();
    renderProductRows();
    renderOrders();
    renderCustomers();
    renderLowStock();
    renderSalesReport();
    renderProfile();
  }

  function setProductTypeOptions(selected) {
    const types = categories[$("#product-category").value] || [];
    $("#product-type").innerHTML = types.map(type => `<option ${type === selected ? "selected" : ""}>${escapeHtml(type)}</option>`).join("");
  }

  function makeProductId() {
    let id;
    const existing = new Set(store.getProducts().map(product => product.id));
    do {
      id = `AG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    } while (existing.has(id));
    return id;
  }

  function openProductForm(product) {
    $("#product-form").reset();
    activeImageData = "";
    $("#product-id").value = product?.id || makeProductId();
    $("#generated-product-id").textContent = `Product ID: ${$("#product-id").value}`;
    $("#form-title").textContent = product ? "Edit product" : "Add new product";
    $("#product-category").value = product?.category || "Bike Accessories";
    setProductTypeOptions(product?.type);
    $("#product-name").value = product?.name || "";
    $("#product-brand").value = product?.brand || "";
    $("#product-price").value = product ? listPrice(product) : "";
    $("#product-discount").value = product ? currentPrice(product) : "";
    $("#product-stock").value = product?.stock ?? "";
    $("#product-rating").value = product?.rating ?? "4.5";
    $("#product-status").value = displayStatus(product || {});
    $("#product-description").value = product?.description || "";
    $("#product-image-url").value = product?.image?.startsWith("data:") ? "" : product?.image || "";
    $("#product-image-file").value = "";
    $("#product-modal").hidden = false;
    document.body.classList.add("modal-open");
    $("#product-name").focus();
  }

  function closeProductForm() {
    $("#product-modal").hidden = true;
    document.body.classList.remove("modal-open");
    activeImageData = "";
  }

  function showProductDetails(id) {
    const product = store.getProducts().find(item => item.id === id);
    if (!product) return;
    const base = listPrice(product);
    const discount = currentPrice(product);
    $("#details-title").textContent = product.name;
    $("#product-details-content").innerHTML = `<div class="product-detail-preview"><img src="${escapeHtml(product.image || fallbackImage)}" alt="${escapeHtml(product.name)}"><div><p><strong>Product ID</strong><span>${escapeHtml(product.id)}</span></p><p><strong>Category</strong><span>${escapeHtml(product.category)} · ${escapeHtml(product.type || "General")}</span></p><p><strong>Brand</strong><span>${escapeHtml(product.brand || "—")}</span></p><p><strong>Price</strong><span>${money(base)}</span></p><p><strong>Discount price</strong><span>${discount ? money(discount) : "No discount"}</span></p><p><strong>Stock</strong><span>${Number(product.stock) || 0}</span></p><p><strong>Rating</strong><span>${Number(product.rating || 0).toFixed(1)} / 5</span></p><p><strong>Status</strong><span>${displayStatus(product)}</span></p></div></div><p class="details-description">${escapeHtml(product.description || "No description provided.")}</p>`;
    $("#product-details-modal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeDetails() {
    $("#product-details-modal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function saveProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const products = store.getProducts();
    const id = $("#product-id").value;
    const existing = products.find(product => product.id === id);
    if (!existing && products.some(product => product.id.toLowerCase() === id.toLowerCase())) {
      $("#product-id").value = makeProductId();
      $("#generated-product-id").textContent = `Product ID: ${$("#product-id").value}`;
      return notify("Duplicate product ID detected. A new unique ID was generated; save again.");
    }
    const listPriceValue = Number($("#product-price").value);
    const discountPrice = Number($("#product-discount").value) || 0;
    if (discountPrice && discountPrice >= listPriceValue) {
      $("#product-discount").setCustomValidity("Discount price must be lower than the regular price.");
      $("#product-discount").reportValidity();
      $("#product-discount").setCustomValidity("");
      return;
    }
    const file = $("#product-image-file").files[0];
    if (file && !file.type.startsWith("image/")) return notify("Choose a valid image file.");
    if (file && file.size > 1024 * 1024) return notify("Please choose an image smaller than 1 MB for browser storage.");
    if (!file && !$("#product-image-url").value.trim() && !existing?.image && !activeImageData) {
      $("#product-image-url").setCustomValidity("Choose an image file or enter an image URL.");
      $("#product-image-url").reportValidity();
      $("#product-image-url").setCustomValidity("");
      return;
    }

    const commit = image => {
      const item = {
        ...(existing || {}),
        id,
        name: $("#product-name").value.trim(),
        category: $("#product-category").value,
        type: $("#product-type").value,
        brand: $("#product-brand").value.trim(),
        listPrice: listPriceValue,
        discountPrice,
        price: discountPrice || listPriceValue,
        oldPrice: discountPrice ? listPriceValue : 0,
        stock: Number($("#product-stock").value),
        rating: Number($("#product-rating").value),
        status: $("#product-status").value,
        description: $("#product-description").value.trim(),
        image: image || existing?.image || fallbackImage
      };
      const next = existing ? products.map(product => product.id === id ? item : product) : [item, ...products];
      try {
        store.setProducts(next);
        renderAll();
        closeProductForm();
        notify(existing ? "Product updated and storefront synced." : "Product added and storefront synced.");
      } catch (error) {
        console.error("Could not save product:", error);
        notify("Product could not be saved. Remove a large image or free browser storage and try again.");
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = () => commit(String(reader.result));
      reader.onerror = () => notify("Could not read the selected image. Please try again.");
      reader.readAsDataURL(file);
    } else commit($("#product-image-url").value.trim() || activeImageData || existing?.image);
  }

  function deleteProduct(id) {
    const product = store.getProducts().find(item => item.id === id);
    if (!product || !window.confirm(`Delete “${product.name}” from the catalog? This cannot be undone.`)) return;
    try {
      store.setProducts(store.getProducts().filter(item => item.id !== id));
      renderAll();
      notify("Product deleted from the catalog.");
    } catch (error) {
      console.error("Could not delete product:", error);
      notify("Product could not be deleted. Please try again.");
    }
  }

  function showCustomerOrders(email) {
    const user = store.getList(store.KEYS.users).find(item => item.email === email);
    const orders = customerOrders(email);
    $("#details-title").textContent = user ? `${user.name} · Orders` : "Customer orders";
    $("#product-details-content").innerHTML = orders.length
      ? `<div class="customer-order-list">${orders.map(order => `<article><strong>${escapeHtml(order.id)}</strong><span>${new Date(order.createdAt).toLocaleDateString()}</span><span>${money(order.total)}</span><span class="status-badge">${escapeHtml(orderStatus(order))}</span></article>`).join("")}</div>`
      : '<p class="details-description">This customer has not placed any orders.</p>';
    $("#product-details-modal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function deleteCustomer(email) {
    const users = store.getList(store.KEYS.users);
    const customer = users.find(user => user.email === email);
    if (!customer || !window.confirm(`Remove customer account for ${customer.email}? Existing order history will be kept.`)) return;
    try {
      store.setList(store.KEYS.users, users.filter(user => user.email !== email));
      renderStats();
      renderCustomers();
      notify("Customer account removed. Order records were retained.");
    } catch (error) {
      console.error("Could not remove customer account:", error);
      notify("Customer account could not be removed. Please try again.");
    }
  }

  function setActiveTab(tab, persist) {
    const panel = $(`#${tab}-panel`);
    const navButton = $(`.admin-nav [data-admin-tab="${tab}"]`);
    if (!panel || !navButton) return;
    document.querySelectorAll(".admin-nav [data-admin-tab]").forEach(button => button.classList.toggle("active", button === navButton));
    document.querySelectorAll(".admin-panel").forEach(section => section.classList.toggle("active", section === panel));
    if (persist) persistAdminPreference("autogear_admin_tab", tab);
    if (tab === "products") renderProductRows();
    if (tab === "customers") renderCustomers();
  }

  function logout() {
    sessionStorage.removeItem(store.KEYS.adminSession);
    location.href = "index.html";
  }

  document.addEventListener("click", event => {
    const open = event.target.closest("[data-open-product]");
    if (open) openProductForm();
    const tab = event.target.closest("[data-admin-tab]");
    if (tab) setActiveTab(tab.dataset.adminTab, true);
    const edit = event.target.closest("[data-edit]");
    if (edit) openProductForm(store.getProducts().find(item => item.id === edit.dataset.edit));
    const view = event.target.closest("[data-view-product]");
    if (view) showProductDetails(view.dataset.viewProduct);
    const remove = event.target.closest("[data-delete]");
    if (remove) deleteProduct(remove.dataset.delete);
    const customerView = event.target.closest("[data-customer-orders]");
    if (customerView) showCustomerOrders(customerView.dataset.customerOrders);
    const customerRemove = event.target.closest("[data-delete-customer]");
    if (customerRemove) deleteCustomer(customerRemove.dataset.deleteCustomer);
    if (event.target.closest("[data-close-details]")) closeDetails();
  });

  document.addEventListener("change", event => {
    const select = event.target.closest("[data-order-status]");
    if (!select) return;
    const orders = store.getList(store.KEYS.orders);
    const order = orders.find(item => item.id === select.dataset.orderStatus);
    if (!order) return;
    order.status = select.value;
    try {
      store.setList(store.KEYS.orders, orders);
    } catch (error) {
      console.error("Could not save order status:", error);
      notify("Order status could not be saved. Check available browser storage.");
      renderOrders();
      return;
    }
    renderStats();
    renderOrders();
    renderCustomers();
    renderSalesReport();
    notify("Order status updated.");
  });

  document.addEventListener("DOMContentLoaded", () => {
    store.getProducts();
    if (!getAdminSession()) {
      sessionStorage.setItem(store.KEYS.adminSession, JSON.stringify({ name: "Store admin", email: "admin@autogear.demo" }));
    }
    renderAll();
    $("#product-form").addEventListener("submit", saveProduct);
    $("#product-category").addEventListener("change", () => setProductTypeOptions());
    $("#admin-search").addEventListener("input", renderProductRows);
    $("#admin-category-filter").addEventListener("change", renderProductRows);
    $("#admin-sort").addEventListener("change", renderProductRows);
    $("#customer-search").addEventListener("input", renderCustomers);
    $("#modal-close").addEventListener("click", closeProductForm);
    $("#modal-cancel").addEventListener("click", closeProductForm);
    $("#product-modal").addEventListener("click", event => { if (event.target === $("#product-modal")) closeProductForm(); });
    $("#product-details-modal").addEventListener("click", event => { if (event.target === $("#product-details-modal")) closeDetails(); });
    $("#product-image-file").addEventListener("change", event => {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        event.target.value = "";
        return notify("Choose a valid image file.");
      }
      if (file.size > 1024 * 1024) {
        event.target.value = "";
        return notify("Please choose an image smaller than 1 MB.");
      }
      const reader = new FileReader();
      reader.onload = () => { activeImageData = String(reader.result); };
      reader.onerror = () => notify("Could not preview the selected image.");
      reader.readAsDataURL(file);
    });
    $("#admin-logout").addEventListener("click", logout);
    $("#profile-logout").addEventListener("click", logout);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeProductForm();
        closeDetails();
      }
    });
    window.addEventListener("storage", event => {
      if ([store.KEYS.products, store.KEYS.orders, store.KEYS.users].includes(event.key)) renderAll();
    });
    window.addEventListener("autogear:products-updated", renderAll);
    const cookieTab = document.cookie.split("; ").find(item => item.startsWith("autogear_admin_tab="))?.split("=")[1];
    const savedTab = cookieTab ? decodeURIComponent(cookieTab) : "";
    setActiveTab(document.getElementById(`${savedTab}-panel`) ? savedTab : "overview", false);
  });
})();
