dev:
	docker compose -f docker/docker-compose.override.yml up --build

build:
	docker compose build

up:
	docker compose up -d

logs:
	docker compose logs -f

db-migrate:
	cd backend && npm run db:migrate

db-seed:
	cd backend && npm run db:seed
