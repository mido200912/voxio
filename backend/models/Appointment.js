import { FirestoreModel } from "../config/firestoreModel.js";

class AppointmentModel extends FirestoreModel {
  async create(data) {
    return super.create({
      status: "pending",
      ...data,
    });
  }
}

const Appointment = new AppointmentModel("appointments");
export default Appointment;
