# Human Resource Management System (HRMS) SaaS

A professional, full-stack HRMS solution built with the MERN stack (MongoDB, Express, React, Node.js) and integrated with AI capabilities.

## 🚀 Features
- **Employee Management**: Manage profiles, roles, and records.
- **Attendance & Leaves**: Track attendance and process leave requests.
- **Salary Management**: Generate and manage salary slips.
- **AI Integration**: AI-powered features for HR tasks.
- **Secure Authentication**: JWT-based secure login.

## 🛠 Tech Stack
- **Frontend**: React.js, Tailwind CSS (or Vanilla CSS)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI**: Groq AI API

## 📦 Deployment Guide

### Prerequisites
- MongoDB Atlas account
- Groq API Key
- Node.js installed

### Backend Setup
1. Navigate to the `backend` folder.
2. Create a `.env` file based on `.env.example`.
3. Run `npm install`.
4. Start the server with `npm start`.

### Frontend Setup
1. Navigate to the `frontend` folder.
2. Run `npm install`.
3. Set `REACT_APP_API_URL` in your environment (for production).
4. Run `npm run build`.

### Deploying to Render/Vercel
- **Backend**: Connect your GitHub repo, set the root directory to `backend`, and add your environment variables.
- **Frontend**: Connect your GitHub repo, set the root directory to `frontend`, and set the build command to `npm run build`.

## 📄 License
ISC
--
