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

2. Install all dependencies:
   ```
   npm run install-all
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/spatial-image-board
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3004

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=your_bucket_region (e.g., us-east-1)
   AWS_S3_BUCKET_NAME=your_bucket_name
   ```

4. Create a `.env` file in the client directory:
   ```
   REACT_APP_API_URL=http://localhost:5001/api
   REACT_APP_SOCKET_URL=http://localhost:5001
   REACT_APP_NAME=EternalFile
   REACT_APP_ENV=development
   ```

## Running the Application

1. Start the development environment:
   ```
   npm start
   ```
   This will start both the server and client concurrently.

2. Open your browser and navigate to `http://localhost:3004`

## AWS S3 Integration

This application uses Amazon S3 for storing uploaded images. Here's how to set it up:

### 1. Create an AWS Account and S3 Bucket

1. Sign up for an AWS account at [aws.amazon.com](https://aws.amazon.com/) if you don't have one
2. Create an S3 bucket:
   - Go to the S3 service in the AWS Management Console
   - Click "Create bucket"
   - Choose a unique name (e.g., "eternalfile-images")
   - Select a region closest to your users
   - For testing, disable "Block all public access" (but configure properly for production)
   - Enable versioning if desired
   - Click "Create bucket"

### 2. Configure CORS for Your S3 Bucket

Add the following CORS configuration to allow uploads from your application:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3004", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Create IAM User for Application Access

1. Go to the IAM service in AWS Console
2. Create a new user with programmatic access
3. Create a policy with limited permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. Attach the policy to your user
5. Save the Access Key ID and Secret Access Key

## Deployment

### Docker Deployment

1. Build the Docker images:
   ```
   npm run docker-build
   ```

2. Start the containers:
   ```
   npm run docker-up
   ```

3. Stop the containers:
   ```
   npm run docker-down
   ```

### Heroku Deployment

1. Create a new Heroku app
   ```
   heroku create your-app-name
   ```

2. Add MongoDB add-on
   ```
   heroku addons:create mongodb
   ```

3. Set environment variables
   ```
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set AWS_ACCESS_KEY_ID=your_access_key_id
   heroku config:set AWS_SECRET_ACCESS_KEY=your_secret_access_key
   heroku config:set AWS_REGION=your_aws_region
   heroku config:set AWS_S3_BUCKET_NAME=your_bucket_name
   ```

4. Deploy to Heroku
   ```
   git push heroku main
   ```

### Manual Deployment

1. Build the client:
   ```
   npm run build
   ```

2. Set up environment variables on your server
   ```
   export NODE_ENV=production
   export PORT=5001
   export MONGODB_URI=your_mongodb_uri
   export JWT_SECRET=your_jwt_secret
   export AWS_ACCESS_KEY_ID=your_access_key_id
   export AWS_SECRET_ACCESS_KEY=your_secret_access_key
   export AWS_REGION=your_region
   export AWS_S3_BUCKET_NAME=your_bucket_name
   ```

3. Start the server:
   ```
   npm run deploy
   ```

## Release Checklist

Before releasing to production, ensure you've completed the following steps:

### Security
- [ ] All sensitive environment variables are properly set and not exposed
- [ ] JWT secret is a strong, randomly generated string
- [ ] AWS S3 bucket has proper access controls
- [ ] MongoDB connection uses authentication
- [ ] API endpoints have proper authentication and authorization
- [ ] CORS is configured correctly

### Performance
- [ ] Client bundle is optimized (run `npm run build` with production flag)
- [ ] Images are properly compressed before upload
- [ ] Requests are paginated where appropriate
- [ ] Server uses caching where appropriate

### Functionality
- [ ] User registration and login work correctly
- [ ] Image upload functionality works with AWS S3
- [ ] Drag and drop interface works smoothly
- [ ] AI image combination feature functions correctly
- [ ] Real-time updates via Socket.io are working
- [ ] All CRUD operations for boards, images, and folders work

### Monitoring
- [ ] Server logs are properly configured
- [ ] Error tracking is implemented (e.g., Sentry)
- [ ] Performance monitoring is set up

### Backup & Recovery
- [ ] Database backup strategy is in place
- [ ] Disaster recovery plan is documented

## Development

- The server runs on port 5001
- The client runs on port 3004
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

## Deployment Guide

### Prerequisites
- Docker and Docker Compose installed
- Git (for cloning the repository)

### Local Deployment with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eternalfile
   ```

2. **Set up environment variables**
   - Copy the example environment files:
     ```bash
     cp client/.env.production.example client/.env.production
     cp server/.env.production.example server/.env.production
     ```
   - Edit both files to set your configuration values

3. **Deploy with Docker Compose**
   - Use the deployment script:
     ```bash
     ./deploy.sh
     ```
   - Alternatively, run Docker Compose manually:
     ```bash
     docker-compose build
     docker-compose up -d
     ```

4. **Access the application**
   - Client: http://localhost:3004
   - Server API: http://localhost:5001/api
   - Health check: http://localhost:5001/api/health

### Production Deployment

For production deployment, follow these additional steps:

1. **Secure your environment variables**
   - Make sure to use strong, unique values for:
     - JWT_SECRET (for authentication)
     - MongoDB credentials
     - AWS S3 credentials (if using S3 storage)

2. **Set up proper domain names**
   - Update the CLIENT_URL in server/.env.production
   - Configure your web server or load balancer to route traffic

3. **Set up SSL/TLS**
   - Configure HTTPS for security
   - You can use a reverse proxy like Nginx or Traefik with Let's Encrypt

4. **Monitoring and logging**
   - Set up monitoring for both containers
   - Configure log aggregation for troubleshooting

5. **Backup strategy**
   - Configure regular backups for MongoDB data
   - Implement backup verification procedures

### Updating the Application

To update to a new version:

1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart containers:
   ```bash
   ./deploy.sh
   ```

### Troubleshooting

- **View logs:**
  ```bash
  docker-compose logs -f
  ```

- **Restart a specific service:**
  ```bash
  docker-compose restart client
  docker-compose restart server
  ```

- **Rebuild a specific service:**
  ```bash
  docker-compose build client
  docker-compose up -d client
  ```

- **Check container status:**
  ```bash
  docker-compose ps
  ``` 