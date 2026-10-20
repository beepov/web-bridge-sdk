export const NATIVE_COMMANDS = {
    identity: {
        getUser: "identity.getUser",
        verify: "identity.verify",
    },
    app: {
        alert: "app.alert",
    },
    sheet: {
        open: "sheet.open",
        close: "sheet.close",
    },
    camera: {
        open: "camera.open",
        close: "camera.close",
    },
} as const;

export const BRIDGE_EVENTS = {
    response: "__native_bridge_response__",
} as const;

export const BRIDGE_MESSAGE_TYPES = {
    request: "request",
    response: "response",
} as const;