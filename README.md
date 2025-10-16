# RADIUS Multi-Tenant Admin Panel

Modern, containerized RADIUS authentication and management system with multi-tenant support, built with Node.js (Express) backend and Angular frontend.

## 🚀 Features

### Core Functionality
- **Multi-Tenant Architecture** - Complete tenant isolation with role-based access control (RBAC)
- **RADIUS Integration** - Full FreeRADIUS compatibility with radcheck, radreply, and radacct tables
- **User Management** - Comprehensive user lifecycle management with package assignments
- **NAS Device Management** - Manage Network Access Servers and Mikrotik routers
- **Session Monitoring** - Real-time session tracking and accounting
- **Package Management** - Define and assign internet packages with speed limits

### Advanced Features
- **IP Management** - Static and dynamic IP assignment with NAT support
- **Metro IP Pool** - Manage static, shared, and extra routed IP addresses
- **NAT Configuration** - Automatic NAT rule synchronization with Mikrotik devices
- **WebSocket Support** - Real-time traffic monitoring
- **JWT Authentication** - Secure token-based authentication
- **Permission System** - Granular permission control for different modules

## 🛠️ Technology Stack

### Backend
- Node.js 18 (Express.js)
- Sequelize ORM
- MySQL 8.0
- Redis (session storage)
- JWT authentication
- bcrypt encryption

### Frontend
- Angular 16+
- TypeScript
- RxJS
- Bootstrap 5 / AdminLTE
- Font Awesome

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)
- MySQL 8.0
- Redis 7

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ Disk Space

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd test_new1
```

### 2. Environment Setup
```bash
# Copy example environment file
cp env.example .env

# Edit .env with your secure values
nano .env
```

### 3. Start Services
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access Application
- **Web UI**: http://localhost
- **Direct Frontend**: http://localhost:4200
- **API**: http://localhost:3000/api
- **MySQL**: localhost:3306

### 5. Default Login
See `DEPLOYMENT.md` for default credentials (change immediately after first login!)

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[database/README.md](database/README.md)** - Database schema documentation
- **API Documentation** - Available at `/api/docs` (when running)

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Nginx     │────▶│   Frontend   │     │   Backend   │
│  (Port 80)  │     │  (Angular)   │◀────│  (Node.js)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                    ┌────────────────────────────┼────────────────┐
                    │                            │                │
              ┌─────▼─────┐              ┌──────▼──────┐   ┌────▼─────┐
              │   MySQL   │              │    Redis    │   │ Mikrotik │
              │  Database │              │   Session   │   │  Devices │
              └───────────┘              └─────────────┘   └──────────┘
```

## 📦 Project Structure

```
.
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── app.js       # Main application
│   │   ├── config/      # Configuration
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Auth & validation
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # API routes
│   │   ├── services/    # External services (Mikrotik)
│   │   └── websocket/   # WebSocket handlers
│   ├── Dockerfile
│   └── package.json
│
├── frontend/            # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/   # Page components
│   │   │   └── services/# API services
│   │   └── assets/      # Static assets
│   ├── Dockerfile
│   └── angular.json
│
├── database/            # Database initialization
│   ├── init.sql        # Schema & seed data
│   └── README.md       # Database docs
│
├── docker-compose.yml   # Docker orchestration
├── nginx.conf          # Nginx configuration
└── README.md           # This file
```

## 🔧 Configuration

### Environment Variables

Create `.env` file from `env.example`:
```bash
cp env.example .env
```

Key variables:
- `MYSQL_ROOT_PASSWORD` - MySQL root password
- `DB_PASSWORD` - Application database password
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed frontend origin

### Database Configuration

Database is automatically initialized on first run using `database/init.sql`.

To reset database:
```bash
docker-compose down -v
docker-compose up -d
```

## 🔐 Security

### Important Security Steps

1. **Change default passwords** immediately after deployment
2. **Generate strong JWT secret**: `openssl rand -base64 32`
3. **Use strong database passwords**: `openssl rand -base64 24`
4. **Update CORS settings** for production domain
5. **Enable HTTPS** in production (see DEPLOYMENT.md)
6. **Review and restrict** network access in docker-compose.yml
7. **Regular backups** of MySQL data

### Sensitive Files (Not in Git)

These files are ignored by git for security:
- `.env` - Environment variables
- `ADMIN_CREDENTIALS.txt` - Default credentials
- `ssl/*` - SSL certificates
- `*.pem`, `*.key` - Private keys

## 🛠️ Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Build for Production
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Database Schema

### Core Tables
- `tenants` - Multi-tenant isolation
- `members` - Admin users
- `roles`, `permissions` - RBAC system
- `packetsInfo` - Internet packages

### RADIUS Tables
- `radcheck` - User authentication
- `radreply` - Reply attributes (Framed-IP)
- `radacct` - Accounting/session records
- `radippool` - IP pool with NAT support

### Network Tables
- `nas` - NAS devices
- `routers` - Mikrotik devices
- `metroIP` - Static & shared public IPs
- `usersInfo` - Extended user information

See `database/README.md` for detailed schema documentation.

## 🐛 Troubleshooting

### Service Issues
```bash
# Check logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up -d --build [service-name]
```

### Database Issues
```bash
# Connect to MySQL
docker exec -it radius_mysql mysql -uroot -p

# Check database
docker exec radius_mysql mysql -uroot -p[password] -e "SHOW DATABASES;"
```

### Backend Issues
```bash
# View backend logs
docker logs radius_backend --tail 50

# Test API
curl http://localhost:3000/api/health
```

See `DEPLOYMENT.md` for more troubleshooting tips.

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/assign-ip` - Assign IP to user

### Members (Admin Users)
- `GET /api/members` - List members
- `POST /api/members` - Create member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Packages
- `GET /api/packages` - List packages
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### NAS Devices
- `GET /api/nas` - List NAS devices
- `POST /api/nas` - Create NAS device
- `PUT /api/nas/:id` - Update NAS device
- `DELETE /api/nas/:id` - Delete NAS device

See API documentation for complete endpoint list.

## 🤝 Contributing

This is a private project. For internal use only.

## 📄 License

Private/Proprietary - All rights reserved.

## 🆘 Support

For support and issues, contact the development team.

---

**⚠️ Security Notice**: This is a private project. Do not share credentials, database dumps, or configuration files publicly.

