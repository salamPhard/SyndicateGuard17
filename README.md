# SyndicateGuard17
An API Rate Limiting and Traffic Control Service developed by Hajime Backend Syndicate XVII

A rate limiting service built with Express.js, MongoDB, and React.

The purpose of this project is to build a reusable rate limiting service that can control the number of requests a client can make within a defined time window.

The project contains both the backend API and frontend interface in a single repository.

###############################################

🚀 Getting Started
1. Clone the Repository

Clone the repository to your local machine:

git clone https://github.com/salamPhard/SyndicateGuard17.git

Then enter the project:

cd SyndicateGuard17

Before making changes, create a working branch from the latest `main` branch. Do not commit directly to `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/describe-your-change
```

Replace `feature/describe-your-change` with a short, descriptive branch name.

###############################################

🌿 BRANCHING STRATEGY

The main branch is the primary branch.

Important

Do not work directly on main.

Each developer should create their own branch before making changes.

Create a branch:

git checkout -b your-name

Example:

git checkout -b abdusalaam

You can also create a feature-specific branch:

git checkout -b feature/rate-limit-controller

or:

git checkout -b feature/frontend-dashboard
Check your current branch
git branch

The branch with * is your current branch.

########################################

🔄 KEEPING YOUR BRANCH UPDATED

Before starting new work, make sure your local main is up to date:

git checkout main
git pull origin main

Then return to your branch:

git checkout your-name

Merge the latest changes from main into your branch:

git merge main

Resolve any conflicts if necessary.

###########################################

📤 PUSHING YOUR WORK

After making your changes:

git add .

Commit your changes:

git commit -m "Describe your changes"

Push your branch:

git push origin your-name

For a new branch being pushed for the first time:

git push -u origin your-name

#######################################

🔀 PULL REQUESTS

When your work is ready:

Push your branch to GitHub.
Open a Pull Request from your branch into main.
Clearly describe what you changed.
Request a review from another team member.
Address review comments if necessary.
Once approved, merge the Pull Request into main.
Pull Request Example
feature/rate-limit-controller
              ↓
            main

Avoid pushing unfinished or experimental code directly to main.

###########################################

⚙️ BACKEND SETUP

Go into the backend directory:

cd backend

Install dependencies:

npm install

Create your environment file:

backend/.env

Use the example environment file as a guide:

cp .env.example .env

On Windows, you can simply create .env manually and copy the required variables from .env.example.

Example:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
SUPERUSER_EMAIL=your_superuser_email
SUPERUSER_PASSWORD=your_superuser_password
RESEND_API_KEY=your_resend_api_key

Never commit your .env file to GitHub.

The actual .env file is ignored by .gitignore.

#####################################

▶️ RUNNING THE BACKEND

Development mode:

```bash
npm run dev
```

The backend will normally be available at `http://localhost:5000`. Keep this terminal open while developing.

🎨 FRONTEND SETUP

Open another terminal and go to the frontend directory:

```bash
cd frontend
npm install
```

Create:

frontend/.env

Set the API URL to the backend address:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend from the `frontend` directory in a separate terminal:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Required developer setup for the expected result

Follow every step below. Skipping configuration or running only one part of the project can prevent the application from working as expected.

1. Install a supported Node.js version and make sure MongoDB is available, either locally or through a MongoDB service.
2. In `backend`, run `npm install`. Copy `.env.example` to `.env` and set a reachable `MONGO_URI`, a private `JWT_SECRET`, and the superuser credentials `SUPERUSER_EMAIL` and `SUPERUSER_PASSWORD`. Do not use real production credentials in local development.
3. In `frontend`, run `npm install` and set `VITE_API_URL` in `frontend/.env` to the backend URL. The frontend URL and backend URL must match the addresses where the two services are running.
4. Start the backend with `npm run dev` from `backend`, then start the frontend with `npm run dev` from `frontend`. Keep both terminals running.
5. Open the Vite URL in a browser. Register a regular account to test user features, or sign in at `/admin` using the superuser credentials from `backend/.env`.
6. Before submitting code changes, run `npm run lint` and `npm run build` from `frontend`, and verify the feature manually in the browser. Push your feature branch and open a pull request into `main`.

When setup is correct, the browser should load the React application, user registration and login should communicate with the backend, and the dashboards should load data from MongoDB. Admin login requires the configured superuser credentials. Never commit `.env` files, credentials, database connection strings, or tokens.

Do not commit the actual .env file.

👤 USER DASHBOARD

After logging in, select Continue in the login information dialog to open the user dashboard. Users can view their current package, submit Pro or Enterprise upgrade requests for admin approval, and update their contact details. Administrators can review pending requests from the Admin control center.

The admin dashboard lists active and deactivated accounts, lets admins create regular user accounts, deactivate/reactivate accounts, assign Pro or Enterprise packages, and see per-user daily API request usage. Authenticated user profile and upgrade-request API calls count toward each user's daily allowance: Free users get 5 requests, Pro users get 50, and Enterprise users are unlimited. Usage is stored per user and resets at midnight UTC. Admin endpoints are not counted against user allowances. Admin-created accounts receive the selected package; public registration always creates a regular Free account. Admin accounts must be provisioned separately.

To sign in to the admin dashboard, use the credentials configured by `SUPERUSER_EMAIL` and `SUPERUSER_PASSWORD` in `backend/.env`. These are checked by the backend and must never be added to frontend environment variables or committed to source control.

### Admin dashboard data and session troubleshooting

After signing in, the dashboard loads user accounts and package-upgrade requests from the backend. It refreshes this data periodically, and the **Refresh requests** button can be used to request the latest users and upgrade requests immediately. The user table includes each account's package, active status, and API request usage for the current UTC day.

If the dashboard says it cannot load users or upgrade requests:

1. Confirm that the backend is running and connected to the MongoDB database configured by `MONGO_URI`.
2. Confirm that `VITE_API_URL` in `frontend/.env` points to that backend, then restart the frontend if the environment file changed.
3. If the admin session has expired or the saved token is invalid, the dashboard clears that session and returns to the superuser sign-in form. Sign in again with the `SUPERUSER_EMAIL` and `SUPERUSER_PASSWORD` configured in `backend/.env`.
4. If access is denied after signing in, verify that the backend is running the expected version and that the superuser environment variables and `JWT_SECRET` are configured correctly. Never put these credentials in frontend configuration.

################################################
🔐 Environment Variables

Environment variables contain configuration and sensitive information.

Backend
backend/.env

Example:

PORT=5000
MONGO_URI=
JWT_SECRET=
SUPERUSER_EMAIL=
SUPERUSER_PASSWORD=
RESEND_API_KEY=   #This is for the email stufff
Frontend
frontend/.env

Example:

VITE_API_URL=http://localhost:5000
Important

Never commit:

.env

API keys, passwords, database credentials, JWT secrets, and other sensitive information must not be pushed to GitHub.

Use .env.example to show other developers which variables they need.


📄 License

This project is currently being developed as a collaborative project.

👨‍💻 Contributors

Contributors will be added as the project progresses.

⭐ Project Goal

The goal of this project is to understand and implement a practical rate limiting service, including client identification, request tracking, time windows, request limits, authentication, API responses, and eventually scalable approaches such as Redis-based rate limiting.

📌 Recommended Workflow

A typical development workflow is:

1. Clone repository
        ↓
2. Checkout main
        ↓
3. Pull latest changes
        ↓
4. Create your branch
        ↓
5. Develop
        ↓
6. Test
        ↓
7. Commit
        ↓
8. Push branch
        ↓
9. Create Pull Request
        ↓
10. Code review
        ↓
11. Merge into main

Example:

git clone https://github.com/salamPhard/SyndicateGuard17.git

cd SyndicateGuard17

git checkout main

git pull origin main

git checkout -b feature/my-feature

# Make your changes

git add .

git commit -m "Implement my feature"

git push -u origin feature/my-feature

Then create a Pull Request on GitHub.