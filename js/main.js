/**
 * E-Charge Finder - Main Application Logic
 * Sprint 1 / Version 0.1
 * * Handles:
 * PROJ-1: User Auth & Profile
 * PROJ-2: Station Data & Search
 * PROJ-3: Real-time Simulation
 */

const App = {
    // --- Data Store ---
    stations: [
        { id: 1, name: "Downtown SuperCharge", area: "Downtown", address: "101 Main St", type: "DC Fast", total: 10, available: 8 },
        { id: 2, name: "Mall Plaza EV", area: "Westside", address: "500 Shopping Blvd", type: "Level 2", total: 20, available: 15 },
        { id: 3, name: "City Park Charge", area: "Northside", address: "88 Park Ave", type: "Level 2", total: 6, available: 0 },
        { id: 4, name: "Tech Hub Station", area: "Tech District", address: "404 Innovation Dr", type: "DC Fast", total: 12, available: 5 },
        { id: 5, name: "Airport QuickStop", area: "Airport", address: "Terminal B Parking", type: "Supercharger", total: 50, available: 42 },
        { id: 6, name: "Suburban Library", area: "Eastside", address: "12 Library Ln", type: "Level 2", total: 4, available: 2 }
    ],

    // --- PROJ-1: User Management ---
    auth: {
        currentUser: null,

        init: function() {
            const userStr = localStorage.getItem('ecf_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
                App.ui.updateNavbar(true);
            } else {
                App.ui.updateNavbar(false);
            }
        },

        register: function(name, email, password) {
            // Get existing users or empty array
            const users = JSON.parse(localStorage.getItem('ecf_users') || "[]");
            
            // Validation
            if (users.find(u => u.email === email)) {
                return { success: false, message: "Email already registered." };
            }
            if (password.length < 6) {
                return { success: false, message: "Password must be at least 6 characters." };
            }

            // Save user
            const newUser = { name, email, password, phone: "", vehicle: "" };
            users.push(newUser);
            localStorage.setItem('ecf_users', JSON.stringify(users));
            return { success: true };
        },

        login: function(email, password) {
            const users = JSON.parse(localStorage.getItem('ecf_users') || "[]");
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                this.currentUser = user;
                localStorage.setItem('ecf_user', JSON.stringify(user));
                return { success: true };
            }
            return { success: false, message: "Invalid email or password." };
        },

        logout: function() {
            this.currentUser = null;
            localStorage.removeItem('ecf_user');
            window.location.href = 'index.html';
        },

        updateProfile: function(updatedData) {
            if (!this.currentUser) return;
            
            // Merge data
            const updatedUser = { ...this.currentUser, ...updatedData };
            this.currentUser = updatedUser;
            
            // Update session
            localStorage.setItem('ecf_user', JSON.stringify(updatedUser));
            
            // Update in users database
            let users = JSON.parse(localStorage.getItem('ecf_users') || "[]");
            users = users.map(u => u.email === updatedUser.email ? updatedUser : u);
            localStorage.setItem('ecf_users', JSON.stringify(users));
            
            return true;
        }
    },

    // --- PROJ-2: Station Search & Render ---
    stationsLogic: {
        render: function(stationList) {
            const grid = document.getElementById('stations-grid');
            if (!grid) return;

            grid.innerHTML = ''; // Clear current

            if (stationList.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666;">No stations found in this area.</div>';
                return;
            }

            stationList.forEach(station => {
                const percent = Math.round((station.available / station.total) * 100);
                let colorStatus = 'bg-green';
                let textStatus = 'status-green';
                
                if (percent < 15) { colorStatus = 'bg-red'; textStatus = 'status-red'; }
                else if (percent < 50) { colorStatus = 'bg-yellow'; textStatus = 'status-yellow'; }

                const card = document.createElement('div');
                card.className = 'station-card';
                card.innerHTML = `
                    <div class="card-header">
                        <span class="station-type">${station.type}</span>
                        <span style="font-size: 0.8rem; color: #666;">${station.area}</span>
                    </div>
                    <div class="card-body">
                        <h3 class="station-name">${station.name}</h3>
                        <p class="station-location"><i class="fas fa-map-marker-alt"></i> ${station.address}</p>
                        
                        <div class="availability-container">
                            <div class="availability-header">
                                <span>Availability</span>
                                <span class="${textStatus} id="avail-text-${station.id}">
                                    <strong>${station.available}</strong> / ${station.total}
                                </span>
                            </div>
                            <div class="progress-bar">
                                <div id="bar-${station.id}" class="progress-fill ${colorStatus}" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        },

        filter: function(query) {
            const term = query.toLowerCase();
            const filtered = App.stations.filter(s => 
                s.name.toLowerCase().includes(term) || 
                s.area.toLowerCase().includes(term) ||
                s.address.toLowerCase().includes(term)
            );
            this.render(filtered);
        }
    },

    // --- PROJ-3: Real-Time Simulation ---
    simulation: {
        start: function() {
            // Update every 3 seconds
            setInterval(() => {
                App.stations.forEach(station => {
                    // Randomly add or subtract 1 car, but keep within bounds
                    const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                    let newVal = station.available + change;
                    if (newVal < 0) newVal = 0;
                    if (newVal > station.total) newVal = station.total;
                    station.available = newVal;
                });
                
                // Re-render only if we are on the home page with the grid
                if (document.getElementById('stations-grid')) {
                    // Note: In a full React app we'd update state. 
                    // Here we'll just re-trigger the search to repaint the current view.
                    const searchInput = document.getElementById('search-input');
                    const query = searchInput ? searchInput.value : '';
                    App.stationsLogic.filter(query);
                }
            }, 3000);
        }
    },

    // --- UI Helpers ---
    ui: {
        updateNavbar: function(isLoggedIn) {
            const guestNav = document.getElementById('nav-guest');
            const userNav = document.getElementById('nav-user');
            
            if (isLoggedIn) {
                if(guestNav) guestNav.style.display = 'none';
                if(userNav) userNav.style.display = 'flex';
                
                // Set name in nav
                const nameEl = document.getElementById('user-name-display');
                if(nameEl && App.auth.currentUser) nameEl.textContent = App.auth.currentUser.name;
            } else {
                if(guestNav) guestNav.style.display = 'flex';
                if(userNav) userNav.style.display = 'none';
            }
        }
    }
};

// --- Initialization & Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    App.auth.init();

    // 1. Homepage Logic
    if (document.getElementById('home-page')) {
        App.stationsLogic.render(App.stations);
        App.simulation.start();

        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            App.stationsLogic.filter(e.target.value);
        });
    }

    // 2. Login Page Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const result = App.auth.login(email, password);

            if (result.success) {
                window.location.href = 'index.html';
            } else {
                const err = document.getElementById('login-error');
                err.textContent = result.message;
                err.style.display = 'block';
            }
        });
    }

    // 3. Register Page Logic
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = App.auth.register(name, email, password);

            if (result.success) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                const err = document.getElementById('register-error');
                err.textContent = result.message;
                err.style.display = 'block';
            }
        });
    }

    // 4. Profile Page Logic
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        // Redirect if not logged in
        if (!App.auth.currentUser) {
            window.location.href = 'login.html';
        } else {
            // Fill form
            document.getElementById('p-name').value = App.auth.currentUser.name;
            document.getElementById('p-email').value = App.auth.currentUser.email;
            document.getElementById('p-phone').value = App.auth.currentUser.phone || '';
            document.getElementById('p-vehicle').value = App.auth.currentUser.vehicle || '';

            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const updated = {
                    name: document.getElementById('p-name').value,
                    phone: document.getElementById('p-phone').value,
                    vehicle: document.getElementById('p-vehicle').value
                };
                App.auth.updateProfile(updated);
                alert('Profile updated successfully!');
            });
        }
    }

    // Logout Listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            App.auth.logout();
        });
    }
});