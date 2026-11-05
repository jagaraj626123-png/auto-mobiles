(function () {
  const store = window.AutoGearStore;
  const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const allProducts = () => store.getProducts();
  const products = () => allProducts().filter(product => product.status !== "Inactive");
  const cart = () => store.getList(store.KEYS.cart);
  const wishlist = () => store.getList(store.KEYS.wishlist);
  const params = new URLSearchParams(location.search);
  const user = () => store.getSession();

  function toast(message) {
    let node = document.querySelector(".toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "toast";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(node.timer);
    node.timer = setTimeout(() => node.classList.remove("show"), 2600);
  }

  function saveCookie(name, value, days) {
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${days * 86400}; path=/; SameSite=Lax`;
  }

  function updateHeader() {
    document.querySelectorAll("[data-cart-count]").forEach(node => {
      node.textContent = cart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
    });
    document.querySelectorAll("[data-wishlist-count]").forEach(node => { node.textContent = wishlist().length; });
    const account = document.querySelector("[data-account-label]");
    if (account) account.textContent = user()?.name ? `Hi, ${user().name.split(" ")[0]}` : "Account";
  }

  function productCard(product) {
    const wished = wishlist().includes(product.id);
    return `<article class="product-card">
      <a class="product-image" href="product-details.html?id=${encodeURIComponent(product.id)}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
        <button class="wish-button ${wished ? "active" : ""}" type="button" aria-label="Toggle wishlist" data-wish="${escapeHtml(product.id)}">${wished ? "♥" : "♡"}</button>
      </a>
      <div class="product-info">
        <p class="product-type">${escapeHtml(product.type || product.category)}</p>
        <a class="product-name" href="product-details.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a>
        <div class="rating">★★★★★ <span>${Number(product.rating || 4.5).toFixed(1)}</span></div>
        <div class="price-row"><strong>${money(product.price)}</strong>${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ""}</div>
        <button class="button button-dark button-small add-cart" data-add="${escapeHtml(product.id)}" ${Number(product.stock) < 1 ? "disabled" : ""}>${Number(product.stock) < 1 ? "Sold out" : "Add to cart"}</button>
      </div>
    </article>`;
  }

  function renderProducts(container, items) {
    if (!container) return;
    container.innerHTML = items.length ? items.map(productCard).join("") : '<div class="empty-state"><span>◇</span><h3>No products found</h3><p>Try a different search or category.</p></div>';
  }

  function setFilterOptions() {
    const select = document.querySelector("#category-filter");
    if (!select) return;
    const current = select.value;
    const categories = [...new Set(products().map(item => item.category))];
    select.innerHTML = '<option value="">All categories</option>' + categories.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    select.value = current || params.get("category") || "";
  }

  function initHome() {
    renderProducts(document.querySelector("#featured-products"), products().slice(0, 4));
    renderProducts(document.querySelector("#bestseller-products"), products().filter(item => item.badge === "BESTSELLER" || item.badge === "TOP RATED" || item.rating >= 4.8).slice(0, 4));
    renderProducts(document.querySelector("#new-products"), products().filter(item => item.badge === "NEW").slice(0, 4));
  }

  function initProducts() {
    const grid = document.querySelector("#product-grid");
    setFilterOptions();
    const category = document.querySelector("#category-filter");
    const sort = document.querySelector("#sort-filter");
    const search = document.querySelector("#product-search");
    const count = document.querySelector("#result-count");
    const apply = () => {
      let items = products();
      const q = (search?.value || params.get("q") || "").trim().toLowerCase();
      const cat = category?.value || params.get("category") || "";
      if (q) items = items.filter(item => `${item.name} ${item.type} ${item.category} ${item.description}`.toLowerCase().includes(q));
      if (cat) items = items.filter(item => item.category === cat);
      if (sort?.value === "price-low") items.sort((a, b) => a.price - b.price);
      if (sort?.value === "price-high") items.sort((a, b) => b.price - a.price);
      if (count) count.textContent = `${items.length} products`;
      renderProducts(grid, items);
    };
    if (params.get("q") && search) search.value = params.get("q");
    [category, sort, search].forEach(field => field?.addEventListener("input", apply));
    apply();
  }

  function initDetails() {
    const host = document.querySelector("#product-detail");
    const product = products().find(item => item.id === params.get("id"));
    if (!host) return;
    renderProducts(document.querySelector("#featured-products"), products().filter(item => item.id !== product?.id).slice(0, 4));
    if (!product) {
      host.innerHTML = '<div class="empty-state"><h2>Product not found</h2><a href="products.html">Browse products</a></div>';
      return;
    }
    host.innerHTML = `<div class="detail-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div>
      <div class="detail-copy"><p class="eyebrow">${escapeHtml(product.category)} / ${escapeHtml(product.type || "")}</p>
      <h1>${escapeHtml(product.name)}</h1><div class="rating">★★★★★ <span>${Number(product.rating || 4.5).toFixed(1)} · 24 reviews</span></div>
      <div class="detail-price">${money(product.price)} ${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ""}</div>
      <p class="detail-description">${escapeHtml(product.description)}</p><p class="stock-note">${product.stock > 0 ? `✓ In stock — ${product.stock} available` : "Currently out of stock"}</p>
      <div class="detail-actions"><button class="button button-orange" data-add="${escapeHtml(product.id)}" ${Number(product.stock) < 1 ? "disabled" : ""}>Add to cart</button><button class="button button-outline" data-wish="${escapeHtml(product.id)}">♡ Save to wishlist</button></div>
      <div class="detail-perks"><span>↗ Secure checkout</span><span>↺ Easy 7-day returns</span><span>✓ Quality guaranteed</span></div></div>`;
  }

  function addToCart(id, quantity) {
    const product = products().find(item => item.id === id);
    if (!product || product.stock < 1) return toast("This product is currently unavailable.");
    const items = cart();
    const found = items.find(item => item.id === id);
    const nextQty = (found?.qty || 0) + (quantity || 1);
    if (nextQty > Number(product.stock)) return toast(`Only ${product.stock} available in stock.`);
    if (found) found.qty = nextQty;
    else items.push({ id, qty: quantity || 1 });
    store.setList(store.KEYS.cart, items);
    updateHeader();
    toast("Added to your cart.");
  }

  function toggleWishlist(id) {
    const items = wishlist();
    const index = items.indexOf(id);
    if (index >= 0) items.splice(index, 1);
    else items.push(id);
    store.setList(store.KEYS.wishlist, items);
    updateHeader();
    const button = document.querySelector(`[data-wish="${CSS.escape(id)}"]`);
    if (button) {
      button.classList.toggle("active", index < 0);
      if (button.classList.contains("wish-button")) button.textContent = index < 0 ? "♥" : "♡";
    }
    if (document.body.dataset.page === "wishlist") renderWishlist();
    toast(index >= 0 ? "Removed from wishlist." : "Saved to your wishlist.");
  }

  function initCart() {
    const host = document.querySelector("#cart-content");
    if (!host) return;
    const lines = cart().map(line => ({ ...line, product: products().find(item => item.id === line.id) })).filter(line => line.product);
    if (!lines.length) {
      host.innerHTML = '<div class="empty-state"><span>▱</span><h2>Your cart is ready for a good find.</h2><p>Explore the latest gear for your next drive.</p><a class="button button-orange" href="products.html">Shop accessories</a></div>';
      return;
    }
    const total = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    host.innerHTML = `<div class="cart-layout"><div class="cart-lines">${lines.map(line => `<article class="cart-line">
      <a href="product-details.html?id=${encodeURIComponent(line.id)}"><img src="${escapeHtml(line.product.image)}" alt="${escapeHtml(line.product.name)}"></a>
      <div class="cart-line-info"><p class="product-type">${escapeHtml(line.product.category)}</p><a href="product-details.html?id=${encodeURIComponent(line.id)}"><h3>${escapeHtml(line.product.name)}</h3></a><span>${money(line.product.price)}</span>
      <button class="text-button" data-remove="${escapeHtml(line.id)}">Remove</button></div>
      <div class="quantity-control"><button data-qty="${escapeHtml(line.id)}" data-change="-1" aria-label="Decrease quantity">−</button><span>${line.qty}</span><button data-qty="${escapeHtml(line.id)}" data-change="1" aria-label="Increase quantity">+</button></div>
      <strong>${money(line.product.price * line.qty)}</strong></article>`).join("")}</div>
      <aside class="summary-card"><h2>Order summary</h2><div><span>Subtotal</span><strong>${money(total)}</strong></div><div><span>Delivery</span><strong class="free">FREE</strong></div><div class="summary-total"><span>Total</span><strong>${money(total)}</strong></div><a class="button button-orange button-full" href="checkout.html">Proceed to checkout</a><p>Taxes included. Shipping calculated at checkout.</p></aside></div>`;
  }

  function renderWishlist() {
    const host = document.querySelector("#wishlist-grid");
    if (!host) return;
    renderProducts(host, products().filter(item => wishlist().includes(item.id)));
  }

  function initCheckout() {
    const form = document.querySelector("#checkout-form");
    const host = document.querySelector("#checkout-summary");
    const lines = cart().map(line => ({ ...line, product: products().find(item => item.id === line.id) })).filter(line => line.product);
    if (!lines.length) {
      if (form) form.innerHTML = '<div class="empty-state"><h2>Your cart is empty</h2><a href="products.html">Browse products</a></div>';
      return;
    }
    const total = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    if (host) host.innerHTML = `<h2>Your order</h2>${lines.map(line => `<div class="checkout-item"><span>${escapeHtml(line.product.name)} × ${line.qty}</span><strong>${money(line.product.price * line.qty)}</strong></div>`).join("")}<div class="summary-total"><span>Total</span><strong>${money(total)}</strong></div>`;
    try {
      const temporary = JSON.parse(sessionStorage.getItem(store.KEYS.checkout) || "null");
      if (temporary?.data) {
        Object.entries(temporary.data).forEach(([name, value]) => {
          const field = form.elements.namedItem(name);
          if (field && field.type !== "radio") field.value = value;
        });
      }
    } catch (error) {
      console.error("Unable to restore temporary checkout information:", error);
    }
    form?.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      if (!user()) {
        sessionStorage.setItem(store.KEYS.checkout, JSON.stringify({ returnTo: "checkout.html", data }));
        location.href = "login.html?next=checkout.html";
        return;
      }
      const method = data.payment;
      if (!method) return toast("Choose a payment method to continue.");
      const currentProducts = allProducts();
      const unavailable = lines.find(line => {
        const latestProduct = currentProducts.find(item => item.id === line.id);
        return !latestProduct || latestProduct.status === "Inactive" || Number(latestProduct.stock) < line.qty;
      });
      if (unavailable) return toast(`${unavailable.product.name} no longer has enough stock. Please update your cart.`);
      const orders = store.getList(store.KEYS.orders);
      const order = {
        id: `AG-${Date.now().toString().slice(-8)}`,
        userEmail: user().email,
        customer: user().name,
        items: lines.map(line => ({ id: line.id, name: line.product.name, price: line.product.price, qty: line.qty })),
        total,
        payment: method,
        address: `${data.address}, ${data.city} ${data.postcode}`,
        status: "Confirmed",
        createdAt: new Date().toISOString()
      };
      orders.unshift(order);
      store.setList(store.KEYS.orders, orders);
      store.setProducts(currentProducts.map(product => {
        const sold = lines.find(line => line.id === product.id);
        return sold ? { ...product, stock: Math.max(0, Number(product.stock) - sold.qty) } : product;
      }));
      store.setList(store.KEYS.cart, []);
      sessionStorage.removeItem(store.KEYS.checkout);
      location.href = `checkout.html?success=${encodeURIComponent(order.id)}`;
    });
  }

  function showOrderConfirmation() {
    const id = params.get("success");
    if (!id) return false;
    const form = document.querySelector("#checkout-form");
    if (form) form.innerHTML = `<div class="success-card"><span>✓</span><p class="eyebrow">ORDER CONFIRMED</p><h1>Thank you for your order.</h1><p>Your demo order <strong>${escapeHtml(id)}</strong> has been placed successfully.</p><p>This is a demo checkout. No real payment was taken.</p><a class="button button-orange" href="products.html">Continue shopping</a></div>`;
    return true;
  }

  function initAuth() {
    const form = document.querySelector("#auth-form");
    const registerLink = document.querySelector(".auth-switch a[href='register.html']");
    if (registerLink && params.get("next")) registerLink.href = `register.html?next=${encodeURIComponent(params.get("next"))}`;
    form?.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const users = store.getList(store.KEYS.users);
      const register = form.dataset.mode === "register";
      if (register) {
        if (users.some(item => item.email.toLowerCase() === data.email.toLowerCase())) return toast("An account with that email already exists.");
        const account = { name: data.name.trim(), email: data.email.trim().toLowerCase(), password: data.password };
        users.push(account);
        store.setList(store.KEYS.users, users);
        store.setSession({ name: account.name, email: account.email });
      } else {
        const account = users.find(item => item.email.toLowerCase() === data.email.trim().toLowerCase() && item.password === data.password);
        if (!account) return toast("Email or password is incorrect. Please register first if you are new.");
        store.setSession({ name: account.name, email: account.email });
      }
      if (document.querySelector("#remember-me")?.checked) saveCookie("autogear_remember", "yes", 30);
      const next = params.get("next");
      location.href = next === "checkout.html" ? "checkout.html" : "index.html";
    });
  }

  function initAccount() {
    document.querySelectorAll("[data-logout]").forEach(button => button.addEventListener("click", () => {
      store.clearSession();
      location.href = "index.html";
    }));
    const host = document.querySelector("#order-history");
    const accountSession = document.querySelector("#account-session");
    if (accountSession && user()) {
      document.querySelector(".auth-card")?.setAttribute("hidden", "");
      accountSession.hidden = false;
      const greeting = document.querySelector("#account-greeting");
      if (greeting) greeting.textContent = `Welcome back, ${user().name}.`;
    }
    if (host) {
      const orders = store.getList(store.KEYS.orders).filter(order => order.userEmail === user()?.email);
      host.innerHTML = orders.length ? orders.map(order => `<article class="history-order"><div><strong>${escapeHtml(order.id)}</strong><span>${new Date(order.createdAt).toLocaleDateString()}</span></div><p>${order.items.map(item => `${escapeHtml(item.name)} × ${item.qty}`).join(", ")}</p><div><strong>${money(order.total)}</strong><span class="status-pill">${escapeHtml(order.status)}</span></div></article>`).join("") : '<p class="muted">Your orders will appear here after checkout.</p>';
    }
  }

  function initSearch() {
    document.querySelectorAll("[data-search-form]").forEach(form => form.addEventListener("submit", event => {
      event.preventDefault();
      const query = form.querySelector("input").value.trim();
      location.href = `products.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    }));
  }

  function initCookieNotice() {
    if (document.cookie.split("; ").some(item => item.startsWith("autogear_consent="))) return;
    const banner = document.querySelector("#cookie-banner");
    if (!banner) return;
    banner.hidden = false;
    banner.querySelector("button")?.addEventListener("click", () => {
      saveCookie("autogear_consent", "accepted", 180);
      banner.hidden = true;
    });
  }

  function initNewsletter() {
    const form = document.querySelector("#newsletter-form");
    form?.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const email = new FormData(form).get("email");
      saveCookie("autogear_newsletter", String(email), 180);
      form.reset();
      toast("You're on the list. Watch your inbox for the next drive.");
    });
  }

  function initMobileMenu() {
    let button = document.querySelector(".mobile-menu");
    const nav = document.querySelector(".main-nav");
    const actions = document.querySelector(".header-actions");
    if (!nav || !actions) return;
    if (!button) {
      button = document.createElement("button");
      button.className = "mobile-menu";
      button.type = "button";
      button.setAttribute("aria-label", "Open menu");
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = '<i class="fa-solid fa-bars"></i>';
      actions.appendChild(button);
    }
    button.addEventListener("click", () => {
      nav.classList.toggle("mobile-open");
      button.setAttribute("aria-expanded", String(nav.classList.contains("mobile-open")));
    });
  }

  document.addEventListener("click", event => {
    const add = event.target.closest("[data-add]");
    if (add) { event.preventDefault(); addToCart(add.dataset.add); }
    const wish = event.target.closest("[data-wish]");
    if (wish) { event.preventDefault(); event.stopPropagation(); toggleWishlist(wish.dataset.wish); }
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      store.setList(store.KEYS.cart, cart().filter(item => item.id !== remove.dataset.remove));
      initCart(); updateHeader(); toast("Item removed from cart.");
    }
    const qty = event.target.closest("[data-qty]");
    if (qty) {
      const id = qty.dataset.qty;
      const next = cart().map(item => item.id === id ? { ...item, qty: item.qty + Number(qty.dataset.change) } : item).filter(item => item.qty > 0);
      const product = products().find(item => item.id === id);
      if (next.find(item => item.id === id)?.qty > product.stock) return toast(`Only ${product.stock} available in stock.`);
      store.setList(store.KEYS.cart, next); initCart(); updateHeader();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    updateHeader();
    initSearch();
    initCookieNotice();
    initNewsletter();
    initMobileMenu();
    const page = document.body.dataset.page;
    if (page === "home") initHome();
    if (page === "products") initProducts();
    if (page === "details") initDetails();
    if (page === "cart") initCart();
    if (page === "wishlist") renderWishlist();
    if (page === "checkout") { if (!showOrderConfirmation()) initCheckout(); }
    if (page === "login" || page === "register") initAuth();
    initAccount();
    window.addEventListener("autogear:products-updated", () => {
      if (page === "home") initHome();
      if (page === "products") initProducts();
      if (page === "details") initDetails();
      if (page === "wishlist") renderWishlist();
    });
    window.addEventListener("storage", event => {
      if (event.key === store.KEYS.products) {
        if (page === "home") initHome();
        if (page === "products") initProducts();
        if (page === "details") initDetails();
        if (page === "wishlist") renderWishlist();
      }
      if (event.key === store.KEYS.cart || event.key === store.KEYS.wishlist) updateHeader();
      if (event.key === store.KEYS.orders) initAccount();
    });
  });
})();
