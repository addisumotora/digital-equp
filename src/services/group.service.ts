import { Types } from 'mongoose';
import Membership from '../models/membership.model';
import { ApiError } from '../utils/apiError';
import { IEqubGroup } from '../models/group.model';
import EqubGroup from '../models/group.model';


class GroupService {
  async createGroup(groupData: {
    name: string;
    description?: string;
    amount: number;
    cycleDuration: number;
    creator: Types.ObjectId;
  }): Promise<IEqubGroup> {
    const group = await EqubGroup.create(groupData);
    
    // Add creator as first member
    await Membership.create({
      user: groupData.creator,
      group: group._id
    });

    return group;
  }

  async joinGroup(
    groupId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IEqubGroup> {
    const group = await EqubGroup.findById(groupId);
    
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }

    if (group.members.includes(userId)) {
      throw new ApiError(400, 'User already in group');
    }

    group.members.push(userId);
    await group.save();

    await Membership.create({
      user: userId,
      group: groupId
    });

    return group;
  }

  async rotatePayout(groupId: Types.ObjectId): Promise<IEqubGroup> {
    const group = await EqubGroup.findById(groupId).populate('members');
    
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }

    // Simple rotation logic - can be enhanced with more complex rules
    const eligibleMembers = group.members.filter(member => 
      !member._id.equals(group.currentWinner)
    );

    if (eligibleMembers.length === 0) {
      throw new ApiError(400, 'No eligible members for payout');
    }

    const nextWinner = eligibleMembers[
      Math.floor(Math.random() * eligibleMembers.length)
    ];

    group.currentWinner = nextWinner._id;
    group.currentCycle += 1;
    await group.save();

    return group;
  }
}

export default new GroupService();