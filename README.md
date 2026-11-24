# Study Support Requests API — ICT251 Activity 7

Mulungushi University | Student number: **202508154**

A standalone Express REST API using PostgreSQL. It follows the Activity 6 record contract and is designed to be connected to the Activity 6 frontend in Activity 8.

## Requirements
- Node.js 20 or later (active LTS recommended)
- npm
- PostgreSQL database

## 1. Install

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your PostgreSQL connection string. Example local database URL:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/study_support
```

If your hosted PostgreSQL provider requires SSL, set `DB_SSL=true`. Never commit `.env`.

## 2. Create the database and seed records

Create a PostgreSQL database named `study_support` (or use another name and update `.env`). Then run:

```bash
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/study_support" -f schema.sql
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/study_support" -f seed.sql
```

The schema creates the records table. The seed script inserts eight made-up examples only when the table is empty. Re-running it will not add another batch when records already exist.

## 3. Start the API

```bash
npm start
```

Open http://localhost:3000. The root page is the API guide. Check http://localhost:3000/health and http://localhost:3000/api/records.

## API contract

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | API guide |
| GET | `/health` | Database health check |
| GET | `/api/records` | List records |
| GET | `/api/records/:id` | Read one record |
| POST | `/api/records` | Create a record |
| PUT | `/api/records/:id` | Replace all editable fields |
| DELETE | `/api/records/:id` | Delete a record |

POST and PUT JSON body (do not send `id`):

```json
{
  "title": "Help with JavaScript arrays",
  "category": "Programming",
  "description": "I need help understanding array methods and iteration.",
  "status": "Pending"
}
```

Rules: title 3–80 characters; category 2–40; description 5–300; status must be exactly `Pending`, `In progress` or `Completed`. Text is trimmed before length checks. The database generates the ID. PUT replaces all four editable fields and does not create a missing record.

Success codes: GET/PUT/DELETE `200`; POST `201`. Errors: invalid input/ID/malformed JSON `400`; missing record or route `404`; unexpected server failure `500`; database health failure `503`. Errors return a JSON `message`.

## Test with curl

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/records
curl -X POST http://localhost:3000/api/records \
  -H 'Content-Type: application/json' \
  -d '{"title":"Help with JavaScript arrays","category":"Programming","description":"I need help understanding array methods and iteration.","status":"Pending"}'
```

Use the ID returned by POST to test GET `/api/records/ID`, PUT `/api/records/ID` and DELETE `/api/records/ID`. Test invalid bodies and an ID that does not exist too. After POST, restart the server and GET the same ID to verify persistence.

## Deploy to Render

1. Push this project to a GitHub repository. Include `package.json` and `package-lock.json`; do not upload `.env` or `node_modules`.
2. Create a persistent PostgreSQL database in Render (or another lecturer-approved PostgreSQL provider). Copy its **internal** database URL for a Render-hosted web service where available.
3. Create a Render **Web Service** connected to the repository. If this folder is nested in a larger repository, set the Root Directory to `activity7-backend`.
4. Set Build Command to `npm install` and Start Command to `npm start`.
5. Add environment variables in Render: `DATABASE_URL` (the hosted database URL), `DB_SSL=true` if required by your provider, and `CLIENT_ORIGINS` set to the exact Activity 6 Netlify origin (for example `https://your-site.netlify.app`). Do not include a trailing slash in the origin.
6. Deploy. Open the service's `/health` route. If the database is empty, run `schema.sql` and then `seed.sql` once against the hosted database using a PostgreSQL SQL client.
7. Test every CRUD route against the live HTTPS URL. Submit the base URL, not a route URL.

Render's local service filesystem is not persistent. Keep records in PostgreSQL. A free web service may sleep when idle; its first request can take time to start.

## Activity 8 note

The frontend should call this API using the exact record field names and routes above. The API is independent of browser storage and does not require the frontend to be open.
