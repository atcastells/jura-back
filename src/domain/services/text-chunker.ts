import { Service } from "typedi";

@Service()
export class TextChunker {
  private readonly CHUNK_SIZE = 1000;
  private readonly CHUNK_OVERLAP = 200;

  split(text: string): string[] {
    if (text.length <= this.CHUNK_SIZE) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = start + this.CHUNK_SIZE;
      const chunk = text.slice(start, end);
      chunks.push(chunk);

      start += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
    }

    return chunks;
  }
}
