(() => {
	const PRIVY_CONTAINER_ID = "privy-container";
	const PRIVY_TAB_SELECTOR = ".privy-tab-container";
	const CLOSE_BUTTON_CLASS = "privy-custom-tab-close";
	const SESSION_STORAGE_KEY = "privy-tab-closed";
	const INIT_FLAG = "privyCustomInit";

	const isTabClosedForSession = () => {
		try {
			return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "1";
		} catch (error) {
			return false;
		}
	};

	const setTabClosedForSession = () => {
		try {
			window.sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
		} catch (error) {
			// Ignore storage errors.
		}
	};

	const hideTab = (tabContainer) => {
		if (!tabContainer) return;
		tabContainer.hidden = true;
		tabContainer.setAttribute("aria-hidden", "true");
	};

	const ensureCloseButton = (tabContainer) => {
		if (!tabContainer) return;
		if (tabContainer.querySelector(`.${CLOSE_BUTTON_CLASS}`)) {
			return;
		}

		const closeButton = document.createElement("button");
		closeButton.type = "button";
		closeButton.className = CLOSE_BUTTON_CLASS;
		closeButton.setAttribute("aria-label", "Close tab");
		closeButton.textContent = "×";

		closeButton.addEventListener("click", () => {
			hideTab(tabContainer);
			setTabClosedForSession();
		});

		tabContainer.appendChild(closeButton);
	};

	const processContainer = (container) => {
		if (!container) return;
		const tabContainer = container.querySelector(PRIVY_TAB_SELECTOR);
		if (!tabContainer) return;

		ensureCloseButton(tabContainer);

		if (isTabClosedForSession()) {
			hideTab(tabContainer);
		}
	};

	const start = () => {
		if (window[INIT_FLAG]) {
			return;
		}

		window[INIT_FLAG] = true;

		let containerObserver = null;

		const attachToContainer = (container) => {
			if (!container) return;

			processContainer(container);

			if (!containerObserver) {
				containerObserver = new MutationObserver(() => {
					processContainer(container);
				});

				containerObserver.observe(container, {
					childList: true,
					subtree: true,
				});
			}
		};

		const existingContainer = document.getElementById(PRIVY_CONTAINER_ID);
		if (existingContainer) {
			attachToContainer(existingContainer);
			return;
		}

		const observer = new MutationObserver(() => {
			const container = document.getElementById(PRIVY_CONTAINER_ID);
			if (!container) return;

			observer.disconnect();
			attachToContainer(container);
		});

		observer.observe(document.documentElement, {
			childList: true,
			subtree: true,
		});
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start, { once: true });
	} else {
		start();
	}
})();
