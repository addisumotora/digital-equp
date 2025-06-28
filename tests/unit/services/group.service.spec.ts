import '../../setup'; // Import database setup for service tests that need database
import mongoose from 'mongoose';
import GroupService from '../../../src/services/group.service';
import EqubGroup from '../../../src/models/group.model';
import Membership from '../../../src/models/membership.model';
import User from '../../../src/models/user.model';

describe('GroupService', () => {
  afterEach(async () => {
    await EqubGroup.deleteMany({});
    await Membership.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a group and assign creator as member', async () => {
    const creatorId = new mongoose.Types.ObjectId();

    const groupData = {
      name: 'Test Group',
      amount: 100,
      cycleDuration: 30,
      creator: creatorId,
    };

    const group = await GroupService.createGroup(groupData);

    expect(group.name).toBe(groupData.name);
    expect(group.members).toContainEqual(creatorId);

    const membership = await Membership.findOne({ user: creatorId, group: group._id });
    expect(membership).not.toBeNull();
  });

  it('should throw an error when trying to join a non-existent group', async () => {
    const nonExistentGroupId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await expect(GroupService.joinGroup(nonExistentGroupId, userId)).rejects.toThrow('Group not found');
  });
});