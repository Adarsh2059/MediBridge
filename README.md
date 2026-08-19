# MediBridge

AI-powered healthcare appointment and follow-up management platform.

## Project Overview

MediBridge is a full-stack healthcare platform designed to connect patients, doctors, and administrators through a centralized appointment and follow-up management system.

The platform focuses on appointment scheduling, doctor availability, AI-assisted summaries, notifications, medication reminders, and calendar integration.

## Project Status

Phase 1 - Project Initialization

## Planned Features

### Patient
- Register and login
- Search doctors
- View available appointment slots
- Book appointments
- Submit symptoms
- View AI-generated pre-visit summary
- View appointment history
- View post-visit summary
- Receive medication reminders

### Doctor
- Secure login
- Manage profile
- Configure working hours
- View appointments
- View patient symptoms
- View AI pre-visit summaries
- Add clinical notes and prescriptions
- Generate patient-friendly post-visit summaries
- Manage leave

### Admin
- Manage doctors
- Manage doctor profiles
- Configure working hours
- Configure slot duration
- Manage doctor leave
- Monitor appointments

### Platform
- Role-based access control
- Double-booking prevention
- Slot hold mechanism
- AI symptom analysis
- AI post-visit summaries
- Email notifications
- Email retry mechanism
- Medication reminders
- Google Calendar integration
- Background jobs

## Tech Stack

### Frontend
- React
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### AI
- LLM API

### Integrations
- Email service
- Google Calendar API

## Architecture

```text
React Frontend
      |
      | HTTP/REST
      v
Express Backend
      |
      v
MongoDB

## Authentication

MediBridge uses JWT-based authentication with role-based access control.

### Supported Roles

- Patient
- Doctor
- Admin

### Authentication APIs

| Method | Endpoint | Authentication |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Required |

### Registration

Public registration creates patient accounts.

Doctor and admin accounts are controlled through authorized administrative workflows.

### Authentication Header

Protected endpoints use:

```text
Authorization: Bearer <JWT>