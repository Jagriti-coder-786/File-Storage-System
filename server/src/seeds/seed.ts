import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { User } from '../models/User';
import { Folder } from '../models/Folder';
import { File } from '../models/File';
import { Activity } from '../models/Activity';
import { storageProvider } from '../services/storage';
import { getFileCategory } from '../utils/fileCategory';

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to database for seeding...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Create or update Admin
    let admin = await User.findOne({ email: 'admin@cloudvault.io' });
    if (!admin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash('Admin123!', salt);
      admin = await User.create({
        name: 'CloudVault Admin',
        email: 'admin@cloudvault.io',
        passwordHash,
        role: 'ADMIN',
        storageQuota: 5 * 1024 * 1024 * 1024, // 5 GB
      });
      console.log('👑 Admin user created: admin@cloudvault.io / Admin123!');
    } else {
      console.log('👑 Admin user already exists: admin@cloudvault.io');
    }

    // 2. Create or update Standard User
    let demoUser = await User.findOne({ email: 'user@cloudvault.io' });
    if (!demoUser) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash('Password123!', salt);
      demoUser = await User.create({
        name: 'Alex Mercer',
        email: 'user@cloudvault.io',
        passwordHash,
        role: 'USER',
        storageQuota: 1024 * 1024 * 1024, // 1 GB
      });
      console.log('👤 Demo user created: user@cloudvault.io / Password123!');
    } else {
      console.log('👤 Demo user already exists: user@cloudvault.io');
    }

    // 3. Create Sample Folders for Demo User if none exist
    const existingFolders = await Folder.countDocuments({ ownerId: demoUser._id, isDeleted: false });
    let docsFolder: any = null;
    let imagesFolder: any = null;
    let projectsFolder: any = null;

    if (existingFolders === 0) {
      docsFolder = await Folder.create({
        ownerId: demoUser._id,
        name: 'Documents',
        color: '#F5C542',
      });
      imagesFolder = await Folder.create({
        ownerId: demoUser._id,
        name: 'Branding & Assets',
        color: '#38BDF8',
      });
      projectsFolder = await Folder.create({
        ownerId: demoUser._id,
        name: 'Q3 Product Specs',
        color: '#34D399',
      });
      console.log('📁 Created starter folders.');
    } else {
      docsFolder = await Folder.findOne({ ownerId: demoUser._id, name: 'Documents' });
      imagesFolder = await Folder.findOne({ ownerId: demoUser._id, name: 'Branding & Assets' });
      projectsFolder = await Folder.findOne({ ownerId: demoUser._id, name: 'Q3 Product Specs' });
    }

    // 4. Create sample files if user has no files
    const existingFiles = await File.countDocuments({ ownerId: demoUser._id });
    if (existingFiles === 0) {
      const starterFiles = [
        {
          name: 'Welcome-to-CloudVault.txt',
          mimeType: 'text/plain',
          content: `Welcome to CloudVault! 🚀
Your files. Your cloud. Your control.

CloudVault provides military-grade security, lightning-fast uploads, instant previews, and seamless folder organization.
Key Features:
- Drag-and-drop multi-file uploads
- Real-time storage analytics & quotas
- Expiring shareable links
- Trash with full restore capability
- Built with high-contrast warm yellow & charcoal aesthetics.

Enjoy storing your files securely!`,
          folderId: null,
          isStarred: true,
        },
        {
          name: 'Product-Architecture.json',
          mimeType: 'application/json',
          content: JSON.stringify(
            {
              platform: 'CloudVault',
              version: '1.0.0',
              backend: {
                runtime: 'Node.js 22+',
                framework: 'Express + TypeScript',
                storage: 'Pluggable (Local / S3 / R2)',
                database: 'MongoDB',
              },
              frontend: {
                framework: 'React 18 + Vite',
                styling: 'Tailwind CSS',
                motion: 'Framer Motion',
                icons: 'Lucide React',
              },
            },
            null,
            2
          ),
          folderId: projectsFolder ? projectsFolder._id : null,
          isStarred: true,
        },
        {
          name: 'cloudvault-logo-banner.svg',
          mimeType: 'image/svg+xml',
          content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="100%" height="100%">
  <rect width="800" height="400" fill="#171717"/>
  <circle cx="400" cy="180" r="80" fill="#F5C542" opacity="0.15"/>
  <rect x="350" y="130" width="100" height="90" rx="16" fill="#F5C542"/>
  <path d="M380 130 V110 A20 20 0 0 1 420 110 V130" stroke="#F5C542" stroke-width="12" fill="none"/>
  <circle cx="400" cy="170" r="10" fill="#171717"/>
  <path d="M400 180 V195" stroke="#171717" stroke-width="8" stroke-linecap="round"/>
  <text x="400" y="280" fill="#FAFAF8" font-family="Inter, sans-serif" font-size="32" font-weight="bold" text-anchor="middle">CLOUDVAULT</text>
  <text x="400" y="320" fill="#A3A3A3" font-family="Inter, sans-serif" font-size="16" letter-spacing="2" text-anchor="middle">YOUR FILES. YOUR CLOUD. YOUR CONTROL.</text>
</svg>`,
          folderId: imagesFolder ? imagesFolder._id : null,
          isStarred: false,
        },
        {
          name: 'Executive-Summary.md',
          mimeType: 'text/markdown',
          content: `# CloudVault SaaS Platform Summary

### Overview
CloudVault solves the storage lock-in problem by giving organizations full ownership and control over their storage infrastructure while enjoying a consumer-grade user experience.

### Milestones
- [x] Zero-cost local storage driver
- [x] S3 & Cloudflare R2 object storage drivers
- [x] Interactive Recharts storage analytics
- [x] Role-based Administrator moderation portal
- [x] Responsive layout with warm yellow signature aesthetic
`,
          folderId: docsFolder ? docsFolder._id : null,
          isStarred: false,
        },
      ];

      let totalInitialBytes = 0;
      for (const item of starterFiles) {
        const buffer = Buffer.from(item.content, 'utf8');
        const ext = path.extname(item.name);
        const storageKey = `${demoUser._id}/${uuidv4()}${ext}`;
        const category = getFileCategory(item.mimeType, item.name);

        await storageProvider.upload(storageKey, buffer, item.mimeType);

        const newFile = await File.create({
          ownerId: demoUser._id,
          folderId: item.folderId,
          originalName: item.name,
          storedName: path.basename(storageKey),
          mimeType: item.mimeType,
          size: buffer.length,
          storageKey,
          category,
          isStarred: item.isStarred,
        });

        totalInitialBytes += buffer.length;

        await Activity.create({
          ownerId: demoUser._id,
          action: 'UPLOAD',
          targetType: 'file',
          targetId: newFile._id,
          targetName: newFile.originalName,
          metadata: { size: buffer.length, mimeType: item.mimeType },
        });
      }

      demoUser.storageUsed = totalInitialBytes;
      await demoUser.save();
      console.log('📄 Created sample files and uploaded mock data.');
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
