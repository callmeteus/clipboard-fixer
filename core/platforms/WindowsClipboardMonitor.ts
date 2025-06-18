import { tmpdir } from "os";
import path from "path";
import scriptContents from "../../assets/scripts/clipboard-monitor.ps1" with { type: "text" };
import { Logger } from "../Logger";
import { BaseClipboardMonitor } from "./BaseClipboardMonitor";
import { InteractivePowerShell } from "./win32/InteractivePowerShell";

/**
 * Class for monitoring clipboard on Windows systems
 */
export class WindowsClipboardMonitor extends BaseClipboardMonitor {
    private readShell: InteractivePowerShell | null = null;
    private writeShell: InteractivePowerShell | null = null;

    /**
     * Start the clipboard monitoring process.
     */
    async start() {
        // Create the processes
        await this.createReadProcess();
        await this.createWriteProcess();

        Logger.info("Windows clipboard monitoring started (real-time)");
    }

    /**
     * Stop the clipboard monitoring process.
     */
    stop() {
        if (this.readShell) {
            this.readShell.destroy();
            this.readShell = null;
        }

        if (this.writeShell) {
            this.writeShell.destroy();
            this.writeShell = null;
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
            if (!this.writeShell) {
                throw new Error("PowerShell write process not running");
            }

            // Write the command to the process's stdin
            const command = `[System.Windows.Forms.Clipboard]::SetText('${text.replace(/'/g, "''")}');\n`;

            // Write the command to the process's stdin
            this.writeShell.execute(command);

            return true;
        } catch (e) {
            Logger.error("Error writing to clipboard: %s", e);
            return false;
        }
    }

    /**
     * Creates the process used to read from the clipboard.
     */
    private async createReadProcess() {
        // Write the script to a temporary file
        const scriptPath = path.resolve(tmpdir(), "clipboard-monitor.ps1");
        await Bun.write(scriptPath, scriptContents);

        // Start PowerShell process for monitoring
        this.readShell = new InteractivePowerShell({
            command: `& { Set-ExecutionPolicy Bypass -Scope Process -Force; & "${scriptPath}" }`,

            onStdout: (data) => {
                // Decode the value
                const text = new TextDecoder().decode(data).replace(/(\r\n|\n|\r|\n)$/, "");

                // If received text, check if it's a clipboard update or an error
                if (text) {
                    if (text.startsWith("ERROR:")) {
                        Logger.error("PowerShell error: %s", text.substring(6));
                    } else {
                        this.onUpdate(text);
                    }
                }
            }
        });
    }

    /**
     * Creates the process used to write to the clipboard.
     */
    private async createWriteProcess() {
        // Start PowerShell process for writing
        this.writeShell = new InteractivePowerShell();

        // Add the assembly to the process
        await this.writeShell.execute("Add-Type -AssemblyName System.Windows.Forms;\n");
    }
} 