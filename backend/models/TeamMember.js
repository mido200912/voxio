import { FirestoreModel } from "../config/firestoreModel.js";

class TeamMemberModel extends FirestoreModel {
  async create(data) {
    return super.create({
      role: "agent",
      isActive: true,
      ...data,
    });
  }
}

const TeamMember = new TeamMemberModel("team_members");
export default TeamMember;
