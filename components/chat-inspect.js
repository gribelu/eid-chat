class ChatInspect extends HTMLElement {
    constructor() {
        super();
        this.overlay = null;
        this.originalStyles = [];
        this.eventListeners = [];
    }

    connectedCallback() {
        this.setupInspectMode();
    }

    disconnectedCallback() {
        this.cleanup();
    }

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
                    selectors.forEach((sel) => {
                        document.querySelectorAll(sel).forEach((targetEl) => {
                            const customCtx =
                                targetEl.getAttribute('data-ai-context');
                            if (customCtx) {
                                mainText += ' ' + customCtx;
                            } else {
                                mainText +=
                                    ' ' +
                                    this.getTextFromElement(targetEl, 'all');
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

    collectTextWithDepth(node, depth) {
        if (depth < 0) return '';
        let text =
            (node.nodeType === Node.TEXT_NODE ? node.nodeValue : '') || '';
        node.childNodes.forEach((child) => {
            text += ' ' + this.collectTextWithDepth(child, depth - 1);
        });
        return text.replace(/\s+/g, ' ');
    }

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
