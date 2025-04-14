import { spawn } from "bun";
import { tmpdir } from "os";
import path from "path";
import scriptContents from "../../assets/scripts/clipboard-monitor.ps1" with { type: "text" };
import { Logger } from "../Logger";

/**
 * Class for Windows-specific clipboard monitoring
 */
export class WindowsClipboardMonitor {
    /**
     * The PowerShell process for clipboard monitoring.
     */
    private clipboardProcess: any = null;

    /**
     * Callback function for clipboard updates.
     */
    private onUpdate: (text: string) => void;

    constructor(onUpdate: (text: string) => void) {
        this.onUpdate = onUpdate;
    }

    /**
     * Start the clipboard monitoring process.
     */
    async start() {
        console.log(scriptContents);
        // Write the script to a temporary file
        const scriptPath = path.resolve(tmpdir(), "clipboard-monitor.ps1");
        await Bun.write(scriptPath, scriptContents);

        // Start PowerShell process with hidden window
        this.clipboardProcess = spawn(["powershell.exe", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", scriptPath], {
            stdout: "pipe",
            stderr: "pipe"
        });

        // Handle clipboard updates
        const reader = this.clipboardProcess.stdout.getReader();

        /**
         * Reads the stream
         */
        const readStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }

                    // Decode the value
                    const text = new TextDecoder().decode(value);

                    // If received text, check if it's a clipboard update or an error
                    if (text) {
                        // If it's a clipboard update
                        if (text.startsWith("CLIPBOARD_UPDATE:")) {
                            // Remove the prefix
                            const clipboardText = text.substring("CLIPBOARD_UPDATE:".length);
                            
                            Logger.debug("Received clipboard update", { text: clipboardText });

                            // Call the callback function
                            this.onUpdate(clipboardText);
                        } else
                        if (text.startsWith("ERROR:")) {
                            // Log the error
                            Logger.error("PowerShell error", { error: text.substring("ERROR:".length) });
                        }
                    }
                }
            } catch (error) {
                Logger.error("Error reading clipboard stream", { error });
            }
        };

        readStream();

        // Also handle stderr
        const errorReader = this.clipboardProcess.stderr.getReader();

        /**
         * Reads the error stream
         */
        const readErrorStream = async () => {
            try {
                while (true) {
                    // Read the error stream
                    const { done, value } = await errorReader.read();

                    // If done, break
                    if (done) {
                        break;
                    }

                    const text = new TextDecoder().decode(value).trim();

                    // If received text, log the error
                    if (text) {
                        Logger.error("PowerShell stderr", { error: text });
                    }
                }
            } catch (error) {
                Logger.error("Error reading error stream", { error });
            }
        };

        readErrorStream();

        Logger.info("Windows clipboard monitoring started");
    }

    /**
     * Stop the clipboard monitoring process.
     */
    stop() {
        if (this.clipboardProcess) {
            this.clipboardProcess.kill();
            this.clipboardProcess = null;
            Logger.info("Windows clipboard monitoring stopped");
        }
    }
} 