import { FirestoreModel } from "../config/firestoreModel.js";

class RequestModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      customerName: 'عميل غير معروف',
      product: 'عام',
      message: '',
      source: 'web',
      date: new Date().toISOString(),
      company: data.company || '',
      ...data
    };
    return super.create(defaultData);
  }
}

const Request = new RequestModel("requests");
export default Request;
