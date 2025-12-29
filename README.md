# ClockWrk

A modern productivity app that helps users manage their time, organize tasks, track habits, set priorities, and stay on track.

## Features

- 📋 **Task Management** - Create, organize, and track tasks with priorities and due dates
- 🗓️ **Calendar View** - Visual calendar with drag-and-drop task scheduling
- 🎯 **Habit Tracking** - Build and maintain daily/weekly habits with streak tracking
- 🍅 **Pomodoro Timer** - Built-in focus timer with break management
- 📊 **Eisenhower Matrix** - Prioritize tasks using the urgent/important framework
- 🔐 **Secure Authentication** - Email/password, OTP, and OAuth (Google/GitHub)

## Tech Stack

### Backend
- **Java 21** with **Spring Boot 4.0**
- **PostgreSQL** database
- **JWT** for authentication
- **OAuth2** for social login
- **Spring Security** for authorization

### Frontend
- **Angular 21** with standalone components
- **TypeScript**
- **Angular CDK** for drag-and-drop
- **ngx-toastr** for notifications

## Getting Started

### Prerequisites
- Java 21+
- Node.js 20+
- PostgreSQL 15+
- Maven 3.9+

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clockwrk.git
cd clockwrk/backend
```

2. Create environment variables (or use `.env` file with a library like `dotenv-java`):

```bash
# Copy the example env file
cp .env.example .env

# Edit with your values
nano .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection URL
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `JWT_SECRET_KEY` - 256-bit secret key for JWT signing
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `MAIL_USERNAME` - Email address for sending OTPs
- `MAIL_PASSWORD` - Email app password

3. Run the application:
```bash
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:4200`

## Environment Configuration

### Development
- Frontend: `src/environments/environment.ts`
- Backend: `src/main/resources/application.properties` (uses environment variables)

### Production
- Frontend: `src/environments/environment.prod.ts`
- Backend: Set environment variables in your deployment platform

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/authenticate` - Login with email/password
- `POST /api/auth/otp/send` - Send OTP to email
- `POST /api/auth/otp/verify` - Verify OTP and login
- `POST /api/auth/verify-email` - Verify email after registration
- `POST /api/auth/refresh-token` - Refresh access token

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/calendar` - Get tasks for calendar view
- `PATCH /api/tasks/:id/reschedule` - Reschedule task

### Habits
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/toggle` - Toggle habit completion for a date
- `GET /api/habits/entries` - Get habit entries for date range

### User
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password

## Security

- All credentials are stored as environment variables
- Passwords are hashed with BCrypt
- JWT tokens for stateless authentication
- Automatic token refresh before expiration
- OTP generated with SecureRandom
- File upload validation (type, size)
- CORS configured for frontend origin

## Screenshots

<img width="476" height="710" alt="Mobile View" src="https://github.com/user-attachments/assets/c366d93c-df03-4edd-a000-890239088c19" />

<img width="1440" height="777" alt="Dashboard" src="https://github.com/user-attachments/assets/6ee193eb-e90f-4b67-af2a-2ea2e9bd2e19" />

<img width="1440" height="777" alt="Calendar" src="https://github.com/user-attachments/assets/b26e8b2b-8ae1-4ba9-97cd-f8ff767dc991" />

<img width="1440" height="777" alt="Habits" src="https://github.com/user-attachments/assets/0820dbe3-2bfd-4632-a13a-205e60c860bf" />

<img width="1440" height="777" alt="Focus Mode" src="https://github.com/user-attachments/assets/cb9e5e41-99b3-4b87-80fd-4cd8f3a64899" />

## License

MIT License - see LICENSE file for details.
