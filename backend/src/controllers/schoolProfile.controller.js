const SchoolProfileModel = require('../models/SchoolProfile.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { validateSchoolProfile } = require('../validators/schoolProfile.validator');
const path = require('path');
const fs = require('fs');

class SchoolProfileController {
  /**
   * Get school profile
   * GET /api/school-profile
   * @access Public (no JWT required)
   */
  static async get(req, res) {
    try {
      const schoolProfile = await SchoolProfileModel.get();

      if (!schoolProfile) {
        return errorResponse(res, 404, 'School profile not found');
      }

      return successResponse(res, 200, 'School profile retrieved successfully', {
        school_profile: schoolProfile
      });

    } catch (error) {
      console.error('Get school profile error:', error);
      return errorResponse(res, 500, 'Failed to retrieve school profile', error.message);
    }
  }

  /**
   * Create school profile
   * POST /api/school-profile
   * @access Private (Admin only)
   */
  static async create(req, res) {
    try {
      // Check if school profile already exists (should be only one)
      const exists = await SchoolProfileModel.exists();
      if (exists) {
        // Delete uploaded file if exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 400, 'School profile already exists. Please update instead.');
      }

      const {
        school_name,
        tagline,
        description,
        address,
        phone,
        email,
        website,
        vision,
        mission,
        instagram,
        facebook,
        youtube
      } = req.body;

      // Get logo path from uploaded file
      let logo = null;
      if (req.file) {
        logo = '/uploads/logo/' + req.file.filename;
      }

      // Validate input
      const validation = validateSchoolProfile({
        school_name,
        tagline,
        description,
        logo,
        address,
        phone,
        email,
        website,
        vision,
        mission,
        instagram,
        facebook,
        youtube
      }, false);

      if (!validation.isValid) {
        // Delete uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Create school profile
      const schoolProfile = await SchoolProfileModel.create({
        school_name,
        tagline,
        description,
        logo,
        address,
        phone,
        email,
        website,
        vision,
        mission,
        instagram,
        facebook,
        youtube
      });

      return successResponse(res, 201, 'School profile created successfully', {
        school_profile: schoolProfile
      });

    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Create school profile error:', error);
      return errorResponse(res, 500, 'Failed to create school profile', error.message);
    }
  }

  /**
   * Update school profile
   * PUT /api/school-profile/:id
   * @access Private (Admin only)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;

      // Check if school profile exists
      const existingProfile = await SchoolProfileModel.get();
      if (!existingProfile) {
        // Delete uploaded file if school profile not found
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 404, 'School profile not found');
      }

      // Verify the ID matches
      if (existingProfile.id !== id) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 404, 'School profile not found');
      }

      const {
        school_name,
        tagline,
        description,
        address,
        phone,
        email,
        website,
        vision,
        mission,
        instagram,
        facebook,
        youtube
      } = req.body;

      // Get logo path from uploaded file or keep existing
      let logo = existingProfile.logo;
      if (req.file) {
        logo = '/uploads/logo/' + req.file.filename;
      }

      // Validate input
      const validation = validateSchoolProfile({
        school_name,
        tagline,
        description,
        logo,
        address,
        phone,
        email,
        website,
        vision,
        mission,
        instagram,
        facebook,
        youtube
      }, true);

      if (!validation.isValid) {
        // Delete uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old logo if new logo uploaded
      if (req.file && existingProfile.logo) {
        const oldLogoPath = path.join(__dirname, '../../', existingProfile.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      // Update school profile
      const updatedProfile = await SchoolProfileModel.update(id, {
        school_name,
        tagline,
        description,
        logo,
        address,
        phone,
        email,
        website,
        vision,
        mission,
        instagram,
        facebook,
        youtube
      });

      return successResponse(res, 200, 'School profile updated successfully', {
        school_profile: updatedProfile
      });

    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Update school profile error:', error);
      return errorResponse(res, 500, 'Failed to update school profile', error.message);
    }
  }

  /**
   * Delete school profile
   * DELETE /api/school-profile/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if school profile exists
      const existingProfile = await SchoolProfileModel.get();
      if (!existingProfile) {
        return errorResponse(res, 404, 'School profile not found');
      }

      // Verify the ID matches
      if (existingProfile.id !== id) {
        return errorResponse(res, 404, 'School profile not found');
      }

      // Delete school profile from database
      await SchoolProfileModel.delete(id);

      // Delete logo file if exists
      if (existingProfile.logo) {
        const logoPath = path.join(__dirname, '../../', existingProfile.logo);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
      }

      return successResponse(res, 200, 'School profile deleted successfully');

    } catch (error) {
      console.error('Delete school profile error:', error);
      return errorResponse(res, 500, 'Failed to delete school profile', error.message);
    }
  }
}

module.exports = SchoolProfileController;
