import { callNative } from "./bridge";
import { identity } from "./identity";

export const NativeBridge = {
    identity,

    call<T = unknown>(name: string, payload?: unknown, timeoutMs = 60_000): Promise<T> {
        return callNative<T>(name, payload, timeoutMs)
    }
};
