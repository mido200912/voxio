import { FirestoreModel } from "../config/firestoreModel.js";

class CopilotHistoryModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      role: 'user',         // 'user' | 'assistant'
      content: '',
      timestamp: new Date().toISOString(),
      ...data,
    };
    return super.create(defaultData);
  }
}

const CopilotHistory = new CopilotHistoryModel('copilot_history');
export default CopilotHistory;
