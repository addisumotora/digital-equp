import '../../setup'; // Import database setup for model tests
import mongoose from 'mongoose';
import EqubGroup from '../../../src/models/group.model';

describe('Group Model', () => {
  afterEach(async () => {
    await EqubGroup.deleteMany({});
  });

  describe('Group Schema Validation', () => {
    it('should create a valid group', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group for validation',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30,
        members: [new mongoose.Types.ObjectId()]
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.name).toBe(groupData.name);
      expect(savedGroup.description).toBe(groupData.description);
      expect(savedGroup.amount).toBe(groupData.amount);
      expect(savedGroup.cycleDuration).toBe(groupData.cycleDuration);
      expect(savedGroup.currentCycle).toBe(1); // Default value
      expect(savedGroup.isActive).toBe(true); // Default value
      expect(savedGroup.createdAt).toBeDefined();
      expect(savedGroup.updatedAt).toBeDefined();
    });

    it('should require name', async () => {
      const groupData = {
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should require creator', async () => {
      const groupData = {
        name: 'Test Group',
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should require amount', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should require cycleDuration', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000
      };

      const group = new EqubGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should validate minimum amount', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 0, // Invalid: less than 1
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should validate minimum cycleDuration', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 0 // Invalid: less than 1
      };

      const group = new EqubGroup(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should allow optional description', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.description).toBeUndefined();
    });
  });

  describe('Default Values', () => {
    it('should set default currentCycle to 1', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.currentCycle).toBe(1);
    });

    it('should set default isActive to true', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.isActive).toBe(true);
    });

    it('should set default startDate to current date', async () => {
      const beforeSave = new Date();
      
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      const afterSave = new Date();

      expect(savedGroup.startDate).toBeInstanceOf(Date);
      expect(savedGroup.startDate.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedGroup.startDate.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    it('should set default admin to null', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.admin).toBeNull();
    });

    it('should initialize empty members array', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.members).toEqual([]);
    });
  });

  describe('References and Relationships', () => {
    it('should store creator as ObjectId reference', async () => {
      const creatorId = new mongoose.Types.ObjectId();
      const groupData = {
        name: 'Test Group',
        creator: creatorId,
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.creator).toEqual(creatorId);
      expect(savedGroup.creator).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should store admin as ObjectId reference', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30,
        admin: adminId
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.admin).toEqual(adminId);
      expect(savedGroup.admin).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should store currentWinner as ObjectId reference', async () => {
      const winnerId = new mongoose.Types.ObjectId();
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30,
        currentWinner: winnerId
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.currentWinner).toEqual(winnerId);
      expect(savedGroup.currentWinner).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should store members as array of ObjectIds', async () => {
      const member1 = new mongoose.Types.ObjectId();
      const member2 = new mongoose.Types.ObjectId();
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30,
        members: [member1, member2]
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.members).toHaveLength(2);
      expect(savedGroup.members[0]).toEqual(member1);
      expect(savedGroup.members[1]).toEqual(member2);
      expect(savedGroup.members[0]).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(savedGroup.members[1]).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  describe('Data Types and Constraints', () => {
    it('should store amount as number', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1500.50,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(typeof savedGroup.amount).toBe('number');
      expect(savedGroup.amount).toBe(1500.50);
    });

    it('should store cycleDuration as number', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 45
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(typeof savedGroup.cycleDuration).toBe('number');
      expect(savedGroup.cycleDuration).toBe(45);
    });

    it('should store currentCycle as number', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30,
        currentCycle: 5
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(typeof savedGroup.currentCycle).toBe('number');
      expect(savedGroup.currentCycle).toBe(5);
    });

    it('should store isActive as boolean', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30,
        isActive: false
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(typeof savedGroup.isActive).toBe('boolean');
      expect(savedGroup.isActive).toBe(false);
    });
  });

  describe('Schema Options', () => {
    it('should not have versionKey', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect((savedGroup as any).__v).toBeUndefined();
    });

    it('should have timestamps', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      expect(savedGroup.createdAt).toBeInstanceOf(Date);
      expect(savedGroup.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();
      const originalUpdatedAt = savedGroup.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedGroup.name = 'Updated Group Name';
      const updatedGroup = await savedGroup.save();

      expect(updatedGroup.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Group Operations', () => {
    it('should allow updating group properties', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      savedGroup.name = 'Updated Group';
      savedGroup.amount = 2000;
      savedGroup.currentCycle = 2;
      savedGroup.isActive = false;

      const updatedGroup = await savedGroup.save();

      expect(updatedGroup.name).toBe('Updated Group');
      expect(updatedGroup.amount).toBe(2000);
      expect(updatedGroup.currentCycle).toBe(2);
      expect(updatedGroup.isActive).toBe(false);
    });

    it('should allow adding members to the group', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      const newMember = new mongoose.Types.ObjectId();
      savedGroup.members.push(newMember);

      const updatedGroup = await savedGroup.save();

      expect(updatedGroup.members).toHaveLength(1);
      expect(updatedGroup.members[0]).toEqual(newMember);
    });

    it('should allow setting current winner', async () => {
      const groupData = {
        name: 'Test Group',
        creator: new mongoose.Types.ObjectId(),
        amount: 1000,
        cycleDuration: 30
      };

      const group = new EqubGroup(groupData);
      const savedGroup = await group.save();

      const winnerId = new mongoose.Types.ObjectId();
      savedGroup.currentWinner = winnerId;

      const updatedGroup = await savedGroup.save();

      expect(updatedGroup.currentWinner).toEqual(winnerId);
    });
  });
}); 