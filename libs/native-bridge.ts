
export type BridgeResponse = {
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

const pending = new Map<string, PendingRequest>();
let initialized = false;

function initialize() {
    if (initialized || typeof window === "undefined") return;
    initialized = true;

    window.addEventListener(
        "__native_bridge_response__",
        ((event: CustomEvent<BridgeResponse>) => {
            const response = event.detail;
            const request = pending.get(response.id);

            if (!request) return;

            clearTimeout(request.timer);
            pending.delete(response.id);

            if (response.success) {
                request.resolve(response.data);
            } else {
                request.reject(
                    new Error(response.error ?? "Native action failed")
                );
            }
        }) as EventListener
    );
}

function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const NativeBridge = {
    /**
     * It checks whether your Next.js website is running inside a React Native WebView that exposes the bridge.
     */
    get isNative() {
        return (
            typeof window !== "undefined" &&
            typeof window.ReactNativeWebView?.postMessage === "function"
        );
    },

    call<T = unknown>(name: string, payload?: unknown, timeoutMs = 30_000): Promise<T> {
        initialize();

        if (!this.isNative) {
            return Promise.reject(
                new Error(`Native bridge unavailable: ${name}`)
            );
        }

        const id = createId();

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                pending.delete(id);
                reject(new Error(`Native command timed out: ${name}`));
            }, timeoutMs);

            pending.set(id, {
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
                pending.delete(id);
                reject(
                    error instanceof Error ? error : new Error(String(error))
                );
            }
        });
    },
};
