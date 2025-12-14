import { Service } from "typedi";
import { PDFParse } from "pdf-parse";
import { DocumentParser } from "../../../domain/ports/outbound/document-parser.js";

@Service()
export class PdfParserAdapter implements DocumentParser {
  async parse(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType !== "application/pdf") {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    try {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      await parser.destroy();
      return data.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
      throw new Error("Unknown error during PDF parsing");
    }
  }
}
