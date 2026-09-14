const FamilyMediaService = require('../services/FamilyMedia.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class FamilyMediaController {
    async getHeadDetails(req, res) {
        try {
            const { treeId, headMemberId } = req.params;
            const details = await FamilyMediaService.getHeadDetails(treeId, headMemberId);
            return successResponse(res, 200, 'Head details fetched successfully', details);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getAllHeadDetails(req, res) {
        try {
            const { treeId } = req.params;
            const detailsList = await FamilyMediaService.getAllHeadDetails(treeId);
            return successResponse(res, 200, 'All head details fetched successfully', detailsList);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async updateHeadDetails(req, res) {
        try {
            const { treeId, headMemberId } = req.params;
            const details = await FamilyMediaService.updateHeadDetails(treeId, headMemberId, req.body, req.user._id);
            return successResponse(res, 200, 'Head details updated successfully', details);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getBranchPhotos(req, res) {
        try {
            const { rootMemberId } = req.params;
            const photos = await FamilyMediaService.getBranchPhotos(rootMemberId);
            return successResponse(res, 200, 'Branch photos fetched successfully', photos);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async addBranchPhoto(req, res) {
        try {
            const { rootMemberId } = req.params;
            const { imageUrl, caption } = req.body;
            const photo = await FamilyMediaService.addBranchPhoto(rootMemberId, imageUrl, caption);
            return successResponse(res, 201, 'Branch photo added successfully', photo);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async deleteBranchPhoto(req, res) {
        try {
            const { photoId } = req.params;
            const photo = await FamilyMediaService.deleteBranchPhoto(photoId);
            return successResponse(res, 200, 'Branch photo deleted successfully', photo);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new FamilyMediaController();
