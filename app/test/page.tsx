"use client";
import { NativeBridge } from "@/libs/native-bridge";

export default function TestPage() {
    async function runCommand(
        name: string,
        payload?: unknown
    ) {
        try {
            const result = await NativeBridge.call(name, payload);
            console.log(`${name} succeeded:`, result);
        } catch (error) {
            console.error(`${name} failed:`, error);
        }
    }

    return (
        <main style={{ padding: 24, display: "grid", gap: 16 }}>
            <h1>Native Bridge Test</h1>

            <button
                onClick={() =>
                    runCommand("app.alert", {
                        title: "Native Alert",
                        message: "Hello from Next.js!",
                    })
                }
            >
                Open Native Alert
            </button>

            <button
                onClick={() =>
                    runCommand("sheet.open", {
                        name: "guest-info",
                    })
                }
            >
                Open Native Bottom Sheet
            </button>

            <button onClick={() => runCommand("sheet.close")}>
                Close Native Bottom Sheet
            </button>

            <button onClick={() => runCommand("camera.open")}>
                Open Native Camera
            </button>

            <button onClick={() => runCommand("camera.close")}>
                Close Native Camera
            </button>
        </main>
    );
}
