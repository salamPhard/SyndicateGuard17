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

cd rate-limiting-service

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
RESEND_API_KEY=your_resend_api_key

Never commit your .env file to GitHub.

The actual .env file is ignored by .gitignore.

#####################################

▶️ RUNNING THE BACKEND

Development mode:

npm run dev

Or, depending on the scripts configured in package.json:

npm start

The backend will normally be available at:

http://localhost:5000

#######################################

🎨 FRONTEND SETUP

Open another terminal and go to the frontend directory:

cd frontend

Install dependencies:

npm install

Create:

frontend/.env

Example:

VITE_API_URL=http://localhost:5000

Do not commit the actual .env file.


################################################
🔐 Environment Variables

Environment variables contain configuration and sensitive information.

Backend
backend/.env

Example:

PORT=5000
MONGO_URI=
JWT_SECRET=
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

cd rate-limiting-service

git checkout main

git pull origin main

git checkout -b feature/my-feature

# Make your changes

git add .

git commit -m "Implement my feature"

git push -u origin feature/my-feature

Then create a Pull Request on GitHub.