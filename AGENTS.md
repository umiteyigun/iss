# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This is a RADIUS Multi-Tenant Admin Panel with a Node.js/Express backend and Angular 17 frontend, backed by MySQL 8.0 and Redis 7.

### Services

| Service | Port | How to run (dev) |
|---------|------|------------------|
| Backend | 3000 | `cd backend && npm run dev` |
| Frontend | 4200 | `cd frontend && npx ng serve --host 0.0.0.0` |
| MySQL 8.0 | 3306 | Docker container `radius_mysql` |
| Redis 7 | 6379 | Docker container `radius_redis` |

### Starting infrastructure (MySQL + Redis)
Docker is required. Start containers:
```
docker run -d --name radius_mysql -e MYSQL_ROOT_PASSWORD=321321 -e MYSQL_DATABASE=radius -e MYSQL_ROOT_HOST=% -p 3306:3306 -v /workspace/database/init.sql:/docker-entrypoint-initdb.d/init.sql mysql:8.0 --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

docker run -d --name radius_redis -p 6379:6379 redis:7-alpine
```

If containers already exist, start them with `docker start radius_mysql radius_redis`.

### Backend .env
The backend needs a `.env` file at `/workspace/backend/.env`. Key settings for local dev:
- `DB_HOST=localhost`, `DB_NAME=radius`, `DB_USER=root`, `DB_PASSWORD=321321`
- `REDIS_HOST=localhost`, `REDIS_PORT=6379`
- `NODE_ENV=development`
- `CORS_ORIGIN=http://localhost:4200`
- `JWT_SECRET` — any string for dev

### Important gotchas
- The backend uses `sequelize.sync({ alter: true })` in development mode, which auto-migrates the DB schema. The DB must have the `packetsInfo.name` column indexed (UNIQUE) for the `usersInfo.packet` foreign key to work. The `database/init.sql` does not include this index, so run: `docker exec radius_mysql mysql -uroot -p321321 -e "USE radius; ALTER TABLE packetsInfo ADD UNIQUE INDEX idx_name (name);"` after initial DB setup.
- The frontend proxies `/api` and `/ws` requests to `http://localhost:3000` via `proxy.conf.json` (configured in `angular.json`).
- Default admin login: username `admin`, password `admin123`.
- No ESLint/lint configuration exists in the project. Backend tests use Jest (`npm test`), frontend tests use Karma (`npx ng test`), but neither has test files currently.

### Database reset
To fully reset the database:
```
docker exec radius_mysql mysql -uroot -p321321 -e "DROP DATABASE IF EXISTS radius; SOURCE /docker-entrypoint-initdb.d/init.sql;"
docker exec radius_mysql mysql -uroot -p321321 -e "USE radius; ALTER TABLE packetsInfo ADD UNIQUE INDEX idx_name (name);"
```
