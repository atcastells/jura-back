import { Service } from 'typedi';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Service()
export class GeminiAdapter  {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    console.log('Initializing GeminiAdapter');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    } else {
      console.log('GEMINI_API_KEY found, initializing GeminiAdapter');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI generation failed: ${error.message}`);
      }
      throw new Error('Unknown AI generation error');
    }
  }

}