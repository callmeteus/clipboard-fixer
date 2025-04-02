export class UrlReplacer {
   constructor(public pattern: RegExp, public replacement: string) {}

   apply(text: string): string {
       let match;
       let result = text;
       
       // Replace all matches
       while ((match = result.match(this.pattern))) {
           console.info("Found match %s, replacing with %s", match[0], this.replacement);
           result = result.replace(match[0], this.replacement);
       }
       
       return result;
   }
}