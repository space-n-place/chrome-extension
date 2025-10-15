/**
 * Предобработка HTML для AI парсинга
 * Удаляет ненужные элементы и оставляет только релевантные данные о недвижимости
 */

// Теги которые нужно полностью удалить
const REMOVE_TAGS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "path",
  "canvas",
  "audio",
  "video",
  "embed",
  "object",
  "link[rel='stylesheet']",
  "link[rel='preload']",
  "link[rel='prefetch']",
  "meta",
];

// Атрибуты которые нужно удалить (оставляем только полезные)
const REMOVE_ATTRIBUTES = [
  "style",
  "onclick",
  "onload",
  "onerror",
  "onmouseover",
  "onmouseout",
  "onfocus",
  "onblur",
  "class",
  "id",
  "data-testid",
  "data-qa",
  "data-cy",
  "data-test",
  "aria-label",
  "aria-hidden",
  "role",
];

// Атрибуты которые нужно сохранить
const KEEP_ATTRIBUTES = [
  "href",
  "src",
  "alt",
  "title",
  "content",
  "property",
  "name",
  "itemprop",
  "itemtype",
  "itemscope",
  "data-price",
  "data-area",
  "data-address",
];

/**
 * Предобработка HTML для отправки в AI
 */
export function preprocessHTML(html?: string): string {
  if (!html) {
    html = document.documentElement.outerHTML;
  }

  // Создаем временный DOM для обработки
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 1. Удаляем ненужные теги
  REMOVE_TAGS.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // 2. Удаляем комментарии
  removeComments(doc);

  // 3. Очищаем атрибуты
  cleanAttributes(doc);

  // 4. Удаляем пустые элементы и навигацию
  removeEmptyElements(doc);
  removeNavigationElements(doc);

  // 5. Компактируем whitespace
  compactWhitespace(doc);

  // Получаем очищенный HTML
  let cleaned = doc.body.innerHTML;

  // 6. Дополнительная очистка строк
  cleaned = cleaned
    .replace(/\s+/g, " ") // множественные пробелы
    .replace(/>\s+</g, "><") // пробелы между тегами
    .replace(/<!--.*?-->/gs, "") // комментарии
    .trim();

  return cleaned;
}

/**
 * Удаляет комментарии из DOM
 */
function removeComments(node: Node) {
  const iterator = document.createNodeIterator(
    node,
    NodeFilter.SHOW_COMMENT,
    null
  );
  const comments: Node[] = [];
  let currentNode;
  while ((currentNode = iterator.nextNode())) {
    comments.push(currentNode);
  }
  comments.forEach((comment) => comment.parentNode?.removeChild(comment));
}

/**
 * Очищает атрибуты элементов
 */
function cleanAttributes(doc: Document) {
  const allElements = doc.querySelectorAll("*");
  allElements.forEach((el) => {
    const attrs = Array.from(el.attributes);
    attrs.forEach((attr) => {
      // Удаляем атрибут если он в списке на удаление и не в списке на сохранение
      if (
        REMOVE_ATTRIBUTES.includes(attr.name) &&
        !KEEP_ATTRIBUTES.includes(attr.name)
      ) {
        el.removeAttribute(attr.name);
      }
      // Также удаляем все data-* атрибуты кроме тех что в KEEP_ATTRIBUTES
      if (
        attr.name.startsWith("data-") &&
        !KEEP_ATTRIBUTES.includes(attr.name)
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
}

/**
 * Удаляет пустые элементы (без текста и без полезных атрибутов)
 */
function removeEmptyElements(doc: Document) {
  const elements = doc.querySelectorAll("*");
  elements.forEach((el) => {
    const hasText = el.textContent?.trim().length ?? 0 > 0;
    const hasUsefulAttrs = KEEP_ATTRIBUTES.some((attr) =>
      el.hasAttribute(attr)
    );
    const hasChildren = el.children.length > 0;

    if (!hasText && !hasUsefulAttrs && !hasChildren) {
      el.remove();
    }
  });
}

/**
 * Удаляет элементы навигации, футеры, хедеры
 */
function removeNavigationElements(doc: Document) {
  const selectors = [
    "nav",
    "header:not([itemscope])", // оставляем header если это schema.org
    "footer",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    ".navbar",
    ".navigation",
    ".menu",
    ".header",
    ".footer",
    ".sidebar",
    ".advertisement",
    ".ad",
    ".cookie",
    ".popup",
    ".modal",
  ];

  selectors.forEach((selector) => {
    try {
      doc.querySelectorAll(selector).forEach((el) => {
        // Проверяем что элемент не содержит важные schema.org данные
        if (!el.querySelector('[itemscope][itemtype*="realestate"]')) {
          el.remove();
        }
      });
    } catch (e) {
      // игнорируем ошибки неправильных селекторов
    }
  });
}

/**
 * Компактирует whitespace в текстовых узлах
 */
function compactWhitespace(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent) {
      node.textContent = node.textContent.replace(/\s+/g, " ");
    }
  }
  node.childNodes.forEach((child) => compactWhitespace(child));
}

/**
 * Получает размер HTML в байтах
 */
export function getHTMLSize(html: string): number {
  return new Blob([html]).size;
}

/**
 * Форматирует размер для отображения
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}


