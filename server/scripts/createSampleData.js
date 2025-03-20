require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Board = require('../models/Board');
const Folder = require('../models/Folder');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eternalfile')
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      // Get the demo user
      const demoUser = await User.findOne({ email: 'demo@example.com' });
      
      if (!demoUser) {
        throw new Error('Demo user not found. Please run createAdmin.js first.');
      }
      
      // Create folders if they don't exist
      const defaultFolder = await Folder.findOne({ 
        userId: demoUser._id, 
        name: 'My Boards',
        isDefault: true 
      });
      
      if (!defaultFolder) {
        const newDefaultFolder = new Folder({
          userId: demoUser._id,
          name: 'My Boards',
          description: 'Default folder for boards',
          isDefault: true,
          color: '#4299e1'
        });
        
        await newDefaultFolder.save();
        console.log('Default folder created');
      } else {
        console.log('Default folder already exists');
      }
      
      const projectsFolder = await Folder.findOne({ 
        userId: demoUser._id, 
        name: 'Projects' 
      });
      
      if (!projectsFolder) {
        const newProjectsFolder = new Folder({
          userId: demoUser._id,
          name: 'Projects',
          description: 'Project boards',
          color: '#f56565'
        });
        
        await newProjectsFolder.save();
        console.log('Projects folder created');
      } else {
        console.log('Projects folder already exists');
      }
      
      // Get the folders
      const folders = await Folder.find({ userId: demoUser._id });
      
      // Create boards if they don't exist
      const existingBoardsCount = await Board.countDocuments({ userId: demoUser._id });
      
      if (existingBoardsCount === 0) {
        // Sample boards
        const boards = [
          {
            userId: demoUser._id,
            title: 'Welcome Board',
            description: 'This is your first board',
            isPublic: true,
            folderId: folders.find(f => f.isDefault)._id,
            background: 'grid'
          },
          {
            userId: demoUser._id,
            title: 'Creative Ideas',
            description: 'A collection of creative ideas and inspirations',
            isPublic: false,
            folderId: folders.find(f => f.name === 'Projects')._id,
            background: 'dots'
          },
          {
            userId: demoUser._id,
            title: 'Project Planning',
            description: 'Planning board for upcoming projects',
            isPublic: false,
            folderId: folders.find(f => f.name === 'Projects')._id,
            background: 'lines'
          }
        ];
        
        for (const boardData of boards) {
          const board = new Board(boardData);
          await board.save();
        }
        
        console.log(`${boards.length} sample boards created`);
      } else {
        console.log(`${existingBoardsCount} boards already exist`);
      }
      
      console.log('Sample data creation completed successfully');
      
    } catch (error) {
      console.error('Error creating sample data:', error);
    } finally {
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 