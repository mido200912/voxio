import { FirestoreModel } from "../config/firestoreModel.js";

class ChatRatingModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      rating: 3,
      feedback: "",
      ...data,
    };
    return super.create(defaultData);
  }
}

const ChatRating = new ChatRatingModel("chat_ratings");
export default ChatRating;
