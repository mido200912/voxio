import { FirestoreModel } from "../config/firestoreModel.js";

class LeadModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      name: '',
      phone: '',
      email: '',
      source: 'manual',
      sourceData: {},
      status: 'new',
      notes: '',
      tags: [],
      company: data.company || '',
      ...data
    };
    return super.create(defaultData);
  }
}

const Lead = new LeadModel("leads");
export default Lead;
