import { FirestoreModel } from "../config/firestoreModel.js";

class IntegrationModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      isActive: true,
      settings: {
        autoReply: true,
        syncProducts: false,
        aiMode: 'restricted', // 'general' or 'restricted'
        aiModel: 'inclusionai/ring-2.6-1t:free', // Default model
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
