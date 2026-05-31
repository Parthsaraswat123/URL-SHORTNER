# Scalable URL Shortener Service

A highly performant and secure URL Shortener service built with **Node.js**, **Express**, **PostgreSQL**, and **Redis**. The project supports JWT authentication, detailed analytics tracking (clicks, devices, referrers), and asynchronous batch processing of URL shortening requests via CSV uploads.

---

## 🚀 Features

- **Secure Authentication**: User signup and login powered by bcrypt password hashing and JSON Web Tokens (JWT).
- **Efficient URL Shortening**: Generates unique, short codes mapping to long destination URLs.
- **Ultra-Fast Redirects**: Utilizes **Redis caching** to bypass PostgreSQL queries on frequent redirections.
- **Detailed Analytics**: Captures visitor metrics (click time, IP address, user-agent, and referrers) for each shortened link.
- **Bulk CSV Upload**: Allows users to upload a CSV file with multiple URLs for batch processing. Handles upload status and tracking via a background worker queue.
- **Standardized API Responses**: Standardized JSON response handler for consistency across all endpoints.

---

## 📁 Directory Structure

```text
URL-SHORTNER/src/
├── DatabaseConnection/
│   ├── postgresConnections.js  # PostgreSQL client connection pooling
│   └── redisConnection.js      # Redis client initialization for caching
├── Model/
│   ├── userModel.sql           # Schema definition for Users table
│   ├── urlModel.sql            # Schema definition for Short URLs table
│   ├── urlAnalyticsModel.sql   # Schema definition for Analytics tracking table
│   └── uploadJobs.sql          # Schema definition for Bulk Upload tracking table
├── controller/
│   ├── usercontroller.js       # Handles User registration and authentication logic
│   └── urlController.js        # Handles shortening, redirection, analytics, & bulk upload logic
├── fileUploader/
│   └── uploader.js             # Logic for processing/validating uploaded CSV files
├── helpers/
│   └── responseHandler.js      # Utility function to format API JSON responses
├── routes/
│   ├── userRoute.js            # Router defining endpoints for user management
│   └── urlRoute.js             # Router defining endpoints for URLs and analytics
├── uploads/                    # Directory where temporary CSV uploads are stored
├── utils/
│   ├── jwtToken.js             # JWT helper functions (sign, verify, middleware)
│   └── multer.js               # Multer configuration for file uploads
├── server.js                   # Application entry point (starts server and configures middleware)
└── README.md                   # Project documentation
```

---

## 🗄️ Database Schemas (PostgreSQL)

The system uses a relational database model in PostgreSQL. Below are the suggested SQL definitions for each of the model files:

### 1. User Schema (`Model/userModel.sql`)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. URL Schema (`Model/urlModel.sql`)
```sql
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_urls_short_code ON urls(short_code);
```

### 3. URL Analytics Schema (`Model/urlAnalyticsModel.sql`)
```sql
CREATE TABLE url_analytics (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT
);
CREATE INDEX idx_analytics_url_id ON url_analytics(url_id);
```

### 4. Upload Jobs Schema (`Model/uploadJobs.sql`)
```sql
CREATE TABLE upload_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    total_urls INTEGER DEFAULT 0,
    processed_urls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API Endpoints

### 🔐 Authentication (`routes/userRoute.js`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/signup` | Registers a new user account | No |
| `POST` | `/api/users/login` | Logs in and returns a JWT token | No |

### 🔗 URL Management & Analytics (`routes/urlRoute.js`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/urls/shorten` | Shortens a single URL | Yes (JWT) |
| `GET` | `/:code` | Redirects a short code to the original URL | No |
| `GET` | `/api/urls/analytics/:code` | Retrieves tracking analytics for a short URL | Yes (JWT) |
| `POST` | `/api/urls/upload` | Uploads a CSV file for bulk shortening | Yes (JWT) |
| `GET` | `/api/urls/upload/jobs` | Checks status of uploaded bulk jobs | Yes (JWT) |

---

## 🛠️ Setup and Installation

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v16+ recommended)
- **PostgreSQL**
- **Redis**

### 1. Clone the Repository
```bash
git clone https://github.com/Parthsaraswat123/URL-SHORTNER.git
cd URL-SHORTNER
```

### 2. Install Dependencies
Ensure you initialize your Node project and install the required NPM packages:
```bash
npm init -y
npm install express pg redis jsonwebtoken bcryptjs multer dotenv
npm install --save-dev nodemon
```

### 3. Environment Configuration
Create a `.env` file in the root of the project:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=url_shortener

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 4. Initialize Database
Execute the SQL files inside the `Model/` directory against your local PostgreSQL database:
```bash
psql -U your_db_user -d url_shortener -f Model/userModel.sql
psql -U your_db_user -d url_shortener -f Model/urlModel.sql
psql -U your_db_user -d url_shortener -f Model/urlAnalyticsModel.sql
psql -U your_db_user -d url_shortener -f Model/uploadJobs.sql
```

### 5. Running the Application

For development with hot-reloading:
```bash
npm run dev
```

For production:
```bash
npm start
```
