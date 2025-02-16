class ChatHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize state
    this.history = [
      {
        messages: [
          {
            id: 1,
            text: "Previous conversation 1",
            sender: "ai",
            timestamp: new Date(),
          },
        ],
        date: "2023-10-01",
      },
      {
        messages: [
          {
            id: 2,
            text: "Previous conversation 2",
            sender: "ai",
            timestamp: new Date(),
          },
        ],
        date: "2023-09-30",
      },
    ];

    const styles = `
            :host {
                display: block;
            }

            .history-container {
                position: absolute;
                right: -24rem;
                top: 10%;
                width: 24rem;
                height: 80%;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.3);
                border-radius: 1rem;
                display: flex;
                flex-direction: column;
                padding: 1rem;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .title {
                font-size: 1.6rem;
                font-weight: 600;
            }

            .list {
                overflow-y: auto;
                flex: 1;
            }

            .list-item {
                padding: 1rem;
                cursor: pointer;
                border-radius: 0.4rem;
                transition: background-color 0.2s;
            }

            .list-item:hover {
                background-color: rgba(0, 0, 0, 0.04);
            }

            .list-item-text {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                font-size: 1.4rem;
            }

            .list-item-date {
                font-size: 1.2rem;
                color: #666;
                margin-top: 0.4rem;
            }

            .footer {
                margin-top: auto;
                text-align: center;
            }

            .icon-button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.8rem;
                border-radius: 0.4rem;
                display: flex;
                align-items: center;
                color: #307fc1;
            }

            .icon-button:hover {
                background-color: rgba(48, 127, 193, 0.04);
            }

            .button-text {
                margin-left: 0.8rem;
                font-size: 1.2rem;
            }
        `;

    this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="history-container">
                <div class="header">
                    <span class="title">Chat History</span>
                    <button class="icon-button new-chat">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                </div>
                <div class="list">
                    ${this.renderHistoryItems()}
                </div>
                <div class="footer">
                    <button class="icon-button load-more">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        <span class="button-text">Load More</span>
                    </button>
                </div>
            </div>
        `;
  }

  renderHistoryItems() {
    return this.history
      .map(
        (item, index) => `
            <div class="list-item" data-index="${index}">
                <div class="list-item-text">${item.messages[0].text}</div>
                <div class="list-item-date">${item.date}</div>
            </div>
        `
      )
      .join("");
  }

  connectedCallback() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const listItems = this.shadowRoot.querySelectorAll(".list-item");
    const loadMoreBtn = this.shadowRoot.querySelector(".load-more");

    listItems.forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        const selectedHistory = this.history[index];

        // Dispatch custom event with selected messages
        this.dispatchEvent(
          new CustomEvent("history-selected", {
            detail: {
              messages: selectedHistory.messages,
            },
            bubbles: true,
            composed: true,
          })
        );
      });
    });

    loadMoreBtn.addEventListener("click", () => {
      this.handleLoadMore();
    });
  }

  handleLoadMore() {
    // Implement load more functionality
    console.log("Load more clicked");
  }
}

customElements.define("chat-history", ChatHistory);
