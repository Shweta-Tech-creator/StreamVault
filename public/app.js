// public/app.js - Frontend client-side logic
const API_BASE = '/api';

// State Management
let currentUser = JSON.parse(localStorage.getItem('streamvault_user')) || null;

// DOM Elements
const authTabLogin = document.getElementById('tab-login');
const authTabSignup = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const uploadForm = document.getElementById('upload-video-form');
const contactForm = document.getElementById('contact-form');

const totalUsersEl = document.getElementById('stat-total-users');
const totalVideosEl = document.getElementById('stat-total-videos');
const activeStreamsEl = document.getElementById('stat-active-streams');
const storageUsageEl = document.getElementById('stat-storage-usage');

const dbStatusBadge = document.getElementById('db-status-badge');
const usersTableBody = document.getElementById('users-table-body');
const videoGrid = document.getElementById('video-grid');

// Video Player Modal Elements
const playerModal = document.getElementById('player-modal');
const modalTitle = document.getElementById('modal-title');
const videoPlayer = document.getElementById('video-player');
const modalClose = document.getElementById('modal-close');

// Header Profile Area
const navProfileArea = document.getElementById('nav-profile-area');
const navLinks = document.getElementById('nav-links');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateAuthUI();
  fetchDashboardStats();
  fetchUsers();
  fetchVideos();
});

// Event Listeners Configuration
function setupEventListeners() {
  // Authentication tabs toggle
  if (authTabLogin && authTabSignup) {
    authTabLogin.addEventListener('click', () => switchAuthTab('login'));
    authTabSignup.addEventListener('click', () => switchAuthTab('signup'));
  }

  // Authentication Forms Submit
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Upload Video Form Submit
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUploadVideo);
  }

  // Contact Form Submit
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const msg = document.getElementById('contact-message').value;
      
      if (name && email && msg) {
        showToast(`Thank you, ${name}! Your inquiry has been received.`, 'success');
        contactForm.reset();
      } else {
        showToast('Please fill out all fields.', 'error');
      }
    });
  }

  // Modal Close Events
  if (modalClose) {
    modalClose.addEventListener('click', closeVideoModal);
  }
  window.addEventListener('click', (e) => {
    if (e.target === playerModal) {
      closeVideoModal();
    }
  });
}

// ==========================================
// AUTHENTICATION LOGIC & UI
// ==========================================

function switchAuthTab(tab) {
  if (tab === 'login') {
    authTabLogin.classList.add('active');
    authTabSignup.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
  } else {
    authTabSignup.classList.add('active');
    authTabLogin.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
  }
}

// Update UI based on User Login Status
function updateAuthUI() {
  if (currentUser) {
    // Hide auth section completely or show logged-in info in header
    navProfileArea.innerHTML = `
      <span class="user-badge">
        <i class="fas fa-user-circle"></i> Hi, ${currentUser.name} (${currentUser.subscription})
      </span>
      <button class="logout-btn" onclick="handleLogout()">Logout</button>
    `;
    
    // Auto-fill uploader name in video upload form
    const uploaderInput = document.getElementById('upload-uploader');
    if (uploaderInput) {
      uploaderInput.value = currentUser.name;
      uploaderInput.disabled = true;
    }
  } else {
    navProfileArea.innerHTML = `
      <a href="#auth" class="btn" style="padding: 8px 18px; font-size: 14px; box-shadow: none;">Login / Signup</a>
    `;
    const uploaderInput = document.getElementById('upload-uploader');
    if (uploaderInput) {
      uploaderInput.value = '';
      uploaderInput.disabled = false;
    }
  }
}

// Handle User Signup
async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const subscription = document.getElementById('signup-subscription').value;

  try {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, subscription })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    showToast('Account created successfully! Logging you in...', 'success');
    
    // Simulate automatic login on signup
    currentUser = { name, email, subscription };
    localStorage.setItem('streamvault_user', JSON.stringify(currentUser));
    
    signupForm.reset();
    updateAuthUI();
    
    // Refresh database statistics and user records
    fetchDashboardStats();
    fetchUsers();

    // Scroll to dashboard
    document.getElementById('dashboard').scrollIntoView();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle User Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    showToast('Login successful!', 'success');
    
    currentUser = data.user;
    localStorage.setItem('streamvault_user', JSON.stringify(currentUser));
    
    loginForm.reset();
    updateAuthUI();
    
    // Refresh stats
    fetchDashboardStats();

    // Scroll to video library or dashboard
    document.getElementById('dashboard').scrollIntoView();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle Logout
window.handleLogout = function() {
  localStorage.removeItem('streamvault_user');
  currentUser = null;
  updateAuthUI();
  showToast('Logged out successfully.', 'success');
};

// ==========================================
// DATA FETCHING & RENDERING
// ==========================================

// Fetch Dashboard Metrics
async function fetchDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/dashboard-stats`);
    const data = await res.json();
    
    if (data.success) {
      totalUsersEl.textContent = data.stats.totalUsers;
      totalVideosEl.textContent = data.stats.totalVideos;
      activeStreamsEl.textContent = data.stats.activeStreams;
      storageUsageEl.textContent = data.stats.storageUsage;

      // Update Database connectivity state badge
      if (data.isMock) {
        dbStatusBadge.innerHTML = `<span class="badge-mock"><i class="fas fa-triangle-exclamation"></i> Mock Database Active</span>`;
      } else {
        dbStatusBadge.innerHTML = `<span class="badge-connected"><i class="fas fa-database"></i> Connected to RDS MySQL</span>`;
      }
    }
  } catch (error) {
    console.error("Error fetching stats:", error.message);
  }
}

// Fetch and Render Users Table
async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/users`);
    const users = await res.json();

    usersTableBody.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      
      // Format registration date
      const regDate = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      row.innerHTML = `
        <td>${user.id}</td>
        <td style="font-weight: 600;">${user.name}</td>
        <td>${user.email}</td>
        <td><span class="sub-badge ${user.subscription.toLowerCase()}">${user.subscription}</span></td>
        <td style="color: #64748b;">${regDate}</td>
      `;
      usersTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
  }
}

// Fetch and Render Video Grid
async function fetchVideos() {
  try {
    const res = await fetch(`${API_BASE}/videos`);
    const videos = await res.json();

    videoGrid.innerHTML = '';
    
    if (videos.length === 0) {
      videoGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No videos available. Upload one below!</p>`;
      return;
    }

    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      // Determine size display
      const sizeDisplay = video.size_mb >= 1024 
        ? `${(video.size_mb / 1024).toFixed(2)} GB`
        : `${parseFloat(video.size_mb).toFixed(1)} MB`;

      // Extract a representative icon based on category
      let categoryIcon = 'fa-film';
      const cat = video.category.toLowerCase();
      if (cat.includes('sci-fi') || cat.includes('cgi')) categoryIcon = 'fa-rocket';
      else if (cat.includes('animation') || cat.includes('toon')) categoryIcon = 'fa-smile';
      else if (cat.includes('promo') || cat.includes('ad')) categoryIcon = 'fa-bullhorn';
      else if (cat.includes('fantasy') || cat.includes('magic')) categoryIcon = 'fa-wand-magic-sparkles';

      card.innerHTML = `
        <div class="thumbnail-container">
          <div class="thumbnail-bg"></div>
          <div class="thumbnail-overlay">
            <div class="play-btn-overlay" onclick="playVideo('${video.title.replace(/'/g, "\\'")}', '${video.url}')">
              <i class="fas fa-play"></i>
            </div>
          </div>
          <span style="position: absolute; bottom: 12px; left: 12px; z-index: 3; font-size: 24px; color: var(--primary);">
            <i class="fas ${categoryIcon}"></i>
          </span>
        </div>
        <div class="video-info">
          <span class="video-tag">${video.category}</span>
          <h4 class="video-title">${video.title}</h4>
          <div class="video-meta">
            <span><i class="fas fa-hdd"></i> ${sizeDisplay}</span>
            <span><i class="fas fa-user-circle"></i> ${video.uploaded_by}</span>
          </div>
          <button class="btn-watch" onclick="playVideo('${video.title.replace(/'/g, "\\'")}', '${video.url}')">
            <i class="fas fa-circle-play"></i> Stream Video
          </button>
        </div>
      `;
      videoGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching videos:", error.message);
  }
}

// Upload/Submit a New Video
async function handleUploadVideo(e) {
  e.preventDefault();
  const title = document.getElementById('upload-title').value;
  const category = document.getElementById('upload-category').value;
  const url = document.getElementById('upload-url').value;
  const sizeMb = document.getElementById('upload-size').value;
  const uploadedBy = currentUser ? currentUser.name : 'Guest Uploader';

  try {
    const res = await fetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, url, sizeMb, uploadedBy })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add video');

    showToast('Video added to library and cataloged in RDS Database!', 'success');
    uploadForm.reset();
    
    // Refresh stats & video library list
    fetchDashboardStats();
    fetchVideos();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==========================================
// VIDEO STREAM PLAYER MODAL LOGIC
// ==========================================

window.playVideo = function(title, url) {
  modalTitle.textContent = title;
  
  // Set video source
  videoPlayer.innerHTML = `<source src="${url}" type="video/mp4">`;
  
  // Open Modal
  playerModal.classList.add('active');
  
  // Load and play video
  videoPlayer.load();
  videoPlayer.play().catch(err => {
    console.log("Auto-play blocked, waiting for user interaction.", err);
  });
};

function closeVideoModal() {
  playerModal.classList.remove('active');
  // Pause playback and clear source to conserve bandwidth
  videoPlayer.pause();
  videoPlayer.innerHTML = '';
}

// ==========================================
// TOAST NOTIFICATION UTILITY
// ==========================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';

  toast.innerHTML = `
    <span class="toast-icon ${type}"><i class="fas ${icon}"></i></span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger Slide In
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  // Remove Toast after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
