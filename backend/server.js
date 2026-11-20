const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const PROFILES_PATH = path.join(__dirname, 'data', 'profiles.json');
const STATE_PATH = path.join(__dirname, 'data', 'state.json');

function getProfiles() {
  const raw = fs.readFileSync(PROFILES_PATH, 'utf-8');
  return JSON.parse(raw);
}

function getState() {
  if (!fs.existsSync(STATE_PATH)) {
    const initialState = { swipes: {}, matches: [] };
    fs.writeFileSync(STATE_PATH, JSON.stringify(initialState, null, 2));
    return initialState;
  }
  const raw = fs.readFileSync(STATE_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function sanitizeProfile(profile) {
  const { likedUser, gender, ...publicProfile } = profile;
  return publicProfile;
}

app.get('/feed', (req, res) => {
  try {
    const profiles = getProfiles();
    const state = getState();

    const unswipedProfiles = profiles
      .filter((profile) => !state.swipes[profile.id])
      .map(sanitizeProfile);

    res.json({ profiles: unswipedProfiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

app.post('/swipe', (req, res) => {
  try {
    const { profileId, direction } = req.body;

    if (!profileId || !['like', 'pass'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid profileId or direction' });
    }

    const profiles = getProfiles();
    const targetProfile = profiles.find((p) => p.id === profileId);

    if (!targetProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const state = getState();

    if (state.swipes[profileId]) {
      return res.status(400).json({ error: 'Already swiped on this profile' });
    }

    state.swipes[profileId] = {
      direction,
      timestamp: new Date().toISOString(),
    };

    let isMatch = false;
    let matchedProfile = null;

    if (direction === 'like' && targetProfile.likedUser === true) {
      isMatch = true;
      matchedProfile = sanitizeProfile(targetProfile);

      if (!state.matches.includes(profileId)) {
        state.matches.push(profileId);
      }
    }

    saveState(state);

    res.json({
      success: true,
      isMatch,
      matchedProfile,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process swipe' });
  }
});

app.get('/matches', (req, res) => {
  try {
    const profiles = getProfiles();
    const state = getState();

    const matchedProfiles = state.matches
      .map((matchId) => profiles.find((p) => p.id === matchId))
      .filter(Boolean)
      .map(sanitizeProfile);

    res.json({ matches: matchedProfiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load matches' });
  }
});

app.post('/reset', (req, res) => {
  try {
    const initialState = { swipes: {}, matches: [] };
    saveState(initialState);
    res.json({ success: true, message: 'Demo state reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset state' });
  }
});

app.listen(PORT, () => {
  console.log(`Coy Discover Backend running on http://localhost:${PORT}`);
});
