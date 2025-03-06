/**
 * API Service Module
 *
 * Provides functions to initialize a SignalR connection, send messages to the API,
 * and register callbacks to handle incoming or completed message events.
 */
let connection = null;
const eventHandlers = {
  onReceiveMessage: null,
  onCompleteMessage: null,
};

// Generate Client ID
function generateClientId() {
  let clientId = localStorage.getItem("clientId");
  if (!clientId) {
    clientId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    localStorage.setItem("clientId", clientId);
  }
  return clientId;
}

// Helper function to dispatch connection state events
function dispatchConnectionEvent(eventName) {
  document.dispatchEvent(new CustomEvent(eventName));
}

// Send system parameters to the server
async function sendSystemParams() {
  if (!connection || connection.state !== "Connected") {
    console.error("Cannot send system params: Connection not established");
    return;
  }

  const clientId = generateClientId();
  const systemParams = window.EIDChat?.SystemParams || {};

  // Send each system parameter individually
  for (const [key, value] of Object.entries(systemParams)) {
    try {
      await connection.invoke(
        "SendMessageToServer",
        clientId,
        `SetContext(${key}=${value})`,
        "" // Empty string for system messages
      );
      console.log(`System parameter sent: ${key}=${value}`);
    } catch (error) {
      console.error(`Error sending system parameter ${key}:`, error);
    }
  }
}

export const initializeSignalRConnection = async () => {
  // Get configuration from window.EIDChat
  if (!window.EIDChat?.serverUrl) {
    throw new Error("serverUrl configuration is required in window.EIDChat");
  }

  try {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(window.EIDChat.serverUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    // Register server-side methods
    connection.on("ReceiveMessage", (message) => {
      console.log("Message received from AI:", message);
      eventHandlers.onReceiveMessage?.(message);
    });

    connection.on("MessageReceived", (acknowledgment) => {
      console.log("Message acknowledgment received:", acknowledgment);
    });

    connection.onclose(async () => {
      console.log("SignalR connection closed. Attempting to reconnect.");
      dispatchConnectionEvent("signalr-disconnected");
      await startConnection();
    });

    connection.onreconnecting(() => {
      console.log("SignalR is attempting to reconnect.");
      dispatchConnectionEvent("signalr-reconnecting");
    });

    connection.onreconnected(() => {
      console.log("SignalR reconnected successfully.");
      dispatchConnectionEvent("signalr-connected");
      // Send system parameters again after reconnection
      sendSystemParams();
    });

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR connected");
        dispatchConnectionEvent("signalr-connected");

        // Send system parameters after initial connection
        await sendSystemParams();
      } catch (error) {
        console.error("SignalR connection error:", error);
        dispatchConnectionEvent("signalr-disconnected");
        setTimeout(() => startConnection(), 5000); // Retry after delay
      }
    };

    await startConnection();
  } catch (error) {
    console.error("SignalR Connection Error:", error);
    dispatchConnectionEvent("signalr-disconnected");
    throw error;
  }
};

export const sendMessageToApi = async (message) => {
  if (!window.EIDChat?.moduleId) {
    throw new Error("moduleId is required in window.EIDChat");
  }

  if (connection?.state === "Connected") {
    try {
      const clientId = generateClientId();

      await connection.invoke(
        "SendMessageToServer",
        clientId,
        message,
        window.EIDChat.moduleId
      );
      console.log("Message sent to AI:", message);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  } else {
    console.error("No SignalR connection established.");
    throw new Error("No SignalR connection established.");
  }
};

export const onReceiveMessage = (callback) => {
  eventHandlers.onReceiveMessage = callback;
};

export const onCompleteMessage = (callback) => {
  eventHandlers.onCompleteMessage = callback;
};

export const disconnectSignalR = async () => {
  if (connection) {
    try {
      await connection.stop();
      connection = null;
      eventHandlers.onReceiveMessage = null;
      eventHandlers.onCompleteMessage = null;
      dispatchConnectionEvent("signalr-disconnected");
    } catch (error) {
      console.error("Error stopping SignalR connection:", error);
      throw error;
    }
  }
};

// Function to update system parameters
export const updateSystemParams = async (newParams) => {
  // Initialize EIDChat object if it doesn't exist
  if (!window.EIDChat) {
    window.EIDChat = {};
  }

  // Initialize SystemParams if it doesn't exist
  if (!window.EIDChat.SystemParams) {
    window.EIDChat.SystemParams = {};
  }

  // Update the system parameters
  window.EIDChat.SystemParams = {
    ...window.EIDChat.SystemParams,
    ...newParams,
  };

  // Send the updated parameters to the server if connected
  if (connection?.state === "Connected") {
    await sendSystemParams();
  }
};
