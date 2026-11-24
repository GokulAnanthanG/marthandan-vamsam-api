const MatrimonialProfile = require('../models/MatrimonialProfile.model');
const AccessRequest = require('../models/AccessRequest.model');
const ApiError = require('../utils/apiError');

class MatrimonialService {
    /**
     * Get Matrimonial Profiles with Access Control (Requirement 5.4)
     */
    async getProfiles({ userId, userRole, gender = null, search = '' }) {
        await this.ensureSeedProfiles();

        const query = { status: 'ACTIVE' };
        if (gender && gender !== 'ALL') {
            query.gender = gender;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { personName: regex },
                { education: regex },
                { occupation: regex },
                { fieldOfWork: regex }
            ];
        }

        const profiles = await MatrimonialProfile.find(query).sort({ createdAt: -1 }).lean();

        // Check user's approved and pending requests for VARAN
        const userRequests = await AccessRequest.find({
            requesterId: userId,
            requestType: 'VARAN'
        }).lean();

        const requestMap = new Map();
        let hasGlobalAccess = false;
        for (const req of userRequests) {
            if (req.targetVaranId) {
                requestMap.set(String(req.targetVaranId), req);
            } else {
                if (req.status === 'APPROVED') hasGlobalAccess = true;
            }
        }

        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(userRole || '').toUpperCase());

        const processed = profiles.map(p => {
            const isOwner = p.userId && String(p.userId) === String(userId);
            const req = requestMap.get(String(p._id));
            const hasAccess = isAdmin || isOwner || hasGlobalAccess || (req && req.status === 'APPROVED');
            const accessStatus = isOwner ? 'OWNER' : (hasAccess ? 'APPROVED' : (req ? req.status : 'NONE'));

            return {
                id: p._id,
                personName: p.personName,
                gender: p.gender,
                age: p.age,
                dateOfBirth: p.dateOfBirth,
                height: p.height,
                education: p.education,
                occupation: p.occupation,
                fieldOfWork: p.fieldOfWork,
                hasAccess,
                accessStatus,
                rejectionReason: req?.rejectionReason || null,
                // Protected information revealed only after approval (Requirement 5.4)
                income: hasAccess ? p.income : '••••••••',
                residentialAddress: hasAccess ? p.residentialAddress : '••••••••••••••••••••',
                fatherName: hasAccess ? p.fatherName : '••••••••••••',
                motherName: hasAccess ? p.motherName : '••••••••••••',
                contactNumber: hasAccess ? p.contactNumber : '••••••••••',
                bridePhotoUrl: hasAccess ? p.bridePhotoUrl : null,
                groomPhotoUrl: hasAccess ? p.groomPhotoUrl : null,
                jathagamUrl: hasAccess ? p.jathagamUrl : null,
                biodataUrl: hasAccess ? p.biodataUrl : null,
                about: p.about
            };
        });

        return processed;
    }

    /**
     * Get single profile details
     */
    async getProfileDetail({ profileId, userId, userRole }) {
        const profile = await MatrimonialProfile.findById(profileId).lean();
        if (!profile) throw new ApiError(404, 'Matrimonial profile not found');

        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(userRole || '').toUpperCase());
        const isOwner = profile.userId && String(profile.userId) === String(userId);

        const approvedReq = await AccessRequest.findOne({
            requesterId: userId,
            requestType: 'VARAN',
            $or: [{ targetVaranId: profileId }, { targetVaranId: null }],
            status: 'APPROVED'
        });

        const pendingReq = await AccessRequest.findOne({
            requesterId: userId,
            requestType: 'VARAN',
            targetVaranId: profileId,
            status: 'PENDING'
        });

        const hasAccess = isAdmin || isOwner || !!approvedReq;
        const accessStatus = isOwner ? 'OWNER' : (hasAccess ? 'APPROVED' : (pendingReq ? 'PENDING' : 'NONE'));

        return {
            ...profile,
            hasAccess,
            accessStatus,
            income: hasAccess ? profile.income : '••••••••',
            residentialAddress: hasAccess ? profile.residentialAddress : '••••••••••••••••••••',
            fatherName: hasAccess ? profile.fatherName : '••••••••••••',
            motherName: hasAccess ? profile.motherName : '••••••••••••',
            contactNumber: hasAccess ? profile.contactNumber : '••••••••••',
            bridePhotoUrl: hasAccess ? profile.bridePhotoUrl : null,
            groomPhotoUrl: hasAccess ? profile.groomPhotoUrl : null,
            jathagamUrl: hasAccess ? profile.jathagamUrl : null,
            biodataUrl: hasAccess ? profile.biodataUrl : null
        };
    }

    /**
     * Update asset documents within matrimonial profile (Requirement 5.4: Bride/Groom photo, Jathagam, Biodata)
     */
    async updateProfileAssets({ profileId, userId, userRole, assets }) {
        const profile = await MatrimonialProfile.findById(profileId);
        if (!profile) throw new ApiError(404, 'Matrimonial profile not found');

        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(userRole || '').toUpperCase());
        const isOwner = profile.userId && String(profile.userId) === String(userId);

        if (!isAdmin && !isOwner) {
            throw new ApiError(403, 'You are not authorized to update assets for this matrimonial profile');
        }

        const { bridePhotoUrl, groomPhotoUrl, jathagamUrl, biodataUrl, about } = assets;
        if (bridePhotoUrl !== undefined) profile.bridePhotoUrl = bridePhotoUrl;
        if (groomPhotoUrl !== undefined) profile.groomPhotoUrl = groomPhotoUrl;
        if (jathagamUrl !== undefined) profile.jathagamUrl = jathagamUrl;
        if (biodataUrl !== undefined) profile.biodataUrl = biodataUrl;
        if (about !== undefined) profile.about = about;

        await profile.save();
        return profile;
    }

    async ensureSeedProfiles() {
        const count = await MatrimonialProfile.countDocuments();
        if (count === 0) {
            const sample = [
                {
                    personName: 'Subramanian Marthandan, M.Tech',
                    gender: 'MALE',
                    dateOfBirth: new Date('1998-05-14'),
                    age: 28,
                    height: "5'11\"",
                    education: 'M.Tech Software Engineering (Anna University)',
                    occupation: 'Senior Staff Engineer at Microsoft',
                    fieldOfWork: 'Information Technology',
                    income: '₹32 LPA',
                    residentialAddress: '15, Sannathi Street, Marthandan',
                    fatherName: 'Madasamy Marthandan (Retd. Principal)',
                    motherName: 'Kalyani Ammal',
                    contactNumber: '9840129901',
                    about: 'Grew up with strong heritage values. Vegetarian, athletic, and values family traditions.',
                    bridePhotoUrl: null,
                    groomPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
                    jathagamUrl: 'Heritage Jathagam Available - Rishaba Rasi, Rohini Natchathiram',
                    biodataUrl: 'Marthandan_Subramanian_Biodata.pdf'
                },
                {
                    personName: 'Meenakshi Marthandan, MBBS, MD',
                    gender: 'FEMALE',
                    dateOfBirth: new Date('2000-08-22'),
                    age: 26,
                    height: "5'5\"",
                    education: 'MBBS, MD Paediatrics (Madras Medical College)',
                    occupation: 'Consultant Paediatrician',
                    fieldOfWork: 'Healthcare & Medical',
                    income: '₹22 LPA',
                    residentialAddress: '42, West Car Street, Marthandan',
                    fatherName: 'Velmurugan Marthandan (Civil Engineer)',
                    motherName: 'Deivanai Ammal',
                    contactNumber: '9840129902',
                    about: 'Compassionate medical professional fond of Carnatic music and cultural activities.',
                    bridePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                    groomPhotoUrl: null,
                    jathagamUrl: 'Heritage Jathagam Available - Kanni Rasi, Hastha Natchathiram',
                    biodataUrl: 'Marthandan_Meenakshi_Biodata.pdf'
                },
                {
                    personName: 'Karuppasamy Marthandan, CA',
                    gender: 'MALE',
                    dateOfBirth: new Date('1997-11-03'),
                    age: 29,
                    height: "5'9\"",
                    education: 'Chartered Accountant (ICAI) & B.Com',
                    occupation: 'Partner at Marthandan & Associates CA Firm',
                    fieldOfWork: 'Banking & Finance',
                    income: '₹28 LPA',
                    residentialAddress: '89, River View Avenue, Marthandan',
                    fatherName: 'Karuppasamy Marthandan (Business Proprietor)',
                    motherName: 'Parvathi Ammal',
                    contactNumber: '9840129903',
                    about: 'Independent financial consultant who values honesty and traditional community ties.',
                    bridePhotoUrl: null,
                    groomPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
                    jathagamUrl: 'Heritage Jathagam Available - Thula Rasi, Swati Natchathiram',
                    biodataUrl: 'Marthandan_Karuppasamy_Biodata.pdf'
                }
            ];
            await MatrimonialProfile.insertMany(sample);
        }
    }
}

module.exports = new MatrimonialService();
