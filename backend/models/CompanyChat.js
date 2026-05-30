import { FirestoreModel } from "../config/firestoreModel.js";

class CompanyChatModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      sender: 'user',
      platform: 'web',
      status: 'active',
      aiEnabled: true,
      handoffRequested: false,
      handoffAcceptedBy: null,
      ...data
    };
    return super.create(defaultData);
  }
}

const CompanyChat = new CompanyChatModel('company_chats');
export default CompanyChat;
