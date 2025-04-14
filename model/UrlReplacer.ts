import { Logger } from "../core/Logger";

export class ContentReplacer {
    constructor(
        /**
         * The regular expression to match.
         */
        public pattern: RegExp,

        /**
         * The replacement string.
         */
        public replacement: string
    ) {

    }

    /**
     * Apply the replacer to a string.
     * @param text The text to apply the replacer to.
     * @returns 
     */
    apply(text: string): string {
        let match;
        let result = text;

        // Replace all matches
        while ((match = result.match(this.pattern))) {
            Logger.debug("Found match", { 
                match: match[0], 
                replacement: this.replacement 
            });
            result = result.replace(match[0], this.replacement);
        }

        return result;
    }
}