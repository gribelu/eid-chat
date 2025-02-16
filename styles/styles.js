export const styles = `
    :host {
        all: initial;
        --primary-color: #307fc1;
        --background-color: #f1f3f6;
        --text-color: #333;
        --border-color: rgba(0, 0, 0, 0.05);
        --shadow-color: rgba(0, 0, 0, 0.15);
        --transition-duration: 0.3s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-family: inherit;
        font-size: inherit;
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }

    .chat-container {
        position: fixed;
        bottom: 1.6rem;
        left: 1.6rem;
        z-index: 2000;
    }

    .chat-bot-container {
        position: fixed;
        bottom: 1.6rem;
        left: 1.6rem;
        backface-visibility: hidden;
        will-change: transform, width, height, opacity;
        transform-origin: 3.2rem calc(100% - 4.4rem);
        background-color: var(--background-color);
        border-radius: 1.6rem;
        outline: solid 0.2rem var(--border-color);
        box-shadow: 0 0.1rem 2rem 0 var(--shadow-color);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        transition: all var(--transition-duration) ease-in-out;
    }

    .chat-bot-container.open {
        transform: scale(1);
        width: 55.2rem;
    }

    .chat-bot-container.open.fullscreen {
        width: 80vw;
        height: 90%;
    }

    .chat-bot-container:not(.open) {
        transform: scale(0);
    }

    .chat-content {
        position: relative;
        height: 100%;
        display: grid;
        grid-template-rows: auto 1fr auto;
    }

    .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
        background-color: var(--background-color);
        max-height: 51.6rem;
        min-height: 51.6rem;
        position: relative;
    }

    .messages-container-wrapper {
        position: relative;
    }
    .messages-container-wrapper::before {
        content: '';
        width: 100%;
        display: block;
        height: 3.2rem;
        background-image: linear-gradient(to top, rgba(241, 243, 246, 0), #e3e6eb);
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
    }

    .messages-container-wrapper::after {
        content: '';
        width: 100%;
        display: block;
        height: 3.2rem;
        background-image: linear-gradient(to bottom, rgba(241, 243, 246, 0), #e3e6eb);
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 1;
    }

    .messages-container.fullscreen {
        max-height: 100%;
    }

    .input-footer {
        align-self: end;
        padding-left: 9.6rem;
    }

    .input-footer-container {
        display: flex;
        align-items: flex-start;
        padding-left: 9.6rem;
        position: relative;
    }

    .input-footer-container::after {
        content: "";
        display: block;
        height: 3.2rem;
        width: 100%;
        background-image: linear-gradient(to bottom, rgba(241, 243, 246, 0), #e3e6eb);
        position: absolute;
        top: -3.2rem;
        left: 0;
        z-index: 1;
    }

    .footer-buttons {
        display: flex;
        justify-content: left;
        padding: 0.5rem;
    }

    .icon-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.8rem;
        display: flex;
        align-items: center;
        transition: background-color var(--transition-duration);
        color: #8b909a;
        font-size: 1.2rem;
        font-weight: 600;
    }

    .icon-button:hover {
        background-color: rgba(48, 127, 193, 0.04);
        color: var(--primary-color);
    }

    .icon-button:nth-child(1) {
        padding-left: 0;
    }

    .icon-button svg {
        width: 2rem;
        height: 2rem;
        color: var(--primary-color);
    }

    .icon-button span {
        margin-left: 0.8rem;
        font-size: 1.2rem;
    }

    .toggle-button {
        width: 6.4rem;
        height: 6.4rem;
        border-radius: 50%;
        background-color: #fff;
        border: solid 0.1rem var(--primary-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--transition-duration);
        position: absolute;
        z-index: 2001;
        bottom: 2.7rem;
        left: 1.6rem;
    }

    .toggle-button:hover {
        transform: scale(1.1);
    }

    .header {
        display: flex;
        justify-content: flex-end;
        padding: 0.2rem 1rem;
        gap: 1rem;
        background-color: #fff;
        border-top-left-radius: 1.6rem;
        border-top-right-radius: 1.6rem;
    }

    .line-glow {
        height: 0.1rem;
        opacity: 0.25;
        border-style: solid;
        border-width: 0.1rem;
        border-image-source: linear-gradient(to right, rgba(1, 174, 143, 0), #04ab93 7%, #2c83bd 91%, rgba(48, 127, 193, 0));
        border-image-slice: 1;
        position: absolute;
        bottom: -0.1rem;
        width: 100%;
    }
`;

export default styles;
