import winston from "winston";

/**
 * The Logger class is a singleton that provides a logger for the application
 */
export class Logger {
    /**
     * The singleton instance of the logger
     */
    private static instance: winston.Logger;

    /**
     * Constructor for the Logger class
     */
    private constructor() {
        Logger.instance = winston.createLogger({
            level: "info",

            /**
             * The format of the log messages
             */
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
                    return `${timestamp} [${level}]: ${message} ${metaString}`;
                })
            ),

            /**
             * The transports of the logger
             */
            transports: [
                /**
                 * The file transport of the logger
                 */
                new winston.transports.File({ 
                    filename: process.cwd() + "/crash.log",
                    level: "error"
                }),

                /**
                 * The console transport of the logger
                 */
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ level, message, timestamp, ...meta }) => {
                            const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
                            return `${timestamp} [${level}]: ${message} ${metaString}`;
                        })
                    )
                })
            ]
        });
    }

    /**
     * Get the singleton instance of the logger
     * @returns The singleton instance of the logger
     */
    public static getInstance(): winston.Logger {
        if (!Logger.instance) {
            new Logger();
        }
        return Logger.instance;
    }

    /**
     * Log an info message
     * @param message The message to log
     * @param args The arguments to log
     */
    public static info(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().info(message, ...args);
        } else {
            Logger.getInstance().info(message);
        }
    }

    /**
     * Log an error message
     * @param message The message to log
     * @param args The arguments to log
     */
    public static error(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().error(message, ...args);
        } else {
            Logger.getInstance().error(message);
        }
    }

    /**
     * Log a warning message
     * @param message The message to log
     * @param args The arguments to log
     */
    public static warn(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().warn(message, ...args);
        } else {
            Logger.getInstance().warn(message);
        }
    }

    /**
     * Log a debug message
     * @param message The message to log
     * @param args The arguments to log
     */
    public static debug(message: string, ...args: any[]): void {
        if (args.length > 0) {
            Logger.getInstance().debug(message, ...args);
        } else {
            Logger.getInstance().debug(message);
        }
    }
}
