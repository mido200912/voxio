import { FirestoreModel } from "../config/firestoreModel.js";

class UserModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      isVerified: false,
      fcmToken: null,
      ...data
    };
    return super.create(defaultData);
  }
}

const User = new UserModel("users");
export default User;
