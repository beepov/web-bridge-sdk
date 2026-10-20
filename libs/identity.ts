import { callNative } from "./bridge";
import { NATIVE_COMMANDS } from "./constant";

export type NativeUser = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
};

export const identity = {
    async getUser(): Promise<NativeUser> {
        return await callNative<NativeUser>(NATIVE_COMMANDS.identity.getUser);
    },
}