# Spatial Image Board

A vintage macOS-inspired web application for arranging and combining images with AI.

## Features

- Vintage macOS-inspired UI with draggable interface elements
- User authentication with "@username" format and GIF profile pictures
- Spatial canvas where users can freely arrange images
- AI-powered image combination feature that merges multiple images
- Real-time updates using Socket.io
- Folder organization system for images
- Public feed where admins can curate content

## Tech Stack

- **Frontend**: React, Redux Toolkit, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Image Storage**: AWS S3
- **Authentication**: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- AWS S3 bucket (for image storage)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/spatial-image-board.git
   cd spatial-image-board
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

4. Create a `.env` file in the server directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/spatial-image-board
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name

   # AI Service Configuration
   AI_SERVICE_URL=http://localhost:5001/combine
   AI_API_KEY=your_ai_service_api_key
   ```

## Running the Application

1. Start the server:
   ```
   cd server
   npm run dev
   ```

2. Start the client (in a new terminal):
   ```
   cd client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Development

- The server runs on port 5000
- The client runs on port 3000
- The client proxy is configured to forward API requests to the server

## Folder Structure

```
eternalfile/
├── client/                   # Frontend React application
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # React components
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # Page components
│       ├── services/         # API services
│       ├── store/            # Redux store
│       ├── styles/           # CSS/SCSS files
│       └── utils/            # Utility functions
├── server/                   # Backend Node.js application
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   └── utils/                # Utility functions
└── .env                      # Environment variables
```

## License

MIT 