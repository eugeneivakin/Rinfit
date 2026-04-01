(() => {
  const ROOT_SELECTOR = ".js-collection-infinite-scroll[data-enabled='true']";

  function getSectionElement(sectionId) {
    return document.getElementById(`shopify-section-${sectionId}`);
  }

  function getProductList(sectionId) {
    return document.getElementById(`product-list-${sectionId}`);
  }

  function setStatusLoading(root, isLoading) {
    const statusEl = root.querySelector(".js-collection-infinite-scroll-status");

    if (!statusEl) {
      return;
    }

    statusEl.hidden = !isLoading;
  }

  function updateBrowserUrl(pageUrl) {
    if (!(pageUrl instanceof URL) || !window.history?.replaceState) {
      return;
    }

    const nextAddress = `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`;
    window.history.replaceState(window.history.state, "", nextAddress);
  }

  function revealAppendedCards(productList, appendedCards) {
    if (!productList || appendedCards.length === 0) {
      return;
    }

    if (typeof productList.reveal === "function") {
      productList.reveal();
      return;
    }

    appendedCards.forEach((card) => {
      card.removeAttribute("reveal-on-scroll");
    });
  }

  async function loadNextPage(root) {
    const nextUrl = root.dataset.nextUrl;
    const sectionId = root.dataset.sectionId;

    if (!nextUrl || !sectionId || root.dataset.loading === "true") {
      return;
    }

    root.dataset.loading = "true";
    setStatusLoading(root, true);

    try {
      const url = new URL(nextUrl, window.location.origin);
      url.searchParams.set("section_id", sectionId);

      const response = await fetch(url.toString(), { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(`Infinite scroll request failed with status ${response.status}`);
      }

      const html = await response.text();
      const tempDoc = new DOMParser().parseFromString(html, "text/html");

      const currentSection = getSectionElement(sectionId);
      const currentList = getProductList(sectionId);
      const nextList = tempDoc.getElementById(`product-list-${sectionId}`);

      if (!currentSection || !currentList || !nextList) {
        throw new Error("Infinite scroll cannot find product list in current or fetched markup");
      }

      const fragment = document.createDocumentFragment();
      const currentRevealCards = Array.from(currentList.querySelectorAll('product-card[reveal-on-scroll="true"]'));
      currentRevealCards.forEach((card) => {
        card.removeAttribute("reveal-on-scroll");
      });

      const appendedCards = [];
      Array.from(nextList.children).forEach((child) => {
        const importedNode = document.importNode(child, true);
        fragment.appendChild(importedNode);

        if (importedNode.matches?.('product-card[reveal-on-scroll="true"]')) {
          appendedCards.push(importedNode);
        }
      });

      currentList.appendChild(fragment);
      revealAppendedCards(currentList, appendedCards);
      updateBrowserUrl(new URL(nextUrl, window.location.origin));

      const nextRoot = tempDoc.querySelector(`${ROOT_SELECTOR}[data-section-id='${sectionId}']`);
      const nextPageUrl = nextRoot?.dataset?.nextUrl;

      if (nextPageUrl) {
        root.dataset.nextUrl = nextPageUrl;
      } else {
        root.dataset.nextUrl = "";

        const sentinel = root.querySelector(".js-collection-infinite-scroll-sentinel");
        if (sentinel) {
          sentinel.remove();
        }

        root._infiniteObserver?.disconnect?.();
      }
    } catch (error) {
      console.error(error);
    } finally {
      root.dataset.loading = "false";
      setStatusLoading(root, false);
    }
  }

  function initInfiniteRoot(root) {
    if (root.dataset.infiniteReady === "true") {
      return;
    }

    const sentinel = root.querySelector(".js-collection-infinite-scroll-sentinel");
    if (!sentinel) {
      return;
    }

    const fallbackPagination = root.querySelector(".js-collection-infinite-scroll-pagination");
    if (fallbackPagination) {
      fallbackPagination.hidden = true;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadNextPage(root);
          }
        });
      },
      { rootMargin: "250px 0px 250px 0px" },
    );

    observer.observe(sentinel);
    root._infiniteObserver = observer;
    root.dataset.infiniteReady = "true";
  }

  function initInfiniteScroll(scope = document) {
    scope.querySelectorAll(ROOT_SELECTOR).forEach((root) => initInfiniteRoot(root));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initInfiniteScroll();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }

          if (node.matches?.(ROOT_SELECTOR)) {
            initInfiniteRoot(node);
          } else {
            initInfiniteScroll(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
