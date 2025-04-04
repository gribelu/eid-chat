/**
 * ChatInspect Custom Element
 *
 * Allows developers and users to select an element on the page to extract context.
 * It highlights inspectable elements and dispatches the extracted text via events.
 */
class ChatInspect extends HTMLElement {
    constructor() {
        super();
        // Overlay for UI blocking during inspection
        this.overlay = null;
        // Original styles for elements to be restored
        this.originalStyles = [];
        // Keep track of event listeners for cleanup
        this.eventListeners = [];
    }

    connectedCallback() {
        this.setupInspectMode();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    /**
     * Activates inspect mode: sets up an overlay and applies highlight styles,
     * then attaches event listeners for element selection.
     */
    setupInspectMode() {
        // Create dark overlay
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '9999',
            pointerEvents: 'none',
            display: 'none',
        });
        document.body.appendChild(this.overlay);

        // Find all inspectable elements
        const highlightElements =
            document.querySelectorAll('[data-ai-inspect]');

        highlightElements.forEach((element) => {
            // Store original styles
            this.originalStyles.push({
                element,
                zIndex: element.style.zIndex,
                position: element.style.position,
                pointerEvents: element.style.pointerEvents,
                cursor: element.style.cursor,
                outline: element.style.outline,
                outlineOffset: element.style.outlineOffset,
                boxShadow: element.style.boxShadow,
            });

            // Set inspection styles
            Object.assign(element.style, {
                zIndex: '10',
                position: 'relative',
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s ease',
                outline: '2px dashed rgba(255, 0, 0, 0.5)',
                outlineOffset: '-2px',
            });

            // Create event handlers
            const handleMouseEnter = () => {
                element.style.boxShadow = '0 0 2px 4px rgba(255, 0, 0, 0.5)';
            };

            const handleMouseLeave = () => {
                element.style.boxShadow = '';
                element.style.outline = '2px dashed rgba(255, 0, 0, 0.5)';
            };

            const handleClick = (event) => {
                event.preventDefault();
                event.stopPropagation();

                // Build message from attributes
                const contextAttr =
                    element.getAttribute('data-ai-context') || '';
                const depthAttr =
                    element.getAttribute('data-ai-get-text-from-depth') || '';
                const selectorAttr =
                    element.getAttribute('data-ai-context-from-selectors') ||
                    '';
                const prefixAttr =
                    element.getAttribute(
                        'data-ai-context-from-selectors-prefixes',
                    ) || '';
                const suffixAttr =
                    element.getAttribute(
                        'data-ai-context-from-selectors-suffixes',
                    ) || '';

                let mainText = contextAttr;
                // If no context or user re-enabled text extraction, gather text
                if (!contextAttr || depthAttr) {
                    mainText +=
                        (mainText ? ' ' : '') +
                        this.getTextFromElement(element, depthAttr);
                }

                // Gather text from selectors
                if (selectorAttr) {
                    const selectors = selectorAttr
                        .split(',')
                        .map((sel) => sel.trim());
                    const prefixes = prefixAttr.split(';');
                    const suffixes = suffixAttr.split(';');

                    selectors.forEach((sel, i) => {
                        document.querySelectorAll(sel).forEach((targetEl) => {
                            const customCtx =
                                targetEl.getAttribute('data-ai-context');
                            const p = prefixes[i] ? prefixes[i].trim() : '';
                            const s = suffixes[i] ? suffixes[i].trim() : '';

                            if (customCtx) {
                                mainText += ` ${p} ${customCtx} ${s}`;
                            } else {
                                mainText += ` ${p} ${this.getTextFromElement(
                                    targetEl,
                                    'all',
                                )} ${s}`;
                            }
                        });
                    });
                }

                // Dispatch event with final message
                this.dispatchEvent(
                    new CustomEvent('element-selected', {
                        detail: { message: mainText.trim() },
                        bubbles: true,
                        composed: true,
                    }),
                );

                this.cleanup();
            };

            // Attach event listeners
            element.addEventListener('mouseenter', handleMouseEnter);
            element.addEventListener('mouseleave', handleMouseLeave);
            element.addEventListener('click', handleClick);

            // Store for cleanup
            this.eventListeners.push({
                element,
                handleMouseEnter,
                handleMouseLeave,
                handleClick,
            });
        });
    }

    /**
     * Extracts text from an element based on the specified depth.
     * - If depth is '0' or unspecified, only the element's own text nodes are used.
     * - If numeric and > 0, collects text from child levels up to that depth.
     * - If 'all', collects text from all descendants.
     *
     * @param {HTMLElement} el - The element from which to extract text.
     * @param {string} depth - The depth level ('0', numeric string, or 'all').
     * @returns {string} The extracted text.
     */
    getTextFromElement(el, depth) {
        if (!depth || depth === '0') {
            let text = '';
            el.childNodes.forEach((child) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    text += ' ' + child.nodeValue;
                }
            });
            return text.trim();
        }
        // If numeric depth
        if (!isNaN(depth) && Number(depth) > 0) {
            return this.collectTextWithDepth(el, Number(depth)).trim();
        }
        // If 'all'
        if (depth === 'all') {
            return this.collectTextWithDepth(el, Infinity).trim();
        }
        // Default fallback
        return (el.textContent || '').trim();
    }

    /**
     * Recursively collects text from a node and its children up to a defined depth.
     *
     * @param {Node} node - The DOM node.
     * @param {number} depth - The depth to traverse.
     * @returns {string} The concatenated text.
     */
    collectTextWithDepth(node, depth) {
        if (depth < 0) return '';
        let text =
            (node.nodeType === Node.TEXT_NODE ? node.nodeValue : '') || '';
        node.childNodes.forEach((child) => {
            text += ' ' + this.collectTextWithDepth(child, depth - 1);
        });
        return text.replace(/\s+/g, ' ');
    }

    /**
     * Restores original styles and removes event listeners and overlays.
     */
    cleanup() {
        // Remove overlay
        if (this.overlay?.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        // Restore original styles
        this.originalStyles.forEach(
            ({
                element,
                zIndex,
                position,
                pointerEvents,
                cursor,
                boxShadow,
                outline,
                outlineOffset,
            }) => {
                element.style.zIndex = zIndex;
                element.style.position = position;
                element.style.pointerEvents = pointerEvents;
                element.style.cursor = cursor;
                element.style.boxShadow = boxShadow;
                element.style.outline = outline;
                element.style.outlineOffset = outlineOffset;
            },
        );

        // Remove event listeners
        this.eventListeners.forEach(
            ({ element, handleMouseEnter, handleMouseLeave, handleClick }) => {
                element.removeEventListener('mouseenter', handleMouseEnter);
                element.removeEventListener('mouseleave', handleMouseLeave);
                element.removeEventListener('click', handleClick);
            },
        );

        // Clear arrays
        this.originalStyles = [];
        this.eventListeners = [];
    }
}

customElements.define('chat-inspect', ChatInspect);
