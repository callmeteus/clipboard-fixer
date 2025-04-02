/**
 * Clipboard monitor script with Windows tray icon.
 * 
 * @author Gio Pavanelli (https://github.com/callmeteus)
 * @license MIT
 * @version 1.1.0
 */

import { ClipboardMonitor } from "./core/ClipboardMonitor";

/**
 * Entry point for the application
 */
async function main() {
    const monitor = new ClipboardMonitor();
    
    // Handle process termination
    process.on("SIGINT", () => {
        console.log("Received SIGINT signal");
        monitor.exit();
    });
    
    process.on("SIGTERM", () => {
        console.log("Received SIGTERM signal");
        monitor.exit();
    });
    
    // Initialize and start monitoring
    await monitor.init();
}

// Run the application
main().catch(console.error);