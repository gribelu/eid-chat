/**
 * ChatBot Custom Element
 *
 * Serves as the main container for the chat interface.
 * Handles initialization of the SignalR connection, managing chat state, and dispatching messages.
 * Integrates chat input, message display, history, and inspect features.
 */
import { styles } from "./styles/styles.js";
import "./components/chat-message.js";
import "./components/chat-input.js";
import "./components/chat-history.js";
import "./components/chat-inspect.js";
import {
  initializeSignalRConnection,
  sendMessageToApi,
  onReceiveMessage,
  onCompleteMessage,
  updateSystemParams,
} from "./services/api-service.js";

class ChatBot extends HTMLElement {
  static get observedAttributes() {
    return ["server-url", "module-id"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize EIDChat global object
    this.initializeEIDChat();

    // Load SignalR script but don't initialize connection yet
    this.loadSignalR();

    // Initialize state for UI management
    this.state = {
      isOpen: false,
      isFullscreen: false,
      messages: [],
      isConnected: false,
      showHistory: false,
      isInspectMode: false,
      connectionStatus: "disconnected",
      connectionInitialized: false,
    };

    // Create template for chat UI
    const template = document.createElement("template");
    template.innerHTML = `
            <style>${styles}</style>
            <div class="chat-container">
                <button class="toggle-button disconnected">
                    <div class="toggle-button__svg-container">
                          <svg width="64px" height="64px" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                              <title>m/buttons/64/chatbot/normal</title>
                              <defs>
                              <linearGradient x1="0%" y1="0%" x2="100%" y2="100%" id="linearGradient-1">
                                  <stop stop-color="#019CAE" offset="0%"></stop>
                                  <stop stop-color="#307FC1" offset="100%"></stop>
                              </linearGradient>
                              <circle id="path-2" cx="32" cy="32" r="32"></circle>
                              <filter x="-76.6%" y="-73.4%" width="253.1%" height="253.1%" filterUnits="objectBoundingBox" id="filter-4">
                                  <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                                  <feGaussianBlur stdDeviation="16" in="shadowOffsetOuter1" result="shadowBlurOuter1"></feGaussianBlur>
                                  <feComposite in="shadowBlurOuter1" in2="SourceAlpha" operator="out" result="shadowBlurOuter1"></feComposite>
                                  <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.15 0" type="matrix" in="shadowBlurOuter1"></feColorMatrix>
                              </filter>
                              <filter x="-56.2%" y="-53.1%" width="212.5%" height="212.5%" filterUnits="objectBoundingBox" id="filter-5">
                                  <feGaussianBlur stdDeviation="4" in="SourceAlpha" result="shadowBlurInner1"></feGaussianBlur>
                                  <feOffset dx="0" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
                                  <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
                                  <feColorMatrix values="0 0 0 0 0.270588235   0 0 0 0 0.247058824   0 0 0 0 0.733333333  0 0 0 1 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
                              </filter>
                              <filter x="-150.0%" y="-150.0%" width="400.0%" height="400.0%" filterUnits="objectBoundingBox" id="filter-6">
                                  <feGaussianBlur stdDeviation="8" in="SourceGraphic"></feGaussianBlur>
                              </filter>
                              <filter x="-150.0%" y="-150.0%" width="400.0%" height="400.0%" filterUnits="objectBoundingBox" id="filter-7">
                                  <feGaussianBlur stdDeviation="8" in="SourceGraphic"></feGaussianBlur>
                              </filter>
                          </defs>
                          <g id="m/buttons/64/chatbot/normal" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                              <g id="logo">
                                  <mask id="mask-3" fill="white">
                                      <use xlink:href="#path-2"></use>
                                  </mask>
                                  <g id="Outline">
                                      <use fill="black" fill-opacity="1" filter="url(#filter-4)" xlink:href="#path-2"></use>
                                      <use fill="url(#linearGradient-1)" fill-rule="evenodd" xlink:href="#path-2"></use>
                                      <use fill="black" fill-opacity="1" filter="url(#filter-5)" xlink:href="#path-2"></use>
                                      <circle stroke="#FFFFFF" stroke-width="2" stroke-linejoin="square" cx="32" cy="32" r="31"></circle>
                                  </g>
                                  <g id="Orbs-in" mask="url(#mask-3)">
                                      <g transform="translate(7, 6)">
                                          <rect id="2" fill="#453FBB" filter="url(#filter-6)" x="41" y="41" width="16" height="16"></rect>
                                          <rect id="1" fill="#D50393" filter="url(#filter-7)" x="0" y="0" width="16" height="16"></rect>
                                      </g>
                                  </g>
                                  <g id="Logo" mask="url(#mask-3)" fill="#FFFFFF">
                                      <g transform="translate(14.6719, 15.9477)">
                                          <path d="M31.9611269,22.9943028 C31.9611269,25.1856339 30.1676675,26.9587534 27.9567223,26.9587534 L23.2581551,26.9587534 L13.7103304,31.6422346 L13.7103304,26.9587534 L8.40653231,26.9587534 C6.19558714,26.9587534 4.4021277,25.1856339 4.4021277,22.9943028 L4.4021277,8.65526883 C4.4021277,6.46638338 6.19558714,4.6908182 8.40653231,4.6908182 L27.9567223,4.6908182 C30.1676675,4.6908182 31.9611269,6.46638338 31.9611269,8.65526883 L31.9611269,22.9943028 Z M27.5417069,0 L8.81907738,0 C3.94758702,0 0,3.91064562 0,8.73353066 L0,22.9111496 C0,27.7340346 3.94758702,31.6422346 8.81907738,31.6422346 L13.7078601,31.6422346 L13.7053897,37.6366013 L22.6578649,31.6422346 L27.5417069,31.6422346 C32.410727,31.6422346 36.3607843,27.7340346 36.3607843,22.9111496 L36.3607843,8.73353066 C36.3607843,3.91064562 32.410727,0 27.5417069,0 L27.5417069,0 Z" id="Fill-1"></path>
                                          <path d="M10.9449197,8.98130271 C9.94418909,8.98130271 9.29745675,9.65141959 9.29745675,10.6883888 L9.29745675,21.2319687 C9.29745675,22.2689379 9.94418909,22.9390548 10.9449197,22.9390548 C11.9340397,22.9390548 12.5731141,22.2689379 12.5731141,21.2319687 L12.5731141,10.6883888 C12.5731141,9.65141959 11.9340397,8.98130271 10.9449197,8.98130271" id="Fill-3"></path>
                                          <path d="M23.7344099,16.081558 C23.7344099,18.5428924 22.2853145,19.9545401 19.7584141,19.9545401 L17.3799806,19.9545401 L17.3799806,12.2088204 L19.7584141,12.2088204 C22.2853145,12.2088204 23.7344099,13.6204681 23.7344099,16.081558 M19.5906787,9.09620085 L15.7465985,9.09620085 C14.6996728,9.09620085 14.0228024,9.76607317 14.0228024,10.8027978 L14.0228024,21.1177065 C14.0228024,22.1544311 14.6996728,22.8243034 15.7465985,22.8243034 L19.5906787,22.8243034 C24.2697304,22.8243034 27.0634264,20.2582938 27.0634264,15.9602521 C27.0634264,11.6622105 24.2697304,9.09620085 19.5906787,9.09620085" id="Fill-5"></path>
                                      </g>
                                  </g>
                              </g>
                          </g>
                      </svg>
                    </div>
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
   * Initialize the EIDChat global object with configuration from attributes
   */
  initializeEIDChat() {
    // Initialize EIDChat object if it doesn't exist
    if (!window.EIDChat) {
      window.EIDChat = {};
    }

    // Initialize SystemParams if it doesn't exist
    if (!window.EIDChat.SystemParams) {
      window.EIDChat.SystemParams = {};
    }

    // Set core configuration from attributes
    const serverUrl = this.getAttribute("server-url");
    const moduleId = this.getAttribute("module-id");

    if (serverUrl) {
      window.EIDChat.serverUrl = serverUrl;
    }

    if (moduleId) {
      window.EIDChat.moduleId = moduleId;
    }
  }

  /**
   * Handles attribute changes for configuration attributes.
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "server-url":
        window.EIDChat.serverUrl = newValue;
        break;
      case "module-id":
        window.EIDChat.moduleId = newValue;
        break;
    }
  }

  /**
   * Dynamically loads the SignalR script if not already loaded.
   */
  async loadSignalR() {
    if (window.signalR) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.7/signalr.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load SignalR"));
      document.head.appendChild(script);
    });
  }

  connectedCallback() {
    this.setupEventListeners();
    this.setupMessageHandlers();
  }

  disconnectedCallback() {
    // Cleanup event listeners
    document.removeEventListener("signalr-connected", this.updateUI);
    document.removeEventListener("signalr-disconnected", this.updateUI);
    document.removeEventListener("signalr-reconnecting", this.updateUI);

    const toggleBtn = this.shadowRoot.querySelector(".toggle-button");
    if (toggleBtn) {
      toggleBtn.removeEventListener("click", this.handleToggleChat);
    }

    const fullscreenBtn = this.shadowRoot.querySelector(".fullscreen");
    if (fullscreenBtn) {
      fullscreenBtn.removeEventListener("click", this.handleToggleFullscreen);
    }

    const closeBtn = this.shadowRoot.querySelector(".close");
    if (closeBtn) {
      closeBtn.removeEventListener("click", this.handleToggleChat);
    }

    const inspectBtn = this.shadowRoot.querySelector(".inspect");
    if (inspectBtn) {
      inspectBtn.removeEventListener("click", this.handleInspect);
    }

    const historyBtn = this.shadowRoot.querySelector(".history");
    if (historyBtn) {
      historyBtn.removeEventListener("click", this.handleToggleHistory);
    }

    const newChatBtn = this.shadowRoot.querySelector(".new-chat");
    if (newChatBtn) {
      newChatBtn.removeEventListener("click", this.handleNewChat);
    }

    const chatInput = this.shadowRoot.querySelector("chat-input");
    if (chatInput) {
      chatInput.removeEventListener("message-sent", this.handleSendMessage);
    }
  }

  /**
   * Sets up event listeners for various UI buttons and input events.
   */
  setupEventListeners() {
    const toggleBtn = this.shadowRoot.querySelector(".toggle-button");
    toggleBtn.addEventListener("click", this.handleToggleChat);

    const fullscreenBtn = this.shadowRoot.querySelector(".fullscreen");
    fullscreenBtn.addEventListener("click", this.handleToggleFullscreen);

    const closeBtn = this.shadowRoot.querySelector(".close");
    closeBtn.addEventListener("click", this.handleToggleChat);

    const inspectBtn = this.shadowRoot.querySelector(".inspect");
    inspectBtn.addEventListener("click", this.handleInspect);

    const historyBtn = this.shadowRoot.querySelector(".history");
    historyBtn.addEventListener("click", this.handleToggleHistory);

    const newChatBtn = this.shadowRoot.querySelector(".new-chat");
    newChatBtn.addEventListener("click", this.handleNewChat);

    const chatInput = this.shadowRoot.querySelector("chat-input");
    chatInput.addEventListener("message-sent", (e) =>
      this.handleSendMessage(e.detail)
    );
  }

  /**
   * Initializes the SignalR connection and updates state based on success or failure.
   */
  async initializeConnection() {
    if (this.state.connectionInitialized) {
      return; // Connection already initialized or in progress
    }

    this.state.connectionInitialized = true;
    this.state.connectionStatus = "connecting";

    try {
      if (!window.EIDChat?.serverUrl || !window.EIDChat?.moduleId) {
        throw new Error(
          "Missing required configuration: serverUrl and moduleId are required in window.EIDChat"
        );
      }

      await initializeSignalRConnection();
      this.state.isConnected = true;
      this.state.connectionStatus = "connected";
    } catch (error) {
      console.error("Connection failed:", error);
      this.state.connectionStatus = "disconnected";
      this.state.connectionInitialized = false; // Allow retry on next toggle
    }

    this.updateUI();
  }

  /**
   * Registers message event handlers for receiving and completing messages.
   */
  setupMessageHandlers() {
    // Add event listeners for connection state changes
    document.addEventListener("signalr-connected", () => {
      this.state.isConnected = true;
      this.state.connectionStatus = "connected";
      this.updateUI();
    });

    document.addEventListener("signalr-disconnected", () => {
      this.state.isConnected = false;
      this.state.connectionStatus = "disconnected";
      this.updateUI();
    });

    document.addEventListener("signalr-reconnecting", () => {
      this.state.isConnected = false;
      this.state.connectionStatus = "connecting";
      this.updateUI();
    });

    onReceiveMessage((messageChunk) => {
      const lastMessage = this.state.messages[this.state.messages.length - 1];

      if (lastMessage && lastMessage.placeholder) {
        const updatedMessage = {
          ...lastMessage,
          text: messageChunk,
          placeholder: false,
          streaming: true,
        };
        this.state.messages[this.state.messages.length - 1] = updatedMessage;
      } else if (
        lastMessage &&
        lastMessage.sender === "ai" &&
        lastMessage.streaming
      ) {
        const updatedMessage = {
          ...lastMessage,
          text: lastMessage.text + messageChunk,
        };
        this.state.messages[this.state.messages.length - 1] = updatedMessage;
      } else {
        const aiMessage = {
          id: Date.now(),
          text: messageChunk,
          sender: "ai",
          timestamp: new Date(),
          streaming: true,
        };
        this.state.messages.push(aiMessage);
      }
      this.updateUI();
    });

    onCompleteMessage(() => {
      const lastMessage = this.state.messages[this.state.messages.length - 1];
      if (lastMessage && lastMessage.streaming) {
        const updatedMessage = {
          ...lastMessage,
          streaming: false,
        };
        this.state.messages[this.state.messages.length - 1] = updatedMessage;
        this.updateUI();
      }
    });
  }

  // UI event handler methods below:

  handleToggleChat() {
    this.state.isOpen = !this.state.isOpen;
    this.state.isInspectMode = false;

    // Initialize connection on first open if not already connected
    if (this.state.isOpen && !this.state.connectionInitialized) {
      this.initializeConnection();
    }

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

    const chatInspect = document.createElement("chat-inspect");
    chatInspect.addEventListener("element-selected", (e) => {
      this.handleElementSelected(e.detail.message);
    });
    chatInspect.addEventListener("inspect-cancel", () => {
      this.handleInspectCancel();
    });
    document.body.appendChild(chatInspect);
  }

  handleElementSelected(message) {
    this.state.isInspectMode = false;
    this.state.isOpen = true;

    // Initialize connection if not already connected
    if (!this.state.connectionInitialized) {
      this.initializeConnection();
    }

    // Show user message in chat
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };
    this.state.messages.push(userMessage);

    const placeholderMessage = {
      id: Date.now() + 1,
      text: "",
      sender: "ai",
      timestamp: new Date(),
      placeholder: true,
    };
    this.state.messages.push(placeholderMessage);

    this.updateUI();
    this.handleSendMessageFromInspect(message);
  }

  async handleSendMessageFromInspect(text) {
    try {
      // Check if connection is initialized, if not, try to initialize
      if (!this.state.connectionInitialized) {
        await this.initializeConnection();
      }

      if (!this.state.isConnected) {
        console.error("Not connected to server");
        return;
      }

      // Send message to API
      await sendMessageToApi(`Context: ${text}`);
    } catch (error) {
      console.error("Failed to send inspect message:", error);
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
    // Check if connection is initialized, if not, try to initialize
    if (!this.state.connectionInitialized) {
      await this.initializeConnection();
    }

    if (!this.state.isConnected) {
      console.error("Not connected to server");
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: formattedText,
      sender: "user",
      timestamp: new Date(),
    };
    this.state.messages.push(userMessage);

    const placeholderMessage = {
      id: Date.now() + 1,
      text: "",
      sender: "ai",
      timestamp: new Date(),
      placeholder: true,
    };
    this.state.messages.push(placeholderMessage);
    this.updateUI();

    try {
      // Prefix message sent to the server with "Context:"
      await sendMessageToApi(`Context: ${rawText}`);
    } catch (error) {
      console.error("Failed to send message:", error);
      this.state.messages = this.state.messages.filter(
        (msg) => msg.id !== placeholderMessage.id
      );
      const errorMessage = {
        id: Date.now() + 2,
        text: "Failed to send message. Please try again later.",
        sender: "system",
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
    const container = this.shadowRoot.querySelector(".chat-bot-container");
    container.classList.toggle("open", this.state.isOpen);
    container.classList.toggle("fullscreen", this.state.isFullscreen);

    // Update connection status indicator
    const toggleButton = this.shadowRoot.querySelector(".toggle-button");
    toggleButton.classList.remove("connecting", "connected", "disconnected");
    toggleButton.classList.add(this.state.connectionStatus);

    // Update messages display
    this.renderMessages();

    // Update history visibility
    const history = this.shadowRoot.querySelector("chat-history");
    if (this.state.showHistory && !history) {
      const historyElement = document.createElement("chat-history");
      historyElement.addEventListener("select", (e) =>
        this.handleHistorySelect(e.detail)
      );
      this.shadowRoot.appendChild(historyElement);
    } else if (!this.state.showHistory && history) {
      history.remove();
    }

    // Scroll to bottom
    const messagesContainer = this.shadowRoot.querySelector(
      ".messages-container"
    );
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Renders chat messages in the messages container.
   */
  renderMessages() {
    const messagesContainerWrapper = this.shadowRoot.querySelector(
      ".messages-container-wrapper"
    );
    const messagesContainer = this.shadowRoot.querySelector(
      ".messages-container"
    );
    messagesContainer.innerHTML = "";

    messagesContainerWrapper.style.display =
      this.state.messages.length === 0 ? "none" : "block";

    messagesContainer.style.display =
      this.state.messages.length === 0 ? "none" : "block";

    this.state.messages.forEach((message) => {
      const messageElement = document.createElement("chat-message");
      messageElement.setAttribute("message", JSON.stringify(message));
      messagesContainer.appendChild(messageElement);
    });
  }

  /**
   * Public method to set system parameters
   * @param {Object} params - Object containing key-value pairs of system parameters
   */
  setSystemParams(params) {
    if (!params || typeof params !== "object") {
      console.error("System parameters must be an object");
      return;
    }

    updateSystemParams(params);
  }
}

customElements.define("chat-bot", ChatBot);
