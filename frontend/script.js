/* ============================================
   BHARATHIYA ART TECH EXPERTISM
   Main JavaScript — Client-Side Logic
   ============================================ */

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initStarCanvas();
    initNavbar();
    initSmoothScroll();
    initAOS();
    initForm();
    initPaymentRedirect();
    initScrollIndicator();
    initAdmin();
});

// ==================== STAR CANVAS BACKGROUND ====================
function initStarCanvas() {
    const canvas = document.getElementById('star-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let mouseX = 0;
    let mouseY = 0;
    let rotation = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Define some "Constellation Shapes" (relative offsets)
    const patterns = [
        [{x:0,y:0}, {x:40,y:60}, {x:100,y:30}, {x:150,y:80}], // W-shape
        [{x:0,y:0}, {x:60,y:-20}, {x:120,y:10}, {x:80,y:70}, {x:20,y:50}], // Pentagon-ish
        [{x:0,y:0}, {x:100,y:0}, {x:50,y:80}], // Triangle
        [{x:0,y:0}, {x:30,y:40}, {x:90,y:40}, {x:120,y:0}] // Trapezoid
    ];

    function createStars() {
        stars = [];
        // 1. Background Dust (Many small faint stars)
        for (let i = 0; i < 250; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 0.8 + 0.2,
                opacity: Math.random() * 0.4 + 0.1,
                twinkleSpeed: Math.random() * 0.01 + 0.005,
                twinklePhase: Math.random() * Math.PI * 2,
                parallaxFactor: 0.05,
                type: 'dust'
            });
        }

        // 2. Intentional Constellations
        for (let i = 0; i < 8; i++) {
            const baseX = Math.random() * canvas.width;
            const baseY = Math.random() * canvas.height;
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            const group = [];
            
            pattern.forEach(p => {
                const s = {
                    x: baseX + p.x,
                    y: baseY + p.y,
                    radius: Math.random() * 1.5 + 1.2,
                    opacity: Math.random() * 0.5 + 0.5,
                    twinkleSpeed: Math.random() * 0.02 + 0.01,
                    twinklePhase: Math.random() * Math.PI * 2,
                    parallaxFactor: 0.2,
                    type: 'node',
                    group: group // Reference to others in this constellation
                };
                group.push(s);
                stars.push(s);
            });
        }
    }

    function drawStars(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        rotation += 0.0001;

        const dx = (mouseX - centerX) * 0.03;
        const dy = (mouseY - centerY) * 0.03;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);

        // Pre-calculate positions
        const positions = stars.map(s => {
            const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase);
            const opacity = s.opacity * (0.6 + 0.4 * twinkle);
            return {
                ...s,
                px: s.x + dx * s.parallaxFactor,
                py: s.y + dy * s.parallaxFactor,
                currentOpacity: opacity
            };
        });

        // 1. Draw Constellation Lines (Only within groups)
        ctx.lineWidth = 0.8;
        positions.forEach(s => {
            if (s.type === 'node' && s.group) {
                s.group.forEach(other => {
                    if (other === s) return;
                    // Find actual screen position of other in the pre-calculated list
                    const oPos = positions.find(p => p.x === other.x && p.y === other.y);
                    if (!oPos) return;

                    const distSq = (s.px - oPos.px) ** 2 + (s.py - oPos.py) ** 2;
                    if (distSq < 40000) { // Limit line length
                        ctx.beginPath();
                        ctx.moveTo(s.px, s.py);
                        ctx.lineTo(oPos.px, oPos.py);
                        const lineOpacity = Math.min(s.currentOpacity, oPos.currentOpacity) * 0.3;
                        ctx.strokeStyle = `rgba(167, 139, 250, ${lineOpacity})`;
                        ctx.stroke();
                    }
                });
            }
        });

        // 2. Draw Stars
        positions.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.px, s.py, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${s.currentOpacity})`;
            ctx.fill();

            if (s.type === 'node') {
                // Glow
                const grad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, s.radius * 6);
                grad.addColorStop(0, `rgba(167, 139, 250, ${s.currentOpacity * 0.4})`);
                grad.addColorStop(1, 'rgba(167, 139, 250, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(s.px, s.py, s.radius * 6, 0, Math.PI * 2);
                ctx.fill();

                // Cross Flare Flare
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${s.currentOpacity * 0.3})`;
                ctx.lineWidth = 0.5;
                // Horizontal
                ctx.moveTo(s.px - s.radius * 10, s.py);
                ctx.lineTo(s.px + s.radius * 10, s.py);
                // Vertical
                ctx.moveTo(s.px, s.py - s.radius * 10);
                ctx.lineTo(s.px, s.py + s.radius * 10);
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    function animate(time) {
        drawStars(time);
        requestAnimationFrame(animate);
    }

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('resize', () => { resize(); createStars(); });

    resize();
    createStars();
    animate(0);
}

// ==================== NAVBAR ====================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// ==================== SMOOTH SCROLL ====================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const position = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: position, behavior: 'smooth' });
            }
        });
    });
}

// ==================== AOS ====================
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 80,
            delay: 0,
        });
    }
}

// ==================== SCROLL INDICATOR ====================
function initScrollIndicator() {
    const indicator = document.getElementById('scroll-indicator');
    if (indicator) {
        indicator.addEventListener('click', () => {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                const offset = 80;
                const position = aboutSection.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: position, behavior: 'smooth' });
            }
        });

        // Hide on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                indicator.style.opacity = '0';
                indicator.style.pointerEvents = 'none';
            } else {
                indicator.style.opacity = '1';
                indicator.style.pointerEvents = 'auto';
            }
        });
    }
}

// ==================== SANSKRIT NUMERAL CONVERSION ====================
const SANSKRIT_DIGITS = {
    '0': '\u0966',
    '1': '\u0967',
    '2': '\u0968',
    '3': '\u0969',
    '4': '\u096A',
    '5': '\u096B',
    '6': '\u096C',
    '7': '\u096D',
    '8': '\u096E',
    '9': '\u096F'
};

function toSanskritNumerals(num) {
    return String(num).split('').map(d => SANSKRIT_DIGITS[d] || d).join('');
}

function generateUniqueId() {
    // 6-digit random ID
    const id = Math.floor(100000 + Math.random() * 900000);
    return {
        numeric: id,
        sanskrit: toSanskritNumerals(id)
    };
}

// ==================== FORM HANDLING ====================
function initForm() {
    const form = document.getElementById('astrology-form');
    const submitBtn = document.getElementById('submit-btn');
    const resultSection = document.getElementById('result');
    const registerSection = document.getElementById('register');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear errors
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

        // Get values
        const name = document.getElementById('user-name').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const city = document.getElementById('user-city').value.trim();
        const email = document.getElementById('user-email').value.trim();

        // Validate
        let valid = true;

        if (!name) {
            document.getElementById('name-error').textContent = 'Please enter your name';
            valid = false;
        }
        if (!phone || !/^[0-9]{10}$/.test(phone)) {
            document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
            valid = false;
        }
        if (!city) {
            document.getElementById('city-error').textContent = 'Please enter your city';
            valid = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email-error').textContent = 'Please enter a valid email';
            valid = false;
        }

        if (!valid) return;

        // Show loading
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Simulate processing delay for UX
        await new Promise(resolve => setTimeout(resolve, 1800));

        // Generate ID
        const regId = generateUniqueId();

        // Store data
        window.reportData = {
            name,
            phone,
            city,
            email,
            regId
        };

        // Display result
        document.getElementById('sanskrit-id-display').textContent = regId.sanskrit;
        document.getElementById('numeric-id-display').textContent = '(' + regId.numeric + ')';

        const detailsHtml = `
            <p><span>Name</span><span>${escapeHtml(name)}</span></p>
            <p><span>Phone</span><span>${escapeHtml(phone)}</span></p>
            <p><span>City</span><span>${escapeHtml(city)}</span></p>
            <p><span>Mail ID</span><span>${escapeHtml(email)}</span></p>
            <p><span>Registration ID</span><span style="color: var(--accent-gold-light);">${regId.sanskrit}</span></p>
        `;
        document.getElementById('result-details').innerHTML = detailsHtml;

        // Show result section
        resultSection.style.display = 'block';

        // Reset button
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        // Scroll to result
        setTimeout(() => {
            const offset = 80;
            const position = resultSection.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: position, behavior: 'smooth' });
        }, 200);

        // Refresh AOS for new elements
        if (typeof AOS !== 'undefined') AOS.refresh();
    });

    // Generate another button
    const generateAnotherBtn = document.getElementById('generate-another-btn');
    if (generateAnotherBtn) {
        generateAnotherBtn.addEventListener('click', () => {
            resultSection.style.display = 'none';
            form.reset();
            const offset = 80;
            const position = registerSection.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: position, behavior: 'smooth' });
        });
    }
}

// (PDF generation logic completely removed in favor of image download)

// ==================== PAYMENT GATE REDIRECT ====================
function initPaymentRedirect() {
    const proceedBtn = document.getElementById('proceed-payment-btn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            if (!window.reportData) return;
            
            // Mark as pending
            const payload = {
                ...window.reportData,
                status: 'pending'
            };

            // Set button to loading
            const originalHtml = proceedBtn.innerHTML;
            proceedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Payment...';
            proceedBtn.style.pointerEvents = 'none';

            fetch('/api/save-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(() => {
                // Redirect to payment page passing the numeric ID
                window.location.href = '/payment.html?id=' + window.reportData.regId.numeric;
            }).catch(err => {
                console.error("Tracking Error:", err);
                // Redirect anyway if network failed but data exists
                window.location.href = '/payment.html?id=' + window.reportData.regId.numeric;
            });
        });
    }
}

// ==================== SECRET ADMIN DASHBOARD ====================
function initAdmin() {
    const trigger = document.getElementById('admin-trigger');
    const logoTrigger = document.getElementById('admin-logo-trigger');
    const overlay = document.getElementById('admin-overlay');
    const closeBtn = document.getElementById('admin-close');
    const clearAllBtn = document.getElementById('admin-clear-all');
    const tbody = document.getElementById('admin-table-body');
    let currentPassword = '';

    function renderTable(items) {
        tbody.innerHTML = '';
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:gray;padding:20px;">No purchases tracked yet.</td></tr>';
        } else {
            items.forEach((item, idx) => {
                const dateObj = new Date(item.timestamp);
                const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td><strong>${item.name}</strong></td>
                    <td class="admin-details-cell">Phone: ${item.phone || '-'}<br>City: ${item.city || '-'}<br>Email: ${item.email || '-'}</td>
                    <td style="font-family:'Noto Sans Devanagari', sans-serif; font-size: 1.2rem; color:var(--accent-gold);">${item.regId?.sanskrit || '-'}</td>
                    <td>${item.regId?.numeric || '-'}</td>
                    <td style="text-align:center;"><button class="admin-delete-btn" data-index="${idx}" title="Delete" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:5px 10px;border-radius:5px;cursor:pointer;font-size:0.8rem;"><i class="fas fa-trash"></i></button></td>
                `;
                tbody.appendChild(tr);
            });
            tbody.querySelectorAll('.admin-delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this entry?')) return;
                    try {
                        const res = await fetch('/api/admin/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: currentPassword, index: parseInt(btn.dataset.index) }) });
                        const result = await res.json();
                        if (result.success) { await refreshDashboard(); } else { alert('Delete failed.'); }
                    } catch (e) { alert('Error connecting to server.'); }
                });
            });
        }
    }

    async function refreshDashboard() {
        const res = await fetch('/api/admin/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: currentPassword }) });
        const data = await res.json();
        if (data.success) { renderTable(data.data); }
    }

    async function openAdminDashboard() {
        const pwd = prompt('Enter Admin Password:');
        if (!pwd) return;
        currentPassword = pwd;
        try {
            const res = await fetch('/api/admin/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) });
            const data = await res.json();
            if (data.success) { renderTable(data.data); overlay.style.display = 'flex'; }
            else { currentPassword = ''; alert('Access Denied: ' + (data.error || 'Incorrect Password')); }
        } catch (e) { alert('Error connecting to server.'); }
    }

    if (trigger) { trigger.addEventListener('click', openAdminDashboard); }
    if (logoTrigger) { logoTrigger.addEventListener('click', openAdminDashboard); }
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (!confirm('Delete ALL purchase records? This cannot be undone.')) return;
            try {
                const res = await fetch('/api/admin/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: currentPassword }) });
                const result = await res.json();
                if (result.success) { await refreshDashboard(); } else { alert('Clear failed.'); }
            } catch (e) { alert('Error connecting to server.'); }
        });
    }
    if (closeBtn && overlay) { closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; currentPassword = ''; }); }
}

// ==================== UTILITIES ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
}
