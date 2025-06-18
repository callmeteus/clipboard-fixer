import { spawn } from "bun";
import { Logger } from "../../Logger";

export class InteractivePowerShell {
    /**
     * The PowerShell process.
     */
    private process: Bun.Subprocess<"pipe", "pipe", "pipe"> | null = null;

    /**
     * Creates a new PowerShell process.
     * @param opts The options for the PowerShell process.
     */
    constructor(private opts?: {
        /**
         * The command to execute.
         */
        command?: string;

        /**
         * The callback to call when stdout is read.
         */
        onStdout?: (data: Uint8Array) => void;
    }) {
        if (opts?.command) {
            this.process = spawn(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", opts.command], {
                stdout: "pipe",
                stderr: "pipe",
                stdin: "pipe"
            });
        } else {
            this.process = spawn(["powershell.exe", "-NoProfile", "-NonInteractive"], {
                stdout: "pipe",
                stderr: "pipe",
                stdin: "pipe"
            });
        }

        this.readStdout();
        this.readStderr();
    }

    /**
     * Execute a command in the PowerShell process.
     * @param command The command to execute.
     */
    public async execute(command: string) {
        if (!command.endsWith("\n")) {
            command += "\n";
        }

        this.process!.stdin.write(command);
    }

    /**
     * Destroy the PowerShell process.
     */
    public destroy() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    /**
     * Read a stream.
     * @param stream The stream to read.
     * @returns The text read from the stream.
     */
    private async readStream(stream: ReadableStream<Uint8Array>) {
        const reader = stream.getReader();

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            this.opts?.onStdout?.(value);
        }

        reader.releaseLock();
    }

    /**
     * Read the stdout stream.
     */
    private async readStdout() {
        Logger.info("%s", await this.readStream(this.process!.stdout));
    }

    /**
     * Read the stderr stream.
     */
    private async readStderr() {
        Logger.info("%s", await this.readStream(this.process!.stderr));
    }
}