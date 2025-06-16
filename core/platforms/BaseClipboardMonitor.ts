
/**
 * Base class for clipboard monitors
 */
export abstract class BaseClipboardMonitor {
    /**
     * The callback function to be called when clipboard content changes
     */
    protected onUpdate: (text: string) => void;

    /**
     * The last clipboard content
     */
    protected lastClipboardContent: string = "";

    /**
     * Constructor for BaseClipboardMonitor
     * @param onUpdate The callback function to be called when clipboard content changes
     */
    constructor(onUpdate: (text: string) => void) {
        this.onUpdate = onUpdate;
    }

    /**
     * Start the clipboard monitoring process
     */
    abstract start(): void;

    /**
     * Stop the clipboard monitoring process
     */
    abstract stop(): void;

    /**
     * Write to clipboard
     * @param text The text to write to clipboard
     * @returns True if the text was written to clipboard, false otherwise
     */
    abstract writeClipboard(text: string): Promise<boolean>;
} 