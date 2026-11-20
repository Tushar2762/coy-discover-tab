import { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Home,
  Heart,
  X,
  MapPin,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  BadgeCheck,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Send
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:5000';

function getHDPhoto(profile) {
  if (!profile) return '';
  const num = parseInt(String(profile.id).replace(/\D/g, ''), 10) || 1;
  const idx = Math.ceil(num / 2);
  const prefix = num % 2 === 1 ? 'girl' : 'boy';
  return `/photos/img/${prefix}${idx}.jpg`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [discoverView, setDiscoverView] = useState('swipe');
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMatchModal, setNewMatchModal] = useState(null);
  const [expandedProfile, setExpandedProfile] = useState(null);

  // Chat state for matched profiles
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('coy_match_chats') || '{}');
    } catch {
      return {};
    }
  });
  const [chatInput, setChatInput] = useState('');

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(null);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    localStorage.setItem('coy_match_chats', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (activeTab !== 'discover' || discoverView !== 'swipe' || newMatchModal || expandedProfile) return;
      if (e.key === 'ArrowRight') handleSwipe('like');
      if (e.key === 'ArrowLeft') handleSwipe('pass');
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [feedRes, matchesRes] = await Promise.all([
        fetch(`${API_BASE}/feed`),
        fetch(`${API_BASE}/matches`),
      ]);
      const feedData = await feedRes.json();
      const matchesData = await matchesRes.json();

      setProfiles(feedData.profiles || []);
      setMatches(matchesData.matches || []);
    } catch (err) {
      console.error('Error loading Coy Discover data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSwipe(direction) {
    if (profiles.length === 0 || exitDirection) return;

    const currentProfile = profiles.at(0);
    setExitDirection(direction);

    setTimeout(async () => {
      setProfiles((prev) => prev.slice(1));
      setExitDirection(null);
      setDragOffset({ x: 0, y: 0 });

      try {
        const res = await fetch(`${API_BASE}/swipe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: currentProfile.id,
            direction,
          }),
        });

        const data = await res.json();

        if (data.isMatch && data.matchedProfile) {
          setMatches((prev) => [...prev, data.matchedProfile]);
          setNewMatchModal(data.matchedProfile);
        }
      } catch (err) {
        console.error('Swipe request failed:', err);
      }
    }, 260);
  }

  async function handleDemoReset() {
    await fetch(`${API_BASE}/reset`, { method: 'POST' });
    setNewMatchModal(null);
    setExpandedProfile(null);
    setActiveChatUser(null);
    setChatHistory({});
    localStorage.removeItem('coy_match_chats');
    setDiscoverView('swipe');
    fetchInitialData();
  }

  function handleSendMessage(textToSend) {
    const text = (textToSend || chatInput).trim();
    if (!text || !activeChatUser) return;

    const userId = activeChatUser.id;
    const userName = activeChatUser.name.split(' ');
   const interest = activeChatUser.interests.at(0) || 'music';


    setChatHistory((prev) => ({
      ...prev,
      [userId]: [...(prev[userId] || []), { sender: 'me', text }]
    }));
    setChatInput('');

    setTimeout(() => {
      const replies = [
        `Hey! So glad we matched 😊 How's your day going?`,
        `Haha love that! Are you into ${interest} too?`,
        `That sounds awesome! Would love to chat more about it.`
      ];
      const replyText = replies[(chatHistory[userId]?.length || 0) % replies.length];
      setChatHistory((prev) => ({
        ...prev,
        [userId]: [...(prev[userId] || []), { sender: 'them', text: replyText }]
      }));
    }, 650);
  }

  function onPointerDown(e) {
    if (exitDirection) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = (e.clientY - startPos.current.y) * 0.25;
    setDragOffset({ x: dx, y: dy });
  }

  function onPointerUp() {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > 110) {
      handleSwipe('like');
    } else if (dragOffset.x < -110) {
      handleSwipe('pass');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }

  const currentCard = profiles.at(0);
  const nextCard = profiles.at(1);

  let cardTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`;
  let cardTransition = isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';

  if (exitDirection === 'like') {
    cardTransform = 'translate(500px, 40px) rotate(24deg)';
    cardTransition = 'transform 0.26s ease-in';
  } else if (exitDirection === 'pass') {
    cardTransform = 'translate(-500px, 40px) rotate(-24deg)';
    cardTransition = 'transform 0.26s ease-in';
  }

  const likeOpacity =
    exitDirection === 'like' ? 1 : Math.min(Math.max((dragOffset.x - 25) / 85, 0), 1);
  const passOpacity =
    exitDirection === 'pass' ? 1 : Math.min(Math.max((-dragOffset.x - 25) / 85, 0), 1);
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-logo">coy</div>

        {activeTab === 'discover' && (
          <div className="header-actions">
            <button
              className={`matches-pill ${discoverView === 'matches' ? 'active' : ''}`}
              onClick={() => {
                setActiveChatUser(null);
                setDiscoverView((prev) => (prev === 'matches' ? 'swipe' : 'matches'));
              }}
            >
              <Heart size={14} fill="currentColor" />
              <span>Matches ({matches.length})</span>
            </button>

            <button
              className="reset-btn"
              onClick={handleDemoReset}
              title="Reset Demo Swipes"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        )}
      </header>

      <main className="main-content">
        {activeTab === 'home' ? (
          <div className="home-blank">
            <h2>Home</h2>
            <p>
              This placeholder represents Coy’s existing Home screen. Switch to the Discover tab to explore profiles.
            </p>
            <button
              className="cta-discover-btn"
              onClick={() => setActiveTab('discover')}
            >
              Go to Discover
            </button>
          </div>
        ) : discoverView === 'matches' && activeChatUser ? (
          <div className="chat-view">
            <div className="chat-header">
              <button
                className="chat-back-btn"
                onClick={() => setActiveChatUser(null)}
              >
                <ArrowLeft size={18} />
              </button>
              <img
                src={getHDPhoto(activeChatUser)}
                alt={activeChatUser.name}
                className="chat-avatar"
              />
              <div>
                <div className="chat-user-name">{activeChatUser.name}</div>
                <div className="chat-user-sub">Matched • Online</div>
              </div>
            </div>

            <div className="chat-messages">
              {(chatHistory[activeChatUser.id] || []).length === 0 ? (
                <div className="chat-empty-hint">
                  <p>Say hi to <strong>{activeChatUser.name}</strong>! Pick an icebreaker below:</p>
                  <div className="icebreaker-chips">
                    <button
                      className="icebreaker-chip"
                      onClick={() => handleSendMessage('Hey! How is your week going? 👋')}
                    >
                      Hey! 👋
                    </button>
                    <button
                      className="icebreaker-chip"
                      onClick={() =>
                        handleSendMessage(`Fellow ${activeChatUser.interests.at(0) || 'coffee'} fan here!`)
                      }
                    >
                     Love {activeChatUser.interests.at(0) || 'your vibe'}!

                    </button>
                  </div>
                </div>
              ) : (
                (chatHistory[activeChatUser.id] || []).map((msg, i) => (
                  <div
                    key={i}
                    className={`msg-bubble ${msg.sender === 'me' ? 'msg-me' : 'msg-them'}`}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            <form
              className="chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                className="chat-input"
                placeholder={`Message ${activeChatUser.name.split(' ')}...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                <Send size={17} />
              </button>
            </form>
          </div>
        ) : discoverView === 'matches' ? (
          <div className="matches-view">
            <div className="matches-title">
              <span>Mutual Matches ({matches.length})</span>
              <button
                onClick={() => setDiscoverView('swipe')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e11d48',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back to Swipe
              </button>
            </div>

            {matches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Heart size={30} />
                </div>
                <h3>No matches yet</h3>
                <p>
                  Keep swiping in Discover! You’ll only see a match when both of you like each other.
                </p>
                <button
                  className="cta-discover-btn"
                  onClick={() => setDiscoverView('swipe')}
                >
                  Start Swiping
                </button>
              </div>
            ) : (
              <div className="matches-grid">
                {matches.map((match) => (
                  <div
                    className="match-card"
                    key={match.id}
                    onClick={() => setActiveChatUser(match)}
                  >
                    <img src={getHDPhoto(match)} alt={match.name} />
                    <div className="match-card-overlay">
                      <div className="match-card-name">
                        {match.name}, {match.age}
                      </div>
                      <div className="match-card-sub">Tap to message 💬</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="empty-state">
            <p>Loading profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckCircle2 size={32} />
            </div>
            <h3>You’re all caught up!</h3>
            <p>
              You’ve seen every profile in your area for now. Check your mutual matches or reset the demo feed.
            </p>
            <button className="cta-discover-btn" onClick={handleDemoReset}>
              Reset Demo Feed
            </button>
          </div>
        ) : (
          <>
            <div className="card-stack-wrapper">
              {nextCard && (
                <div className="swipe-card behind">
                  <img
                    src={getHDPhoto(nextCard)}
                    alt={nextCard.name}
                    className="card-image"
                  />
                  <div className="card-gradient" />
                </div>
              )}

              {currentCard && (
                <div
                  key={currentCard.id}
                  className="swipe-card"
                  style={{
                    transform: cardTransform,
                    transition: cardTransition,
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <img
                    src={getHDPhoto(currentCard)}
                    alt={currentCard.name}
                    className="card-image"
                  />
                  <div className="card-gradient" />

                  {likeOpacity > 0.05 && (
                    <div className="stamp stamp-like" style={{ opacity: likeOpacity }}>
                      LIKE
                    </div>
                  )}
                  {passOpacity > 0.05 && (
                    <div className="stamp stamp-pass" style={{ opacity: passOpacity }}>
                      NOPE
                    </div>
                  )}

                  <div className="card-info">
                    <div className="card-name-row">
                      <span className="card-name">{currentCard.name}</span>
                      <span className="card-age">{currentCard.age}</span>
                      <BadgeCheck size={20} color="#38bdf8" fill="rgba(56, 189, 248, 0.2)" />
                    </div>

                    <div className="card-location">
                      <MapPin size={14} />
                      <span>{currentCard.cityOrCollege}</span>
                    </div>

                    <p className="card-bio">{currentCard.bio}</p>

                    <div className="card-interests">
                      {currentCard.interests.map((tag) => (
                        <span className="interest-tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      className="info-expand-btn"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setExpandedProfile(currentCard)}
                      title="View Full Profile"
                    >
                      <ChevronUp size={22} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button
                className="action-btn btn-pass"
                onClick={() => handleSwipe('pass')}
                aria-label="Pass"
              >
                <X size={28} strokeWidth={2.8} />
              </button>

                            <button
                className="action-btn btn-like"
                onClick={() => handleSwipe('like')}
                aria-label="Like"
              >
                <Heart size={28} fill="currentColor" />
              </button>

            </div>
          </>
        )}
      </main>

      {expandedProfile && (
        <div className="drawer-backdrop" onClick={() => setExpandedProfile(null)}>
          <div className="profile-drawer" onClick={(e) => e.stopPropagation()}>
            <button
              className="drawer-close-btn"
              onClick={() => setExpandedProfile(null)}
            >
              <ChevronDown size={22} />
            </button>

            <img
              src={getHDPhoto(expandedProfile)}
              alt={expandedProfile.name}
              className="drawer-hero-img"
            />

            <div className="drawer-body">
              <div className="drawer-header">
                <span className="drawer-name">{expandedProfile.name}</span>
                <span className="drawer-age">{expandedProfile.age}</span>
                <BadgeCheck size={20} color="#38bdf8" fill="rgba(56, 189, 248, 0.2)" />
              </div>

              <div className="drawer-location">
                <MapPin size={15} />
                <span>{expandedProfile.cityOrCollege}</span>
              </div>

              <div className="drawer-section-title">About</div>
              <p className="drawer-bio">{expandedProfile.bio}</p>

              <div className="drawer-section-title">Interests</div>
              <div className="drawer-tags">
                {expandedProfile.interests.map((tag) => (
                  <span className="drawer-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="drawer-actions">
                <button
                  className="drawer-btn-pass"
                  onClick={() => {
                    setExpandedProfile(null);
                    handleSwipe('pass');
                  }}
                >
                  <X size={20} /> Pass
                </button>
                <button
                  className="drawer-btn-like"
                  onClick={() => {
                    setExpandedProfile(null);
                    handleSwipe('like');
                  }}
                >
                  <Heart size={20} fill="currentColor" /> Like
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {newMatchModal && (
        <div className="match-modal">
          <div className="match-badge">
            <Sparkles size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            Mutual Crush
          </div>
          <h2 className="match-headline">It’s a match!</h2>
          <p className="match-subtext">
            You and <strong>{newMatchModal.name}</strong> both liked each other.
          </p>

          <div className="match-avatar-ring">
            <img src={getHDPhoto(newMatchModal)} alt={newMatchModal.name} />
          </div>

          <button
            className="modal-primary-btn"
            onClick={() => {
              const matched = newMatchModal;
              setNewMatchModal(null);
              setDiscoverView('matches');
              setActiveChatUser(matched);
            }}
          >
            Send a Message 💬
          </button>

          <button
            className="modal-secondary-btn"
            onClick={() => setNewMatchModal(null)}
          >
            Keep Swiping
          </button>
        </div>
      )}

      <nav className="bottom-tabs">
        <button
          className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={22} />
          <span>Home</span>
        </button>

        <button
          className={`tab-item ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('discover');
            setDiscoverView('swipe');
            setActiveChatUser(null);
          }}
        >
          <Flame size={22} />
          <span>Discover</span>
        </button>
      </nav>
    </div>
  );
}

