/**
 * Search-as-you-type combobox (input + suggestions). Scales to large lists by filtering + capping rows.
 */
(function (global) {
    const DEFAULT_MAX = 50;

    function initCombo(root, options) {
        if (!root) throw new Error("Combo: missing root element");

        const input = root.querySelector(".combo-input");
        const hidden = root.querySelector(".combo-value");
        const list = root.querySelector(".combo-list");

        if (!input || !hidden || !list) {
            throw new Error("Combo: root must contain .combo-input, .combo-value, .combo-list");
        }

        const getItems = options.getItems || function () {
            return [];
        };
        const getValue = options.getValue || function (x) {
            return String(x);
        };
        const getLabel = options.getLabel || function (x) {
            return String(x);
        };
        const filterItem = options.filter || function (q, item) {
            const qq = q.trim().toLowerCase();
            if (!qq) return true;
            const label = getLabel(item).toLowerCase();
            return label.includes(qq);
        };
        const maxSuggestions = options.maxSuggestions != null ? options.maxSuggestions : DEFAULT_MAX;
        const onChange = options.onChange;

        let activeIndex = -1;
        let open = false;
        let docHandlerBound = false;

        function currentFiltered() {
            const q = input.value;
            const all = getItems();
            const filtered = all.filter(function (it) {
                return filterItem(q, it);
            });
            if (!q.trim()) {
                return filtered.slice(0, maxSuggestions);
            }
            return filtered.slice(0, maxSuggestions);
        }

        function highlightItems() {
            const lis = list.querySelectorAll(".combo-item");
            lis.forEach(function (li, i) {
                li.classList.toggle("combo-item-active", i === activeIndex);
                if (i === activeIndex) {
                    li.scrollIntoView({ block: "nearest" });
                }
            });
        }

        function renderList() {
            const items = currentFiltered();
            list.innerHTML = "";
            activeIndex = -1;

            items.forEach(function (it, i) {
                const li = document.createElement("li");
                li.className = "combo-item";
                li.setAttribute("role", "option");
                li.textContent = getLabel(it);
                li.dataset.index = String(i);
                li.addEventListener("mousedown", function (e) {
                    e.preventDefault();
                    selectItem(it);
                });
                list.appendChild(li);
            });

            list.setAttribute("aria-expanded", items.length > 0 ? "true" : "false");
        }

        function selectItem(it) {
            if (it == null) return;
            hidden.value = getValue(it);
            input.value = getLabel(it);
            closeList();
            input.setAttribute("aria-activedescendant", "");
            if (onChange) {
                onChange(hidden.value, it);
            }
        }

        function openList() {
            open = true;
            root.classList.add("combo-open");
            list.classList.remove("hidden");
            renderList();
            input.setAttribute("aria-expanded", "true");

            if (!docHandlerBound) {
                docHandlerBound = true;
                document.addEventListener("click", onDocClick);
            }
        }

        function closeList() {
            open = false;
            root.classList.remove("combo-open");
            list.classList.add("hidden");
            activeIndex = -1;
            input.setAttribute("aria-expanded", "false");
        }

        function onDocClick(e) {
            if (!root.contains(e.target)) {
                closeList();
            }
        }

        function onInput() {
            const prev = hidden.value;
            hidden.value = "";
            openList();
            if (prev !== "" && typeof onChange === "function") {
                onChange("", null);
            }
        }

        function onFocus() {
            openList();
        }

        function onKeydown(e) {
            const items = currentFiltered();
            const lis = list.querySelectorAll(".combo-item");

            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (!open) openList();
                if (items.length === 0) return;
                if (activeIndex < 0) activeIndex = 0;
                else activeIndex = Math.min(activeIndex + 1, items.length - 1);
                highlightItems();
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (!open) openList();
                if (items.length === 0) return;
                if (activeIndex < 0) activeIndex = items.length - 1;
                else activeIndex = Math.max(activeIndex - 1, 0);
                highlightItems();
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                if (activeIndex >= 0 && items[activeIndex] != null) {
                    selectItem(items[activeIndex]);
                }
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                closeList();
                return;
            }
        }

        input.addEventListener("input", onInput);
        input.addEventListener("focus", onFocus);
        input.addEventListener("keydown", onKeydown);

        input.setAttribute("role", "combobox");
        input.setAttribute("aria-autocomplete", "list");
        input.setAttribute("aria-expanded", "false");

        function destroy() {
            input.removeEventListener("input", onInput);
            input.removeEventListener("focus", onFocus);
            input.removeEventListener("keydown", onKeydown);
            document.removeEventListener("click", onDocClick);
        }

        return {
            getValue: function () {
                return hidden.value;
            },
            setValue: function (val) {
                const all = getItems();
                const it = all.find(function (x) {
                    return getValue(x) === val;
                });
                if (it) {
                    hidden.value = val;
                    input.value = getLabel(it);
                } else {
                    hidden.value = "";
                    input.value = "";
                }
            },
            clear: function () {
                hidden.value = "";
                input.value = "";
            },
            refresh: function () {
                if (open) {
                    renderList();
                }
            },
            focus: function () {
                input.focus();
            },
            destroy: destroy,
        };
    }

    /**
     * Build combo DOM (for dynamic rows). className optional.
     */
    function createComboElement(idPrefix, placeholder, className) {
        const wrap = document.createElement("div");
        wrap.className = "combo" + (className ? " " + className : "");
        if (idPrefix) wrap.id = idPrefix;

        const inp = document.createElement("input");
        inp.type = "text";
        inp.className = "combo-input";
        inp.setAttribute("autocomplete", "off");
        inp.placeholder = placeholder || "Search…";

        const hid = document.createElement("input");
        hid.type = "hidden";
        hid.className = "combo-value";
        hid.value = "";

        const ul = document.createElement("ul");
        ul.className = "combo-list hidden";
        ul.setAttribute("role", "listbox");

        wrap.appendChild(inp);
        wrap.appendChild(hid);
        wrap.appendChild(ul);

        return wrap;
    }

    global.Combo = {
        init: initCombo,
        createElement: createComboElement,
    };
})(window);
