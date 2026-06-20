const authPanel = document.getElementById('auth-panel');
const profilePanel = document.getElementById('profile-panel');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupButton = document.getElementById('signup-btn');
const loginButton = document.getElementById('login-btn');
const logoutButton = document.getElementById('logout-btn');
const messageEl = document.getElementById('message');
const welcomeMsg = document.getElementById('welcome-msg');

// Dashboard Elements
const mobileNumbersInput = document.getElementById('mobile-numbers');
const numberCountSpan = document.getElementById('number-count');
const tabButtons = document.querySelectorAll('.tab-btn');
const launchBtn = document.getElementById('launch-btn');
const previewBtn = document.getElementById('preview-btn');
const testBtn = document.getElementById('test-btn');
const messageTextInput = document.getElementById('message-text');

// WhatsApp Status Elements
const waStatusLabel = document.getElementById('wa-status');
const qrContainer = document.getElementById('qr-container');
const qrCodeImg = document.getElementById('qr-code');
const refreshWaBtn = document.getElementById('refresh-wa');

// Navigation
const navItems = document.querySelectorAll('.nav-item, .submenu-item');
const viewSections = document.querySelectorAll('.view-section');

const setMessage = (text, type = 'info') => {
  messageEl.textContent = text;
  messageEl.style.color = type === 'error' ? '#dc2626' : (type === 'success' ? '#059669' : '#111827');
  messageEl.style.backgroundColor = type === 'error' ? '#fee2e2' : (type === 'success' ? '#d1fae5' : 'transparent');
};

const showProfile = (user) => {
  if (!user) return;
  const name = user.email ? user.email.split('@')[0] : 'User';
  welcomeMsg.innerHTML = `Welcome, <strong>${name}</strong>`;
  document.body.classList.remove('auth-mode');
  authPanel.classList.add('hidden');
  profilePanel.classList.remove('hidden');
  checkWhatsAppStatus();
};

// WhatsApp Logic
const checkWhatsAppStatus = async () => {
  if (profilePanel.classList.contains('hidden')) return;
  try {
    const res = await fetch('/whatsapp/status');
    const data = await res.json();
    
    waStatusLabel.textContent = data.status.toUpperCase();
    
    if (data.status === 'qr' && data.qr) {
      qrContainer.classList.remove('hidden');
      qrCodeImg.src = data.qr;
      waStatusLabel.style.color = '#f59e0b'; // Amber
    } else if (data.status === 'ready') {
      qrContainer.classList.add('hidden');
      waStatusLabel.style.color = '#059669'; // Green
    } else {
      qrContainer.classList.add('hidden');
      waStatusLabel.style.color = '#ef4444'; // Red
    }
  } catch (err) {
    console.error('Status check failed', err);
  }
};

// Poll status every 5 seconds
setInterval(checkWhatsAppStatus, 5000);
refreshWaBtn.addEventListener('click', checkWhatsAppStatus);

// Navigation Logic
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    // If it's a submenu item, prevent bubbling to parent nav-item
    if (item.classList.contains('submenu-item')) {
      e.stopPropagation();
    }

    const view = item.dataset.view;
    
    // Toggle submenu if it has one
    if (item.classList.contains('has-submenu')) {
      item.classList.toggle('open');
      // If we clicked the parent and it has no view, don't try to switch views
      if (!view || view === 'whatsapp') {
          // If it just opened, maybe we want to show the first submenu item?
          // For now, just return to keep the current view
          return;
      }
    }

    if (!view) return;

    // Handle Active State
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    // Switch Views
    viewSections.forEach(section => section.classList.add('hidden'));
    const targetSection = document.getElementById(`${view}-view`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    if (view === 'reports') {
      loadReports();
    }
  });
});

// Quick Action Buttons Logic
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('sms')) {
      const campaignBtn = document.querySelector('.submenu-item[data-view="campaign"]');
      if (campaignBtn) campaignBtn.click();
    } else if (btn.classList.contains('api')) {
      alert("API settings coming soon!");
    } else {
      alert("This feature is coming soon!");
    }
  });
});

// Add Template Button Logic
const addTemplateBtn = document.querySelector('.btn-black');
if (addTemplateBtn) {
  addTemplateBtn.addEventListener('click', () => {
    alert("Add New Template feature is coming soon!");
  });
}

const loadReports = () => {
  const stored = localStorage.getItem('campaign_history');
  const campaigns = stored ? JSON.parse(stored) : [];
  const reportsBody = document.getElementById('reports-body');
  
  if (campaigns.length === 0) {
    reportsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No campaigns found.</td></tr>';
    return;
  }
  
  reportsBody.innerHTML = campaigns.map(c => `
    <tr>
      <td>${new Date(c.date).toLocaleString()}</td>
      <td title="${c.message}">${c.message}</td>
      <td>${c.total}</td>
      <td>${c.sent}</td>
      <td>${c.failed}</td>
      <td><span class="badge badge-success">COMPLETED</span></td>
    </tr>
  `).join('');
};

const saveCampaign = (campaign) => {
  const stored = localStorage.getItem('campaign_history');
  const history = stored ? JSON.parse(stored) : [];
  history.unshift(campaign);
  localStorage.setItem('campaign_history', JSON.stringify(history.slice(0, 50)));
};

// Dashboard Logic
const updateNumberCount = () => {
  const content = mobileNumbersInput.value.trim();
  const numbers = content ? content.split('\n').filter(n => n.trim() !== '') : [];
  numberCountSpan.textContent = numbers.length;
  tabButtons[0].textContent = `Copy/Paste (${numbers.length})`;
};

mobileNumbersInput.addEventListener('input', updateNumberCount);

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.tab !== 'paste') {
      alert(`Tab "${btn.dataset.tab}" is coming soon!`);
    }
  });
});

testBtn.addEventListener('click', async () => {
  const content = mobileNumbersInput.value.trim();
  const numbers = content ? content.split('\n').filter(n => n.trim() !== '') : [];
  const message = messageTextInput.value.trim();

  if (!message) {
    alert('Please enter message content.');
    return;
  }
  
  let targetNumber;
  if (numbers.length === 0) {
    targetNumber = prompt("Enter your personal WhatsApp number (with country code, e.g., 919876543210):");
    if (!targetNumber) return;
  } else {
    targetNumber = numbers[0].trim();
  }

  console.log(`Sending test message to ${targetNumber}...`);
  
  try {
    const res = await fetch('/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: targetNumber, message })
    });
    const result = await res.json();
    
    if (result.success) {
      alert(`Test message sent to ${targetNumber}!`);
    } else {
      alert(result.error || 'Failed to send message.');
    }
  } catch (err) {
    alert('Network error. Check if the server is running.');
  }
});

launchBtn.addEventListener('click', async () => {
  const content = mobileNumbersInput.value.trim();
  const numbers = content ? content.split('\n').filter(n => n.trim() !== '') : [];
  const message = messageTextInput.value.trim();

  if (numbers.length === 0) {
    alert('Please add at least one mobile number.');
    return;
  }
  if (!message) {
    alert('Please enter message content.');
    return;
  }

  if(!confirm(`Starting campaign for ${numbers.length} numbers. Continue?`)) return;
  
  let successCount = 0;
  for (const num of numbers) {
    try {
      const res = await fetch('/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num.trim(), message })
      });
      const data = await res.json();
      if (data.success) successCount++;
    } catch (err) {
      console.error(`Failed to send to ${num}`, err);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  saveCampaign({
    date: new Date().toISOString(),
    message: message,
    total: numbers.length,
    sent: successCount,
    failed: numbers.length - successCount
  });

  alert(`Campaign finished! Successfully sent: ${successCount}/${numbers.length}`);
});

previewBtn.addEventListener('click', () => {
  const msg = messageTextInput.value;
  if (!msg) {
    alert("Please enter a message first.");
    return;
  }
  alert(`Preview Message:\n\n${msg}`);
});

// Auth Logic
const fetchJson = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(path, { ...options, headers });
  return response.json();
};

const handleAuthResponse = async (result) => {
  if (result.error) {
    setMessage(result.error, 'error');
    return;
  }
  if (result.session && result.user) {
    localStorage.setItem('supabase_session', JSON.stringify(result.session));
    showProfile(result.user);
    setMessage('Logged in successfully.', 'success');
    return;
  }
  if (result.message) {
    setMessage(result.message, 'success');
  }
};

signupButton.addEventListener('click', async () => {
  setMessage('Signing up...');
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    setMessage('Email and password are required.', 'error');
    return;
  }
  const result = await fetchJson('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  handleAuthResponse(result);
});

loginButton.addEventListener('click', async () => {
  setMessage('Logging in...');
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    setMessage('Email and password are required.', 'error');
    return;
  }
  const result = await fetchJson('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  handleAuthResponse(result);
});

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('supabase_session');
  document.body.classList.add('auth-mode');
  authPanel.classList.remove('hidden');
  profilePanel.classList.add('hidden');
  setMessage('Logged out.', 'info');
});

const loadSession = async () => {
  const stored = localStorage.getItem('supabase_session');
  if (!stored) return;
  try {
    const session = JSON.parse(stored);
    if (session.user) {
        showProfile(session.user);
        setMessage('Session restored.', 'info');
        return;
    }
    const token = session.access_token;
    if (!token) return;
    const profile = await fetchJson('/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (profile.user) {
      showProfile(profile.user);
      setMessage('Session restored.', 'info');
    } else {
      localStorage.removeItem('supabase_session');
    }
  } catch (e) {
    console.error('Session load failed', e);
    localStorage.removeItem('supabase_session');
  }
};

loadSession();
