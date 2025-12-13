export interface DocumentParser {
  parse(buffer: Buffer, mimeType: string): Promise<string>;
}
