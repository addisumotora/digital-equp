import { Types } from "mongoose";
import Membership from "../models/membership.model";
import { ApiError } from "../utils/apiError";
import { IEqubGroup } from "../models/group.model";
import EqubGroup from "../models/group.model";

class GroupService {
  async createGroup(groupData: {
    name: string;
    description?: string;
    amount: number;
    cycleDuration: number;
    creator: Types.ObjectId | string;
  }): Promise<IEqubGroup> {
    // Ensure creator is a valid ObjectId
    const creatorId = new Types.ObjectId(groupData.creator);

    const group = await EqubGroup.create({
      ...groupData,
      creator: creatorId,
      members: [creatorId],
    });

    // Add creator as first member in Membership collection
    await Membership.create({
      user: creatorId,
      group: group._id,
    });

    return group;
  }

  async joinGroup(
    groupId: Types.ObjectId | string,
    userId: Types.ObjectId | string
  ): Promise<IEqubGroup> {
    const group = await EqubGroup.findById(groupId);

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    // Ensure userId is a valid ObjectId
    const userObjectId = new Types.ObjectId(userId);

    if (
      group.members.some((member: Types.ObjectId) =>
        member.equals(userObjectId)
      )
    ) {
      throw new ApiError(400, "User already in group");
    }

    group.members.push(userObjectId);
    await group.save();

    await Membership.create({
      user: userObjectId,
      group: group._id,
    });

    return group;
  }

  async isGroupMember(
    groupId: Types.ObjectId | string,
    userId: Types.ObjectId | string
  ): Promise<boolean> {
    const group = await EqubGroup.findById(groupId);
    if (!group) return false;
    const userObjectId = new Types.ObjectId(userId);
    return group.members.some((member: Types.ObjectId) =>
      member.equals(userObjectId)
    );
  }

  async isCurrentWinner(
    groupId: Types.ObjectId | string,
    userId: Types.ObjectId | string
  ): Promise<boolean> {
    const group = await EqubGroup.findById(groupId);
    if (!group || !group.currentWinner) return false;
    const userObjectId = new Types.ObjectId(userId);
    return group.currentWinner.equals(userObjectId);
  }
  async getGroupById(
    groupId: Types.ObjectId | string
  ): Promise<IEqubGroup | null> {
    console.log("Fetching group with ID:", groupId);
    return EqubGroup.findById(groupId).populate("members");
  }

  async rotatePayout(groupId: Types.ObjectId | string): Promise<IEqubGroup> {
    const group = await EqubGroup.findById(groupId).populate("members");

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    // Simple rotation logic - can be enhanced with more complex rules
    // @ts-ignore
    const eligibleMembers = group.members.filter(
      (member: any) => !member._id.equals(group.currentWinner)
    );

    if (eligibleMembers.length === 0) {
      throw new ApiError(400, "No eligible members for payout");
    }

    const nextWinner =
      eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];

    group.currentWinner = nextWinner._id;
    group.currentCycle += 1;
    await group.save();

    return group;
  }

  async assignAdmin(
    groupId: Types.ObjectId | string,
    adminId: Types.ObjectId | string
  ): Promise<IEqubGroup> {
    const group = await EqubGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Group not found");
    }
    group.admin = new Types.ObjectId(adminId);
    await group.save();
    return group;
  }

  async findGroupById(groupId: Types.ObjectId | string): Promise<IEqubGroup | null> {
  return EqubGroup.findOne({ _id: groupId }).populate("members").populate("admin");
}


  async deleteGroup(groupId: Types.ObjectId | string): Promise<void> {
    const group = await EqubGroup.findByIdAndDelete(groupId);
    if (!group) {
      throw new ApiError(404, "Group not found");
    }
    await Membership.deleteMany({ group: groupId });
  }

  async removeAdmin(
    groupId: Types.ObjectId | string,
    adminId: Types.ObjectId | string
  ): Promise<IEqubGroup> {
    const group = await EqubGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    if (group.admin && group.admin.toString() === adminId.toString()) {
      group.admin = null;
      await group.save();
      return group;
    } else {
      throw new ApiError(
        400,
        "Specified user is not the current admin of this group"
      );
    }
  }
  async removeUserFromGroup(
    groupId: Types.ObjectId | string,
    userId: Types.ObjectId | string
  ): Promise<IEqubGroup> {
    const group = await this.findGroupById(groupId);
    if (!group) {
      throw new ApiError(404, "Group not found");
    }
    const userObjectId = new Types.ObjectId(userId);
    group.members = group.members.filter(
      (member: Types.ObjectId) => !member.equals(userObjectId)
    );

    await Membership.deleteOne({ user: userObjectId, group: group._id });
    await group.save();
    return group;
  }


  async getUserGroups(userId: Types.ObjectId | string): Promise<any[]> {
    // Find groups where the user is a member or admin
    return EqubGroup.find({
      $or: [{ members: userId }, { admin: userId }],
    });
  }
}

export default new GroupService();
