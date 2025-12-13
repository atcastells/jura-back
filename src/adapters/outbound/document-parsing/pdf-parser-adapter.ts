import { Service } from "typedi";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdf from "pdf-parse";
import { DocumentParser } from "../../../domain/ports/outbound/document-parser.js";

@Service()
export class PdfParserAdapter implements DocumentParser {
  async parse(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType !== "application/pdf") {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    try {
      // Handle CommonJS export mismatch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseFunction = (pdf as any).default || pdf;
      const data = await parseFunction(buffer);
      return data.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
      throw new Error("Unknown error during PDF parsing");
    }
  }
}
