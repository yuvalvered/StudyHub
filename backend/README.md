# StudyHub Backend

Backend API for StudyHub - A platform for students to share study materials and get AI-powered learning assistance.

## 🚀 Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **AI**: OpenAI API + RAG (Retrieval Augmented Generation)
- **Vector Database**: ChromaDB
- **File Storage**: AWS S3 (or local for development)
- **Migrations**: Alembic

## 📁 Project Structure

```
backend/
├── app/
│   ├── core/              # Configuration, security, dependencies
│   ├── db/                # Database setup and initialization
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic schemas (validation)
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── middleware/        # Middleware (CORS, logging)
├── alembic/               # Database migrations
├── tests/                 # Unit and integration tests
├── uploads/               # Local file storage (development)
├── main.py                # Application entry point
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variables template
├── Dockerfile             # Docker configuration
└── docker-compose.yml     # Docker Compose setup
```

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Git

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StudyHub/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb studyhub

   # Or using psql
   psql -U postgres
   CREATE DATABASE studyhub;
   ```

6. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

7. **Run the application**
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

### Option 2: Docker Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StudyHub/backend
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

   The API will be available at: http://localhost:8000

## 📝 Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Security
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/studyhub

# AI
OPENAI_API_KEY=your-openai-api-key

# Email (for password reset)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 🗄️ Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback last migration:
```bash
alembic downgrade -1
```

## 🧪 Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/forgot-password` - Password reset

#### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/{id}` - Get user by ID

#### Materials
- `POST /api/v1/materials` - Upload material
- `GET /api/v1/materials` - List materials
- `GET /api/v1/materials/{id}` - Get material
- `GET /api/v1/materials/{id}/download` - Download material

#### AI
- `POST /api/v1/ai/ask` - Ask AI a question
- `POST /api/v1/ai/summarize` - Summarize document
- `POST /api/v1/ai/generate-questions` - Generate practice questions

## 🔧 Development

### Code Style

We use Black for code formatting:
```bash
black app/
```

Linting with flake8:
```bash
flake8 app/
```

## 📦 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Generate a strong `SECRET_KEY`
- [ ] Use production database (not local PostgreSQL)
- [ ] Configure AWS S3 for file storage
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Deployment Platforms

This app can be deployed to:
- **Railway** (recommended for MVP)
- **Render**
- **AWS** (EC2, ECS, or Elastic Beanstalk)
- **Heroku**
- **DigitalOcean App Platform**

## 🤝 Contributing

1. Create a new branch
2. Make your changes
3. Run tests
4. Submit a pull request

## 📄 License

[Add your license here]

## 👥 Team

StudyHub - Final Year Project

## 🐛 Known Issues

- [ ] AI endpoints not yet implemented
- [ ] File upload validation needs antivirus integration
- [ ] Rate limiting not yet implemented

## 📮 Contact

For questions or support, contact: [your-email]
