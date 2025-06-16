import { Logger } from "../Logger";
import { BaseClipboardMonitor } from "./BaseClipboardMonitor";

/**
 * Class for monitoring clipboard on Linux systems
 */
export class LinuxClipboardMonitor extends BaseClipboardMonitor {
    /**
     * The polling interval in milliseconds
     */
    private pollingInterval: number = 500;

    /**
     * The interval ID for the clipboard monitoring
     */
    private intervalId: NodeJS.Timeout | null = null;

    /**
     * Start the clipboard monitoring process
     */
    start() {
        this.intervalId = setInterval(() => this.checkClipboard(), this.pollingInterval);
        Logger.info("Linux clipboard monitoring started (polling)");
    }

    /**
     * Stop the clipboard monitoring process
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        Logger.info("Linux clipboard monitoring stopped");
    }

    /**
     * Get clipboard content using xclip
     * @returns The clipboard content or an empty string if reading fails
     */
    private async getClipboardContent(): Promise<string> {
        try {
            const proc = Bun.spawn(["xclip", "-selection", "clipboard", "-o"], {
                stdout: "pipe",
            });
            
            const output = await new Response(proc.stdout).text();
            return output.trim();
        } catch (e) {
            Logger.error("Error reading clipboard: %s", e);
            return "";
        }
    }

    /**
     * Check clipboard for content and process it
     */
    private async checkClipboard() {
        try {
            // Read the current clipboard content
            const clipboardContent = await this.readClipboard();
            
            // If has no length, skip
            if (!clipboardContent?.length) {
                return;
            }
            
            // Check if the content has changed
            if (clipboardContent !== this.lastClipboardContent) {
                this.lastClipboardContent = clipboardContent;
                this.onUpdate(clipboardContent);
            }
        } catch (error) {
            Logger.error("Error in clipboard monitoring: %s", error);
        }
    }

    /**
     * Read clipboard content
     * @returns The clipboard content or an empty string if reading fails
     */
    private async readClipboard(): Promise<string> {
        try {
            // Read the current clipboard content
            const clipboardContent = await this.getClipboardContent();
            
            // If has no length, skip
            if (!clipboardContent?.length) {
                return "";
            }
            
            return clipboardContent;
        } catch (error) {
            Logger.error("Error reading clipboard: %s", error);
            return "";
        }
    }

    /**
     * Write content to clipboard
     * @param text The text to write to the clipboard
     * @returns True if writing was successful, false otherwise
     */
    async writeClipboard(text: string): Promise<boolean> {
        try {
            const proc = Bun.spawn(["xclip", "-selection", "clipboard", "-i"], {
                stdin: "pipe",
            });

            await proc.stdin.write(text);
            await proc.stdin.end();

            return true;
        } catch (e) {
            Logger.error("Error writing to clipboard: %s", e);
            return false;
        }
    }
} 