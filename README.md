# Overtime Salary Calculator

<p align="center">
  <img src="frontend/src/assets/logo.png" alt="Overtime Salary Calculator Logo" width="200"/>
</p>

![Overtime Calculator](https://img.shields.io/badge/Overtime-Calculator-blue)
![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A full-stack web application for calculating and managing overtime pay. This application helps users track their overtime hours and automatically calculates their overtime compensation based on their monthly salary.

## Features

- User authentication and authorization
- Monthly salary configuration
- Overtime hour tracking
- Automatic overtime pay calculation
- Group-based organization of overtime records
- Admin panel for user management
- Responsive web interface

## Tech Stack

### Frontend

- Vue.js 3
- Vue Router
- Vuex for state management
- Modern UI components

### Backend

- Node.js
- Express.js
- SQLite3 database
- JWT authentication
- RESTful API

### Infrastructure

- Docker containerization
- GitHub Actions for CI/CD
- Automated releases

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

## Getting Started

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/wulukewu/overtime-salary.git
cd overtime-salary
```

2. Set up the backend:

```bash
cd backend
npm install
```

3. Set up the frontend:

```bash
cd frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:

```
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your_jwt_secret
```

5. Start the development servers:

For backend:

```bash
cd backend
npm run dev
```

For frontend:

```bash
cd frontend
npm run serve
```

### Docker Deployment

1. Build and start the containers:

```bash
docker-compose up --build
```

The application will be available at:

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Project Structure

```
overtime-salary/
├── frontend/           # Vue.js frontend application
│   ├── src/           # Source files
│   ├── public/        # Static files
│   └── package.json   # Frontend dependencies
├── backend/           # Node.js backend application
│   ├── routes/        # API routes
│   ├── data/         # SQLite database files
│   └── package.json  # Backend dependencies
└── docker-compose.yml # Docker configuration
```

## API Documentation

The backend provides the following main endpoints:

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management endpoints
- `/api/overtime/*` - Overtime calculation endpoints
- `/api/groups/*` - Group management endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention
- XSS protection headers

## Support

For support, please open an issue in the GitHub repository.
