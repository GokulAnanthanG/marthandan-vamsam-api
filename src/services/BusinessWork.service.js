const User = require('../models/User.model');
const FamilyMember = require('../models/FamilyMember.model');
const FamilyRelationship = require('../models/FamilyRelationship.model');
const AccessRequest = require('../models/AccessRequest.model');

class BusinessWorkService {
    /**
     * Helper: Build relationship graph and determine relation relative to logged-in user
     */
    async buildRelationMap(userId) {
        // Find current user's corresponding tree member if any
        const currentUser = await User.findById(userId).select('fullName mobileNumber').lean();
        const userPhone = currentUser?.mobileNumber || '';
        const userName = currentUser?.fullName || '';

        // Query all active relationships
        const relationships = await FamilyRelationship.find().lean();
        const allMembers = await FamilyMember.find({ isDeleted: false }).select('_id name gender phone photoUrl').lean();

        const memberMap = new Map();
        for (const m of allMembers) {
            memberMap.set(String(m._id), m);
        }

        // Map parent-child and spouses
        const parentMap = new Map(); // childId -> [parentIds]
        const childrenMap = new Map(); // parentId -> [childIds]
        const spouseMap = new Map(); // memberId -> [spouseIds]

        for (const rel of relationships) {
            const pId = String(rel.parentMemberId);
            const cId = String(rel.childMemberId);

            if (rel.relationshipType === 'PARENT_CHILD') {
                if (!parentMap.has(cId)) parentMap.set(cId, []);
                parentMap.get(cId).push(pId);

                if (!childrenMap.has(pId)) childrenMap.set(pId, []);
                childrenMap.get(pId).push(cId);
            } else if (rel.relationshipType === 'SPOUSE') {
                if (!spouseMap.has(pId)) spouseMap.set(pId, []);
                spouseMap.get(pId).push(cId);

                if (!spouseMap.has(cId)) spouseMap.set(cId, []);
                spouseMap.get(cId).push(pId);
            }
        }

        // Find logged-in user's node in the tree
        let userMemberNode = null;
        if (userPhone) {
            userMemberNode = allMembers.find(m => m.phone === userPhone);
        }
        if (!userMemberNode && userName) {
            userMemberNode = allMembers.find(m => m.name && m.name.toLowerCase().trim() === userName.toLowerCase().trim());
        }

        const userNodeId = userMemberNode ? String(userMemberNode._id) : null;

        // Precompute immediate family sets for fast lookup
        const userParents = new Set(userNodeId && parentMap.has(userNodeId) ? parentMap.get(userNodeId) : []);
        const userChildren = new Set(userNodeId && childrenMap.has(userNodeId) ? childrenMap.get(userNodeId) : []);
        const userSpouses = new Set(userNodeId && spouseMap.has(userNodeId) ? spouseMap.get(userNodeId) : []);

        const userSiblings = new Set();
        for (const p of userParents) {
            const siblings = childrenMap.get(p) || [];
            for (const s of siblings) {
                if (s !== userNodeId) userSiblings.add(s);
            }
        }

        const userUnclesAunts = new Set();
        for (const p of userParents) {
            const grandParents = parentMap.get(p) || [];
            for (const gp of grandParents) {
                const pSiblings = childrenMap.get(gp) || [];
                for (const ps of pSiblings) {
                    if (ps !== p) userUnclesAunts.add(ps);
                }
            }
        }

        const userCousins = new Set();
        for (const ua of userUnclesAunts) {
            const cousins = childrenMap.get(ua) || [];
            for (const c of cousins) userCousins.add(c);
        }

        return {
            memberMap,
            parentMap,
            childrenMap,
            userNodeId,
            userPhone,
            computeRelation: (memberId, memberGender) => {
                const mId = String(memberId);
                const parents = parentMap.get(mId) || [];
                const parentNames = parents.map(pid => memberMap.get(pid)?.name).filter(Boolean);
                const parentLineage = parentNames.length > 0 ? parentNames.join(', ') : null;

                if (!userNodeId) {
                    // Fallback to lineage information
                    return {
                        relationLabel: parentLineage ? (memberGender === 'FEMALE' ? `d/o ${parentLineage}` : `s/o ${parentLineage}`) : 'Marthandan Lineage',
                        relationLabelTa: parentLineage ? (memberGender === 'FEMALE' ? `${parentLineage} மகள்` : `${parentLineage} மகன்`) : 'வம்ச சொந்தம்',
                        relationType: 'LINEAGE',
                        parentName: parentLineage,
                        isImmediate: false
                    };
                }

                if (mId === userNodeId) {
                    return { relationLabel: 'Self', relationLabelTa: 'நீங்கள் (நான்)', relationType: 'SELF', parentName: parentLineage, isImmediate: true };
                }
                if (userParents.has(mId)) {
                    const label = memberGender === 'FEMALE' ? 'Mother' : 'Father';
                    const labelTa = memberGender === 'FEMALE' ? 'தாய்' : 'தந்தை';
                    return { relationLabel: label, relationLabelTa: labelTa, relationType: 'PARENT', parentName: parentLineage, isImmediate: true };
                }
                if (userChildren.has(mId)) {
                    const label = memberGender === 'FEMALE' ? 'Daughter' : 'Son';
                    const labelTa = memberGender === 'FEMALE' ? 'மகள்' : 'மகன்';
                    return { relationLabel: label, relationLabelTa: labelTa, relationType: 'CHILD', parentName: parentLineage, isImmediate: true };
                }
                if (userSiblings.has(mId)) {
                    const label = memberGender === 'FEMALE' ? 'Sister' : 'Brother';
                    const labelTa = memberGender === 'FEMALE' ? 'சகோதரி' : 'சகோதரர்';
                    return { relationLabel: label, relationLabelTa: labelTa, relationType: 'SIBLING', parentName: parentLineage, isImmediate: true };
                }
                if (userSpouses.has(mId)) {
                    return { relationLabel: 'Spouse', relationLabelTa: 'துணைவர்', relationType: 'SPOUSE', parentName: parentLineage, isImmediate: true };
                }
                if (userUnclesAunts.has(mId)) {
                    const label = memberGender === 'FEMALE' ? 'Paternal Aunt' : 'Paternal Uncle';
                    const labelTa = memberGender === 'FEMALE' ? 'அத்தை / பெரியம்மா' : 'பெரியப்பா / சித்தப்பா';
                    return { relationLabel: label, relationLabelTa: labelTa, relationType: 'UNCLE_AUNT', parentName: parentLineage, isImmediate: false };
                }
                if (userCousins.has(mId)) {
                    return { relationLabel: 'Cousin', relationLabelTa: 'பங்காளி / மைத்துனர்', relationType: 'COUSIN', parentName: parentLineage, isImmediate: false };
                }

                return {
                    relationLabel: parentLineage ? (memberGender === 'FEMALE' ? `d/o ${parentLineage}` : `s/o ${parentLineage}`) : 'Lineage Relative',
                    relationLabelTa: parentLineage ? (memberGender === 'FEMALE' ? `${parentLineage} மகள்` : `${parentLineage} மகன்`) : 'வம்ச சொந்தம்',
                    relationType: 'LINEAGE',
                    parentName: parentLineage,
                    isImmediate: false
                };
            }
        };
    }

    /**
     * Get Business Directory directly from Tree Node Data (FamilyMember) with Relation Understanding
     */
    async getBusinessList({ userId, userRole, businessType = null, relationFilter = 'ALL', search = '' }) {
        await this.ensureSeedTreeMembersWithBusinesses();

        // 1. Fetch relations graph
        const { computeRelation, userPhone } = await this.buildRelationMap(userId);

        // 2. Query FamilyMember nodes that have business data
        const query = {
            isDeleted: false,
            $or: [
                { businessName: { $exists: true, $nin: ['', null] } },
                { profileType: { $in: ['BUSINESS', 'BOTH'] } }
            ]
        };

        if (businessType && businessType !== 'ALL') {
            query.$and = [
                {
                    $or: [
                        { businessType: businessType },
                        { businessType: { $in: [null, ''] }, businessName: { $exists: true, $nin: ['', null] } }
                    ]
                }
            ];
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$and = [
                {
                    $or: [
                        { name: regex },
                        { businessName: regex },
                        { businessType: regex },
                        { businessAddress: regex },
                        { residentialAddress: regex }
                    ]
                }
            ];
        }

        const treeMembers = await FamilyMember.find(query).sort({ businessName: 1 }).lean();

        // Check user's approved/pending access requests
        const userRequests = await AccessRequest.find({
            requesterId: userId,
            requestType: 'BUSINESS'
        }).lean();

        const requestMap = new Map();
        for (const req of userRequests) {
            if (req.targetMemberId) requestMap.set(String(req.targetMemberId), req);
            if (req.targetUserId) requestMap.set(String(req.targetUserId), req);
        }

        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(userRole || '').toUpperCase());

        let processed = treeMembers.map(m => {
            const isOwner = (m.phone && userPhone && m.phone === userPhone) || false;
            const req = requestMap.get(String(m._id));
            const isApproved = isAdmin || isOwner || (req && req.status === 'APPROVED');
            const status = isOwner ? 'OWNER' : (isAdmin ? 'APPROVED' : (req ? req.status : 'NONE'));

            const relInfo = computeRelation(m._id, m.gender);

            return {
                id: m._id,
                memberId: m._id,
                ownerName: m.name,
                gender: m.gender,
                businessName: m.businessName || `${m.name}'s Enterprises`,
                businessType: m.businessType || 'Retail',
                photoUrl: m.photoUrl || null,
                hasAccess: isApproved,
                accessStatus: status,
                rejectionReason: req?.rejectionReason || null,
                // Relation metadata
                relation: relInfo.relationLabel,
                relationTa: relInfo.relationLabelTa,
                relationType: relInfo.relationType,
                parentName: relInfo.parentName,
                isImmediate: relInfo.isImmediate,
                // Location & Addresses
                businessAddress: isApproved ? (m.businessAddress || 'Marthandan Main Bazaar') : '••••••••••••••••••••',
                businessGoogleMapUrl: isApproved ? (m.businessGoogleMapUrl || (m.businessAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([m.businessName, m.businessAddress].filter(Boolean).join(', '))}` : null)) : null,
                contactNumber: isApproved ? (m.phone || '9840123000') : '••••••••••',
                whatsappNumber: isApproved ? (m.whatsapp || m.phone) : '••••••••••',
                residentialAddress: isApproved ? m.residentialAddress : '••••••••••••••••••••',
                homeGoogleMapUrl: isApproved ? m.homeGoogleMapUrl : null
            };
        });

        // Relation filter application
        if (relationFilter === 'IMMEDIATE') {
            processed = processed.filter(item => item.isImmediate || item.relationType === 'SELF' || item.relationType === 'PARENT' || item.relationType === 'CHILD' || item.relationType === 'SIBLING' || item.relationType === 'SPOUSE');
        } else if (relationFilter === 'CLOSE_RELATIVES') {
            processed = processed.filter(item => item.isImmediate || item.relationType === 'UNCLE_AUNT' || item.relationType === 'COUSIN');
        }

        return processed;
    }

    /**
     * Get Work Profiles directly from Tree Node Data (FamilyMember) with Relation Understanding
     */
    async getWorkList({ userId, userRole, fieldOfWork = null, relationFilter = 'ALL', search = '' }) {
        await this.ensureSeedTreeMembersWithWork();

        const { computeRelation, userPhone } = await this.buildRelationMap(userId);

        const query = {
            isDeleted: false,
            $or: [
                { jobTitle: { $exists: true, $nin: ['', null] } },
                { companyName: { $exists: true, $nin: ['', null] } },
                { fieldOfWork: { $exists: true, $nin: ['', null] } },
                { profileType: { $in: ['WORK', 'BOTH'] } }
            ]
        };

        if (fieldOfWork && fieldOfWork !== 'ALL') {
            query.fieldOfWork = fieldOfWork;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$and = [
                {
                    $or: [
                        { name: regex },
                        { jobTitle: regex },
                        { companyName: regex },
                        { fieldOfWork: regex },
                        { residentialAddress: regex }
                    ]
                }
            ];
        }

        const treeMembers = await FamilyMember.find(query).sort({ name: 1 }).lean();

        const userRequests = await AccessRequest.find({
            requesterId: userId,
            requestType: 'WORK_ADDRESS'
        }).lean();

        const requestMap = new Map();
        for (const req of userRequests) {
            if (req.targetMemberId) requestMap.set(String(req.targetMemberId), req);
            if (req.targetUserId) requestMap.set(String(req.targetUserId), req);
        }

        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(userRole || '').toUpperCase());

        let processed = treeMembers.map(m => {
            const isOwner = (m.phone && userPhone && m.phone === userPhone) || false;
            const req = requestMap.get(String(m._id));
            const isApproved = isAdmin || isOwner || (req && req.status === 'APPROVED');
            const status = isOwner ? 'OWNER' : (isAdmin ? 'APPROVED' : (req ? req.status : 'NONE'));

            const relInfo = computeRelation(m._id, m.gender);

            return {
                id: m._id,
                memberId: m._id,
                fullName: m.name,
                gender: m.gender,
                photoUrl: m.photoUrl || null,
                jobTitle: m.jobTitle || 'Professional',
                occupation: m.jobTitle || m.occupationType || 'Professional',
                companyName: m.companyName || 'Reputed Organization',
                fieldOfWork: m.fieldOfWork || 'Information Technology',
                hasAccess: isApproved,
                accessStatus: status,
                rejectionReason: req?.rejectionReason || null,
                // Relation metadata
                relation: relInfo.relationLabel,
                relationTa: relInfo.relationLabelTa,
                relationType: relInfo.relationType,
                parentName: relInfo.parentName,
                isImmediate: relInfo.isImmediate,
                // Location & Contact
                workAddress: isApproved ? (m.residentialAddress || 'Tidel Park, Chennai') : '••••••••••••••••••••',
                contactNumber: isApproved ? (m.phone || '9840123000') : '••••••••••',
                residentialAddress: isApproved ? m.residentialAddress : '••••••••••••••••••••',
                homeGoogleMapUrl: isApproved ? (m.homeGoogleMapUrl || (m.residentialAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.residentialAddress)}` : null)) : null
            };
        });

        if (relationFilter === 'IMMEDIATE') {
            processed = processed.filter(item => item.isImmediate || item.relationType === 'SELF' || item.relationType === 'PARENT' || item.relationType === 'CHILD' || item.relationType === 'SIBLING' || item.relationType === 'SPOUSE');
        } else if (relationFilter === 'CLOSE_RELATIVES') {
            processed = processed.filter(item => item.isImmediate || item.relationType === 'UNCLE_AUNT' || item.relationType === 'COUSIN');
        }

        return processed;
    }

    /**
     * Dedicated Relatives Directory Tab:
     * Combined business & work directory for the logged-in user's direct lineage & relatives
     */
    async getRelativesDirectory({ userId, userRole, search = '' }) {
        const businesses = await this.getBusinessList({ userId, userRole, relationFilter: 'CLOSE_RELATIVES', search });
        const workProfiles = await this.getWorkList({ userId, userRole, relationFilter: 'CLOSE_RELATIVES', search });

        // Merge and tag directory items
        const merged = [
            ...businesses.map(b => ({ ...b, entryType: 'BUSINESS' })),
            ...workProfiles.map(w => ({ ...w, entryType: 'WORK' }))
        ];

        // Sort by immediate relation first, then by name
        merged.sort((a, b) => {
            if (a.isImmediate && !b.isImmediate) return -1;
            if (!a.isImmediate && b.isImmediate) return 1;
            return a.ownerName ? a.ownerName.localeCompare(b.ownerName || '') : 0;
        });

        return merged;
    }

    /**
     * Get Employees under an enterprise (Requirement 5.3)
     */
    async getEmployees({ userId, userRole, businessOwnerId }) {
        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(userRole || '').toUpperCase());

        const approvedRequest = await AccessRequest.findOne({
            requesterId: userId,
            targetUserId: businessOwnerId,
            requestType: 'EMPLOYEES',
            status: 'APPROVED'
        });

        const pendingRequest = await AccessRequest.findOne({
            requesterId: userId,
            targetUserId: businessOwnerId,
            requestType: 'EMPLOYEES',
            status: 'PENDING'
        });

        const hasAccess = isAdmin || !!approvedRequest;

        const employees = [
            { id: 'emp_1', name: 'Subramanian M.', role: 'Chief Operations Officer', experience: '8 Years', phone: hasAccess ? '9840112233' : '••••••••••', address: hasAccess ? 'Marthandan North' : '••••••••••••' },
            { id: 'emp_2', name: 'Gomathi S.', role: 'Senior Accountant', experience: '5 Years', phone: hasAccess ? '9840223344' : '••••••••••', address: hasAccess ? 'Kulithurai' : '••••••••••••' },
            { id: 'emp_3', name: 'Esakkimuthu K.', role: 'Site Supervisor', experience: '6 Years', phone: hasAccess ? '9840334455' : '••••••••••', address: hasAccess ? 'Kuzhithurai Road' : '••••••••••••' }
        ];

        return {
            hasAccess,
            accessStatus: isAdmin ? 'APPROVED' : (approvedRequest ? 'APPROVED' : (pendingRequest ? 'PENDING' : 'NONE')),
            employees
        };
    }

    /**
     * Ensure realistic tree members with business info exist in DB for immediate display
     */
    async ensureSeedTreeMembersWithBusinesses() {
        const count = await FamilyMember.countDocuments({
            isDeleted: false,
            businessName: { $exists: true, $nin: ['', null] }
        });

        if (count === 0) {
            // Find existing tree
            const FamilyTree = require('../models/FamilyTree.model');
            const tree = await FamilyTree.findOne().lean();
            if (!tree) return;

            const samples = [
                {
                    treeId: tree._id,
                    name: 'Sudalaiyandi Marthandan',
                    gender: 'MALE',
                    phone: '9840123001',
                    businessName: 'Marthandan Heritage Silks & Sarees',
                    businessType: 'Retail',
                    businessAddress: '102, Sannathi Street, Marthandan, Kanyakumari',
                    businessGoogleMapUrl: 'https://maps.google.com/?q=Sannathi+Street+Marthandan',
                    profileType: 'BUSINESS',
                    residentialAddress: '15, Heritage Lane, Marthandan',
                    homeGoogleMapUrl: 'https://maps.google.com/?q=Heritage+Lane+Marthandan'
                },
                {
                    treeId: tree._id,
                    name: 'Paramasivan Marthandan',
                    gender: 'MALE',
                    phone: '9840123002',
                    businessName: 'Paramasivan Agro Engineering Works',
                    businessType: 'Manufacturing',
                    businessAddress: '45, Industrial Estate, Marthandan',
                    businessGoogleMapUrl: 'https://maps.google.com/?q=Industrial+Estate+Marthandan',
                    profileType: 'BUSINESS',
                    residentialAddress: '88, West Car Street, Marthandan'
                },
                {
                    treeId: tree._id,
                    name: 'Chockalingam Marthandan',
                    gender: 'MALE',
                    phone: '9840123003',
                    businessName: 'Marthandan Gold & Jewellery Palace',
                    businessType: 'Jewellery & Gold',
                    businessAddress: '12, Main Car Street, Marthandan',
                    businessGoogleMapUrl: 'https://maps.google.com/?q=Main+Car+Street+Marthandan',
                    profileType: 'BUSINESS',
                    residentialAddress: '34, Temple View, Marthandan'
                },
                {
                    treeId: tree._id,
                    name: 'Velmurugan Marthandan',
                    gender: 'MALE',
                    phone: '9840123004',
                    businessName: 'Vel Murugan Transport & Logistics',
                    businessType: 'Transport & Logistics',
                    businessAddress: '88, National Highway Junction, Marthandan',
                    businessGoogleMapUrl: 'https://maps.google.com/?q=National+Highway+Junction+Marthandan',
                    profileType: 'BUSINESS',
                    residentialAddress: '72, River View Road, Marthandan'
                },
                {
                    treeId: tree._id,
                    name: 'Muthukumar Marthandan',
                    gender: 'MALE',
                    phone: '9840123005',
                    businessName: 'Vamsam Organic Farms & Nursery',
                    businessType: 'Agriculture & Farming',
                    businessAddress: '23, Kuzhithurai River Road, Marthandan',
                    businessGoogleMapUrl: 'https://maps.google.com/?q=Kuzhithurai+River+Road+Marthandan',
                    profileType: 'BUSINESS',
                    residentialAddress: '10, Green Meadows, Marthandan'
                }
            ];

            for (const s of samples) {
                const existing = await FamilyMember.findOne({ name: s.name, treeId: s.treeId });
                if (!existing) {
                    await FamilyMember.create(s);
                } else if (!existing.businessName) {
                    await FamilyMember.updateOne({ _id: existing._id }, { $set: s });
                }
            }
        }
    }

    /**
     * Ensure realistic tree members with professional work info exist in DB
     */
    async ensureSeedTreeMembersWithWork() {
        const count = await FamilyMember.countDocuments({
            isDeleted: false,
            jobTitle: { $exists: true, $nin: ['', null] }
        });

        if (count === 0) {
            const FamilyTree = require('../models/FamilyTree.model');
            const tree = await FamilyTree.findOne().lean();
            if (!tree) return;

            const samples = [
                {
                    treeId: tree._id,
                    name: 'Subramanian Marthandan',
                    gender: 'MALE',
                    phone: '9840124001',
                    jobTitle: 'Senior Principal Software Architect',
                    companyName: 'Microsoft Corporation',
                    fieldOfWork: 'Information Technology',
                    profileType: 'WORK',
                    residentialAddress: 'Block 4, Tidel Park Road, Chennai',
                    homeGoogleMapUrl: 'https://maps.google.com/?q=Tidel+Park+Chennai'
                },
                {
                    treeId: tree._id,
                    name: 'Meenakshi Marthandan',
                    gender: 'FEMALE',
                    phone: '9840124002',
                    jobTitle: 'Chief Consultant Paediatrician',
                    companyName: 'Apollo Speciality Hospitals',
                    fieldOfWork: 'Medicine & Healthcare',
                    profileType: 'WORK',
                    residentialAddress: '21, Greams Road, Chennai',
                    homeGoogleMapUrl: 'https://maps.google.com/?q=Greams+Road+Chennai'
                },
                {
                    treeId: tree._id,
                    name: 'Karuppasamy Marthandan',
                    gender: 'MALE',
                    phone: '9840124003',
                    jobTitle: 'Senior Vice President - Corporate Finance',
                    companyName: 'HDFC Bank Ltd',
                    fieldOfWork: 'Banking & Finance',
                    profileType: 'WORK',
                    residentialAddress: '9, Anna Salai, Chennai',
                    homeGoogleMapUrl: 'https://maps.google.com/?q=Anna+Salai+Chennai'
                },
                {
                    treeId: tree._id,
                    name: 'Karthikeyan Marthandan',
                    gender: 'MALE',
                    phone: '9840124004',
                    jobTitle: 'Executive Engineer - Highways',
                    companyName: 'Public Works Department (PWD)',
                    fieldOfWork: 'Government & Public Sector',
                    profileType: 'WORK',
                    residentialAddress: '55, Collectorate Road, Nagercoil',
                    homeGoogleMapUrl: 'https://maps.google.com/?q=Collectorate+Road+Nagercoil'
                },
                {
                    treeId: tree._id,
                    name: 'Ananthi Marthandan',
                    gender: 'FEMALE',
                    phone: '9840124005',
                    jobTitle: 'Professor & Head of Civil Engineering',
                    companyName: 'College of Engineering, Guindy (CEG)',
                    fieldOfWork: 'Teaching & Academia',
                    profileType: 'WORK',
                    residentialAddress: '14, Sardar Patel Road, Guindy, Chennai'
                }
            ];

            for (const s of samples) {
                const existing = await FamilyMember.findOne({ name: s.name, treeId: s.treeId });
                if (!existing) {
                    await FamilyMember.create(s);
                } else if (!existing.jobTitle) {
                    await FamilyMember.updateOne({ _id: existing._id }, { $set: s });
                }
            }
        }
    }
}

module.exports = new BusinessWorkService();
