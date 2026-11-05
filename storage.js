// Shared browser storage helpers and the demo catalog used by every page.
(function () {
  const KEYS = {
    products: "autogear_products",
    users: "autogear_users",
    cart: "autogear_cart",
    wishlist: "autogear_wishlist",
    orders: "autogear_orders",
    session: "autogear_session",
    adminSession: "autogear_admin_session",
    checkout: "autogear_checkout",
    catalogVersion: "autogear_catalog_version"
  };

  const starterProducts = [
    { id: "p-helmet-1", name: "Apex Pro Full-Face Helmet", category: "Helmets", type: "Full-face helmets", price: 8499, oldPrice: 9999, stock: 18, rating: 4.9, badge: "BESTSELLER", description: "A lightweight, aerodynamic full-face helmet with a comfortable moisture-wicking liner and wide anti-scratch visor.", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85" },
    { id: "p-bike-helmet-1", name: "Streetline Bike Helmet", category: "Bike Accessories", type: "Bike helmets", price: 3999, oldPrice: 4699, stock: 21, rating: 4.7, badge: "RIDER ESSENTIAL", description: "A comfortable everyday motorcycle helmet with a secure fit, clear visor and ventilation designed for city rides.", image: "https://images.unsplash.com/photo-1506629905607-d9b1b0a3d8d1?auto=format&fit=crop&w=900&q=85" },
    { id: "p-cover-1", name: "Touring Bike Cover", category: "Bike Accessories", type: "Bike covers", price: 1799, oldPrice: 2199, stock: 32, rating: 4.7, badge: "SALE", description: "Weather-resistant, breathable protection for your motorcycle, with a soft inner lining and secure straps.", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=85" },
    { id: "p-dash-1", name: "RoadEye 4K Dash Camera", category: "Car Accessories", type: "Dash cameras", price: 12499, oldPrice: 14999, stock: 11, rating: 4.8, badge: "4K ULTRA HD", description: "Capture every drive in crisp 4K with a wide-angle lens, night vision and seamless loop recording.", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85" },
    { id: "p-seat-1", name: "Heritage Leather Seat Cover", category: "Car Accessories", type: "Car seat covers", price: 5999, oldPrice: 7499, stock: 24, rating: 4.6, badge: "PREMIUM", description: "Tailored-fit seat covers in durable, easy-clean leatherette with subtle contrast stitching.", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85" },
    { id: "p-brake-1", name: "Ceramic Brake Pad Set", category: "Spare Parts", type: "Brake pads", price: 3299, oldPrice: 3799, stock: 16, rating: 4.8, badge: "STAFF PICK", description: "Quiet, low-dust ceramic pads engineered for confident everyday braking and longer rotor life.", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=85" },
    { id: "p-light-1", name: "Lumen X LED Headlight Kit", category: "Bike Accessories", type: "LED lights", price: 2499, oldPrice: 2999, stock: 29, rating: 4.5, badge: "NEW", description: "A high-output, road-ready LED upgrade with crisp white light, efficient cooling and easy-fit connectors.", image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85" },
    { id: "p-mats-1", name: "All-Weather Car Floor Mats", category: "Car Accessories", type: "Car mats", price: 2899, oldPrice: 3499, stock: 20, rating: 4.7, badge: "ALL WEATHER", description: "Custom-style, anti-slip floor mats with raised edges to keep mud, water and dust contained.", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85" },
    { id: "p-oil-1", name: "TorqueMax Synthetic Engine Oil", category: "Spare Parts", type: "Engine oil", price: 1899, oldPrice: 2199, stock: 40, rating: 4.8, badge: "TOP RATED", description: "Advanced full-synthetic engine oil designed to protect against wear and keep performance smooth.", image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85" },
    { id: "p-mod-1", name: "Shift Modular Touring Helmet", category: "Helmets", type: "Modular helmets", price: 9999, oldPrice: 11999, stock: 8, rating: 4.6, badge: "TOURING", description: "A versatile flip-up touring helmet that blends all-day comfort with the convenience of a modular chin bar.", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85" },
    { id: "p-holder-1", name: "GripLock Pro Phone Mount", category: "Bike Accessories", type: "Mobile holders", price: 1299, oldPrice: 1599, stock: 37, rating: 4.5, badge: "RIDER FAVOURITE", description: "Secure your phone on the move with vibration-damping grip, 360-degree adjustment and tool-free access.", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85" },
    { id: "p-battery-1", name: "VoltEdge AGM Battery", category: "Spare Parts", type: "Batteries", price: 4599, oldPrice: 5199, stock: 14, rating: 4.7, badge: "RELIABLE", description: "A maintenance-free AGM battery built for dependable starts, vibration resistance and long service life.", image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85" },
    { id: "p-perfume-1", name: "Noir Cedar Car Fragrance", category: "Car Accessories", type: "Car perfumes", price: 899, oldPrice: 1199, stock: 50, rating: 4.4, badge: "NEW", description: "A refined, long-lasting blend of cedarwood and warm amber, made to make every drive feel special.", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85" },
    { id: "p-mirror-1", name: "WideView Touring Mirrors", category: "Bike Accessories", type: "Bike mirrors", price: 1599, oldPrice: 1899, stock: 22, rating: 4.6, badge: "PAIR", description: "Durable, adjustable mirrors with a wide field of view and anti-glare glass for confident riding.", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=85" },
    { id: "p-tyre-1", name: "RoadGrip All-Season Tyre", category: "Spare Parts", type: "Tyres", price: 6999, oldPrice: 7999, stock: 12, rating: 4.7, badge: "ROAD READY", description: "A dependable all-season tyre with confident wet grip, a quiet ride and even-wear tread design.", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=85" },
    { id: "p-open-1", name: "Metro Open-Face Helmet", category: "Helmets", type: "Open-face helmets", price: 4299, oldPrice: 4999, stock: 25, rating: 4.5, badge: "CITY RIDE", description: "An easy-going open-face helmet with a comfortable liner, quick-release buckle and drop-down sun visor.", image: "https://images.unsplash.com/photo-1506629905607-d9b1b0a3d8d1?auto=format&fit=crop&w=900&q=85" },
    { id: "p-gloves-1", name: "AeroFlex Riding Gloves", category: "Bike Accessories", type: "Bike gloves", price: 1999, oldPrice: 2399, stock: 31, rating: 4.6, badge: "COMFORT FIT", description: "Breathable gloves with reinforced palms, flexible knuckle protection and touchscreen-ready fingertips.", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85" },
    { id: "p-charger-1", name: "Dual-Port Fast Car Charger", category: "Car Accessories", type: "Car chargers", price: 1499, oldPrice: 1799, stock: 43, rating: 4.5, badge: "FAST CHARGE", description: "Compact dual-port car charger with intelligent power delivery for quick, safe charging on every trip.", image: "https://images.unsplash.com/photo-1503738377798-2f2f47f55b7b?auto=format&fit=crop&w=900&q=85" },
    { id: "p-racing-1", name: "Velocity Racing Helmet", category: "Helmets", type: "Racing helmets", price: 15999, oldPrice: 18499, stock: 6, rating: 4.9, badge: "TRACK SERIES", description: "A race-inspired, lightweight shell with an aerodynamic profile, secure fit and wide peripheral vision.", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85" },
    { id: "p-airfilter-1", name: "CleanFlow Performance Air Filter", category: "Spare Parts", type: "Air filters", price: 2199, oldPrice: 2599, stock: 19, rating: 4.6, badge: "PERFORMANCE", description: "A precision-fit air filter designed for consistent airflow and effective dust protection.", image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85" },
    { id: "p-vacuum-1", name: "TurboClean Portable Car Vacuum", category: "Car Accessories", type: "Car vacuum cleaners", price: 3499, oldPrice: 4199, stock: 13, rating: 4.7, badge: "COMPACT POWER", description: "Powerful, compact cleaning for seats, carpets and tight spaces, with washable filters and useful attachments.", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85" },
    { id: "p-steering-1", name: "Nappa Comfort Steering Cover", category: "Car Accessories", type: "Steering covers", price: 1899, oldPrice: 2299, stock: 28, rating: 4.5, badge: "SOFT TOUCH", description: "A breathable, non-slip steering wheel cover with a soft premium finish and a secure universal fit.", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85" },
    { id: "p-headlight-1", name: "ClearBeam Replacement Headlight", category: "Spare Parts", type: "Headlights", price: 5799, oldPrice: 6499, stock: 9, rating: 4.6, badge: "OEM FIT", description: "A durable replacement headlight assembly engineered for a clear beam pattern and easy installation.", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=85" },
    { id: "p-seatbike-1", name: "CloudRide Bike Seat Cover", category: "Bike Accessories", type: "Bike seat covers", price: 999, oldPrice: 1299, stock: 34, rating: 4.4, badge: "COMFORT", description: "A cushioned, breathable seat cover that adds comfort to everyday commutes and weekend rides.", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=85" },
    { id: "p-sparebike-1", name: "Precision Bike Service Kit", category: "Spare Parts", type: "Bike spare parts", price: 2799, oldPrice: 3299, stock: 17, rating: 4.5, badge: "SERVICE KIT", description: "A practical selection of quality replacement components for routine motorcycle maintenance.", image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85" },
    { id: "p-sparecar-1", name: "Essential Car Service Kit", category: "Spare Parts", type: "Car spare parts", price: 3899, oldPrice: 4499, stock: 15, rating: 4.6, badge: "VALUE KIT", description: "A carefully selected set of essential replacement parts to help keep your car running smoothly.", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=85" }
  ];

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("Unable to read AUTO GEAR storage:", error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Unable to save AUTO GEAR data. Storage may be full:", error);
      throw error;
    }
  }

  function getProducts() {
    const products = read(KEYS.products, null);
    if (!products) {
      write(KEYS.products, starterProducts);
      localStorage.setItem(KEYS.catalogVersion, "2");
      return starterProducts.slice();
    }
    if (localStorage.getItem(KEYS.catalogVersion) !== "2") {
      const byId = new Map(starterProducts.map(product => [product.id, product]));
      const stalePhotos = ["photo-1503738377798", "photo-1635784063383", "photo-1506629905607"];
      let migrated = products.map(product => {
        const current = byId.get(product.id);
        return current && stalePhotos.some(photo => String(product.image).includes(photo))
          ? { ...product, image: current.image }
          : product;
      });
      const bikeHelmet = byId.get("p-bike-helmet-1");
      if (bikeHelmet && !migrated.some(product => product.id === bikeHelmet.id)) migrated.unshift(bikeHelmet);
      write(KEYS.products, migrated);
      localStorage.setItem(KEYS.catalogVersion, "2");
      return migrated;
    }
    return products;
  }

  function setProducts(products) {
    write(KEYS.products, products);
    window.dispatchEvent(new CustomEvent("autogear:products-updated", { detail: products }));
  }

  function getList(key) { return read(key, []); }
  function setList(key, value) { write(key, value); }
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(KEYS.session) || "null"); }
    catch (error) { console.error("Unable to read login session:", error); return null; }
  }
  function setSession(user) { sessionStorage.setItem(KEYS.session, JSON.stringify(user)); }
  function clearSession() { sessionStorage.removeItem(KEYS.session); }

  window.AutoGearStore = {
    KEYS,
    getProducts,
    setProducts,
    getList,
    setList,
    getSession,
    setSession,
    clearSession,
    starterProducts
  };
})();
