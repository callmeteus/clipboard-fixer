import { file, spawn } from "bun";
import path from "path";
import Tray from "trayicon";
import iconDisabledUrl from "../assets/icon-disabled.ico" with { type: "file" };
import iconEnabledUrl from "../assets/icon-enabled.ico" with { type: "file" };
import { ContentReplacer } from "../model/UrlReplacer";
import { Logger } from "./Logger";
import type { BaseClipboardMonitor } from "./platforms/BaseClipboardMonitor";

/**
 * Class for clipboard monitoring and fixing links
 */
export class ClipboardMonitor {
    /**
     * A list of content replacers.
     */
    private replacers: ContentReplacer[] = [];

    /**
     * The last clipboard content.
     */
    private lastClipboardContent: string = "";

    /**
     * Flag to indicate if monitoring is enabled.
     */
    private isMonitoringEnabled: boolean = true;

    /**
     * The Windows system tray icon.
     */
    private tray: any | null = null;

    /**
     * The platform-specific clipboard monitor.
     */
    private monitor: BaseClipboardMonitor | null = null;

    /**
     * Flag to indicate if debug window is visible.
     */
    private isDebugWindowVisible: boolean = false;

    constructor() {
        // Set process title
        process.title = "Fix embeddedable links";

        // Hide console window on Windows
        this.toggleDebugWindow(false);
    }

    /**
     * Initialize the application.
     */
    async init() {
        Logger.info("Loading replacers...");

        // Get the replacers folder
        const replacersFolder = path.resolve(process.cwd(), "config", "replacers");

        // Create a new glob instance
        const glob = new Bun.Glob("*.json");

        // Load replacers from JSON files
        for await (const filePath of glob.scan({
            cwd: replacersFolder,
            absolute: true,
            onlyFiles: true
        })) {
            // Load the rules from the file
            const ruleList = await file(filePath).json();

            // Add each rule to the list
            for (const rule of ruleList) {
                this.replacers.push(
                    new ContentReplacer(
                        new RegExp(rule.pattern, rule.flags ?? "g"),
                        rule.replacement
                    )
                );
            }
        }

        Logger.info("Found %d replacers", this.replacers.length);

        // Initialize tray if on Windows
        if (process.platform === "win32") {
            Logger.info("Initializing tray icon...");
            await this.initTray();
        }

        // Start monitoring
        this.startMonitoring();

        Logger.info("Press Ctrl+C to exit or use the tray icon");
    }

    /**
     * Initialize the system tray icon.
     */
    private async initTray() {
        if (this.tray) {
            throw new Error("`initTray` can only be called once");
        }

        try {
            // Create tray icon
            this.tray = await new Promise((resolve, reject) => {
                Tray.create({
                    title: "Link Fixer"
                }, resolve)
                .catch(reject);
            });

            // Update tray icon
            this.updateTray();

            Logger.info("Tray icon initialized");
        } catch (error) {
            Logger.error("Failed to initialize tray: %s", error);
        }
    }

    /**
     * Update the tray icon and menu.
     */
    private async updateTray() {
        // Ignore if tray is not initialized
        if (!this.tray) {
            return;
        }

        // Set menu items
        this.tray!.setMenu(
            this.tray!.item(this.isMonitoringEnabled ? "Disable Monitoring" : "Enable Monitoring", () => this.toggleMonitoring()),
            this.tray!.item(this.isDebugWindowVisible ? "Hide Debug Window" : "Show Debug Window", () => this.toggleDebugWindow(!this.isDebugWindowVisible)),
            this.tray!.item("Exit", () => this.exit())
        );
        
        try {
            // Get icon path
            const iconPathName = this.isMonitoringEnabled ? iconEnabledUrl : iconDisabledUrl;

            // Read icon data
            const iconBuff = Buffer.from(await file(iconPathName).bytes());

            // Update icon
            this.tray.setIcon(iconBuff);
        } catch (error) {
            Logger.error("Error updating tray: %s", error);
        }
    }

    /**
     * Toggle monitoring state.
     */
    private toggleMonitoring() {
        this.isMonitoringEnabled = !this.isMonitoringEnabled;
        Logger.info("Clipboard monitoring %s", this.isMonitoringEnabled ? "enabled" : "disabled");

        // Update tray
        this.updateTray();
    }

    private async handleClipboardUpdate(text: string) {
        if (!this.isMonitoringEnabled) {
            return;
        }

        if (text === this.lastClipboardContent) {
            return;
        }

        this.lastClipboardContent = text;
        
        // Process the text with replacers
        const fixedText = this.detectAndFixLinks(text);
        
        // Only update if the content has changed
        if (fixedText !== text) {
            Logger.info("Detected link! Replacing...");
            Logger.info("Original: %s", text);
            Logger.info("Fixed: %s", fixedText);
            
            // Update the clipboard 
            if (!await this.monitor!.writeClipboard(fixedText)) {
                Logger.error("Failed to update clipboard");
            }
            
            // Update our stored content to prevent loop
            this.lastClipboardContent = fixedText;
        }
    }

    /**
     * Start the clipboard monitoring process.
     */
    async startMonitoring() {
        if (process.platform === "win32") {
            const { WindowsClipboardMonitor } = await import("./platforms/WindowsClipboardMonitor");

            // Use Windows-specific clipboard monitoring
            this.monitor = new WindowsClipboardMonitor(this.handleClipboardUpdate.bind(this));
        } else
        if (process.platform === "linux") {
            const { LinuxClipboardMonitor } = await import("./platforms/LinuxClipboardMonitor");

            // Use Linux-specific clipboard monitoring
            this.monitor = new LinuxClipboardMonitor(this.handleClipboardUpdate.bind(this));
        } else {
            throw new Error("Unsupported platform: " + process.platform);
        }

        // Start the monitor
        this.monitor.start();
    }

    /**
     * Stop the clipboard monitoring process.
     */
    stopMonitoring() {
        if (this.monitor) {
            this.monitor.stop();
            this.monitor = null;
        }

        Logger.info("Clipboard monitoring stopped");
    }

    /**
     * Exit the application
     */
    exit() {
        Logger.info("Exiting application");
        this.stopMonitoring();
        
        process.exit(0);
    }

    /**
     * Detect and fix links in a string.
     * @param text The string to detect and fix links in.
     * @returns The fixed string or null if no links were found.
     */
    private detectAndFixLinks(text: string) {
        if (!text) {
            return text;
        }

        // Apply all replacers to the text
        return this.replacers.reduce((currentText, replacer) => {
            return replacer.apply(currentText);
        }, text);
    }

    /**
     * Toggle debug window visibility.
     * @param visible Whether to show or hide the debug window.
     */
    private toggleDebugWindow(visible: boolean) {
        if (process.platform === "win32") {
            // Spawn the powershell command to show or hide the console window
            spawn(["powershell.exe", "-WindowStyle", "Hidden", "-Command", `
                Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class Win32 {
                    [DllImport("kernel32.dll")]
                    public static extern IntPtr GetConsoleWindow();
                    [DllImport("user32.dll")]
                    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
                }
                "@
                $console = [Win32]::GetConsoleWindow()
                [Win32]::ShowWindow($console, ${visible ? "5" : "0"})
            `]);

            // Update the flag
            this.isDebugWindowVisible = visible;

            Logger.info("Debug window %s", visible ? "shown" : "hidden");
        }

        // Update tray
        this.updateTray();
    }
}