class ChatMessage extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
    }

    static get observedAttributes() {
        return ['message']
    }

    connectedCallback() {
        this.render()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'message' && oldValue !== newValue) {
            this.render()
        }
    }

    render() {
        const messageData = JSON.parse(this.getAttribute('message') || '{}')
        const isUser = messageData.sender === 'user'

        const styles = `
            :host {
                display: block;
                font-size: inherit;
                font-family: inherit;
                margin-bottom: 1.6rem;
            }

            .message-container {
                display: flex;
                flex-direction: ${isUser ? 'row-reverse' : 'row'};
                align-items: flex-end;
            }

            .avatar {
                width: 4rem;
                height: 4rem;
                border-radius: 50%;
                background-color: #e0e0e0;
                margin: ${isUser ? '0 0 0 1.2rem' : '0 1.2rem 0 0'};
            }

            .message-bubble {
                max-width: 70%;
                padding: 1.2rem 1.6rem;
                background-color: ${
                    messageData.placeholder ? '#e0f7fa' : '#fff'
                };
                background-image: ${
                    messageData.placeholder
                        ? 'linear-gradient(122deg, #019cae, #307fc1)'
                        : 'none'
                };
                border-radius: ${
                    messageData.placeholder
                        ? '1.6rem 1.6rem 1.6rem 0'
                        : isUser
                        ? '0.8rem 0.8rem 0 0.8rem'
                        : '0.8rem 0.8rem 0.8rem 0'
                };
                box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.05);
                border: ${
                    messageData.placeholder
                        ? 'solid 1px transparent'
                        : isUser
                        ? 'solid 1px #307fc1'
                        : 'solid 1px transparent'
                };
                color: ${messageData.placeholder ? '#fff' : 'inherit'};
                font-size: 1.4rem;
                position: relative;
            }

            @keyframes blink {
                0%, 100% { opacity: 0.25; }
                50% { opacity: 1; }
            }

            .message-bubble.placeholder {
                    padding-top: 0.7rem;
                    padding-bottom: 0.6rem;
                    padding-inline: 1.15rem;
            }

            .message-bubble.placeholder::after {
                content: '';
                display: inline;
            }

            .message-bubble.placeholder .message-content::after {
                content: '';
                display: inline-block;
            }

            .dot {
                display: inline-block;
                margin: 0 1px;
                animation: blink 1s infinite;
                font-size: 1.8rem;
                letter-spacing: -0.1rem;
                line-height: 0;
            }

            .dot:nth-child(2) {
                animation-delay: 0.2s;
            }

            .dot:nth-child(3) {
                animation-delay: 0.4s;
            }

            .message-content {
                font-size: 1.4rem;
                overflow-wrap: anywhere;
            }

            .message-content img,
            .message-content svg {
                max-width: 100%;
                height: auto;
                display: block;
            }
        `

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="message-container">
                <img class="avatar"
                     src="${
                         isUser
                             ? 'https://gribelu.github.io/eid-chat/img/avatar.svg'
                             : 'https://gribelu.github.io/eid-chat/img/avatar.svg'
                     }"
                     alt="${isUser ? 'User' : 'AI'} avatar">
                <div class="message-bubble ${
                    messageData.placeholder ? 'placeholder' : ''
                }">
                    <div class="message-content">
                        ${
                            messageData.placeholder
                                ? '<span class="dot">&bull;</span><span class="dot">&bull;</span><span class="dot">&bull;</span>'
                                : messageData.text
                        }
                    </div>
                </div>
            </div>
        `
    }
}

customElements.define('chat-message', ChatMessage)
