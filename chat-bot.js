/**
 * ChatBot Custom Element
 *
 * Serves as the main container for the chat interface.
 * Handles initialization of the SignalR connection, managing chat state, and dispatching messages.
 * Integrates chat input, message display, history, and inspect features.
 */
import { styles } from './styles/styles.js';
import './components/chat-message.js';
import './components/chat-input.js';
import './components/chat-history.js';
import './components/chat-inspect.js';
import {
    initializeSignalRConnection,
    sendMessageToApi,
    onReceiveMessage,
    onCompleteMessage,
} from './services/api-service.js';

class ChatBot extends HTMLElement {
    static get observedAttributes() {
        return ['server-url', 'module-id'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Initialize configuration from attributes
        this.config = {
            serverUrl: this.getAttribute('server-url'),
            moduleId: this.getAttribute('module-id'),
        };

        // Load SignalR script & initialize connection
        this.loadSignalR().then(() => {
            this.initializeConnection();
        });

        // Initialize state for UI management
        this.state = {
            isOpen: false,
            isFullscreen: false,
            messages: [],
            isConnected: false,
            showHistory: false,
            isInspectMode: false,
            connectionStatus: 'connecting',
        };

        // Create template for chat UI
        const template = document.createElement('template');
        template.innerHTML = `
            <style>${styles}</style>
            <div class="chat-container">
                <button class="toggle-button">
                    <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Dashboard---My-identity" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="My-Identity-Header" transform="translate(-217.000000, -22.000000)" fill="#307FC1"><g id="Group-4"><g id="header"><g id="logo-empowerid" transform="translate(217.000000, 22.000000)"><path d="M10.2857143,7 L13.6387529,7 C16.9030426,7 18.8571429,8.91150333 18.8571429,12.1427955 C18.8571429,15.374211 16.9030426,17.2857143 13.6387529,17.2857143 L10.2857143,17.2857143 L10.2857143,7 Z M13.4432449,19.5176942 C18.5821349,19.5176942 21.5893052,16.7350599 21.5893052,11.9999089 C21.5893052,7.26487932 18.5821349,4.48206279 13.4432449,4.48206279 L8.95497266,4.48206279 C8.05728175,4.48206279 7.51871582,5.02074888 7.51871582,5.91831599 L7.51871582,18.0815017 C7.51871582,18.9791296 8.05728175,19.5176942 8.95497266,19.5176942 L13.4432449,19.5176942 Z M5.82693944,18.2161581 L5.82693944,5.78378118 C5.82693944,4.88615332 5.33321855,4.34758875 4.50285599,4.34758875 C3.65013166,4.34758875 3.15641078,4.88615332 3.15641078,5.78378118 L3.15641078,18.2161581 C3.15641078,19.1138467 3.65013166,19.6524113 4.50285599,19.6524113 C5.33321855,19.6524113 5.82693944,19.1138467 5.82693944,18.2161581 Z M19.1438525,0 C21.8258659,0 24,2.17412858 24,4.85613516 L24,19.1439256 C24,21.8258106 21.8258659,24 19.1438525,24 L4.85608669,24 C2.17413409,24 0,21.8258106 0,19.1439256 L0,4.85613516 C0,2.17412858 2.17413409,0 4.85608669,0 L19.1438525,0 Z" id="Combined-Shape-Copy"></path></g></g></g></g></g></svg>
                </button>
                <div class="chat-bot-container">
                    <div class="chat-content">
                        <div class="header">
                            <button class="icon-button fullscreen">
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                                </svg>
                                <span>FULLSCREEN</span>
                            </button>
                            <button class="icon-button close">
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                                <span>CLOSE</span>
                            </button>
                        </div>
                        <div class="messages-container-wrapper">
                            <div class="messages-container"></div>
                        </div>
                        <div class="input-footer">
                            <chat-input></chat-input>
                            <div class="footer-buttons">
                                <button class="icon-button inspect">
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                    <span>INSPECT</span>
                                </button>
                                <button class="icon-button history">
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                                    </svg>
                                    <span>HISTORY</span>
                                </button>
                                <button class="icon-button new-chat">
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                    </svg>
                                    <span>NEW CHAT</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="line-glow"></div>
                </div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Bind event handler methods
        this.handleToggleChat = this.handleToggleChat.bind(this);
        this.handleToggleFullscreen = this.handleToggleFullscreen.bind(this);
        this.handleInspect = this.handleInspect.bind(this);
        this.handleNewChat = this.handleNewChat.bind(this);
        this.handleHistorySelect = this.handleHistorySelect.bind(this);
        this.handleToggleHistory = this.handleToggleHistory.bind(this);
    }

    /**
     * Handles attribute changes for configuration attributes.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'server-url':
                this.config.serverUrl = newValue;
                break;
            case 'module-id':
                this.config.moduleId = newValue;
                break;
        }
    }

    /**
     * Dynamically loads the SignalR script if not already loaded.
     */
    async loadSignalR() {
        if (window.signalR) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src =
                'https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.7/signalr.min.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load SignalR'));
            document.head.appendChild(script);
        });
    }

    connectedCallback() {
        this.setupEventListeners();
        this.setupMessageHandlers();
    }

    disconnectedCallback() {
        // Cleanup event listeners
    }

    /**
     * Sets up event listeners for various UI buttons and input events.
     */
    setupEventListeners() {
        const toggleBtn = this.shadowRoot.querySelector('.toggle-button');
        toggleBtn.addEventListener('click', this.handleToggleChat);

        const fullscreenBtn = this.shadowRoot.querySelector('.fullscreen');
        fullscreenBtn.addEventListener('click', this.handleToggleFullscreen);

        const closeBtn = this.shadowRoot.querySelector('.close');
        closeBtn.addEventListener('click', this.handleToggleChat);

        const inspectBtn = this.shadowRoot.querySelector('.inspect');
        inspectBtn.addEventListener('click', this.handleInspect);

        const historyBtn = this.shadowRoot.querySelector('.history');
        historyBtn.addEventListener('click', this.handleToggleHistory);

        const newChatBtn = this.shadowRoot.querySelector('.new-chat');
        newChatBtn.addEventListener('click', this.handleNewChat);

        const chatInput = this.shadowRoot.querySelector('chat-input');
        chatInput.addEventListener('message-sent', (e) =>
            this.handleSendMessage(e.detail),
        );
    }

    /**
     * Initializes the SignalR connection and updates state based on success or failure.
     */
    async initializeConnection() {
        try {
            if (!this.config.serverUrl || !this.config.moduleId) {
                throw new Error(
                    'Missing required configuration: server-url and module-id attributes are required',
                );
            }

            await initializeSignalRConnection(this.config);
            this.state.isConnected = true;
            this.state.connectionStatus = 'connected';
        } catch (error) {
            console.error('Connection failed:', error);
            this.state.connectionStatus = 'disconnected';

            // Show error message to user
            const errorMessage = {
                id: Date.now(),
                text: 'Failed to initialize chat. Please check configuration and try again.',
                sender: 'system',
                timestamp: new Date(),
            };
            this.state.messages.push(errorMessage);
            this.updateUI();
        }
    }

    /**
     * Registers message event handlers for receiving and completing messages.
     */
    setupMessageHandlers() {
        onReceiveMessage((messageChunk) => {
            const lastMessage =
                this.state.messages[this.state.messages.length - 1];

            if (lastMessage && lastMessage.placeholder) {
                const updatedMessage = {
                    ...lastMessage,
                    text: messageChunk,
                    placeholder: false,
                    streaming: true,
                };
                this.state.messages[this.state.messages.length - 1] =
                    updatedMessage;
            } else if (
                lastMessage &&
                lastMessage.sender === 'ai' &&
                lastMessage.streaming
            ) {
                const updatedMessage = {
                    ...lastMessage,
                    text: lastMessage.text + messageChunk,
                };
                this.state.messages[this.state.messages.length - 1] =
                    updatedMessage;
            } else {
                const aiMessage = {
                    id: Date.now(),
                    text: messageChunk,
                    sender: 'ai',
                    timestamp: new Date(),
                    streaming: true,
                };
                this.state.messages.push(aiMessage);
            }
            this.updateUI();
        });

        onCompleteMessage(() => {
            const lastMessage =
                this.state.messages[this.state.messages.length - 1];
            if (lastMessage && lastMessage.streaming) {
                const updatedMessage = {
                    ...lastMessage,
                    streaming: false,
                };
                this.state.messages[this.state.messages.length - 1] =
                    updatedMessage;
                this.updateUI();
            }
        });
    }

    // UI event handler methods below:

    handleToggleChat() {
        this.state.isOpen = !this.state.isOpen;
        this.state.isInspectMode = false;
        this.updateUI();
    }

    handleToggleFullscreen() {
        this.state.isFullscreen = !this.state.isFullscreen;
        this.updateUI();
    }

    handleToggleHistory() {
        this.state.showHistory = !this.state.showHistory;
        this.updateUI();
    }

    handleNewChat() {
        this.state.messages = [];
        this.updateUI();
    }

    handleHistorySelect(messages) {
        this.state.messages = messages;
        this.state.showHistory = false;
        this.updateUI();
    }

    handleInspect() {
        this.state.isInspectMode = true;
        this.state.isOpen = false;
        this.updateUI();

        const chatInspect = document.createElement('chat-inspect');
        chatInspect.addEventListener('element-selected', (e) => {
            this.handleElementSelected(e.detail.message);
        });
        chatInspect.addEventListener('inspect-cancel', () => {
            this.handleInspectCancel();
        });
        document.body.appendChild(chatInspect);
    }

    handleElementSelected(message) {
        this.state.isInspectMode = false;
        this.state.isOpen = true;

        // Show user message in chat
        const userMessage = {
            id: Date.now(),
            text: message,
            sender: 'user',
            timestamp: new Date(),
        };
        this.state.messages.push(userMessage);

        const placeholderMessage = {
            id: Date.now() + 1,
            text: '',
            sender: 'ai',
            timestamp: new Date(),
            placeholder: true,
        };
        this.state.messages.push(placeholderMessage);

        this.updateUI();
        this.handleSendMessageFromInspect(message);
    }

    async handleSendMessageFromInspect(text) {
        try {
            // Prefix message sent to the server; won't be displayed to the user
            await sendMessageToApi(`Context: ${text}`);
        } catch (error) {
            console.error('Failed to send inspect message:', error);
        }
    }

    handleInspectCancel() {
        this.state.isInspectMode = false;
        this.updateUI();
    }

    /**
     * Handles the sending of messages from the chat input.
     */
    handleSendMessage = async ({ formattedText, rawText }) => {
        if (!this.state.isConnected) {
            console.error('Not connected to server');
            return;
        }
        const userMessage = {
            id: Date.now(),
            text: formattedText,
            sender: 'user',
            timestamp: new Date(),
        };
        this.state.messages.push(userMessage);

        const placeholderMessage = {
            id: Date.now() + 1,
            text: '',
            sender: 'ai',
            timestamp: new Date(),
            placeholder: true,
        };
        this.state.messages.push(placeholderMessage);
        this.updateUI();

        try {
            // Prefix message sent to the server with "Context:"
            await sendMessageToApi(
                `Context: ${rawText}`,
                'en',
                this.config.moduleId,
            );
        } catch (error) {
            console.error('Failed to send message:', error);
            this.state.messages = this.state.messages.filter(
                (msg) => msg.id !== placeholderMessage.id,
            );
            const errorMessage = {
                id: Date.now() + 2,
                text: 'Failed to send message. Please try again later.',
                sender: 'system',
                timestamp: new Date(),
            };
            this.state.messages.push(errorMessage);
            this.updateUI();
        }
    };

    /**
     * Updates the UI based on current state; rerenders messages and history.
     */
    updateUI() {
        const container = this.shadowRoot.querySelector('.chat-bot-container');
        container.classList.toggle('open', this.state.isOpen);
        container.classList.toggle('fullscreen', this.state.isFullscreen);

        // Update messages display
        this.renderMessages();

        // Update history visibility
        const history = this.shadowRoot.querySelector('chat-history');
        if (this.state.showHistory && !history) {
            const historyElement = document.createElement('chat-history');
            historyElement.addEventListener('select', (e) =>
                this.handleHistorySelect(e.detail),
            );
            this.shadowRoot.appendChild(historyElement);
        } else if (!this.state.showHistory && history) {
            history.remove();
        }

        // Scroll to bottom
        const messagesContainer = this.shadowRoot.querySelector(
            '.messages-container',
        );
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Renders chat messages in the messages container.
     */
    renderMessages() {
        const messagesContainerWrapper = this.shadowRoot.querySelector(
            '.messages-container-wrapper',
        );
        const messagesContainer = this.shadowRoot.querySelector(
            '.messages-container',
        );
        messagesContainer.innerHTML = '';

        messagesContainerWrapper.style.display =
            this.state.messages.length === 0 ? 'none' : 'block';

        messagesContainer.style.display =
            this.state.messages.length === 0 ? 'none' : 'block';

        this.state.messages.forEach((message) => {
            const messageElement = document.createElement('chat-message');
            messageElement.setAttribute('message', JSON.stringify(message));
            messagesContainer.appendChild(messageElement);
        });
    }
}

customElements.define('chat-bot', ChatBot);
