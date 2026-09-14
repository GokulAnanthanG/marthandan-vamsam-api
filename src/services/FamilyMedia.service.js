const FamilyHeadDetail = require('../models/FamilyHeadDetail.model');
const FamilyBranchPhoto = require('../models/FamilyBranchPhoto.model');
const ApiError = require('../utils/apiError');

class FamilyMediaService {
    async getHeadDetails(treeId, headMemberId) {
        return await FamilyHeadDetail.findOne({ treeId, headMemberId });
    }

    async getAllHeadDetails(treeId) {
        return await FamilyHeadDetail.find({ treeId });
    }

    async updateHeadDetails(treeId, headMemberId, data, userId) {
        let details = await FamilyHeadDetail.findOne({ treeId, headMemberId });
        if (!details) {
            details = new FamilyHeadDetail({ treeId, headMemberId });
        }
        
        if (data.familyDescription !== undefined) details.familyDescription = data.familyDescription;
        if (data.familyPhotoUrl !== undefined) details.familyPhotoUrl = data.familyPhotoUrl;
        
        details.updatedBy = userId;
        await details.save();
        return details;
    }

    async getBranchPhotos(rootMemberId) {
        return await FamilyBranchPhoto.find({ rootMemberId }).sort({ createdAt: -1 });
    }

    async addBranchPhoto(rootMemberId, imageUrl, caption) {
        const photo = new FamilyBranchPhoto({
            rootMemberId,
            imageUrl,
            caption
        });
        await photo.save();
        return photo;
    }

    async deleteBranchPhoto(photoId) {
        const photo = await FamilyBranchPhoto.findByIdAndDelete(photoId);
        if (!photo) throw new ApiError(404, 'Photo not found');
        return photo;
    }
}

module.exports = new FamilyMediaService();
