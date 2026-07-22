import { FirestoreModel } from "../config/firestoreModel.js";

class KnowledgeFileModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      fileName: '',
      url: '',
      publicId: '',
      type: 'document',
      size: 0,
      status: 'active',
      uploadDate: new Date().toISOString(),
      company: data.company || '',
      ...data
    };
    return super.create(defaultData);
  }
}

const KnowledgeFile = new KnowledgeFileModel("knowledge_files");
export default KnowledgeFile;
