# Rounds Test Project

A marketing competition monitoring system that automatically captures screenshots of Google Play Store app listings at regular intervals.

## Prerequisites

- **Node.js** >= 20.11.0
- **npm** (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rounds-test
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browser binaries:
   ```bash
   cd server
   npx playwright install chromium
   cd ..
   ```

## Database Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

   This will:
   - Create the SQLite database file (`prisma/dev.db`)
   - Set up the `TrackedApp` and `Screenshot` tables
   - Generate the Prisma client

3. Return to the root directory:
   ```bash
   cd ..
   ```

## Configuration

### Server Configuration

1. Copy the environment template:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Edit `server/.env` if needed:
   - `DATABASE_URL`: SQLite database path (default: `file:./dev.db`)
   - `PORT`: Server port (default: `4000`)
   - `DISABLE_SCHEDULER`: Set to `"true"` to disable automatic periodic captures (default: `false`)

### Web Configuration

1. Copy the environment template:
   ```bash
   cd web
   cp .env.example .env
   ```

2. Edit `web/.env` if needed:
   - `VITE_API_BASE_URL`: API server URL (default: `http://localhost:4000`)

## Running the Application

### Development Mode (Recommended)

Run both server and web concurrently:

```bash
npm run dev
```

This will start:
- **Server**: `http://localhost:4000`
- **Web**: `http://localhost:5173`

### Run Services Individually

**Server only:**
```bash
npm run dev:server
```

**Web only:**
```bash
npm run dev:web
```

### Production Build

1. Build the server:
   ```bash
   cd server
   npm run build
   ```

2. Build the web app:
   ```bash
   cd web
   npm run build
   ```

3. Start the server:
   ```bash
   cd server
   npm start
   ```

## Usage Flow

1. **Add a Tracked App**:
   - Open the web interface at `http://localhost:5173`
   - Click "Add App" or use the add button
   - Enter:
     - **Name**: Display name for the app (optional)
     - **Package ID**: Google Play package ID (e.g., `com.example.app`)
     - **URL**: Full Google Play Store URL (e.g., `https://play.google.com/store/apps/details?id=com.example.app`)
     - **Capture Interval**: Minutes between automatic captures (optional, defaults to 60 minutes)
   - Click "Save"

2. **View Monitoring Page**:
   - Click on an app from the list to view its monitoring page
   - See the app's metadata (name, link, start time)
   - View the screenshot timeline (newest first)

3. **Manual Screenshot Capture**:
   - On the monitoring page, click "Capture Now"
   - Wait for the capture to complete
   - The new screenshot will appear at the top of the timeline

4. **Automatic Captures**:
   - The scheduler automatically captures screenshots based on each app's interval
   - Default interval: 60 minutes
   - Per-app intervals can be configured when adding/editing an app
   - Inactive apps are skipped

5. **Edit/Deactivate Apps**:
   - Click the edit icon on an app in the list
   - Modify the app details
   - To deactivate, click "Delete" (soft delete - sets `isActive=false`)

## Screenshot Storage

Screenshots are stored locally in the filesystem:

- **Location**: `server/storage/screenshots/`
- **Naming**: `{trackedAppId}_{timestamp}.png`
- **Access**: Screenshots are served via the API at `GET /api/screenshots/:id/file`

The storage directory is created automatically on first capture. Screenshots are not committed to git (see `.gitignore`).

## API Endpoints

### Apps

- `GET /api/apps` - List all active tracked apps
- `POST /api/apps` - Create a new tracked app
- `PUT /api/apps/:id` - Update an existing tracked app
- `DELETE /api/apps/:id` - Deactivate a tracked app (soft delete)
- `POST /api/apps/:id/capture` - Manually trigger a screenshot capture

### Screenshots

- `GET /api/apps/:id/screenshots?limit=10&cursor=...` - Get paginated screenshots for an app
- `GET /api/screenshots/:id/file` - Serve screenshot image file

### Health

- `GET /health` - Health check endpoint

## Known Limitations

1. **Single-tenant**: No user management or multi-tenant support
2. **Local storage only**: Screenshots are stored on the local filesystem
3. **SQLite database**: Suitable for development and small deployments; consider PostgreSQL for production
4. **Concurrency limits**: Manual captures have a concurrency limit to prevent resource exhaustion
5. **Playwright browser**: Requires Chromium browser binaries to be installed
6. **Timezone display**: All timestamps are displayed in GMT/UTC
7. **No image cleanup**: Old screenshots are not automatically deleted (manual cleanup required)

## Development

### Code Quality

- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Type check**: `npm run typecheck` (in each workspace)

### Project Structure

```
rounds-test/
├── server/           # Backend API service
│   ├── src/          # TypeScript source
│   ├── prisma/       # Database schema and migrations
│   └── storage/      # Screenshot storage
├── web/              # React frontend
│   └── src/          # React components and pages
└── package.json      # Root workspace configuration
```

## Troubleshooting

**Playwright browser not found:**
```bash
cd server
npx playwright install chromium
```

**Database migration errors:**
```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

**Port already in use:**
- Change `PORT` in `server/.env` to a different port
- Update `VITE_API_BASE_URL` in `web/.env` accordingly

**CORS errors:**
- Ensure `@fastify/cors` is installed and configured in `server/src/index.ts`
- Verify the API base URL matches the server URL
