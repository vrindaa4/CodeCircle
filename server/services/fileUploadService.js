const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class FileUploadService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch (error) {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      
      // Create subdirectories
      await fs.mkdir(path.join(this.uploadsDir, 'avatars'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'posts'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'teams'), { recursive: true });
    }
  }

  // Configure multer for memory storage
  getMulterConfig(destination = 'posts') {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow images and certain document types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|md/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images and documents are allowed.'));
        }
      }
    });
  }

  // Process and save uploaded file
  async processUpload(file, destination = 'posts', userId) {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}_${userId}${fileExtension}`;
    const filepath = path.join(this.uploadsDir, destination, filename);

    try {
      // If it's an image, optimize it
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
        await sharp(file.buffer)
          .resize(1200, 1200, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toFile(filepath);
      } else {
        // For non-images, save directly
        await fs.writeFile(filepath, file.buffer);
      }

      return {
        filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${destination}/${filename}`
      };
    } catch (error) {
      throw new Error(`Failed to process upload: ${error.message}`);
    }
  }

  // Process avatar upload with circular crop
  async processAvatarUpload(file, userId) {
    const filename = `avatar_${userId}_${Date.now()}.jpg`;
    const filepath = path.join(this.uploadsDir, 'avatars', filename);

    try {
      await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(filepath);

      return {
        filename,
        url: `/uploads/avatars/${filename}`
      };
    } catch (error) {
      throw new Error(`Failed to process avatar: ${error.message}`);
    }
  }

  // Delete file
  async deleteFile(filename, destination = 'posts') {
    try {
      const filepath = path.join(this.uploadsDir, destination, filename);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file info
  async getFileInfo(filename, destination = 'posts') {
    try {
      const filepath = path.join(this.uploadsDir, destination, filename);
      const stats = await fs.stat(filepath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return { exists: false };
    }
  }
}

module.exports = new FileUploadService();
