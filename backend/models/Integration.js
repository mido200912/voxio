import { FirestoreModel } from "../config/firestoreModel.js";

class IntegrationModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      isActive: true,
      settings: {
        autoReply: true,
        syncProducts: false,
        aiMode: 'restricted', // 'general' or 'restricted'
        aiModel: 'meta-llama/llama-3.1-8b-instruct', // Default model
        languages: ['Arabic', 'English'],
        commands: []
      },
      ...data
    };
    return super.create(defaultData);
  }
}

const Integration = new IntegrationModel('integrations');
export default Integration;
