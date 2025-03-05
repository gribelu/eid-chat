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

export const initializeSignalRConnection = async (config) => {
  if (!config?.serverUrl) {
    throw new Error("serverUrl configuration is required");
  }

  try {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(config.serverUrl, {
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
      await startConnection();
    });

    connection.onreconnecting(() => {
      console.log("SignalR is attempting to reconnect.");
    });

    connection.onreconnected(() => {
      console.log("SignalR reconnected successfully.");
    });

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR connected");
      } catch (error) {
        console.error("SignalR connection error:", error);
        setTimeout(() => startConnection(), 5000); // Retry after delay
      }
    };

    await startConnection();
  } catch (error) {
    console.error("SignalR Connection Error:", error);
    throw error;
  }
};

export const sendMessageToApi = async (message, moduleId) => {
  if (!moduleId) {
    throw new Error("moduleId is required");
  }
  if (connection?.state === "Connected") {
    try {
      const clientId = generateClientId();

      await connection.invoke(
        "SendMessageToServer",
        clientId,
        message,
        moduleId
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
    } catch (error) {
      console.error("Error stopping SignalR connection:", error);
      throw error;
    }
  }
};
