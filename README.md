Shwe Kokko & Myawaddy Marketplace Bot
Telegram bot for hyper-local second-hand listings. Sellers fill a step-by-step form,
admins approve or reject in an admin chat, approved listings are posted to a channel.
Setup
Create a bot with @BotFather and copy the token.
Create an admin group and add the bot. Get its ID (e.g. via @RawDataBot or @getidsbot) – groups look like -100123….
Create your channel and add the bot as an administrator with "Post messages" permission.
Install and run:
    npm install
cp .env.example .env   # fill in BOT_TOKEN, ADMIN_CHAT_ID, CHANNEL_ID
npm start

Flow

/sell → name → category → location → price → condition → contact → photos → admin chat (Approve ✅ / Reject ❌) → channel
/cancel stops the form at any point.
Photos: 1–4. The bot submits automatically at 4, or when the seller taps Done.
The seller gets a private message when their listing is approved or rejected.
Deploy
Railway: New Project → Deploy from GitHub → add the 3 variables → done (start command: npm start).
Render: New Web Service (or Background Worker) → Build: npm install → Start: npm start → add the 3 variables.
On the free Web Service tier the app sleeps when idle; to keep it responsive, set WEBHOOK_DOMAIN=your-app.onrender.com (no https://) so Telegram wakes it with each update.
Notes
Pending listings are kept in memory and mirrored to data/submissions.json. On hosts with an ephemeral disk a redeploy clears them (old Approve buttons then say "Listing not found"). Attach a volume and set DATA_DIR, or swap src/store.js for a database.
All button labels, categories and locations are in src/constants.js; bot messages are in src/scenes/sellWizard.js.

Structure

src/
├── index.js               # bootstrap, launch
├── config.js              # dotenv + validation
├── constants.js           # categories, locations, limits
├── store.js               # pending-listing storage
├── scenes/sellWizard.js   # 7-step seller form
├── handlers/adminActions.js # Approve / Reject buttons
├── services/review.js     # send to admin chat / channel
└── utils/formatPost.js    # post text + hashtags
