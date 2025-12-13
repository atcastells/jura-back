import { Service, Inject } from "typedi";
import { DocumentRepository } from "../../domain/ports/outbound/document-repository.js";
import { StorageService } from "../../adapters/outbound/external-services/supabase/storage-service.js";
import { DOCUMENT_REPOSITORY } from "../../infrastructure/constants.js";

@Service()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private documentRepository: DocumentRepository,
    @Inject(() => StorageService) private storageService: StorageService,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== userId) {
      throw new Error("Unauthorized to delete this document");
    }

    // 1. Delete from Storage
    await this.storageService.deleteFile(document.path);

    // 2. Delete from Repository
    await this.documentRepository.delete(id);
  }
}
