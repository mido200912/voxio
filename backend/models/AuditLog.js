import { FirestoreModel } from "../config/firestoreModel.js";

class AuditLogModel extends FirestoreModel {
  async create(data) {
    return super.create({
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

const AuditLog = new AuditLogModel("audit_logs");
export default AuditLog;
