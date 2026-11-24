const House = require('../models/House.model');
const AccessRequest = require('../models/AccessRequest.model');
const FamilyMember = require('../models/FamilyMember.model');

class HouseService {
    /**
     * Check if user has permission to access Illangal (Requirement 3)
     */
    async checkHouseAccess(userId, userRole) {
        if (['ADMIN', 'SUB_ADMIN'].includes(String(userRole || '').toUpperCase())) {
            return { hasAccess: true, pendingRequest: null };
        }

        const approvedRequest = await AccessRequest.findOne({
            requesterId: userId,
            requestType: 'HOUSE',
            status: 'APPROVED'
        });

        if (approvedRequest) {
            return { hasAccess: true, pendingRequest: null };
        }

        const pendingRequest = await AccessRequest.findOne({
            requesterId: userId,
            requestType: 'HOUSE',
            status: 'PENDING'
        });

        return {
            hasAccess: false,
            pendingRequest: pendingRequest ? { id: pendingRequest._id, createdAt: pendingRequest.createdAt } : null
        };
    }

    /**
     * Fetch paginated house addresses in alphabetical order (Requirement 3)
     */
    async getHouses({ userId, userRole, search = '', page = 1, limit = 10 }) {
        const accessCheck = await this.checkHouseAccess(userId, userRole);
        if (!accessCheck.hasAccess) {
            return {
                hasAccess: false,
                pendingRequest: accessCheck.pendingRequest,
                houses: [],
                total: 0,
                page,
                totalPages: 0
            };
        }

        // Auto-seed sample heritage houses if none exist
        await this.ensureSeedHouses();

        const query = {};
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { houseName: regex },
                { headName: regex },
                { residentialAddress: regex },
                { city: regex }
            ];
        }

        const skip = (page - 1) * limit;

        // Display house addresses in alphabetical order (Requirement 3)
        const [houses, total] = await Promise.all([
            House.find(query)
                .sort({ houseName: 1, headName: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            House.countDocuments(query)
        ]);

        return {
            hasAccess: true,
            houses,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async ensureSeedHouses() {
        const count = await House.countDocuments();
        if (count === 0) {
            const initialHouses = [
                { houseName: 'Agasthiyar Illam', headName: 'Arumugam Marthandan', residentialAddress: '12, North Car Street, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123456', familyMembersCount: 6, generation: '3rd Generation' },
                { houseName: 'Anbagam Heritage Home', headName: 'Chockalingam Marthandan', residentialAddress: '45, Temple Road, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123457', familyMembersCount: 5, generation: '2nd Generation' },
                { houseName: 'Chidambaram Nilayam', headName: 'Esakkimuthu Marthandan', residentialAddress: '78, Bazaar Street, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123458', familyMembersCount: 4, generation: '3rd Generation' },
                { houseName: 'Gomathi Ambal Illam', headName: 'Kandasamy Marthandan', residentialAddress: '23, Mela Ratha Veethi, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123459', familyMembersCount: 5, generation: '4th Generation' },
                { houseName: 'Kalyani Kudil', headName: 'Karuppasamy Marthandan', residentialAddress: '89, River View Avenue, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123460', familyMembersCount: 4, generation: '3rd Generation' },
                { houseName: 'Madasamy Tharavadu', headName: 'Madasamy Marthandan', residentialAddress: '15, Sannathi Street, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123461', familyMembersCount: 7, generation: '2nd Generation' },
                { houseName: 'Murugan Manor', headName: 'Murugan Marthandan', residentialAddress: '56, South Mada Street, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123462', familyMembersCount: 5, generation: '3rd Generation' },
                { houseName: 'Muthukumar Bhavan', headName: 'Muthukumar Marthandan', residentialAddress: '34, East Car Street, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123463', familyMembersCount: 6, generation: '4th Generation' },
                { houseName: 'Narayana Vilas', headName: 'Narayanan Marthandan', residentialAddress: '90, High School Road, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123464', familyMembersCount: 4, generation: '3rd Generation' },
                { houseName: 'Palani Andavar Illam', headName: 'Palani Marthandan', residentialAddress: '11, Post Office Street, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123465', familyMembersCount: 5, generation: '2nd Generation' },
                { houseName: 'Paramasivan Kudumbam', headName: 'Paramasivan Marthandan', residentialAddress: '67, Main Road, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123466', familyMembersCount: 8, generation: '1st Generation' },
                { houseName: 'Sudalaiyandi Mandapam', headName: 'Sudalaiyandi Marthandan', residentialAddress: '01, Vamsam Kovil Lane, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123467', familyMembersCount: 6, generation: 'Founding Root' },
                { houseName: 'Velmurugan Nivas', headName: 'Velmurugan Marthandan', residentialAddress: '42, West Car Street, Marthandan', city: 'Marthandan', pincode: '629165', contactNumber: '9840123468', familyMembersCount: 5, generation: '3rd Generation' }
            ];
            await House.insertMany(initialHouses);
        }
    }
}

module.exports = new HouseService();
