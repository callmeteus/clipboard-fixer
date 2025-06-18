import { spawn } from "bun";
import { tmpdir } from "os";
import path from "path";
import scriptContents from "../../assets/scripts/clipboard-monitor.ps1" with { type: "text" };
import { Logger } from "../Logger";
import { BaseClipboardMonitor } from "./BaseClipboardMonitor";

/**
 * Class for monitoring clipboard on Windows systems
 */
export class WindowsClipboardMonitor extends BaseClipboardMonitor {
    /**
     * The PowerShell process for clipboard monitoring.
     */
    private process: Bun.Subprocess<"pipe", "pipe", "pipe"> | null = null;

    /**
     * Start the clipboard monitoring process.
     */
    async start() {
        // Write the script to a temporary file
        const scriptPath = path.resolve(tmpdir(), "clipboard-monitor.ps1");
        await Bun.write(scriptPath, scriptContents);

        // Start PowerShell process with hidden window
        this.process = spawn(["powershell.exe", "-WindowStyle", "Hidden", "-File", scriptPath], {
            stdout: "pipe",
            stderr: "pipe",
            stdin: "pipe"
        });

        // Read the stream
        const readStream = async () => {
            const reader = this.process!.stdout.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    // If done, break
                    if (done) {
                        break;
                    }

                    // Decode the value
                    const text = new TextDecoder().decode(value).replace(/(\r\n|\n|\r|\n)$/, "");

                    // If received text, check if it's a clipboard update or an error
                    if (text) {
                        if (text.startsWith("ERROR:")) {
                            Logger.error("PowerShell error: %s", text.substring(6));
                        } else {
                            this.onUpdate(text);
                        }
                    }
                }
            } catch (error) {
                Logger.error("Error reading PowerShell output: %s", error);
            } finally {
                reader.releaseLock();
            }
        };

        // Read the error stream
        const readErrorStream = async () => {
            const reader = this.process!.stderr.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    const text = new TextDecoder().decode(value);
                    Logger.error("PowerShell error: %s", text);
                }
            } catch (error) {
                Logger.error("Error reading PowerShell error output: %s", error);
            } finally {
                reader.releaseLock();
            }
        };

        // Read the stream
        readStream();

        // Read the error stream
        readErrorStream();

        Logger.info("Windows clipboard monitoring started (real-time)");
    }

    /**
     * Stop the clipboard monitoring process.
     */
    stop() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        Logger.info("Windows clipboard monitoring stopped");
    }

    /**
     * Write content to clipboard
     * @param text The text to write to the clipboard
     * @returns True if writing was successful, false otherwise
     */
    async writeClipboard(text: string): Promise<boolean> {
        try {
            // Use the existing process to write to clipboard
            if (!this.process) {
                throw new Error("PowerShell process not running");
            }

            // Write the command to the process's stdin
            const encoder = new TextEncoder();
            const command = `Set-Clipboard -Value '${text.replace(/'/g, "''")}'\n`;
            await this.process!.stdin!.write(encoder.encode(command));

            return true;
        } catch (e) {
            Logger.error("Error writing to clipboard: %s", e);
            return false;
        }
    }
} 