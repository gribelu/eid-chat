/**
 * ChatInput Custom Element
 *
 * Renders the text input area and send button for user messages.
 * Manages sending of messages via custom events, and auto-adjusts the input's height.
 */
class ChatInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const styles = `
            :host {
                display: block;
                font-size: inherit;
            }

            .input-container {
                display: flex;
                align-items: center;
                padding: 0.5rem 1.6rem 0.5rem 0.5rem;
                margin-top: 2.2rem;
            }

            .text-field {
                flex: 1;
                font-size: 1.5rem;
                padding: 0.8rem 1.2rem;
                min-height: 2.2rem;
                box-shadow: 0 0.2rem 0.8rem 0 rgba(48, 127, 193, 0.15);
                border: solid 0.1rem #307fc1;
                border-radius: 4px;
                resize: none;
                font-family: inherit;
            }

            .send-button {
                margin-left: 1.6rem;
                background-color: #307fc1;
                border-radius: 0.4rem;
                width: 4rem;
                height: 4rem;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .send-button:hover {
                background-color: #0056d6;
            }

            .send-icon {
                width: 1.6rem;
                height: 1.6rem;
                color: #fff;
                transform: rotate(-35deg) translateX(0.15rem);
            }
        `;

        const template = `
            <div class="input-container">
                <textarea
                    class="text-field"
                    placeholder="Type your message..."
                    rows="1"
                ></textarea>
                <button class="send-button">
                    <svg width="16" height="15" viewBox="0 0 16 15" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.99 1.368a.469.469 0 0 0-.626-.537L.302 6.581a.469.469 0 0 0-.002.876L4.53 9.09v5.147a.469.469 0 0 0 .888.211l1.75-3.473 4.27 3.17c.26.193.634.07.728-.24C16.155.833 15.982 1.401 15.99 1.368zM12.27 3.016 4.934 8.24 1.776 7.022l10.495-4.006zM5.47 9.01l6.396-4.555c-5.504 5.806-5.217 5.5-5.24 5.533-.036.048.062-.14-1.156 2.277V9.011zm5.995 3.986-3.759-2.79 6.797-7.17-3.038 9.96z" fill="#FFF" fill-rule="nonzero"/>
                    </svg>

                </button>
            </div>
        `;

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            ${template}
        `;

        this.textField = this.shadowRoot.querySelector('.text-field');
        this.sendButton = this.shadowRoot.querySelector('.send-button');

        // Bind event handlers.
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleSend = this.handleSend.bind(this);
        this.adjustTextAreaHeight = this.adjustTextAreaHeight.bind(this);
    }

    connectedCallback() {
        this.textField.addEventListener('keypress', this.handleKeyPress);
        this.textField.addEventListener('input', this.adjustTextAreaHeight);
        this.sendButton.addEventListener('click', this.handleSend);
    }

    disconnectedCallback() {
        this.textField.removeEventListener('keypress', this.handleKeyPress);
        this.textField.removeEventListener('input', this.adjustTextAreaHeight);
        this.sendButton.removeEventListener('click', this.handleSend);
    }

    /**
     * Adjusts the height of the text area based on its content.
     */
    adjustTextAreaHeight() {
        const textarea = this.textField;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 72) + 'px'; // 72px = 4 rows max
    }

    /**
     * Handles key press events to send message on "Enter" (without Shift).
     */
    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.textField.value.trim()) {
                this.handleSend();
            }
        }
    }

    /**
     * Handles the send button click event by dispatching a "message-sent" event.
     */
    handleSend() {
        const text = this.textField.value.trim();
        if (text) {
            const formattedText = text.replace(/\n/g, '<br>');

            // Dispatch custom event with message data
            const event = new CustomEvent('message-sent', {
                detail: {
                    formattedText,
                    rawText: text,
                },
            });
            this.dispatchEvent(event);

            // Clear input
            this.textField.value = '';
            this.adjustTextAreaHeight();
        }
    }
}

customElements.define('chat-input', ChatInput);
