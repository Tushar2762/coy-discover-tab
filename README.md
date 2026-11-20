# Coy SDE Intern Assignment - Discover Tab

This project is a mobile-first Discover tab built alongside Coy's existing flow. Users can view profiles, swipe right to Like or left to Pass, expand full profile details, and chat with mutual matches.

## What We Built

1. Privacy-First Matching System
The backend API (GET /feed) removes all private fields like likedUser and gender before sending data to the frontend. Because of this, the app never exposes who liked the user unless both users like each other.

2. Mutual Match Screen and Chat
When both users like each other, an "It's a match!" screen appears. All mutual matches are saved in the Matches section, where users can open a chat window and send messages.

3. Swipe Controls and Profile Details
The app includes 40 seeded profiles with high-resolution portraits, age, bio, college or city, and interests. Users can swipe using touch or mouse drag, desktop Pass and Like buttons, or keyboard Left and Right arrow keys. Tapping the up-arrow button on any card opens a bottom drawer with full profile details.

4. Persistent Storage and Reset
All swipes and matches are saved in backend/data/state.json so swiped profiles never appear again after refreshing the page. Once all 40 profiles are reviewed, a caught-up screen is shown along with a Reset button to restart the demo.

5. Navigation Structure
The bottom navigation bar has a blank placeholder Home tab and the functional Discover tab.

## Tech Stack

Frontend: React.js (Vite), CSS, Lucide Icons
Backend: Node.js, Express.js, CORS
Storage: JSON files (profiles.json and state.json)

## How to Run Locally

Step 1: Start the Backend
Open a terminal and run:
cd backend
npm install
node server.js

The backend server will run on http://localhost:5000.

Step 2: Start the Frontend
Open a second terminal and run:
cd frontend
npm install
npm run dev

Open http://localhost:5173 in your browser.
