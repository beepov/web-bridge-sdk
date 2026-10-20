import { BRIDGE_EVENTS, NATIVE_COMMANDS } from "./constant";

export type NativeResponse = {
    id: string;
    type: "response";
    success: boolean;
    data?: unknown;
    error?: string;
};

type PendingRequest = {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
};

declare global {
    interface Window {
        ReactNativeWebView?: {
            postMessage: (message: string) => void;
        };
    }
}

/**
 * It checks whether your Next.js website is running inside a React Native WebView that exposes the bridge.
 */
export function isNativeBridgeAvailable(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.ReactNativeWebView?.postMessage === "function"
    );
}

const pendingRequests = new Map<string, PendingRequest>();
let initialized = false;

/**
 * This internal function initializes the message listener on the window object.
 * It runs only once when the first call to the bridge is made.
 */
function initialize() {
    if (initialized || typeof window === "undefined") return;
    initialized = true;


    window.addEventListener(
        BRIDGE_EVENTS.response,
        ((event: Event) => {
            const response = (
                event as CustomEvent<NativeResponse>
            ).detail;

            if (
                !response ||
                typeof response.id !== "string" ||
                typeof response.success !== "boolean"
            ) {
                return;
            }

            const pending = pendingRequests.get(response.id);

            if (!pending) {
                return;
            }

            clearTimeout(pending.timer);
            pendingRequests.delete(response.id);

            if (response.success) {
                pending.resolve(response.data);
            } else {
                pending.reject(
                    new Error(response.error ?? "Native command failed")
                );
            }
        }) as EventListener
    );
}

function createRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function callNative<T = unknown>(name: string, payload?: unknown, timeoutMs = 60_000): Promise<T> {
    initialize();

    if (!isNativeBridgeAvailable()) {
        return Promise.reject(
            new Error(`Native bridge unavailable: ${name}`)
        );
    }

    const id = createRequestId();

    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            pendingRequests.delete(id);
            reject(new Error(`Native command timed out: ${name}`));
        }, timeoutMs);

        pendingRequests.set(id, {
            resolve: (data) => resolve(data as T),
            reject,
            timer,
        });

        try {
            window.ReactNativeWebView!.postMessage(
                JSON.stringify({
                    id,
                    type: "request",
                    name,
                    payload,
                })
            );
        } catch (error) {
            clearTimeout(timer);
            pendingRequests.delete(id);
            reject(
                error instanceof Error ? error : new Error(String(error))
            );
        }
    });
}