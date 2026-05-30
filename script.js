const filters = document.querySelectorAll(".filter");
const productGrid = document.querySelector(".product-grid");
const catalogProducts = loadCatalogProducts();
renderCatalogProducts(catalogProducts);
const adminProducts = readAdminProducts();
renderAdminProducts(adminProducts);
const cards = document.querySelectorAll(".product-card");
const searchInput = document.querySelector("#gallery-search");
const sortInput = document.querySelector("#gallery-sort");
const galleryEmpty = document.querySelector(".gallery-empty");
const galleryPagination = document.querySelector(".gallery-pagination");
const galleryPagePrev = document.querySelector(".gallery-page-prev");
const galleryPageNext = document.querySelector(".gallery-page-next");
const galleryPageStatus = document.querySelector(".gallery-page-status");
const filterMoreButton = document.querySelector("[data-filter-more]");
const shareToast = document.createElement("div");
const form = document.querySelector(".contact-form");
const note = document.querySelector(".form-note");
const galleryTriggers = document.querySelectorAll(".gallery-trigger");
const galleryModals = document.querySelectorAll(".gallery-modal");
const langButtons = document.querySelectorAll(".lang-button");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".nav");
const isFullGallery = document.body.dataset.page === "gallery";
const pickHomeCards = (cardList) => {
  const allCards = Array.from(cardList);
  if (isFullGallery) return allCards;

  return allCards.slice(0, 8);
};
const visibleHomeCards = pickHomeCards(cards);
const GALLERY_PAGE_SIZE = 16;
const EUR_TO_UAH = 52;
const LOCAL_DISCOUNT = .8;
const WISHLIST_KEY = "petdecorWishlist";

shareToast.className = "share-toast";
shareToast.setAttribute("role", "status");
shareToast.setAttribute("aria-live", "polite");
document.body.append(shareToast);

if (!isFullGallery) {
  visibleHomeCards.forEach((card, index) => {
    card.style.order = index;
  });
}

let activeGallery = null;
let activeSlide = 0;
let isCarouselWrapping = false;
let currentLang = "ru";
let activeFilter = "all";
let galleryPage = 1;

const initSmoothScroll = () => {
  if (!window.Lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: .82,
    touchMultiplier: 1,
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };

  requestAnimationFrame(raf);
};

initSmoothScroll();

const initHeroCreature = () => {
  const creature = document.querySelector(".hero-creature");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!creature || motionQuery.matches) {
    creature?.classList.add("is-hidden");
    return;
  }

  // Hero cinemagraph timing for a 24 fps, 8 seconds + 1 frame video.
  // The frame helper keeps stop points readable as seconds + frames.
  const FPS = 24;
  const frame = (seconds, frames = 0) => seconds + (frames / FPS);
  const segmentSteps = [
    { from: frame(0, 0), to: frame(0, 16), pause: 6000 },
    { from: frame(0, 16), to: frame(1, 6), pause: 8000 },
    { from: frame(1, 6), to: frame(1, 20), pause: 6000 },
    { from: frame(1, 20), to: frame(2, 20), pause: 10000 },
    { from: frame(2, 20), to: frame(4, 13), pause: 6000 },
    { from: frame(4, 13), to: frame(5, 8), pause: 10000 },
    { from: frame(5, 8), to: frame(6, 4), pause: 8000 },
    { from: frame(6, 4), to: frame(6, 20), pause: 8000 },
    { from: frame(6, 20), to: frame(8, 0), pause: 15000 },
  ];

  let stepIndex = 0;
  let pauseTimer = null;
  let frameId = null;
  let isStopped = false;

  const stopTimers = () => {
    window.clearTimeout(pauseTimer);
    if (frameId) window.cancelAnimationFrame(frameId);
    pauseTimer = null;
    frameId = null;
  };

  const pauseCreature = () => {
    creature.pause();
    creature.classList.remove("is-active");
  };

  const waitForMetadata = () => new Promise((resolve) => {
    if (creature.readyState >= 1) {
      resolve();
      return;
    }

    creature.addEventListener("loadedmetadata", resolve, { once: true });
  });

  const playStep = async () => {
    if (isStopped || document.hidden) return;

    const step = segmentSteps[stepIndex];
    pauseCreature();

    await waitForMetadata();
    if (isStopped || document.hidden) return;

    creature.currentTime = step.from;
    creature.classList.add("is-active");

    try {
      await creature.play();
    } catch {
      pauseCreature();
      return;
    }

    const watchSegment = () => {
      if (isStopped || document.hidden) return;

      if (creature.currentTime >= step.to || creature.ended) {
        creature.pause();
        creature.currentTime = step.to;
        stepIndex = (stepIndex + 1) % segmentSteps.length;
        pauseTimer = window.setTimeout(playStep, step.pause);
        return;
      }

      frameId = window.requestAnimationFrame(watchSegment);
    };

    watchSegment();
  };

  document.addEventListener("visibilitychange", () => {
    stopTimers();

    if (document.hidden) {
      pauseCreature();
      return;
    }

    playStep();
  });

  motionQuery.addEventListener?.("change", (event) => {
    isStopped = event.matches;
    stopTimers();
    pauseCreature();
    creature.classList.toggle("is-hidden", event.matches);
    if (!event.matches) playStep();
  });

  pauseCreature();
  playStep();
};

initHeroCreature();

const initPageReveal = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const revealGroups = [
    [".hero-image, .hero-creature, .workshop-hero", 0, 1],
    [".hero .eyebrow, .workshop-hero .eyebrow", 70, 1],
    [".hero h1, .workshop-hero h1", 150, 1],
    [".hero-copy, .workshop-hero p", 240, 1],
    [".hero-actions", 340, 1],
    [".section-heading .eyebrow, .section-heading h2, .section-subtitle", 80, 90],
    [".gallery-search", 170, 1],
    [".filters", 250, 1],
    [".gallery-pagination, .intro > div, .set-grid article, .message-card, .review-quotes blockquote, .studio-grid > *, .contact-form, .social-panel, .workshop-story > *, .workshop-grid article, .admin-panel, .admin-item", 130, 85],
    [".product-card", 220, 75],
    [".product-card .piece-preview img", 320, 75],
    [".product-card .product-info", 420, 75],
  ];

  const revealItems = [];
  const seen = new Set();

  revealGroups.forEach(([selector, baseDelay, step]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (seen.has(element) || element.closest("[hidden]")) return;
      seen.add(element);
      element.classList.add("reveal-item");
      if (element.matches("img, .hero-image, .hero-creature, .workshop-hero")) {
        element.classList.add("reveal-image");
      }
      element.style.setProperty("--reveal-delay", `${baseDelay + (index * step)}ms`);
      revealItems.push(element);
    });
  });

  requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
    revealItems.forEach((element) => element.classList.add("is-revealed"));
  });
};

const initPageTransitions = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target && link.target !== "_self") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const nextUrl = new URL(href, window.location.href);
      const sameDocument = nextUrl.pathname === window.location.pathname && nextUrl.hash;
      const isLocalPage = nextUrl.protocol === window.location.protocol && /\.html$/i.test(nextUrl.pathname);

      if (!isLocalPage || sameDocument) return;

      event.preventDefault();
      document.body.classList.add("page-leaving");
      window.setTimeout(() => {
        window.location.href = nextUrl.href;
      }, 390);
    });
  });
};

initPageReveal();
initPageTransitions();

function readAdminProducts() {
  try {
    return JSON.parse(localStorage.getItem("petdecorAdminProducts") || "[]");
  } catch {
    return [];
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadCatalogProducts() {
  if (Array.isArray(window.PETDECOR_PRODUCTS?.products)) {
    fetch("data.json", { cache: "no-cache" })
      .then((response) => (response.ok ? response.json() : null))
      .then((catalog) => {
        if (Array.isArray(catalog?.products) && catalog.products.length) {
          window.PETDECOR_PRODUCTS.products = catalog.products;
        }
      })
      .catch(() => {
        // File previews and offline copies use data.js as the non-blocking fallback.
      });

    return window.PETDECOR_PRODUCTS.products;
  }

  return [];
}

function renderCatalogProducts(products) {
  if (!productGrid || !products.length) return;

  const scriptTag = document.querySelector('script[src="script.js"]');
  document.querySelectorAll(".gallery-modal").forEach((modal) => modal.remove());
  productGrid.innerHTML = "";

  products.forEach((product, index) => {
    const id = product.id || product.galleryId?.replace(/-gallery$/, "") || `product-${Date.now()}`;
    const galleryId = product.galleryId || `${id}-gallery`;
    const categories = (product.categories || []).filter(Boolean).join(" ");
    const preview = product.preview || {};
    const title = escapeHtml(product.title || "PetDecor product");
    const typeKey = product.typeKey ? ` data-i18n="${escapeHtml(product.typeKey)}"` : "";
    const descKey = product.descKey ? ` data-i18n="${escapeHtml(product.descKey)}"` : "";
    const type = escapeHtml(product.typeFallback || "");
    const desc = escapeHtml(product.descFallback || "");
    const price = Number(product.priceEur || 0);
    const popularity = Number(product.popularity || 0) || ((product.images || []).length * 10) + (product.categories?.includes("awards") ? 8 : 0) + (product.categories?.includes("panels") ? 5 : 0);
    const focusClass = preview.className ? ` class="${escapeHtml(preview.className)}"` : "";
    const searchText = escapeHtml([
      product.title,
      product.typeFallback,
      product.descFallback,
    ].filter(Boolean).join(" "));
    const searchKeys = escapeHtml([product.typeKey, product.descKey].filter(Boolean).join(" "));

    productGrid.insertAdjacentHTML("beforeend", `
        <article class="product-card featured-piece" id="${escapeHtml(id)}" data-product-id="${escapeHtml(id)}" data-category="${escapeHtml(categories)}" data-price-eur="${price}" data-popularity="${popularity}" data-sort-index="${index}" data-search-text="${searchText}" data-search-keys="${searchKeys}">
          <div class="product-card-actions" aria-label="Действия с изделием">
            <button class="wishlist-button" type="button" data-wishlist-product="${escapeHtml(id)}" aria-label="Добавить в вишлист">♡</button>
            <button class="share-button" type="button" data-share-product="${escapeHtml(id)}" data-share-title="${title}" aria-label="Поделиться изделием">↗</button>
          </div>
          <div class="piece-preview" aria-label="${escapeHtml(preview.ariaLabel || product.title || "")}">
            <button class="gallery-trigger" type="button" data-gallery="${escapeHtml(galleryId)}" aria-haspopup="dialog" aria-controls="${escapeHtml(galleryId)}" aria-label="Открыть галерею ${title}">
              <img loading="lazy"${focusClass} src="${escapeHtml(preview.src || "")}" alt="${escapeHtml(preview.alt || product.title || "")}">
            </button>
          </div>
          <div class="product-info">
            <span${typeKey}>${type}</span>
            <h3>${title}</h3>
            ${price ? `<p class="product-price" data-price-eur="${price}"></p>` : ""}
            <p${descKey}>${desc}</p>
          </div>
        </article>`);

    const images = (product.images || []).filter((image) => image.src);
    const slides = images.map((image) => `
            <div class="carousel-slide${image.fit ? " fit-slide" : ""}">
              <img loading="lazy"${image.className ? ` class="${escapeHtml(image.className)}"` : ""} src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || product.title || "")}">
            </div>`).join("");
    const dots = images.map((_, index) => `
        <button${index === 0 ? ' class="is-active"' : ""} type="button" aria-label="Фото ${index + 1}"></button>`).join("");

    const modal = document.createElement("div");
    modal.className = "gallery-modal";
    modal.id = galleryId;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", `${galleryId}-title`);
    modal.hidden = true;
    modal.innerHTML = `
    <button class="modal-backdrop" type="button" aria-label="Закрыть галерею"></button>
    <section class="modal-panel">
      <div class="modal-header">
        <div>
          <p class="eyebrow"${typeKey}>${type}</p>
          <h2 id="${galleryId}-title">${title}</h2>
          ${price ? `<p class="product-price modal-price" data-price-eur="${price}"></p>` : ""}
        </div>
        <div class="modal-actions">
          <button class="share-button share-button-modal" type="button" data-share-product="${escapeHtml(id)}" data-share-title="${title}" aria-label="Поделиться изделием">↗</button>
          <button class="wishlist-button wishlist-button-modal" type="button" data-wishlist-product="${escapeHtml(id)}" aria-label="Добавить в вишлист">♡</button>
          <button class="order-button order-button-modal" type="button" data-order-product="${title}" data-i18n="order.button">Заказать</button>
          <button class="modal-close" type="button" aria-label="Закрыть">×</button>
        </div>
      </div>
      <div class="carousel" aria-label="Карусель фотографий ${title}">
        <button class="carousel-control prev" type="button" aria-label="Предыдущее фото">‹</button>
        <div class="carousel-viewport">
          <div class="carousel-track">${slides}</div>
        </div>
        <button class="carousel-control next" type="button" aria-label="Следующее фото">›</button>
      </div>
      <div class="carousel-dots" aria-label="Выбор фотографии">${dots}</div>
    </section>`;

    document.body.insertBefore(modal, scriptTag);
  });
}

function textForLang(value, lang = "ru") {
  if (typeof value === "string") return value;
  return value?.[lang] || value?.ru || value?.en || "";
}

function renderAdminProducts(products) {
  if (!productGrid || !products.length) return;

  const scriptTag = document.querySelector('script[src="script.js"]');

  products.forEach((product, index) => {
    const id = product.id || `admin-${Date.now()}`;
    const categories = Array.from(new Set([product.category, ...(product.categories || [])].filter(Boolean))).join(" ");
    const images = (product.images || []).filter(Boolean);
    const mainImage = images[images.length - 1] || "";
    const title = escapeHtml(product.title || "Custom product");
    const type = escapeHtml(textForLang(product.type, "ru"));
    const desc = escapeHtml(textForLang(product.desc, "ru"));
    const price = Number(product.priceEur || product.price || 0);
    const popularity = Number(product.popularity || 0) || images.length * 10;
    const galleryId = `${id}-gallery`;
    const searchText = escapeHtml([
      textForLang(product.title, "ru"),
      textForLang(product.type, "ru"),
      textForLang(product.desc, "ru"),
      textForLang(product.title, "ua"),
      textForLang(product.type, "ua"),
      textForLang(product.desc, "ua"),
      textForLang(product.title, "en"),
      textForLang(product.type, "en"),
      textForLang(product.desc, "en"),
    ].filter(Boolean).join(" "));

    productGrid.insertAdjacentHTML("afterbegin", `
        <article class="product-card featured-piece" id="${escapeHtml(id)}" data-product-id="${escapeHtml(id)}" data-category="${escapeHtml(categories)}" data-admin-product="${escapeHtml(id)}" data-price-eur="${price}" data-popularity="${popularity}" data-sort-index="${index}" data-search-text="${searchText}">
          <div class="product-card-actions" aria-label="Действия с изделием">
            <button class="wishlist-button" type="button" data-wishlist-product="${escapeHtml(id)}" aria-label="Добавить в вишлист">♡</button>
            <button class="share-button" type="button" data-share-product="${escapeHtml(id)}" data-share-title="${title}" aria-label="Поделиться изделием">↗</button>
          </div>
          <div class="piece-preview" aria-label="${title}">
            <button class="gallery-trigger" type="button" data-gallery="${escapeHtml(galleryId)}" aria-haspopup="dialog" aria-controls="${escapeHtml(galleryId)}" aria-label="Открыть галерею ${title}">
              <img src="${mainImage}" alt="${title}">
            </button>
          </div>
          <div class="product-info">
            <span data-admin-field="type">${type}</span>
            <h3 data-admin-field="title">${title}</h3>
            ${price ? `<p class="product-price" data-price-eur="${price}"></p>` : ""}
            <p data-admin-field="desc">${desc}</p>
          </div>
        </article>`);

    const slides = images.map((image, index) => `
            <div class="carousel-slide${index < images.length - 1 ? " fit-slide" : ""}">
              <img${index < images.length - 1 ? ' class="fit-photo no-scale"' : ""} src="${image}" alt="${title}">
            </div>`).join("");
    const dots = images.map((_, index) => `
        <button${index === 0 ? ' class="is-active"' : ""} type="button" aria-label="Фото ${index + 1}"></button>`).join("");

    const modal = document.createElement("div");
    modal.className = "gallery-modal";
    modal.id = galleryId;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", `${galleryId}-title`);
    modal.hidden = true;
    modal.dataset.adminProduct = id;
    modal.innerHTML = `
    <button class="modal-backdrop" type="button" aria-label="Закрыть галерею"></button>
    <section class="modal-panel">
      <div class="modal-header">
        <div>
          <p class="eyebrow" data-admin-field="type">${type}</p>
          <h2 id="${galleryId}-title" data-admin-field="title">${title}</h2>
          ${price ? `<p class="product-price modal-price" data-price-eur="${price}"></p>` : ""}
        </div>
        <div class="modal-actions">
          <button class="share-button share-button-modal" type="button" data-share-product="${escapeHtml(id)}" data-share-title="${title}" aria-label="Поделиться изделием">↗</button>
          <button class="wishlist-button wishlist-button-modal" type="button" data-wishlist-product="${escapeHtml(id)}" aria-label="Добавить в вишлист">♡</button>
          <button class="order-button order-button-modal" type="button" data-order-product="${title}" data-i18n="order.button">Заказать</button>
          <button class="modal-close" type="button" aria-label="Закрыть">×</button>
        </div>
      </div>
      <div class="carousel" aria-label="Карусель фотографий ${title}">
        <button class="carousel-control prev" type="button" aria-label="Предыдущее фото">‹</button>
        <div class="carousel-viewport">
          <div class="carousel-track">${slides}</div>
        </div>
        <button class="carousel-control next" type="button" aria-label="Следующее фото">›</button>
      </div>
      <div class="carousel-dots" aria-label="Выбор фотографии">${dots}</div>
    </section>`;

    document.body.insertBefore(modal, scriptTag);
  });
}

const formatPrice = (priceEur, lang) => {
  if (!priceEur) return "";

  if (lang === "en") {
    return `From €${Math.round(priceEur)}`;
  }

  const localPrice = Math.round((priceEur * EUR_TO_UAH * LOCAL_DISCOUNT) / 100) * 100;
  return lang === "ua" ? `Ціна від ${localPrice} грн` : `Цена от ${localPrice} грн`;
};

const formatAwardSetPrice = (lang) => {
  if (lang === "en") return "From €75 each / from €250 set of 4";
  if (lang === "ua") return "Ціна від 75 € за штуку / від 250 € серія з 4";
  return "Цена от 75 € за штуку / от 250 € серия из 4";
};

const getCardPriceEur = (card) => {
  return Number(card.dataset.priceEur || 0);
};

const readWishlist = () => {
  try {
    const value = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeWishlist = (items) => {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(Array.from(new Set(items))));
};

const updateWishlistButtons = () => {
  const wishlist = new Set(readWishlist());
  const count = wishlist.size;

  const trigger = document.querySelector(".wishlist-trigger");
  const badge = document.querySelector(".wishlist-badge");
  if (trigger) {
    trigger.classList.toggle("has-items", count > 0);
    trigger.hidden = false;
  }
  if (badge) badge.textContent = count > 0 ? String(count) : "";

  document.querySelectorAll(".product-card").forEach((card) => {
    const productId = card.dataset.productId || card.id;
    card.classList.toggle("is-wishlisted", wishlist.has(productId));
  });

  document.querySelectorAll("[data-wishlist-product]").forEach((button) => {
    const isActive = wishlist.has(button.dataset.wishlistProduct);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.setAttribute("aria-label", isActive ? "Убрать из вишлиста" : "Добавить в вишлист");
    button.textContent = isActive ? "♥" : "♡";
  });

  if (document.body.classList.contains("wishlist-panel-open")) {
    renderWishlistItems();
  }
};

const TELEGRAM_USERNAME = "PetDecor";

const getAllWishlistProducts = () => [...catalogProducts, ...readAdminProducts()];

const getProductByWishlistId = (id) => getAllWishlistProducts().find((product) => (
  (product.id || product.galleryId?.replace(/-gallery$/, "")) === id
));

const buildTelegramMessage = (wishlistIds, lang) => {
  const lines = wishlistIds.map((id) => {
    const product = getProductByWishlistId(id);
    if (!product) return null;

    const title = product.title || id;
    const price = Number(product.priceEur || product.price || 0);
    const priceStr = price ? ` (от €${Math.round(price)})` : "";
    return `- ${title}${priceStr}`;
  }).filter(Boolean);

  if (!lines.length) return "";

  const greetings = {
    ru: "Здравствуйте! Меня интересуют изделия PetDecor:",
    ua: "Доброго дня! Мене цікавлять вироби PetDecor:",
    en: "Hello! I'm interested in these PetDecor items:",
  };

  return `${greetings[lang] || greetings.ru}\n${lines.join("\n")}`;
};

const renderWishlistItems = () => {
  const list = document.querySelector(".wishlist-panel-list");
  if (!list) return;

  const ids = readWishlist();

  if (!ids.length) {
    const emptyLabels = {
      ru: "Вы ещё ничего не отложили. Нажмите ♡ на карточке изделия.",
      ua: "Ви ще нічого не відклали. Натисніть ♡ на картці виробу.",
      en: "Nothing saved yet. Tap ♡ on any product card.",
    };
    list.innerHTML = `<p class="wishlist-empty">${emptyLabels[currentLang] || emptyLabels.ru}</p>`;
    return;
  }

  list.innerHTML = ids.map((id) => {
    const product = getProductByWishlistId(id);
    if (!product) return "";

    const title = escapeHtml(product.title || id);
    const price = Number(product.priceEur || product.price || 0);
    const priceStr = price ? formatPrice(price, currentLang) : "";
    const thumb = product.preview?.src || product.images?.[0]?.src || "";
    const imgTag = thumb
      ? `<img class="wishlist-item-thumb" src="${escapeHtml(thumb)}" alt="${title}" loading="lazy">`
      : '<div class="wishlist-item-thumb"></div>';

    return `
      <div class="wishlist-item" data-wishlist-id="${escapeHtml(id)}">
        ${imgTag}
        <div>
          <p class="wishlist-item-name">${title}</p>
          ${priceStr ? `<p class="wishlist-item-price">${escapeHtml(priceStr)}</p>` : ""}
        </div>
        <button class="wishlist-item-remove" type="button" data-remove-wishlist="${escapeHtml(id)}" aria-label="Убрать из избранного">×</button>
      </div>`;
  }).join("");
};

const openWishlistPanel = () => {
  const panel = document.querySelector(".wishlist-panel");
  if (!panel) return;

  renderWishlistItems();
  panel.hidden = false;
  requestAnimationFrame(() => document.body.classList.add("wishlist-panel-open"));
};

const closeWishlistPanel = () => {
  document.body.classList.remove("wishlist-panel-open");
  window.setTimeout(() => {
    const panel = document.querySelector(".wishlist-panel");
    if (panel && !document.body.classList.contains("wishlist-panel-open")) {
      panel.hidden = true;
    }
  }, 300);
};

const buildWishlistPanel = () => {
  const panel = document.createElement("div");
  panel.className = "wishlist-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Избранное");

  const sendLabels = {
    ru: "Отправить подборку в Telegram",
    ua: "Надіслати добірку в Telegram",
    en: "Send selection to Telegram",
  };
  const clearLabels = {
    ru: "Очистить избранное",
    ua: "Очистити обране",
    en: "Clear wishlist",
  };
  const titleLabels = {
    ru: "Избранное",
    ua: "Обране",
    en: "Wishlist",
  };

  panel.innerHTML = `
    <button class="wishlist-panel-backdrop" type="button" aria-label="Закрыть"></button>
    <div class="wishlist-panel-sheet">
      <div class="wishlist-panel-head">
        <h3 class="wishlist-panel-title">${titleLabels[currentLang] || titleLabels.ru}</h3>
        <button class="wishlist-panel-close" type="button" aria-label="Закрыть">×</button>
      </div>
      <div class="wishlist-panel-list"></div>
      <div class="wishlist-panel-footer">
        <button class="wishlist-send-btn" type="button">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 4.8 3.8 11.4c-1.1.4-1.1 1.1-.2 1.4l4.4 1.4 1.7 5.2c.2.7.6.9 1.1.4l2.5-2.4 4.5 3.3c.8.4 1.3.2 1.5-.8L22 5.8c.2-1-.4-1.4-1-.9Z"/>
          </svg>
          ${sendLabels[currentLang] || sendLabels.ru}
        </button>
        <button class="wishlist-clear-btn" type="button">${clearLabels[currentLang] || clearLabels.ru}</button>
      </div>
    </div>`;

  document.body.append(panel);

  panel.querySelector(".wishlist-panel-backdrop").addEventListener("click", closeWishlistPanel);
  panel.querySelector(".wishlist-panel-close").addEventListener("click", closeWishlistPanel);

  let touchStartY = 0;
  let touchDeltaY = 0;
  const sheet = panel.querySelector(".wishlist-panel-sheet");
  sheet.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0].clientY;
    touchDeltaY = 0;
  }, { passive: true });
  sheet.addEventListener("touchmove", (event) => {
    touchDeltaY = event.touches[0].clientY - touchStartY;
  }, { passive: true });
  sheet.addEventListener("touchend", () => {
    if (touchDeltaY > 80) closeWishlistPanel();
    touchDeltaY = 0;
  });

  panel.querySelector(".wishlist-panel-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-wishlist]");
    if (!button) return;

    const wishlist = new Set(readWishlist());
    wishlist.delete(button.dataset.removeWishlist);
    writeWishlist(Array.from(wishlist));
    updateWishlistButtons();
    applyGalleryFilters();
  });

  panel.querySelector(".wishlist-send-btn").addEventListener("click", () => {
    const ids = readWishlist();
    if (!ids.length) return;

    const message = buildTelegramMessage(ids, currentLang);
    const url = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  });

  panel.querySelector(".wishlist-clear-btn").addEventListener("click", () => {
    writeWishlist([]);
    updateWishlistButtons();
    applyGalleryFilters();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("wishlist-panel-open")) {
      closeWishlistPanel();
    }
  });
};

buildWishlistPanel();

document.addEventListener("click", (event) => {
  if (event.target.closest(".wishlist-trigger")) openWishlistPanel();
});

const showShareToast = (messageKey) => {
  shareToast.textContent = translations[currentLang]?.[messageKey] || translations.ru[messageKey] || "";
  shareToast.classList.add("is-visible");
  window.clearTimeout(showShareToast.timer);
  showShareToast.timer = window.setTimeout(() => {
    shareToast.classList.remove("is-visible");
  }, 2200);
};

const getProductUrl = (productId) => {
  const url = new URL(`products/${encodeURIComponent(productId)}.html`, window.location.href);
  return url.toString();
};

const getSortedCards = (cardList) => {
  const mode = sortInput?.value || "new";
  const wishlist = new Set(readWishlist());

  return [...cardList].sort((a, b) => {
    if (mode === "price-asc") return getCardPriceEur(a) - getCardPriceEur(b);
    if (mode === "price-desc") return getCardPriceEur(b) - getCardPriceEur(a);
    if (mode === "popular") {
      const wishDiff = Number(wishlist.has(b.dataset.productId)) - Number(wishlist.has(a.dataset.productId));
      if (wishDiff) return wishDiff;
      return Number(b.dataset.popularity || 0) - Number(a.dataset.popularity || 0);
    }

    return Number(a.dataset.sortIndex || 0) - Number(b.dataset.sortIndex || 0);
  });
};

const ensureProductPrices = () => {
  cards.forEach((card) => {
    const info = card.querySelector(".product-info");
    if (!info) return;

    const price = getCardPriceEur(card);
    if (!price) return;

    card.dataset.priceEur = String(price);

    let priceElement = info.querySelector(".product-price");
    if (!priceElement) {
      priceElement = document.createElement("p");
      priceElement.className = "product-price";
      info.append(priceElement);
    }

    priceElement.dataset.priceEur = String(price);
    if (card.dataset.productId === "mono-breed-show-awards") {
      priceElement.dataset.priceMode = "award-set";
    }
  });
};

const updateProductPrices = () => {
  document.querySelectorAll(".product-price").forEach((element) => {
    if (element.dataset.priceMode === "award-set") {
      element.textContent = formatAwardSetPrice(currentLang);
      return;
    }

    const price = Number(element.dataset.priceEur || element.closest(".product-card")?.dataset.priceEur || 0);
    element.textContent = formatPrice(price, currentLang);
  });
};

ensureProductPrices();

function updateAdminProductText(lang) {
  adminProducts.forEach((product) => {
    document.querySelectorAll(`[data-admin-product="${product.id}"]`).forEach((root) => {
      const title = root.querySelector('[data-admin-field="title"]');
      const type = root.querySelector('[data-admin-field="type"]');
      const desc = root.querySelector('[data-admin-field="desc"]');

      if (title) title.textContent = product.title || "";
      if (type) type.textContent = textForLang(product.type, lang);
      if (desc) desc.textContent = textForLang(product.desc, lang);
    });
  });
}

const buildMobileMenu = () => {
  if (!menuToggle || !siteNav) return;

  const overlay = document.createElement("div");
  overlay.className = "mobile-menu";
  overlay.hidden = true;
  overlay.innerHTML = `
    <button class="mobile-menu-backdrop" type="button" aria-label="Закрыть меню"></button>
    <div class="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Навигация">
      <div class="mobile-menu-head">
        <span>PetDecor</span>
        <button class="mobile-menu-close" type="button" aria-label="Закрыть меню">×</button>
      </div>
      <nav class="mobile-menu-nav" aria-label="Мобильная навигация"></nav>
      <div class="mobile-menu-lang" aria-label="Language switch"></div>
    </div>`;

  const mobileNav = overlay.querySelector(".mobile-menu-nav");
  const mobileLang = overlay.querySelector(".mobile-menu-lang");
  const panel = overlay.querySelector(".mobile-menu-panel");
  let menuTouchStartX = 0;
  let menuTouchDeltaX = 0;
  let isMenuSwiping = false;

  siteNav.querySelectorAll("a").forEach((link) => {
    const clone = link.cloneNode(true);
    clone.addEventListener("click", () => closeMobileMenu());
    mobileNav.append(clone);
  });

  langButtons.forEach((button) => {
    const clone = button.cloneNode(true);
    clone.addEventListener("click", () => {
      setLanguage(clone.dataset.lang);
      closeMobileMenu();
    });
    mobileLang.append(clone);
  });

  document.body.append(overlay);

  const openMobileMenu = () => {
    overlay.hidden = false;
    requestAnimationFrame(() => document.body.classList.add("menu-open"));
    menuToggle.setAttribute("aria-expanded", "true");
  };

  function closeMobileMenu() {
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!document.body.classList.contains("menu-open")) overlay.hidden = true;
    }, 320);
  }

  menuToggle.addEventListener("click", () => {
    if (document.body.classList.contains("menu-open")) {
      closeMobileMenu();
      return;
    }

    openMobileMenu();
  });

  overlay.querySelector(".mobile-menu-backdrop").addEventListener("click", closeMobileMenu);
  overlay.querySelector(".mobile-menu-close").addEventListener("click", closeMobileMenu);

  panel?.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    menuTouchStartX = touch.clientX;
    menuTouchDeltaX = 0;
    isMenuSwiping = true;
    panel.style.transition = "none";
  }, { passive: true });

  panel?.addEventListener("touchmove", (event) => {
    if (!isMenuSwiping) return;
    const touch = event.touches[0];
    menuTouchDeltaX = Math.max(0, touch.clientX - menuTouchStartX);
    panel.style.transform = `translateX(${menuTouchDeltaX}px)`;
  }, { passive: true });

  panel?.addEventListener("touchend", () => {
    if (!isMenuSwiping) return;
    isMenuSwiping = false;
    panel.style.transition = "";
    panel.style.transform = "";

    if (menuTouchDeltaX > 80) closeMobileMenu();
    menuTouchDeltaX = 0;
  });

  panel?.addEventListener("touchcancel", () => {
    isMenuSwiping = false;
    panel.style.transition = "";
    panel.style.transform = "";
    menuTouchDeltaX = 0;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
      closeMobileMenu();
    }
  });
};

buildMobileMenu();

const translations = {
  ru: {
    "nav.home": "Studio",
    "nav.gallery": "Каталог",
    "nav.rooms": "Коллекция",
    "nav.studio": "Мастерская",
    "nav.contacts": "Контакты",
    "nav.cta": "Private edit",
    "hero.eyebrow": "Curated pet interiors",
    "hero.copy": "PetDecor Studio — это пространство авторского декора, созданного с вниманием к атмосфере, материалам и деталям. Мы превращаем дерево, металл и свет в объекты, которые добавляют характер и тепло вашему пространству.",
    "hero.primary": "Смотреть галерею",
    "hero.secondary": "Обсудить проект",
    "workshop.eyebrow": "Workshop",
    "workshop.heroCopy": "PetDecor Studio — мастерская из Николаева, Украина, где идеи превращаются в реальные объекты.",
    "workshop.storyTitle": "Мастерская, где идея проходит путь от эскиза до готового объекта.",
    "workshop.story1": "PetDecor Studio — мастерская из Николаева, Украина, где идеи превращаются в реальные объекты.",
    "workshop.story2": "Мы сами придумываем, проектируем и создаем изделия — от первых эскизов до финальной сборки. Работаем с металлом, деревом, эпоксидной смолой, сланцем, подсветкой и декоративными материалами.",
    "workshop.story3": "Вручную льем смолу, работаем со сваркой и обработкой материалов, создаем нестандартные конструкции и постоянно экспериментируем с новыми технологиями, формами и фактурами.",
    "workshop.story4": "Для реализации проектов используем как собственное производство, так и высокотехнологичное оборудование проверенных подрядчиков. На стороне изготавливаются только отдельные детали — сама идея, конструкция, дизайн и финальный результат полностью создаются внутри мастерской.",
    "workshop.story5": "Мы любим сложные задачи и с интересом погружаемся в новые проекты. Чем необычнее идея — тем интереснее работа.",
    "workshop.location": "Mykolaiv, Ukraine<br>PetDecor Studio",
    "workshop.materialsTitle": "Материалы",
    "workshop.materialsText": "Дерево, латунь, нержавеющая сталь, фанера, стекло и эпоксидная смола. Мы подбираем фактуры так, чтобы предмет выглядел спокойно, дорого и жил в интерьере без визуального шума.",
    "workshop.approachTitle": "Подход",
    "workshop.approachText": "Изделие начинается с силуэта и сценария: где оно будет висеть, что должно хранить, какой питомец или порода станет главным мотивом. Затем идет подбор материала, гравировка, резка, сборка и финиш.",
    "workshop.customTitle": "Индивидуальность",
    "workshop.customText": "Можно адаптировать композицию под питомник, дом, подарок или конкретное животное: породу, кличку, название, адрес, размер, оттенок дерева и тип металла.",
    "intro.1.title": "Objects, not clutter",
    "intro.1.text": "скульптурные формы, темные покрытия, чистая геометрия",
    "intro.2.title": "Made for daily rituals",
    "intro.2.text": "панно, кронштейны, шкатулки и подарочные объекты для дома",
    "intro.3.title": "Warm material language",
    "intro.3.text": "дерево, металл, стекло, гравировка и фурнитура под старую латунь",
    "gallery.eyebrow": "Каталог",
    "gallery.title": "Декор,&nbsp;в&nbsp;котором<br>живёт&nbsp;характер.",
    "gallery.subtitle": "Для интерьера, улицы и сувениров",
    "homeGallery.title": "Свежее&nbsp;из<br>мастерской.",
    "homeGallery.subtitle": "Восемь актуальных работ PetDecor. Полная коллекция — в галерее.",
    "homeGallery.allLink": "Смотреть все изделия →",
    "search.label": "Поиск по галерее",
    "search.placeholder": "панно, сталь, поводки, латунь",
    "search.empty": "Ничего не найдено. Попробуйте другое слово или раздел.",
    "sort.label": "Сортировка",
    "sort.new": "Новые",
    "sort.popular": "Популярные",
    "sort.priceAsc": "По цене ↑",
    "sort.priceDesc": "По цене ↓",
    "share.copied": "Ссылка на изделие скопирована",
    "share.error": "Не удалось скопировать ссылку",
    "filter.all": "Все изделия",
    "filter.panels": "Панно",
    "filter.brackets": "Кронштейны",
    "filter.hangers": "Вешалки",
    "filter.signs": "Вывески",
    "filter.addressSign": "Адресная вывеска",
    "filter.decorSigns": "Декоративные таблички",
    "filter.lightSign": "Вывеска с подсветкой",
    "filter.giftsets": "Предметы сервировки и подарки",
    "filter.giftSetsSub": "Подарочные наборы",
    "filter.boxes": "Шкатулки",
    "filter.glasses": "Стаканы",
    "filter.thermosFlasks": "Термосы и фляги",
    "filter.napkinHolders": "Салфетницы",
    "filter.keychains": "Брелоки, брошки",
    "filter.magnets": "Магниты",
    "filter.epoxy": "Декор из эпоксидной смолы",
    "filter.nightlights": "Ночники",
    "filter.clocks": "Часы",
    "filter.clockMetal": "Металл",
    "filter.clockAcrylic": "Акрил",
    "filter.clockEpoxy": "Эпоксидная смола",
    "filter.awards": "Призы",
    "filter.more": "Ещё",
    "filter.sheetTitle": "Все категории",
    "slateKennel.type": "Decorative plaque",
    "slateKennel.desc": "Авторская интерьерная интерпретация логотипа питомника: глубокая фактура черного сланца и холодный блеск шлифованной стали превращают фирменный знак в спокойный премиальный акцент для стены, полки или зоны наград. Натуральный черный сланец 30 × 20 см, шлифованная нержавеющая сталь, настенное или настольное размещение.",
    "silverLabradorClock.type": "Clock",
    "silverLabradorClock.desc": "Декоративные настенные часы с лабрадором и бабочкой: серебряный акрил на темном циферблате создает сдержанный холодный акцент для кухни, кабинета или современного интерьера. Выполнены из серебряного акрила, диаметр 27 см, фасад — стекло.",
    "forgedLabradorBracket.type": "Кронштейн",
    "forgedLabradorBracket.desc": "Металлический кронштейн с коваными деталями и подвесной табличкой: силуэт лабрадора, декоративная консоль и профильная труба собраны в выразительный фасадный акцент для питомника, входной зоны или сада. Размер кронштейна 50 см; металл 2 мм, профильная труба 15 мм, кованый декоративный элемент.",
    "ringNumberHolder.type": "Держатель номера",
    "ringNumberHolder.desc": "Держатель рингового номера ручной работы: силуэт собаки из эпоксидной смолы с глиттерной заливкой, декоративная проволока по контуру и металлический зажим для крепления номера. Каждое изделие получает уникальный рисунок заливки.",
    "goldRingNumberHolder.type": "Держатель номера",
    "goldRingNumberHolder.desc": "Держатель рингового номера ручной работы: декоративная проволока формирует выразительный контур, глиттер и золотая поталь дают живой блеск, а прозрачная эпоксидная смола защищает композицию и добавляет глубину.",
    "monoBreedAwards.type": "Призы",
    "monoBreedAwards.desc": "Призы для монопородной выставки: серия наград с силуэтами собак, птицами и декоративными титулами BOB, BOS, WB и WD. Основа выполнена из полированной маслины; композиция сочетает нержавеющую сталь 2 мм и латунь 2 мм, отполированные разными техниками для контраста фактур и мягкого металлического блеска. Цена от 75 € за штуку, от 250 € серия из 4 штук.",
    "labradorExpertPlates.type": "Призы",
    "labradorExpertPlates.desc": "Призы от эксперта для монопородной выставки лабрадоров: декоративные тарелки с персонализированными титулами BOB, BOS и Best Junior. Диаметр тарелки 27 см, анодированное покрытие с эффектом хромирования, размещение на прозрачной подставке.",
    "huskySlateAward.type": "Настенный приз",
    "huskySlateAward.desc": "Черный сланец и нержавеющая сталь превращают приз в интерьерный объект, который хочется повесить на стену, а не убрать в ящик. Детализированный портрет хаски, северные мотивы по кругу и персональная подпись на обратной стороне сохраняют характер события на годы. Технические характеристики: натуральный черный сланец, нержавеющая сталь 2 мм, диаметр 30 см, двусторонняя гравировка, изготовление 2-3 недели.",
    "goldenRetrieverClock.type": "Clock",
    "goldenRetrieverClock.desc": "Декоративные настенные часы с композицией, где голден ретривер наблюдает за бабочкой: золотой силуэт на темном циферблате создает теплый акцент для спокойного интерьера. Выполнены из золотого акрила, диаметр 27 см, фасад — стекло.",
    "goldClock.type": "Clock",
    "goldClock.desc": "Декоративные настенные часы с щенком лабрадора: теплый золотой силуэт на темном циферблате добавляет интерьеру мягкий акцент и немного характера. Выполнены из золотого акрила, диаметр 27 см, фасад — стекло.",
    "addressPlate.type": "Address sign",
    "addressPlate.desc": "Адресная табличка для фасада или входной зоны: силуэт лабрадора, декоративная листва и номер дома в теплой шоколадной патине. Металл 2 мм, шоколадная порошковая краска и ручное патинирование.",
    "blackChocolateSign.type": "Вывеска с подсветкой",
    "blackChocolateSign.desc": "Авторская вывеска питомника: название, силуэты лабрадоров и теплая контурная LED-подсветка объединены в один выразительный фасадный объект. Композиция дополнена декоративным кронштейном для подвесного кашпо. Металл 2 мм, порошковая покраска, бэк LED-подсветка теплого свечения, размер 1 × 1,7 м.",
    "bellaMarePanel.type": "Подарочное панно",
    "bellaMarePanel.desc": "Подарочное панно для питомника Bella Mare: теплая фактура ясеня, название питомника и декоративные элементы из нержавеющей стали собраны в чистую интерьерную композицию. Перламутровый глиттер и прозрачная эпоксидная смола добавляют глубину и мягкий блеск. Размер 50 × 30 см, основа — ясень, декор — нержавеющая сталь.",
    "panel.type": "Wall panel",
    "panel.desc": "Компактный вертикальный акцент для гостиной, прихожей или кабинета: черный силуэт собаки, камышей и летящей птицы на теплой деревянной основе. Декоративное панно, размер 17 × 42 см.",
    "bracket.type": "Kennel sign",
    "bracket.desc": "Авторский акцент для входной зоны, вольера или фасада питомника: силуэт русской борзой и подвесная табличка Radiance Soul в теплой бронзовой патине. Кронштейн с декоративной консолью и названием питомника; металл 2 мм, порошковая покраска и ручное патинирование.",
    "box.type": "Gift set",
    "box.desc": "Камерный подарочный набор для дома или кабинета: внутри два стакана с лазерной гравировкой, уложенные в деревянную шкатулку. Шкатулка из фанеры 6 мм, лазерная гравировка, фурнитура под старую латунь.",
    "keyholder.type": "Key holder shelf",
    "keyholder.desc": "Силуэт охотника с собакой добавляет предмету характер и делает входную зону теплее. Вешалка-ключница с деревянной полкой, черными декоративными боковинами и крючками для ключей, поводков и обувной ложки, размер 25 см.",
    "leashShelf.type": "Leash shelf",
    "leashShelf.desc": "Практичная вещь для прихожей: черный силуэт собак, декоративные крючки и место для поводков собирают ежедневные мелочи в один аккуратный акцент. Полка-ключница размером 27 см; доска — полированная и брашированная сосна, обработанная маслом-воском.",
    "bathShelfHanger.type": "Вешалка с полкой",
    "bathShelfHanger.desc": "Вешалка с полкой для бани с авторской композицией: черный патинированный металл, теплая фактура брашированной и отполированной сосны и декоративная сцена из нержавеющей стали создают выразительный банный акцент. Технические характеристики: черный патинированный металл, брашированная и полированная сосна, композиция из нержавеющей стали.",
    "cosmicCatHanger.type": "Мини-вешалка",
    "cosmicCatHanger.desc": "Космическая кошка — авторская ключница и мини-вешалка ручной работы для ключей, аксессуаров и поводков. Металлическая основа покрыта многослойной эпоксидной смолой с глиттерным эффектом галактики, декоративные элементы выполнены из латуни; размер около 20 см, каждое изделие получает уникальный рисунок заливки.",
    "acaciaPanel.type": "Wall panel",
    "acaciaPanel.desc": "Теплая древесина, мягкий блеск металла и прозрачная глубина смолы создают спокойный акцент для гостиной, кабинета или загородного интерьера. Панно из акации, размер 45 × 14 см; композиция из латуни покрыта эпоксидной смолой.",
    "napkinHolder.type": "Tableware object",
    "napkinHolder.desc": "Практичный предмет сервировки, который добавляет столу характер и аккуратный блеск: собака, птицы и камыши собраны в ажурной полированной композиции. Салфетница из нержавеющей стали, толщина 2 мм.",
    "paperweight.type": "Epoxy decor",
    "paperweight.desc": "Спокойный акцент для письменного стола, кабинета или подарка: в прозрачном бирюзовом объеме застыл силуэт лабрадора. Пресс-папье выполнено из эпоксидной смолы и дерева каповой маслины; силуэт — из нержавеющей стали.",
    "roundHuntPanel.type": "Wall panel",
    "roundHuntPanel.desc": "Сцена охоты на утку с лабрадором в теплой древесной фактуре, закрытая прозрачной глубиной смолы. Панно из акации, диаметр 19 см; композиция из латуни, комбинированной с нержавеющей сталью, под эпоксидной смолой.",
    "nook.type": "Wall piece",
    "nook.desc": "Настенный маршрут с мягкой ступенью, скрытым крепежом и графитовой тканью.",
    "soft.type": "Soft form",
    "soft.desc": "Низкая lounge-форма с деревянным бортом, плотной подушкой и съемным чехлом.",
    "bowl.type": "Dining object",
    "bowl.desc": "Керамическая станция с устойчивым основанием и матовой фактурой для темных кухонь.",
    "toy.type": "Utility object",
    "toy.desc": "Текстильная емкость для игрушек, поводков и пледов как спокойный интерьерный объект.",
    "rooms.eyebrow": "Rooms",
    "rooms.title": "Галерея как набор интерьерных сценариев",
    "rooms.1": "Матовый графит, дымчатое стекло и мягкий текстиль без визуального шума.",
    "rooms.2": "Черная база с янтарными деталями для теплых вечерних комнат.",
    "rooms.3": "Дерево, латунь и гравировка для вещей, которые хочется рассматривать близко.",
    "reviews.eyebrow": "Messages",
    "reviews.title": "Отзывы, которые звучат как продолжение интерьера.",
    "reviews.subtitle": "Живые сообщения от клиентов после получения заказов.",
    "reviews.chat1.in": "Панно приехало, дерево вживую еще глубже, чем на фото.",
    "reviews.chat1.out": "Очень рада, что оно попало именно в этот угол комнаты.",
    "reviews.chat2.in": "Ключница выглядит как предмет, который был здесь всегда.",
    "reviews.chat2.out": "Спасибо за точный размер и спокойный черный металл.",
    "reviews.chat3.in": "Подарочный набор получился очень личным, не похожим на магазинный.",
    "reviews.chat3.out": "Гравировка на стаканах — отдельная любовь.",
    "reviews.chat4.in": "Добрый день. Заказ получила, как всегда все на высшем уровне!) уже готовлю подпись для следующего набора 😊",
    "reviews.chat4.mid": "Благодарю 😭",
    "reviews.chat4.out": "Буду вручать завтра после обеда, прошу вас до этого времени не выставлять фото)",
    "reviews.husky.product": "Панно с хаски",
    "reviews.husky.category": "Husky Slate Award",
    "reviews.chat5.out": "Как нашему эксперту изделия понравились?",
    "reviews.chat5.in1": "Даа",
    "reviews.chat5.in2": "И не только ей, все просто в восторге",
    "reviews.chat5.in3": "И за подстаканники отдельное спасибо",
    "reviews.quote1": "«Вещь не просто красивая — она сразу добавила комнате характер».",
    "reviews.author1": "Клиент PetDecor",
    "reviews.quote2": "«Понравилось, что декор получился тёплым, но без лишней декоративности».",
    "reviews.author2": "Заказ для дома",
    "reviews.quote3": "«Сразу видно ручную работу: металл, дерево и детали выглядят очень цельно».",
    "reviews.author3": "Индивидуальный проект",
    "reviews.quote4": "«Заказ получила, как всегда все на высшем уровне. Уже готовлю подпись для следующего набора».",
    "reviews.author4": "Подарочный набор",
    "reviews.quote5": "«И не только ей, все просто в восторге. И за подстаканники отдельное спасибо».",
    "reviews.author5": "Панно с хаски",
    "studio.eyebrow": "Styling desk",
    "studio.title": "Соберем private edit под комнату, привычки питомца и ваш визуальный код.",
    "form.name": "Имя",
    "form.contact": "Как связаться",
    "form.requestType": "Тип запроса",
    "form.ready": "Готовое изделие",
    "form.custom": "Под заказ",
    "form.gift": "Подарок",
    "form.budget": "Бюджет",
    "form.budgetLow": "До 500 грн",
    "form.budgetMiddle": "500–1500 грн",
    "form.budgetHigh": "1500–3000 грн",
    "form.budgetPremium": "От 3000 грн",
    "form.budgetDiscuss": "Обсудим",
    "form.wishes": "Пожелания (необязательно)",
    "form.deadline": "Срок",
    "form.deadlineFlexible": "Не срочно",
    "form.deadlineSoon": "1–2 недели",
    "form.deadlineMonth": "До месяца",
    "form.deadlineDate": "К конкретной дате",
    "form.submit": "Отправить заявку",
    "form.namePlaceholder": "Анна",
    "form.contactPlaceholder": "Телефон или Telegram",
    "form.wishesPlaceholder": "Материал, размер, питомец, место размещения",
    "form.sending": "Отправляем заявку...",
    "form.success": "Заявка отправлена. Мы подготовим подборку PetDecor.",
    "form.error": "Не удалось отправить заявку. Попробуйте еще раз или напишите нам в соцсетях.",
    "order.button": "Заказать",
    "order.prefill": "Интересует изделие:",
    "related.title": "Похожие изделия",
    "social.title": "Соцсети",
  },
  ua: {
    "nav.home": "Studio",
    "nav.gallery": "Каталог",
    "nav.rooms": "Колекція",
    "nav.studio": "Майстерня",
    "nav.contacts": "Контакти",
    "nav.cta": "Private edit",
    "hero.eyebrow": "Curated pet interiors",
    "hero.copy": "PetDecor Studio — це простір авторського декору, створеного з увагою до атмосфери, матеріалів і деталей. Ми перетворюємо дерево, метал і світло на об'єкти, що додають характер і тепло вашому простору.",
    "hero.primary": "Дивитися галерею",
    "hero.secondary": "Обговорити проєкт",
    "workshop.eyebrow": "Workshop",
    "workshop.heroCopy": "PetDecor Studio — майстерня з Миколаєва, Україна, де ідеї перетворюються на реальні об'єкти.",
    "workshop.storyTitle": "Майстерня, де ідея проходить шлях від ескізу до готового об'єкта.",
    "workshop.story1": "PetDecor Studio — майстерня з Миколаєва, Україна, де ідеї перетворюються на реальні об'єкти.",
    "workshop.story2": "Ми самі придумуємо, проєктуємо й створюємо вироби — від перших ескізів до фінального складання. Працюємо з металом, деревом, епоксидною смолою, сланцем, підсвіткою та декоративними матеріалами.",
    "workshop.story3": "Вручну ллємо смолу, працюємо зі зварюванням і обробкою матеріалів, створюємо нестандартні конструкції та постійно експериментуємо з новими технологіями, формами й фактурами.",
    "workshop.story4": "Для реалізації проєктів використовуємо як власне виробництво, так і високотехнологічне обладнання перевірених підрядників. На стороні виготовляються лише окремі деталі — сама ідея, конструкція, дизайн і фінальний результат повністю створюються всередині майстерні.",
    "workshop.story5": "Ми любимо складні завдання й із цікавістю занурюємося в нові проєкти. Що незвичніша ідея — то цікавіша робота.",
    "workshop.location": "Mykolaiv, Ukraine<br>PetDecor Studio",
    "workshop.materialsTitle": "Матеріали",
    "workshop.materialsText": "Дерево, латунь, нержавіюча сталь, фанера, скло й епоксидна смола. Ми підбираємо фактури так, щоб предмет виглядав спокійно, дорого й жив в інтер'єрі без візуального шуму.",
    "workshop.approachTitle": "Підхід",
    "workshop.approachText": "Виріб починається із силуету та сценарію: де він висітиме, що має зберігати, який улюбленець або порода стане головним мотивом. Потім іде підбір матеріалу, гравіювання, різання, складання й фініш.",
    "workshop.customTitle": "Індивідуальність",
    "workshop.customText": "Композицію можна адаптувати під розплідник, дім, подарунок або конкретну тварину: породу, кличку, назву, адресу, розмір, відтінок дерева й тип металу.",
    "intro.1.title": "Objects, not clutter",
    "intro.1.text": "скульптурні форми, темні покриття, чиста геометрія",
    "intro.2.title": "Made for daily rituals",
    "intro.2.text": "панно, кронштейни, шкатулки та подарункові об'єкти для дому",
    "intro.3.title": "Warm material language",
    "intro.3.text": "дерево, метал, скло, гравіювання та фурнітура під стару латунь",
    "gallery.eyebrow": "Каталог",
    "gallery.title": "Декор,&nbsp;у&nbsp;якому<br>живе&nbsp;характер.",
    "gallery.subtitle": "Для інтер'єру, вулиці та сувенірів",
    "homeGallery.title": "Свіже&nbsp;з<br>майстерні.",
    "homeGallery.subtitle": "Вісім актуальних робіт PetDecor. Повна колекція — у галереї.",
    "homeGallery.allLink": "Дивитися всі вироби →",
    "search.label": "Пошук у галереї",
    "search.placeholder": "панно, сталь, повідці, латунь",
    "search.empty": "Нічого не знайдено. Спробуйте інше слово або розділ.",
    "sort.label": "Сортування",
    "sort.new": "Нові",
    "sort.popular": "Популярні",
    "sort.priceAsc": "За ціною ↑",
    "sort.priceDesc": "За ціною ↓",
    "share.copied": "Посилання на виріб скопійовано",
    "share.error": "Не вдалося скопіювати посилання",
    "filter.all": "Усі вироби",
    "filter.panels": "Панно",
    "filter.brackets": "Кронштейни",
    "filter.hangers": "Вішалки",
    "filter.signs": "Вивіски",
    "filter.addressSign": "Адресна вивіска",
    "filter.decorSigns": "Декоративні таблички",
    "filter.lightSign": "Вивіска з підсвічуванням",
    "filter.giftsets": "Предмети сервірування та подарунки",
    "filter.giftSetsSub": "Подарункові набори",
    "filter.boxes": "Скриньки",
    "filter.glasses": "Склянки",
    "filter.thermosFlasks": "Термоси та фляги",
    "filter.napkinHolders": "Серветниці",
    "filter.keychains": "Брелоки, брошки",
    "filter.magnets": "Магніти",
    "filter.epoxy": "Декор з епоксидної смоли",
    "filter.nightlights": "Нічники",
    "filter.clocks": "Годинники",
    "filter.clockMetal": "Метал",
    "filter.clockAcrylic": "Акрил",
    "filter.clockEpoxy": "Епоксидна смола",
    "filter.awards": "Призи",
    "filter.more": "Ще",
    "filter.sheetTitle": "Усі категорії",
    "slateKennel.type": "Decorative plaque",
    "slateKennel.desc": "Авторська інтер'єрна інтерпретація логотипа розплідника: глибока фактура чорного сланцю та холодний блиск шліфованої сталі перетворюють фірмовий знак на спокійний преміальний акцент для стіни, полиці або зони нагород. Натуральний чорний сланець 30 × 20 см, шліфована нержавіюча сталь, настінне або настільне розміщення.",
    "silverLabradorClock.type": "Clock",
    "silverLabradorClock.desc": "Декоративний настінний годинник із лабрадором і метеликом: срібний акрил на темному циферблаті створює стриманий холодний акцент для кухні, кабінету або сучасного інтер'єру. Виконаний зі срібного акрилу, діаметр 27 см, фасад — скло.",
    "forgedLabradorBracket.type": "Кронштейн",
    "forgedLabradorBracket.desc": "Металевий кронштейн із кованими деталями та підвісною табличкою: силует лабрадора, декоративна консоль і профільна труба зібрані у виразний фасадний акцент для розплідника, вхідної зони або саду. Розмір кронштейна 50 см; метал 2 мм, профільна труба 15 мм, кований декоративний елемент.",
    "ringNumberHolder.type": "Тримач номера",
    "ringNumberHolder.desc": "Тримач рингового номера ручної роботи: силует собаки з епоксидної смоли з глітерною заливкою, декоративний дріт по контуру та металевий затискач для кріплення номера. Кожен виріб має унікальний малюнок заливки.",
    "goldRingNumberHolder.type": "Тримач номера",
    "goldRingNumberHolder.desc": "Тримач рингового номера ручної роботи: декоративний дріт формує виразний контур, глітер і золота поталь дають живий блиск, а прозора епоксидна смола захищає композицію та додає глибину.",
    "monoBreedAwards.type": "Призи",
    "monoBreedAwards.desc": "Призи для монопородної виставки: серія нагород із силуетами собак, птахами та декоративними титулами BOB, BOS, WB і WD. Основа виконана з полірованої маслини; композиція поєднує нержавіючу сталь 2 мм і латунь 2 мм, відполіровані різними техніками для контрасту фактур і м'якого металевого блиску. Ціна від 75 € за штуку, від 250 € серія з 4 штук.",
    "labradorExpertPlates.type": "Призи",
    "labradorExpertPlates.desc": "Призи від експерта для монопородної виставки лабрадорів: декоративні тарілки з персоналізованими титулами BOB, BOS і Best Junior. Діаметр тарілки 27 см, анодоване покриття з ефектом хромування, розміщення на прозорій підставці.",
    "huskySlateAward.type": "Настінний приз",
    "huskySlateAward.desc": "Чорний сланець і нержавіюча сталь перетворюють приз на інтер'єрний об'єкт, який вішають на стіну, а не прибирають у ящик. Деталізований портрет хаскі, північні мотиви по колу й персональний підпис на звороті зберігають характер події на роки. Технічні характеристики: натуральний чорний сланець, нержавіюча сталь 2 мм, діаметр 30 см, двостороннє гравіювання, виготовлення 2-3 тижні.",
    "goldenRetrieverClock.type": "Clock",
    "goldenRetrieverClock.desc": "Декоративний настінний годинник із композицією, де голден ретривер спостерігає за метеликом: золотий силует на темному циферблаті створює теплий акцент для спокійного інтер'єру. Виконаний із золотого акрилу, діаметр 27 см, фасад — скло.",
    "goldClock.type": "Clock",
    "goldClock.desc": "Декоративний настінний годинник із цуценям лабрадора: теплий золотий силует на темному циферблаті додає інтер'єру м'який акцент і трохи характеру. Виконаний із золотого акрилу, діаметр 27 см, фасад — скло.",
    "addressPlate.type": "Address sign",
    "addressPlate.desc": "Адресна табличка для фасаду або вхідної зони: силует лабрадора, декоративне листя та номер будинку в теплій шоколадній патині. Метал 2 мм, шоколадне порошкове фарбування та ручне патинування.",
    "blackChocolateSign.type": "Вивіска з підсвічуванням",
    "blackChocolateSign.desc": "Авторська вивіска розплідника: назва, силуети лабрадорів і тепла контурна LED-підсвітка об'єднані в один виразний фасадний об'єкт. Композицію доповнено декоративним кронштейном для підвісного кашпо. Метал 2 мм, порошкове фарбування, тепла бек LED-підсвітка, розмір 1 × 1,7 м.",
    "bellaMarePanel.type": "Подарункове панно",
    "bellaMarePanel.desc": "Подарункове панно для розплідника Bella Mare: тепла фактура ясеня, назва розплідника й декоративні елементи з нержавіючої сталі зібрані в чисту інтер'єрну композицію. Перламутровий глітер і прозора епоксидна смола додають глибину та м'який блиск. Розмір 50 × 30 см, основа — ясен, декор — нержавіюча сталь.",
    "panel.type": "Wall panel",
    "panel.desc": "Компактний вертикальний акцент для вітальні, передпокою або кабінету: чорний силует собаки, очерету та птаха в польоті на теплій дерев'яній основі. Декоративне панно, розмір 17 × 42 см.",
    "bracket.type": "Kennel sign",
    "bracket.desc": "Авторський акцент для вхідної зони, вольєра або фасаду розплідника: силует російського хорта та підвісна табличка Radiance Soul у теплій бронзовій патині. Кронштейн із декоративною консоллю та назвою розплідника; метал 2 мм, порошкове фарбування та ручне патинування.",
    "box.type": "Gift set",
    "box.desc": "Камерний подарунковий набір для дому або кабінету: усередині дві склянки з лазерним гравіюванням, вкладені в дерев'яну шкатулку. Шкатулка з фанери 6 мм, лазерне гравіювання, фурнітура під стару латунь.",
    "keyholder.type": "Key holder shelf",
    "keyholder.desc": "Силует мисливця із собакою додає предмету характеру й робить вхідну зону теплішою. Вішалка-ключниця з дерев'яною полицею, чорними декоративними боковинами та гачками для ключів, повідців і ложки для взуття, розмір 25 см.",
    "leashShelf.type": "Leash shelf",
    "leashShelf.desc": "Практична річ для передпокою: чорний силует собак, декоративні гачки й місце для повідців збирають щоденні дрібниці в один акуратний акцент. Полиця-ключниця розміром 27 см; дошка — полірована й брашована сосна, оброблена олією-воском.",
    "bathShelfHanger.type": "Вішалка з полицею",
    "bathShelfHanger.desc": "Вішалка з полицею для лазні з авторською композицією: чорний патинований метал, тепла фактура брашованої та відполірованої сосни й декоративна сцена з нержавіючої сталі створюють виразний банний акцент. Технічні характеристики: чорний патинований метал, брашована й полірована сосна, композиція з нержавіючої сталі.",
    "cosmicCatHanger.type": "Міні-вішалка",
    "cosmicCatHanger.desc": "Космічна кішка — авторська ключниця й міні-вішалка ручної роботи для ключів, аксесуарів і повідців. Металева основа вкрита багатошаровою епоксидною смолою з глітерним ефектом галактики, декоративні елементи виконані з латуні; розмір близько 20 см, кожен виріб має унікальний малюнок заливки.",
    "acaciaPanel.type": "Wall panel",
    "acaciaPanel.desc": "Тепла деревина, м'який блиск металу й прозора глибина смоли створюють спокійний акцент для вітальні, кабінету або заміського інтер'єру. Панно з акації, розмір 45 × 14 см; композиція з латуні вкрита епоксидною смолою.",
    "napkinHolder.type": "Tableware object",
    "napkinHolder.desc": "Практичний предмет сервірування, який додає столу характер і акуратний блиск: собака, птахи й очерет зібрані в ажурній полірованій композиції. Серветниця з нержавіючої сталі, товщина 2 мм.",
    "paperweight.type": "Epoxy decor",
    "paperweight.desc": "Спокійний акцент для письмового столу, кабінету або подарунка: у прозорому бірюзовому об'ємі застиг силует лабрадора. Прес-пап'є виконане з епоксидної смоли та дерева капової маслини; силует — із нержавіючої сталі.",
    "roundHuntPanel.type": "Wall panel",
    "roundHuntPanel.desc": "Сцена полювання на качку з лабрадором у теплій деревній фактурі, закрита прозорою глибиною смоли. Панно з акації, діаметр 19 см; композиція з латуні, поєднаної з нержавіючою сталлю, під епоксидною смолою.",
    "nook.type": "Wall piece",
    "nook.desc": "Настінний маршрут із м'якою сходинкою, прихованим кріпленням і графітовою тканиною.",
    "soft.type": "Soft form",
    "soft.desc": "Низька lounge-форма з дерев'яним бортиком, щільною подушкою та знімним чохлом.",
    "bowl.type": "Dining object",
    "bowl.desc": "Керамічна станція зі стійкою основою та матовою фактурою для темних кухонь.",
    "toy.type": "Utility object",
    "toy.desc": "Текстильна ємність для іграшок, повідців і пледів як спокійний інтер'єрний об'єкт.",
    "rooms.eyebrow": "Rooms",
    "rooms.title": "Галерея як набір інтер'єрних сценаріїв",
    "rooms.1": "Матовий графіт, димчасте скло та м'який текстиль без візуального шуму.",
    "rooms.2": "Чорна база з бурштиновими деталями для теплих вечірніх кімнат.",
    "rooms.3": "Дерево, латунь і гравіювання для речей, які хочеться розглядати зблизька.",
    "reviews.eyebrow": "Messages",
    "reviews.title": "Відгуки, що звучать як продовження інтер'єру.",
    "reviews.subtitle": "Живі повідомлення від клієнтів після отримання замовлень.",
    "reviews.chat1.in": "Панно приїхало, дерево наживо ще глибше, ніж на фото.",
    "reviews.chat1.out": "Дуже рада, що воно потрапило саме в цей кут кімнати.",
    "reviews.chat2.in": "Ключниця виглядає як предмет, що завжди був тут.",
    "reviews.chat2.out": "Дякую за точний розмір і спокійний чорний метал.",
    "reviews.chat3.in": "Подарунковий набір вийшов дуже особистим, не схожим на магазинний.",
    "reviews.chat3.out": "Гравіювання на склянках — окрема любов.",
    "reviews.chat4.in": "Добрий день. Замовлення отримала, як завжди все на найвищому рівні!) вже готую підпис для наступного набору 😊",
    "reviews.chat4.mid": "Дякую 😭",
    "reviews.chat4.out": "Вручатиму завтра після обіду, прошу вас до цього часу не виставляти фото)",
    "reviews.husky.product": "Панно з хаскі",
    "reviews.husky.category": "Husky Slate Award",
    "reviews.chat5.out": "Як нашому експерту вироби сподобалися?",
    "reviews.chat5.in1": "Таак",
    "reviews.chat5.in2": "І не тільки їй, усі просто в захваті",
    "reviews.chat5.in3": "І за підсклянники окреме дякую",
    "reviews.quote1": "«Річ не просто красива — вона одразу додала кімнаті характер».",
    "reviews.author1": "Клієнт PetDecor",
    "reviews.quote2": "«Сподобалося, що декор вийшов теплим, але без зайвої декоративності».",
    "reviews.author2": "Замовлення для дому",
    "reviews.quote3": "«Одразу видно ручну роботу: метал, дерево й деталі виглядають дуже цілісно».",
    "reviews.author3": "Індивідуальний проєкт",
    "reviews.quote4": "«Замовлення отримала, як завжди все на найвищому рівні. Вже готую підпис для наступного набору».",
    "reviews.author4": "Подарунковий набір",
    "reviews.quote5": "«І не тільки їй, усі просто в захваті. І за підсклянники окреме дякую».",
    "reviews.author5": "Панно з хаскі",
    "studio.eyebrow": "Styling desk",
    "studio.title": "Зберемо private edit під кімнату, звички улюбленця та ваш візуальний код.",
    "form.name": "Ім'я",
    "form.contact": "Як зв'язатися",
    "form.requestType": "Тип запиту",
    "form.ready": "Готовий виріб",
    "form.custom": "Під замовлення",
    "form.gift": "Подарунок",
    "form.budget": "Бюджет",
    "form.budgetLow": "До 500 грн",
    "form.budgetMiddle": "500–1500 грн",
    "form.budgetHigh": "1500–3000 грн",
    "form.budgetPremium": "Від 3000 грн",
    "form.budgetDiscuss": "Обговоримо",
    "form.wishes": "Побажання (необов'язково)",
    "form.deadline": "Термін",
    "form.deadlineFlexible": "Не терміново",
    "form.deadlineSoon": "1–2 тижні",
    "form.deadlineMonth": "До місяця",
    "form.deadlineDate": "До конкретної дати",
    "form.submit": "Надіслати заявку",
    "form.namePlaceholder": "Анна",
    "form.contactPlaceholder": "Телефон або Telegram",
    "form.wishesPlaceholder": "Матеріал, розмір, улюбленець, місце розміщення",
    "form.sending": "Надсилаємо заявку...",
    "form.success": "Заявку надіслано. Ми підготуємо добірку PetDecor.",
    "form.error": "Не вдалося надіслати заявку. Спробуйте ще раз або напишіть нам у соцмережах.",
    "order.button": "Замовити",
    "order.prefill": "Цікавить виріб:",
    "related.title": "Схожі вироби",
    "social.title": "Соцмережі",
  },
  en: {
    "nav.home": "Studio",
    "nav.gallery": "Catalog",
    "nav.rooms": "Collection",
    "nav.studio": "Workshop",
    "nav.contacts": "Contact",
    "nav.cta": "Private edit",
    "hero.eyebrow": "Curated pet interiors",
    "hero.copy": "PetDecor Studio is a space for authored home decor, created with attention to atmosphere, materials, and detail. We turn wood, metal, and light into objects that add character and warmth to your space.",
    "hero.primary": "Explore gallery",
    "hero.secondary": "Discuss a project",
    "workshop.eyebrow": "Workshop",
    "workshop.heroCopy": "PetDecor Studio is a workshop from Mykolaiv, Ukraine, where ideas become real objects.",
    "workshop.storyTitle": "A workshop where an idea moves from sketch to finished object.",
    "workshop.story1": "PetDecor Studio is a workshop from Mykolaiv, Ukraine, where ideas become real objects.",
    "workshop.story2": "We develop, design, and create our pieces ourselves — from first sketches to final assembly. We work with metal, wood, epoxy resin, slate, lighting, and decorative materials.",
    "workshop.story3": "We pour resin by hand, work with welding and material finishing, create custom structures, and constantly experiment with new technologies, forms, and textures.",
    "workshop.story4": "To realize projects, we use both our own production and high-tech equipment from trusted contractors. Only separate parts are made externally — the idea, construction, design, and final result are created entirely inside the workshop.",
    "workshop.story5": "We enjoy complex tasks and dive into new projects with interest. The more unusual the idea, the more interesting the work.",
    "workshop.location": "Mykolaiv, Ukraine<br>PetDecor Studio",
    "workshop.materialsTitle": "Materials",
    "workshop.materialsText": "Wood, brass, stainless steel, plywood, glass, and epoxy resin. We choose textures so each object feels calm, refined, and at home in the interior without visual noise.",
    "workshop.approachTitle": "Approach",
    "workshop.approachText": "A piece begins with a silhouette and a scenario: where it will live, what it should hold, and which pet or breed becomes the main motif. Then come material choice, engraving, cutting, assembly, and finishing.",
    "workshop.customTitle": "Individuality",
    "workshop.customText": "A composition can be adapted for a kennel, home, gift, or specific animal: breed, name, title, address, size, wood tone, and metal type.",
    "intro.1.title": "Objects, not clutter",
    "intro.1.text": "sculptural forms, dark finishes, clean geometry",
    "intro.2.title": "Made for daily rituals",
    "intro.2.text": "wall panels, brackets, boxes, and gift objects for the home",
    "intro.3.title": "Warm material language",
    "intro.3.text": "wood, metal, glass, engraving, and antique brass hardware",
    "gallery.eyebrow": "Catalog",
    "gallery.title": "Decor&nbsp;where<br>character&nbsp;lives.",
    "gallery.subtitle": "For interiors, outdoor spaces, and keepsakes",
    "homeGallery.title": "Fresh&nbsp;from<br>the&nbsp;workshop.",
    "homeGallery.subtitle": "Eight current PetDecor pieces. The full collection is in the gallery.",
    "homeGallery.allLink": "View all pieces →",
    "search.label": "Search gallery",
    "search.placeholder": "panel, steel, leashes, brass",
    "search.empty": "Nothing found. Try another word or category.",
    "sort.label": "Sort",
    "sort.new": "Newest",
    "sort.popular": "Popular",
    "sort.priceAsc": "Price ↑",
    "sort.priceDesc": "Price ↓",
    "share.copied": "Product link copied",
    "share.error": "Could not copy the link",
    "filter.all": "All objects",
    "filter.panels": "Wall panels",
    "filter.brackets": "Brackets",
    "filter.hangers": "Hangers",
    "filter.signs": "Signs",
    "filter.addressSign": "Address sign",
    "filter.decorSigns": "Decorative plaques",
    "filter.lightSign": "Backlit sign",
    "filter.giftsets": "Tableware & gifts",
    "filter.giftSetsSub": "Gift sets",
    "filter.boxes": "Boxes",
    "filter.glasses": "Glasses",
    "filter.thermosFlasks": "Thermoses & flasks",
    "filter.napkinHolders": "Napkin holders",
    "filter.keychains": "Keychains, brooches",
    "filter.magnets": "Magnets",
    "filter.epoxy": "Epoxy resin decor",
    "filter.nightlights": "Night lights",
    "filter.clocks": "Clocks",
    "filter.clockMetal": "Metal",
    "filter.clockAcrylic": "Acrylic",
    "filter.clockEpoxy": "Epoxy resin",
    "filter.awards": "Awards",
    "filter.more": "More",
    "filter.sheetTitle": "All categories",
    "slateKennel.type": "Decorative plaque",
    "slateKennel.desc": "A custom interior interpretation of a kennel logo: the deep texture of black slate and the cool sheen of brushed steel turn the mark into a calm premium accent for a wall, shelf, or awards area. Natural black slate, 30 × 20 cm, brushed stainless steel, wall-mounted or tabletop placement.",
    "silverLabradorClock.type": "Clock",
    "silverLabradorClock.desc": "A decorative wall clock with a Labrador and butterfly composition: silver acrylic on a dark dial creates a restrained cool accent for a kitchen, office, or modern interior. Made from silver acrylic, 27 cm diameter, glass front.",
    "forgedLabradorBracket.type": "Bracket",
    "forgedLabradorBracket.desc": "A metal bracket with forged details and a hanging sign: the Labrador silhouette, decorative console, and profile tube form an expressive facade accent for a kennel, entrance area, or garden. Bracket size 50 cm; 2 mm metal, 15 mm profile tube, forged decorative element.",
    "ringNumberHolder.type": "Ring number holder",
    "ringNumberHolder.desc": "A handmade ring number holder: a dog silhouette in glitter-filled epoxy resin, decorative wire around the contour, and a metal clip for attaching the show number. Each piece has a unique resin pattern.",
    "goldRingNumberHolder.type": "Ring number holder",
    "goldRingNumberHolder.desc": "A handmade ring number holder: decorative wire shapes the expressive contour, glitter and gold leaf add a lively shine, and clear epoxy resin protects the composition while giving it depth.",
    "monoBreedAwards.type": "Awards",
    "monoBreedAwards.desc": "Awards for a mono-breed dog show: a series of trophies with dog silhouettes, birds, and decorative BOB, BOS, WB, and WD titles. The base is polished olive wood; the composition combines 2 mm stainless steel and 2 mm brass, polished with different techniques for a contrast of textures and a soft metallic glow. From €75 each, from €250 for a set of 4.",
    "labradorExpertPlates.type": "Awards",
    "labradorExpertPlates.desc": "Expert awards for a mono-breed Labrador show: decorative plates with personalized BOB, BOS, and Best Junior titles. Plate diameter 27 cm, anodized coating with a chrome effect, displayed on a transparent stand.",
    "huskySlateAward.type": "Wall award",
    "huskySlateAward.desc": "Black slate and stainless steel turn this award into an interior object meant to be displayed on a wall, not stored away. A detailed engraved husky portrait, northern motifs around the circle, and a personal inscription on the reverse preserve the event's character for years. Technical details: natural black slate, 2 mm stainless steel, 30 cm diameter, double-sided engraving, production time 2-3 weeks.",
    "goldenRetrieverClock.type": "Clock",
    "goldenRetrieverClock.desc": "A decorative wall clock with a composition where a golden retriever watches a butterfly: the gold silhouette on a dark dial creates a warm accent for a calm interior. Made from gold acrylic, 27 cm diameter, glass front.",
    "goldClock.type": "Clock",
    "goldClock.desc": "A decorative wall clock with a Labrador puppy: the warm golden silhouette on a dark dial adds a soft accent and a touch of character to the interior. Made from gold acrylic, 27 cm diameter, glass front.",
    "addressPlate.type": "Address sign",
    "addressPlate.desc": "An address plate for a facade or entrance area: a Labrador silhouette, decorative foliage, and house number in a warm chocolate patina. 2 mm metal, chocolate powder coating, and hand patination.",
    "blackChocolateSign.type": "Backlit kennel sign",
    "blackChocolateSign.desc": "A custom kennel sign where the name, Labrador silhouettes, and warm contour back LED lighting become one expressive facade object. The composition is complemented by a decorative bracket for a hanging planter. 2 mm metal, powder coating, warm back LED lighting, size 1 × 1.7 m.",
    "bellaMarePanel.type": "Kennel gift panel",
    "bellaMarePanel.desc": "A gift panel for the Bella Mare kennel: warm ash wood, the kennel name, and stainless-steel decorative elements arranged as a clean interior composition. Pearlescent glitter and clear epoxy resin add depth and a soft reflective glow. Size 50 × 30 cm, ash wood base, stainless-steel decor.",
    "panel.type": "Wall panel",
    "panel.desc": "A compact vertical accent for a living room, hallway, or study: a black silhouette of a dog, reeds, and a flying bird on a warm wooden base. Decorative wall panel, 17 × 42 cm.",
    "bracket.type": "Kennel sign",
    "bracket.desc": "A custom accent for an entrance area, kennel, or facade: a Russian Borzoi silhouette and hanging Radiance Soul sign in a warm bronze patina. Bracket with decorative console and kennel name; 2 mm metal, powder coating, and hand patination.",
    "box.type": "Gift set",
    "box.desc": "An intimate gift set for a home or study: two laser-engraved glasses arranged inside a wooden box. Box made from 6 mm plywood with laser engraving and antique brass-style hardware.",
    "keyholder.type": "Key holder shelf",
    "keyholder.desc": "The hunter-and-dog silhouette adds character and warmth to an entryway. Key holder with wooden shelf, black decorative side panels, and hooks for keys, leashes, and a shoehorn, 25 cm.",
    "leashShelf.type": "Leash shelf",
    "leashShelf.desc": "A practical entryway piece: black dog silhouettes, decorative hooks, and leash storage gather everyday items into one neat accent. Key and leash shelf, 27 cm; polished and brushed pine board treated with oil-wax.",
    "bathShelfHanger.type": "Shelf hanger",
    "bathShelfHanger.desc": "A shelf hanger for a bath or sauna with an original decorative composition: black patinated metal, the warm texture of brushed and polished pine, and stainless steel figures create a characterful sauna accent. Technical details: black patinated metal, brushed and polished pine, stainless steel composition.",
    "cosmicCatHanger.type": "Mini hanger",
    "cosmicCatHanger.desc": "Cosmic Cat is a handmade key holder and mini hanger for keys, accessories, and leashes. The metal base is finished with layered epoxy resin and a glittering galaxy effect, with brass decorative details; approx. 20 cm, each piece has a unique resin pattern.",
    "acaciaPanel.type": "Wall panel",
    "acaciaPanel.desc": "Warm wood, a soft metallic glow, and clear resin depth create a calm accent for a living room, study, or countryside interior. Acacia wall panel, 45 × 14 cm; brass composition sealed under epoxy resin.",
    "napkinHolder.type": "Tableware object",
    "napkinHolder.desc": "A practical tableware object that adds character and a clean shine to the table: dog, birds, and reeds arranged in a polished openwork composition. Napkin holder made from 2 mm stainless steel.",
    "paperweight.type": "Epoxy decor",
    "paperweight.desc": "A calm accent for a desk, study, or gift: a Labrador silhouette suspended inside a transparent turquoise volume. Paperweight made from epoxy resin and olive burl wood; silhouette in stainless steel.",
    "roundHuntPanel.type": "Wall panel",
    "roundHuntPanel.desc": "A duck hunting scene with a Labrador set into warm wood grain and sealed under clear resin depth. Acacia panel, 19 cm diameter; brass composition combined with stainless steel under epoxy resin.",
    "nook.type": "Wall piece",
    "nook.desc": "A wall route with a soft step, hidden mounting, and graphite fabric.",
    "soft.type": "Soft form",
    "soft.desc": "A low lounge form with a wooden rim, dense cushion, and removable cover.",
    "bowl.type": "Dining object",
    "bowl.desc": "A ceramic dining station with a stable base and matte texture for dark kitchens.",
    "toy.type": "Utility object",
    "toy.desc": "A textile vessel for toys, leashes, and throws, designed as a calm interior object.",
    "rooms.eyebrow": "Rooms",
    "rooms.title": "A gallery shaped as a set of interior scenarios",
    "rooms.1": "Matte graphite, smoked glass, and soft textile without visual noise.",
    "rooms.2": "A black base with amber details for warm evening rooms.",
    "rooms.3": "Wood, brass, and engraving for objects that invite a closer look.",
    "reviews.eyebrow": "Messages",
    "reviews.title": "Reviews that feel like part of the interior.",
    "reviews.subtitle": "Real client messages after receiving their orders.",
    "reviews.chat1.in": "The panel arrived, and the wood feels even deeper in person than in the photos.",
    "reviews.chat1.out": "I love that it found exactly this corner of the room.",
    "reviews.chat2.in": "The key shelf looks like it has always belonged here.",
    "reviews.chat2.out": "Thank you for the exact size and the calm black metal.",
    "reviews.chat3.in": "The gift set feels very personal, not like something from a shop.",
    "reviews.chat3.out": "The engraving on the glasses is a detail we keep noticing.",
    "reviews.chat4.in": "Good afternoon. I received the order, and as always everything is top level!) I am already preparing the caption for the next set 😊",
    "reviews.chat4.mid": "Thank you 😭",
    "reviews.chat4.out": "I will present it tomorrow after lunch, please do not post photos before then)",
    "reviews.husky.product": "Husky panel",
    "reviews.husky.category": "Husky Slate Award",
    "reviews.chat5.out": "How did the expert like our pieces?",
    "reviews.chat5.in1": "Yees",
    "reviews.chat5.in2": "And not only her, everyone is absolutely delighted",
    "reviews.chat5.in3": "And a separate thank you for the cup holders",
    "reviews.quote1": "\"It is not just beautiful — it immediately gave the room character.\"",
    "reviews.author1": "PetDecor client",
    "reviews.quote2": "\"I liked that the decor feels warm without becoming overly decorative.\"",
    "reviews.author2": "Home order",
    "reviews.quote3": "\"You can see the handwork: metal, wood, and details feel complete together.\"",
    "reviews.author3": "Custom project",
    "reviews.quote4": "\"I received the order, and as always everything is top level. I am already preparing the caption for the next set.\"",
    "reviews.author4": "Gift set",
    "reviews.quote5": "\"And not only her, everyone is absolutely delighted. And a separate thank you for the cup holders.\"",
    "reviews.author5": "Husky panel",
    "studio.eyebrow": "Styling desk",
    "studio.title": "We will create a private edit for your room, your pet's habits, and your visual code.",
    "form.name": "Name",
    "form.contact": "How to contact you",
    "form.requestType": "Request type",
    "form.ready": "Ready-made",
    "form.custom": "Custom order",
    "form.gift": "Gift",
    "form.budget": "Budget",
    "form.budgetLow": "Up to €20",
    "form.budgetMiddle": "€20–50",
    "form.budgetHigh": "€50–100",
    "form.budgetPremium": "€100 and up",
    "form.budgetDiscuss": "Let's discuss",
    "form.wishes": "Wishes (optional)",
    "form.deadline": "Deadline",
    "form.deadlineFlexible": "Flexible",
    "form.deadlineSoon": "1–2 weeks",
    "form.deadlineMonth": "Within a month",
    "form.deadlineDate": "For a specific date",
    "form.submit": "Send request",
    "form.namePlaceholder": "Anna",
    "form.contactPlaceholder": "Phone or Telegram",
    "form.wishesPlaceholder": "Material, size, pet, placement",
    "form.sending": "Sending request...",
    "form.success": "Request sent. We will prepare a PetDecor selection.",
    "form.error": "Could not send the request. Please try again or message us on social media.",
    "order.button": "Order",
    "order.prefill": "Interested in:",
    "related.title": "Similar pieces",
    "social.title": "Socials",
  },
};

const setLanguage = (lang) => {
  currentLang = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const value = translations[lang][key] || translations.ru[key] || element.textContent;
    element.innerHTML = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    element.placeholder = translations[lang][key] || translations.ru[key] || element.placeholder;
  });

  document.querySelectorAll(".lang-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === lang);
  });

  if (note?.textContent) {
    note.textContent = translations[lang]["form.success"];
  }

  updateAdminProductText(lang);
  updateProductPrices();
  applyGalleryFilters();
};

const normalizeSearch = (value) => value.toLowerCase().replace(/ё/g, "е").trim();

const tokenizeSearch = (value) => normalizeSearch(value)
  .replace(/[^\p{L}\p{N}\s-]/gu, " ")
  .split(/\s+/)
  .filter(Boolean);

const searchStem = (word) => {
  if (word.length < 4) return word;

  return word
    .replace(/(иями|ями|ами|ого|ему|ими|ыми|ую|ая|ое|ые|ий|ый|ой|ом|ам|ах|ях|ов|ев|ей|ию|ья|ье|ьи|ы|и|а|у|е|о)$/u, "");
};

const distanceWithin = (a, b, limit) => {
  if (Math.abs(a.length - b.length) > limit) return false;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > limit) return false;
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length] <= limit;
};

const wordMatches = (query, token) => {
  if (token.includes(query)) return true;
  if (token.length >= 4 && query.includes(token)) return true;

  const queryStem = searchStem(query);
  const tokenStem = searchStem(token);

  if (tokenStem.includes(queryStem)) return true;
  if (tokenStem.length >= 4 && queryStem.includes(tokenStem)) return true;
  if (queryStem.length < 4 || tokenStem.length < 4) return false;
  if (Math.abs(queryStem.length - tokenStem.length) > 1) return false;
  if (queryStem.slice(0, 3) !== tokenStem.slice(0, 3)) return false;

  const tolerance = query.length >= 6 ? 2 : 1;
  return distanceWithin(queryStem, tokenStem, tolerance);
};

const getCardSearchText = (card) => {
  const parts = [card.textContent, card.dataset.category || "", card.dataset.searchText || ""];

  card.querySelectorAll("[alt], [aria-label], [title]").forEach((element) => {
    parts.push(element.getAttribute("alt") || "");
    parts.push(element.getAttribute("aria-label") || "");
    parts.push(element.getAttribute("title") || "");
  });

  card.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    Object.values(translations).forEach((dictionary) => {
      if (dictionary[key]) parts.push(dictionary[key]);
    });
  });

  (card.dataset.searchKeys || "").split(/\s+/).filter(Boolean).forEach((key) => {
    Object.values(translations).forEach((dictionary) => {
      if (dictionary[key]) parts.push(dictionary[key]);
    });
  });

  return parts.join(" ");
};

const getActiveFilterValues = () => {
  const activeButton = document.querySelector(".filter.is-active");
  if (!activeButton || activeButton.dataset.filter === "all") return ["all"];

  const values = new Set([activeButton.dataset.filter].filter(Boolean));
  if (activeButton.classList.contains("filter-parent")) {
    activeButton.closest(".filter-group")?.querySelectorAll(".filter-sub[data-filter]").forEach((button) => {
      values.add(button.dataset.filter);
    });
  }

  return Array.from(values);
};

const getGalleryFilterUrl = (filter) => {
  const url = new URL("gallery.html", window.location.href);
  if (filter && filter !== "all") {
    url.searchParams.set("filter", filter);
  }
  url.hash = "catalog";
  return url.toString();
};

const setActiveFilterButton = (button) => {
  if (!button) return;

  activeFilter = button.dataset.filter || "all";
  galleryPage = 1;
  filters.forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  document.querySelectorAll(".filter-sheet .filter").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.filter === activeFilter);
  });
};

const applyInitialGalleryFilterFromUrl = () => {
  if (!isFullGallery) return;

  const params = new URLSearchParams(window.location.search);
  const filter = params.get("filter");
  if (!filter) return;

  const button = Array.from(filters).find((item) => item.dataset.filter === filter);
  setActiveFilterButton(button);
};

const updateGalleryPagination = (visibleCount) => {
  if (!galleryPagination) return;

  const pageCount = Math.max(1, Math.ceil(visibleCount / GALLERY_PAGE_SIZE));
  galleryPagination.hidden = !isFullGallery || visibleCount <= GALLERY_PAGE_SIZE;

  if (galleryPage > pageCount) galleryPage = pageCount;
  if (galleryPage < 1) galleryPage = 1;

  if (galleryPageStatus) {
    galleryPageStatus.textContent = `${galleryPage} / ${pageCount}`;
  }

  if (galleryPagePrev) {
    galleryPagePrev.disabled = galleryPage <= 1;
  }

  if (galleryPageNext) {
    galleryPageNext.disabled = galleryPage >= pageCount;
  }
};

const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);

const scrollToWithEase = (top, duration = 2550) => {
  const start = window.scrollY;
  const distance = top - start;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, start + distance * easeOutCubic(progress));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

const scrollGalleryToTop = () => {
  const target = productGrid || document.querySelector("#catalog") || document.querySelector("#gallery");
  if (!target) return;

  const header = document.querySelector(".site-header");
  const headerOffset = (header?.offsetHeight || 0) + 18;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

  scrollToWithEase(Math.max(0, top));
};

const getContactTop = () => {
  if (!form) return 0;

  const header = document.querySelector(".site-header");
  const headerOffset = (header?.offsetHeight || 0) + 22;
  return Math.max(0, form.getBoundingClientRect().top + window.scrollY - headerOffset);
};

const setOrderProduct = (productTitle) => {
  const wishes = form?.querySelector('textarea[name="wishes"]');
  if (!wishes || !productTitle) return;

  const prefix = translations[currentLang]["order.prefill"];
  const line = `${prefix} ${productTitle}`;
  const current = wishes.value.trim();

  wishes.value = current && !current.includes(productTitle) ? `${line}\n\n${current}` : line;
  wishes.focus({ preventScroll: true });
};

const openOrderForm = (productTitle) => {
  if (window.innerWidth < 620) {
    const text = encodeURIComponent(`Заказать: ${productTitle}`);
    window.open(`https://t.me/PetDecor?text=${text}`, "_blank", "noopener");
    return;
  }

  if (!form) {
    const url = new URL("index.html", window.location.href);
    url.hash = "contact";
    url.searchParams.set("product", productTitle);
    window.location.href = url.toString();
    return;
  }

  if (activeGallery) {
    closeGallery(activeGallery);
  }

  setOrderProduct(productTitle);
  scrollToWithEase(getContactTop(), 1200);
};

const applyOrderFromUrl = () => {
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const productTitle = params.get("product");
  if (!productTitle) return;

  setOrderProduct(productTitle);

  if (window.location.hash === "#contact") {
    window.setTimeout(() => scrollToWithEase(getContactTop(), 1200), 120);
  }
};

const applyGalleryFilters = () => {
  const words = tokenizeSearch(searchInput?.value || "");
  const hasSearch = words.length > 0;
  const activeFilterValues = getActiveFilterValues();
  const visibleCards = [];

  cards.forEach((card) => {
    const homeVisible = isFullGallery || hasSearch || visibleHomeCards.includes(card);
    const categories = card.dataset.category.split(" ");
    const categoryVisible = hasSearch || activeFilterValues.includes("all") || activeFilterValues.some((filter) => categories.includes(filter));
    const cardWords = tokenizeSearch(getCardSearchText(card));
    const searchVisible = words.every((word) => cardWords.some((cardWord) => wordMatches(word, cardWord)));
    const matches = homeVisible && categoryVisible && searchVisible;

    card.classList.toggle("is-hidden", !matches);
    if (matches) visibleCards.push(card);
  });

  const sortedCards = getSortedCards(visibleCards);

  sortedCards.forEach((card, index) => {
    card.style.order = index;
  });

  const visibleCount = sortedCards.length;
  updateGalleryPagination(visibleCount);

  if (isFullGallery) {
    const pageStart = (galleryPage - 1) * GALLERY_PAGE_SIZE;
    const pageEnd = pageStart + GALLERY_PAGE_SIZE;

    sortedCards.forEach((card, index) => {
      const onCurrentPage = index >= pageStart && index < pageEnd;
      card.classList.toggle("is-hidden", !onCurrentPage);
    });
  }

  if (galleryEmpty) {
    galleryEmpty.hidden = visibleCount !== 0;
  }
};

langButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

const handleFilterClick = (button) => {
  if (!isFullGallery) {
    window.location.href = getGalleryFilterUrl(button.dataset.filter);
    return;
  }

  const matchingMainButton = Array.from(filters).find((item) => item.dataset.filter === button.dataset.filter);
  setActiveFilterButton(matchingMainButton || button);

  const url = new URL(window.location.href);
  if (activeFilter === "all") {
    url.searchParams.delete("filter");
  } else {
    url.searchParams.set("filter", activeFilter);
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

  applyGalleryFilters();
};

filters.forEach((button) => {
  button.addEventListener("click", () => handleFilterClick(button));
});

const buildFilterSheet = () => {
  if (!filterMoreButton) return;

  const sheet = document.createElement("div");
  sheet.className = "filter-sheet";
  sheet.hidden = true;
  sheet.innerHTML = `
    <button class="filter-sheet-backdrop" type="button" aria-label="Закрыть категории"></button>
    <section class="filter-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title">
      <div class="filter-sheet-head">
        <h3 id="filter-sheet-title" data-i18n="filter.sheetTitle">Все категории</h3>
        <button class="filter-sheet-close" type="button" aria-label="Закрыть">×</button>
      </div>
      <div class="filter-sheet-list"></div>
    </section>`;

  const list = sheet.querySelector(".filter-sheet-list");
  filters.forEach((button) => {
    const clone = button.cloneNode(true);
    clone.classList.add("filter-sheet-item");
    clone.classList.remove("is-active");
    clone.addEventListener("click", () => {
      handleFilterClick(clone);
      closeFilterSheet();
    });
    list.append(clone);
  });

  const openFilterSheet = () => {
    sheet.hidden = false;
    requestAnimationFrame(() => document.body.classList.add("filter-sheet-open"));
  };

  function closeFilterSheet() {
    document.body.classList.remove("filter-sheet-open");
    window.setTimeout(() => {
      if (!document.body.classList.contains("filter-sheet-open")) sheet.hidden = true;
    }, 260);
  }

  filterMoreButton.addEventListener("click", openFilterSheet);
  sheet.querySelector(".filter-sheet-backdrop").addEventListener("click", closeFilterSheet);
  sheet.querySelector(".filter-sheet-close").addEventListener("click", closeFilterSheet);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("filter-sheet-open")) {
      closeFilterSheet();
    }
  });

  document.body.append(sheet);
};

buildFilterSheet();

searchInput?.addEventListener("input", () => {
  galleryPage = 1;
  applyGalleryFilters();
});

sortInput?.addEventListener("change", () => {
  galleryPage = 1;
  applyGalleryFilters();
});

galleryPagePrev?.addEventListener("click", () => {
  if (galleryPage <= 1) return;
  galleryPage -= 1;
  applyGalleryFilters();
  scrollGalleryToTop();
});

galleryPageNext?.addEventListener("click", () => {
  galleryPage += 1;
  applyGalleryFilters();
  scrollGalleryToTop();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-product]");
  if (!button) return;

  openOrderForm(button.dataset.orderProduct || "");
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-share-product]");
  if (!button) return;

  const productId = button.dataset.shareProduct;
  const title = button.dataset.shareTitle || document.getElementById(productId)?.querySelector("h3")?.textContent || "PetDecor";
  const url = getProductUrl(productId);

  try {
    if (navigator.share) {
      await navigator.share({ title, text: title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    showShareToast("share.copied");
  } catch {
    try {
      await navigator.clipboard.writeText(url);
      showShareToast("share.copied");
    } catch {
      showShareToast("share.error");
    }
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-wishlist-product]");
  if (!button) return;

  const productId = button.dataset.wishlistProduct;
  const wishlist = new Set(readWishlist());

  if (wishlist.has(productId)) {
    wishlist.delete(productId);
  } else {
    wishlist.add(productId);
  }

  writeWishlist(Array.from(wishlist));
  updateWishlistButtons();
  applyGalleryFilters();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.page = window.location.href;
  payload.language = currentLang;

  if (note) note.textContent = translations[currentLang]["form.sending"];
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Contact request failed");

    if (note) note.textContent = translations[currentLang]["form.success"];
    form.reset();
  } catch {
    if (note) note.textContent = translations[currentLang]["form.error"];
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

const getGalleryParts = (gallery) => ({
  track: gallery.querySelector(".carousel-track"),
  slides: gallery.querySelectorAll(".carousel-slide"),
  dots: gallery.querySelectorAll(".carousel-dots button"),
});

const updateGalleryDots = (dots, index) => {
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
};

const finishWrappedSlide = (track, clone, finalIndex) => {
  window.setTimeout(() => {
    track.style.transition = "none";
    clone.remove();
    activeSlide = finalIndex;
    track.style.transform = `translateX(-${activeSlide * 100}%)`;
    track.offsetHeight;
    track.style.transition = "";
    isCarouselWrapping = false;
  }, 820);
};

const showSlide = (index) => {
  if (!activeGallery || isCarouselWrapping) return;

  const { track, slides, dots } = getGalleryParts(activeGallery);
  const realSlides = Array.from(slides).filter((slide) => slide.dataset.carouselClone !== "true");
  if (!track || !realSlides.length) return;

  realSlides.forEach((slide) => slide.querySelector("img")?.classList.remove("is-zoomed"));

  const slideCount = realSlides.length;
  if (slideCount <= 1) {
    activeSlide = 0;
    track.style.transform = "translateX(0)";
    updateGalleryDots(dots, activeSlide);
    return;
  }

  const movesForwardToStart = activeSlide === slideCount - 1 && (index >= slideCount || index === 0);
  const movesBackwardToEnd = activeSlide === 0 && (index < 0 || index === slideCount - 1);

  if (movesForwardToStart) {
    isCarouselWrapping = true;
    const clone = realSlides[0].cloneNode(true);
    clone.dataset.carouselClone = "true";
    track.appendChild(clone);
    activeSlide = 0;
    updateGalleryDots(dots, activeSlide);
    track.style.transform = `translateX(-${slideCount * 100}%)`;
    finishWrappedSlide(track, clone, activeSlide);
    return;
  }

  if (movesBackwardToEnd) {
    isCarouselWrapping = true;
    const clone = realSlides[slideCount - 1].cloneNode(true);
    clone.dataset.carouselClone = "true";
    track.prepend(clone);
    track.style.transition = "none";
    track.style.transform = "translateX(-100%)";
    track.offsetHeight;
    track.style.transition = "";
    activeSlide = slideCount - 1;
    updateGalleryDots(dots, activeSlide);
    track.style.transform = "translateX(0)";
    finishWrappedSlide(track, clone, activeSlide);
    return;
  }

  activeSlide = (index + slideCount) % slideCount;
  track.style.transform = `translateX(-${activeSlide * 100}%)`;
  updateGalleryDots(dots, activeSlide);
};

const openGallery = (gallery) => {
  activeGallery = gallery;
  activeSlide = 0;
  isCarouselWrapping = false;
  gallery.classList.remove("is-closing");
  gallery.hidden = false;
  document.body.classList.add("modal-open");
  showSlide(activeSlide);
};

const closeGallery = (gallery = activeGallery) => {
  if (!gallery) return;

  gallery.classList.add("is-closing");
  document.body.classList.remove("modal-open");

  window.setTimeout(() => {
    gallery.hidden = true;
    gallery.classList.remove("is-closing");
    if (activeGallery === gallery) {
      activeGallery = null;
      activeSlide = 0;
      isCarouselWrapping = false;
    }
  }, 850);
};

const getCardGalleryId = (card) => {
  const trigger = card.querySelector(".gallery-trigger");
  return trigger?.dataset.gallery || trigger?.getAttribute("aria-controls") || "";
};

const getCardCategories = (card) => (card.dataset.category || "").split(/\s+/).filter(Boolean);

const getCardImage = (card) => card.querySelector(".piece-preview img")?.getAttribute("src") || "";

const getCardTitle = (card) => card.querySelector(".product-info h3")?.textContent.trim() || "";

const getFirstGalleryImage = (galleryId, fallbackImage) => {
  const gallery = document.getElementById(galleryId);
  const firstImage = gallery?.querySelector(".carousel-slide img");
  return firstImage?.getAttribute("src") || fallbackImage;
};

const openRelatedGallery = (currentGallery, targetGallery) => {
  if (!targetGallery || targetGallery === currentGallery) return;

  currentGallery.hidden = true;
  currentGallery.classList.remove("is-closing");
  openGallery(targetGallery);
};

const buildRelatedProducts = () => {
  const products = Array.from(cards)
    .map((card, order) => ({
      card,
      order,
      galleryId: getCardGalleryId(card),
      image: getFirstGalleryImage(getCardGalleryId(card), getCardImage(card)),
      title: getCardTitle(card),
      categories: getCardCategories(card),
    }))
    .filter((product) => product.galleryId && product.image);

  const productsByGallery = new Map(products.map((product) => [product.galleryId, product]));

  galleryModals.forEach((gallery) => {
    if (gallery.querySelector(".related-strip")) return;

    const currentProduct = productsByGallery.get(gallery.id);
    const panel = gallery.querySelector(".modal-panel");
    if (!currentProduct || !panel) return;

    const currentCategories = new Set(currentProduct.categories);
    const sameCategory = products.filter((product) => (
      product.galleryId !== currentProduct.galleryId
      && product.categories.some((category) => currentCategories.has(category))
    ));
    const fallback = products.filter((product) => (
      product.galleryId !== currentProduct.galleryId
      && !sameCategory.includes(product)
    ));
    const relatedProducts = [...sameCategory, ...fallback].slice(0, 5);
    if (!relatedProducts.length) return;

    const strip = document.createElement("section");
    strip.className = "related-strip";
    strip.innerHTML = `
      <p class="related-title" data-i18n="related.title">${translations[currentLang]["related.title"]}</p>
      <div class="related-items"></div>
    `;

    const list = strip.querySelector(".related-items");
    relatedProducts.forEach((product) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "related-thumb";
      button.title = product.title;
      button.setAttribute("aria-label", product.title);
      button.innerHTML = `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">`;
      button.addEventListener("click", () => {
        openRelatedGallery(gallery, document.getElementById(product.galleryId));
      });
      list.append(button);
    });

    panel.append(strip);
  });
};

buildRelatedProducts();

galleryTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const galleryId = trigger.dataset.gallery || trigger.getAttribute("aria-controls");
    const gallery = document.getElementById(galleryId);
    openGallery(gallery);
  });
});

galleryModals.forEach((gallery) => {
  const viewport = gallery.querySelector(".carousel-viewport");
  const panel = gallery.querySelector(".modal-panel");
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeDeltaX = 0;
  let panelTouchStartY = 0;
  let panelTouchDeltaY = 0;
  let isSwiping = false;
  let didSwipe = false;

  gallery.querySelectorAll(".modal-close, .modal-backdrop").forEach((button) => {
    button.addEventListener("click", () => closeGallery(gallery));
  });

  gallery.querySelector(".carousel-control.prev").addEventListener("click", () => {
    activeGallery = gallery;
    showSlide(activeSlide - 1);
  });

  gallery.querySelector(".carousel-control.next").addEventListener("click", () => {
    activeGallery = gallery;
    showSlide(activeSlide + 1);
  });

  gallery.querySelectorAll(".carousel-dots button").forEach((dot, index) => {
    dot.addEventListener("click", () => {
      activeGallery = gallery;
      showSlide(index);
    });
  });

  viewport?.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
    swipeDeltaX = 0;
    isSwiping = true;
    didSwipe = false;
  }, { passive: true });

  viewport?.addEventListener("touchmove", (event) => {
    if (!isSwiping) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - swipeStartX;
    const deltaY = touch.clientY - swipeStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      swipeDeltaX = deltaX;
    }
  }, { passive: true });

  viewport?.addEventListener("touchend", () => {
    if (!isSwiping) return;

    const threshold = Math.min(90, Math.max(44, viewport.clientWidth * .14));
    activeGallery = gallery;

    if (swipeDeltaX > threshold) {
      showSlide(activeSlide - 1);
      didSwipe = true;
    }

    if (swipeDeltaX < -threshold) {
      showSlide(activeSlide + 1);
      didSwipe = true;
    }

    isSwiping = false;
    swipeDeltaX = 0;
  });

  viewport?.addEventListener("touchcancel", () => {
    isSwiping = false;
    swipeDeltaX = 0;
  });

  panel?.addEventListener("touchstart", (event) => {
    panelTouchStartY = event.touches[0].clientY;
    panelTouchDeltaY = 0;
  }, { passive: true });

  panel?.addEventListener("touchmove", (event) => {
    panelTouchDeltaY = event.touches[0].clientY - panelTouchStartY;
  }, { passive: true });

  panel?.addEventListener("touchend", () => {
    if (panelTouchDeltaY > 80) closeGallery(gallery);
    panelTouchDeltaY = 0;
  });

  viewport?.addEventListener("click", (event) => {
    if (didSwipe) {
      didSwipe = false;
      return;
    }

    const image = event.target.closest(".carousel-slide img");
    if (!image) return;

    const rect = image.getBoundingClientRect();
    const originX = ((event.clientX - rect.left) / rect.width) * 100;
    const originY = ((event.clientY - rect.top) / rect.height) * 100;
    image.style.setProperty("--zoom-origin", `${originX}% ${originY}%`);
    image.classList.toggle("is-zoomed");
  });
});

document.addEventListener("keydown", (event) => {
  if (!activeGallery || activeGallery.hidden) return;

  if (event.key === "Escape") {
    closeGallery();
  }

  if (event.key === "ArrowLeft") {
    showSlide(activeSlide - 1);
  }

  if (event.key === "ArrowRight") {
    showSlide(activeSlide + 1);
  }
});

const applyProductHash = () => {
  const productId = decodeURIComponent(window.location.hash.replace("#", ""));
  if (!productId || productId === "contact") return;

  const card = document.getElementById(productId);
  const galleryId = card?.querySelector(".gallery-trigger")?.dataset.gallery;
  const gallery = galleryId ? document.getElementById(galleryId) : null;

  if (gallery) {
    window.setTimeout(() => openGallery(gallery), 180);
  }
};

applyInitialGalleryFilterFromUrl();
updateWishlistButtons();
setLanguage("ru");
applyOrderFromUrl();
applyProductHash();


