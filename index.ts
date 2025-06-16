/**
 * Clipboard monitor script with Windows tray icon.
 * 
 * @author Gio Pavanelli (https://github.com/callmeteus)
 * @license MIT
 * @version 1.1.0
 */

import { ClipboardMonitor } from "./core/ClipboardMonitor";
import { Logger } from "./core/Logger";

// Set up global error handlers
process.on("uncaughtException", (error: Error) => {
    Logger.error("Uncaught Exception", {
        error: error,
        stack: error.stack
    });
    
    // Keep the process running for a moment to ensure the log is written
    setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason: any) => {
    Logger.error("Unhandled Rejection", {
        reason: reason
    });
});

/**
 * Entry point for the application
 */
async function main() {
    try {
        const monitor = new ClipboardMonitor();

        // Handle process termination
        process.on("SIGINT", () => {
            Logger.info("Received SIGINT signal");
            monitor.exit();
        });

        process.on("SIGTERM", () => {
            Logger.info("Received SIGTERM signal");
            monitor.exit();
        });

        // Initialize and start monitoring
        await monitor.init();

        // Keep the process running
        keepAlive();
    } catch (error) {
        Logger.error("Error in main", {
            error: error instanceof Error ? error : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        
        // Rethrow to trigger global handler
        throw error;
    }
}

// Run the application
main().catch(error => {
    Logger.error("Failed to start application", {
        error: error instanceof Error ? error : String(error),
        stack: error instanceof Error ? error.stack : undefined
    });

    process.exit(1);
});

/**
 * Keep the process alive by setting a recursive timeout
 */
function keepAlive() {
    setTimeout(() => {
        keepAlive();
    }, 1000);
}