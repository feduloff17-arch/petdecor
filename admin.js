const storageKey = "petdecorAdminProducts";
const form = document.querySelector("#admin-product-form");
const list = document.querySelector("#admin-list");
const note = document.querySelector("#admin-note");
const resetButton = document.querySelector("#admin-reset");
const exportButton = document.querySelector("#admin-export");
const importInput = document.querySelector("#admin-import");

const readProducts = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
};

const writeProducts = (products) => {
  localStorage.setItem(storageKey, JSON.stringify(products));
};

const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const clearForm = () => {
  form.reset();
  form.elements.id.value = "";
  note.textContent = "";
};

const renderList = () => {
  const products = readProducts();
  list.innerHTML = products.length ? "" : "<p>Пока нет добавленных карточек.</p>";

  products.forEach((product) => {
    const item = document.createElement("article");
    item.className = "admin-item";
    item.innerHTML = `
      <img src="${product.images?.[product.images.length - 1] || ""}" alt="">
      <div>
        <strong>${product.title}</strong>
        <span>${product.category}</span>
      </div>
      <button type="button" data-action="edit" data-id="${product.id}">Править</button>
      <button type="button" data-action="delete" data-id="${product.id}">Удалить</button>
    `;
    list.append(item);
  });
};

const productFromForm = async () => {
  const formData = new FormData(form);
  const id = formData.get("id") || `admin-${Date.now()}`;
  const existing = readProducts().find((product) => product.id === id);
  const files = Array.from(form.elements.images.files || []);
  const images = files.length ? await Promise.all(files.map(compressImage)) : existing?.images || [];

  return {
    id,
    title: formData.get("title").trim(),
    category: formData.get("category"),
    categories: formData.get("categories")
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean),
    type: {
      ru: formData.get("typeRu").trim(),
      ua: formData.get("typeUa").trim(),
      en: formData.get("typeEn").trim(),
    },
    desc: {
      ru: formData.get("descRu").trim(),
      ua: formData.get("descUa").trim(),
      en: formData.get("descEn").trim(),
    },
    images,
  };
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  note.textContent = "Сжимаю фото и сохраняю...";

  const product = await productFromForm();
  if (!product.images.length) {
    note.textContent = "Добавь хотя бы одно фото.";
    return;
  }

  const products = readProducts().filter((item) => item.id !== product.id);
  products.push(product);
  writeProducts(products);
  renderList();
  clearForm();
  note.textContent = "Карточка сохранена. Открой галерею или обнови страницу сайта.";
});

resetButton.addEventListener("click", clearForm);

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const products = readProducts();
  const product = products.find((item) => item.id === button.dataset.id);
  if (!product) return;

  if (button.dataset.action === "delete") {
    writeProducts(products.filter((item) => item.id !== product.id));
    renderList();
    return;
  }

  form.elements.id.value = product.id;
  form.elements.title.value = product.title || "";
  form.elements.category.value = product.category || "panels";
  form.elements.categories.value = (product.categories || []).join(", ");
  form.elements.typeRu.value = product.type?.ru || "";
  form.elements.typeUa.value = product.type?.ua || "";
  form.elements.typeEn.value = product.type?.en || "";
  form.elements.descRu.value = product.desc?.ru || "";
  form.elements.descUa.value = product.desc?.ua || "";
  form.elements.descEn.value = product.desc?.en || "";
  note.textContent = "Редактируешь карточку. Фото можно не выбирать, тогда останутся прежние.";
});

exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(readProducts(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "petdecor-products.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

importInput.addEventListener("change", () => {
  const file = importInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const products = JSON.parse(reader.result);
      if (!Array.isArray(products)) throw new Error("Invalid JSON");
      writeProducts(products);
      renderList();
      note.textContent = "Импорт готов.";
    } catch {
      note.textContent = "Не удалось импортировать JSON.";
    }
  };
  reader.readAsText(file);
});

renderList();
