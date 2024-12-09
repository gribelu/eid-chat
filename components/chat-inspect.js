class ChatInspect extends HTMLElement {
    constructor() {
        super()
        this.overlay = null
        this.originalStyles = []
        this.eventListeners = []
    }

    connectedCallback() {
        this.setupInspectMode()
    }

    disconnectedCallback() {
        this.cleanup()
    }

    setupInspectMode() {
        // Create dark overlay
        this.overlay = document.createElement('div')
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
        })
        document.body.appendChild(this.overlay)

        // Find all inspectable elements
        const highlightElements = document.querySelectorAll('[data-ai]')

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
            })

            // Set inspection styles
            Object.assign(element.style, {
                zIndex: '10',
                // zIndex: '10000',
                position: 'relative',
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s ease',
                // boxShadow:
                //     ' inset 0 0 2px 4px rgba(255, 0, 0, 0.3), inset 0 0 2px 6px rgba(48, 127, 193, 0.3)',
                outline: '2px dashed rgba(255, 0, 0, 0.5)',
                outlineOffset: '-2px',
            })

            // Create event handlers
            const handleMouseEnter = () => {
                element.style.boxShadow = '0 0 2px 4px rgba(255, 0, 0, 0.5)'
            }

            const handleMouseLeave = () => {
                element.style.boxShadow = ''
                element.style.outline = '2px dashed rgba(255, 0, 0, 0.5)'
            }

            const handleClick = (event) => {
                event.preventDefault()
                event.stopPropagation()

                const dataAiAttribute = element.getAttribute('data-ai')
                if (!dataAiAttribute) return

                try {
                    const dataAI = JSON.parse(dataAiAttribute)
                    const messageParts = []

                    // Handle focus
                    if (dataAI.focus) {
                        let focusValue = Array.isArray(dataAI.focus)
                            ? dataAI.focus.join(', ')
                            : dataAI.focus

                        if (dataAI.appendFocusFromElement) {
                            focusValue += ', ' + element.textContent?.trim()
                        }
                        messageParts.push(`Focus: ${focusValue}`)
                    }

                    // Handle context
                    if (dataAI.context) {
                        const contextValue = Array.isArray(dataAI.context)
                            ? dataAI.context.join(', ')
                            : dataAI.context
                        messageParts.push(`Context: ${contextValue}`)
                    }

                    // Handle attributes
                    if (dataAI.attributes) {
                        const attrArray = Array.isArray(dataAI.attributes)
                            ? dataAI.attributes
                            : [dataAI.attributes]
                        const attrStrings = attrArray.map((attrObj) =>
                            Object.entries(attrObj)
                                .map(([key, value]) => `${key}=${value}`)
                                .join(', '),
                        )
                        messageParts.push(
                            `Attributes: ${attrStrings.join(', ')}`,
                        )
                    }

                    const message = messageParts.join(' ')
                    const displayedMessage = dataAI.displayedMessage || false

                    // Dispatch custom event with the inspection data
                    this.dispatchEvent(
                        new CustomEvent('element-selected', {
                            detail: {
                                message,
                                displayedMessage,
                            },
                            bubbles: true,
                            composed: true,
                        }),
                    )
                } catch (error) {
                    console.error('Failed to parse data-ai attribute:', error)
                    this.dispatchEvent(
                        new CustomEvent('inspect-cancel', {
                            bubbles: true,
                            composed: true,
                        }),
                    )
                }

                this.cleanup()
            }

            // Attach event listeners
            element.addEventListener('mouseenter', handleMouseEnter)
            element.addEventListener('mouseleave', handleMouseLeave)
            element.addEventListener('click', handleClick)

            // Store for cleanup
            this.eventListeners.push({
                element,
                handleMouseEnter,
                handleMouseLeave,
                handleClick,
            })
        })
    }

    cleanup() {
        // Remove overlay
        if (this.overlay?.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay)
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
                element.style.zIndex = zIndex
                element.style.position = position
                element.style.pointerEvents = pointerEvents
                element.style.cursor = cursor
                element.style.boxShadow = boxShadow
                element.style.outline = outline
                element.style.outlineOffset = outlineOffset
            },
        )

        // Remove event listeners
        this.eventListeners.forEach(
            ({ element, handleMouseEnter, handleMouseLeave, handleClick }) => {
                element.removeEventListener('mouseenter', handleMouseEnter)
                element.removeEventListener('mouseleave', handleMouseLeave)
                element.removeEventListener('click', handleClick)
            },
        )

        // Clear arrays
        this.originalStyles = []
        this.eventListeners = []
    }
}

customElements.define('chat-inspect', ChatInspect)
