const mongoose = require('mongoose');
const path = require('path');
const FamilyTree = require('./src/models/FamilyTree.model');
const FamilyMember = require('./src/models/FamilyMember.model');
const FamilyRelationship = require('./src/models/FamilyRelationship.model');

// Kuttam authentic names
const maleNames = [
  'Subramanian', 'Velmurugan', 'Sudalaiyandi', 'Madasamy', 'Paramasivan', 
  'Arumugam', 'Karuppasamy', 'Muthukumar', 'Palani', 'Esakkimuthu', 
  'Komban', 'Thirumalai', 'Sivasubramanian', 'Narayanan', 'Kandasamy',
  'Muthiah', 'Chockalingam', 'Shanmugam', 'Murugan', 'Ramakrishnan'
];

const femaleNames = [
  'Pechiamma', 'Isakkiamma', 'Meenakshi', 'Gomathi', 'Muthumari', 
  'Valli', 'Deivanai', 'Sudalaimuthu', 'Mariamma', 'Kalyani',
  'Parvathi', 'Saraswathi', 'Lakshmi', 'Sita', 'Avudaiammal',
  'Thangammal', 'Ponnammal', 'Subbammal', 'Palaniammal', 'Velammal'
];

const treeIds = [
  '6aa04823344acdd3d5640f1b',
  '6aa809effd44dceb572f38f8'
];

const generateName = (gender) => {
  const baseName = gender === 'MALE' 
    ? maleNames[Math.floor(Math.random() * maleNames.length)] 
    : femaleNames[Math.floor(Math.random() * femaleNames.length)];
  return `${baseName} Marthandan`;
};

const runSeed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marthandan-vamsam';
    await mongoose.connect(uri);
    console.log('MongoDB Connected to', uri);

    for (const treeId of treeIds) {
      console.log(`Processing tree: ${treeId}`);
      
      // Clear existing data for this tree
      await FamilyMember.deleteMany({ treeId });
      await FamilyRelationship.deleteMany({ treeId });
      console.log('Cleared existing data.');

      const members = [];
      const relationships = [];
      let totalNodes = 0;
      
      // Create root node
      const rootId = new mongoose.Types.ObjectId();
      const rootGender = 'MALE'; // Must be male to start the lineage
      // Keep a queue of parents to generate children for
      const rootName = generateName(rootGender);
      members.push({
        _id: rootId,
        treeId,
        name: rootName,
        gender: rootGender,
        maritalStatus: 'MARRIED'
      });
      totalNodes++;

      // Update tree root
      // if FamilyTree doesn't exist yet, this will gracefully fail or do nothing
      await FamilyTree.findByIdAndUpdate(treeId, { rootMemberId: rootId });

      // Keep a queue of parents to generate children for
      const queue = [ { id: rootId, gender: rootGender, name: rootName } ];
      let currentIndex = 0;

      while (totalNodes < 1000) {
        let parent;
        if (currentIndex < queue.length) {
           parent = queue[currentIndex++];
        } else {
           // Queue emptied (all branches ended in females), pick a random existing male to continue the lineage
           const males = queue.filter(q => q.gender === 'MALE');
           parent = males[Math.floor(Math.random() * males.length)];
        }
        
        if (parent.gender === 'FEMALE') {
          continue;
        }

        const parentId = parent.id;
        
        const remaining = 1000 - totalNodes;
        if (remaining <= 0) break;
        
        const numChildren = Math.min(Math.floor(Math.random() * 3) + 1, remaining);
        
        for (let i = 0; i < numChildren; i++) {
          const childId = new mongoose.Types.ObjectId();
          const childGender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
          
          let childName = generateName(childGender);
          while (childName === parent.name) {
            childName = generateName(childGender);
          }

          members.push({
            _id: childId,
            treeId,
            name: childName,
            gender: childGender,
            maritalStatus: 'SINGLE'
          });
          
          relationships.push({
            treeId,
            parentMemberId: parentId,
            childMemberId: childId,
            relationshipType: 'PARENT_CHILD'
          });
          
          queue.push({ id: childId, gender: childGender, name: childName });
          totalNodes++;
        }
      }

      console.log(`Generated ${members.length} members and ${relationships.length} relationships.`);
      
      // Insert in batches
      await FamilyMember.insertMany(members);
      await FamilyRelationship.insertMany(relationships);
      console.log(`Tree ${treeId} seeding complete.`);
    }

    console.log('All done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runSeed();
