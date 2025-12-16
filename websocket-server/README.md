# Helper: WebSocket Server Deployment

This folder contains the dedicated server needed for real-time collaboration.

## How to Deploy (Ranked by Easiest)

### Option 1: Render.com (Free Tier)
1.  Push your entire `code-collab` repository to GitHub.
2.  Go to [Render Dashboard](https://dashboard.render.com).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repo.
5.  **Critical Settings**:
    *   **Root Directory**: `websocket-server`  <-- IMPORTANT
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
    *   **Instance Type**: Free
6.  Click **Create Web Service**.
7.  Copy the URL they give you (e.g., `https://my-socket.onrender.com`).
8.  Change `https://` to `wss://` (e.g., `wss://my-socket.onrender.com`).
9.  Put that `wss://...` URL into your Frontend's `.env` or Vercel Environment Variables as `VITE_WEBSOCKET_URL`.

### Option 2: Railway.app (Trial/Paid)
1.  Create a new Service from GitHub Repo.
2.  Set **Root Directory** to `websocket-server`.
3.  Railway automatically detects the `package.json` and `npm start`.
4.  Generate a Domain.
5.  Use that domain with `wss://` prefix.
