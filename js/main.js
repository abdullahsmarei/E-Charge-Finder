/**
 * E-Charge Finder - Main Application Logic
 * Merged Sprint 1 + Sprint 2 / Version 0.2+
 * Features:
 *   - User auth & profile (register, login, update, logout)
 *   - Station search + advanced filters (type, price, speed)
 *   - Real-time availability simulation
 *   - Favorites (heart icon)
 *   - Charging history display on profile
 */

const App = {
    // ────────────────────────────────────────────────
    // Data Store
    // ────────────────────────────────────────────────
    stations: [
        { id: 1, name: "Downtown SuperCharge", area: "Downtown", address: "101 Main St", type: "Supercharger", speed: 250, price: 0.45, dist: 1.2, total: 10, available: 8 },
        { id: 2, name: "Mall Plaza EV", area: "Westside", address: "500 Shopping Blvd", type: "Level 2", speed: 11, price: 0.25, dist: 3.5, total: 20, available: 15 },
        { id: 3, name: "City Park Charge", area: "Northside", address: "88 Park Ave", type: "Level 2", speed: 7, price: 0.15, dist: 0.8, total: 6, available: 0 },
        { id: 4, name: "Tech Hub Station", area: "Tech District", address: "404 Innovation Dr", type: "DC Fast", speed: 50, price: 0.35, dist: 2.1, total: 12, available: 5 },
        { id: 5, name: "Airport QuickStop", area: "Airport", address: "Terminal B Parking", type: "Supercharger", speed: 150, price: 0.55, dist: 12.0, total: 50, available: 42 },
        { id: 6, name: "Eastside Library", area: "Eastside", address: "12 Library Ln", type: "Level 2", speed: 11, price: 0.20, dist: 4.2, total: 4, available: 2 }
    ],

    // ────────────────────────────────────────────────
    // State
    // ────────────────────────────────────────────────
    state: {
        filters: {
            query: '',
            types: [],
            maxPrice: 1.0,
            minSpeed: 0
        },
        userFavorites: JSON.parse(localStorage.getItem('ecf_favorites') || '[]'),
        chargingHistory: [
            { id: 101, station: "Downtown SuperCharge", date: "2025-12-10", cost: 12.50, kwh: 28 },
            { id: 102, station: "Tech Hub Station", date: "2025-11-28", cost: 8.20, kwh: 21 },
            { id: 103, station: "Airport QuickStop", date: "2025-10-15", cost: 19.80, kwh: 36 }
        ]
    },

    // ────────────────────────────────────────────────
    // Authentication
    // ────────────────────────────────────────────────
    auth: {
        currentUser: null,

        init() {
            const userStr = localStorage.getItem('ecf_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
                App.ui.updateNavbar(true);
            } else {
                App.ui.updateNavbar(false);
            }
        },

        register(name, email, password) {
            const users = JSON.parse(localStorage.getItem('ecf_users') || '[]');

            if (users.some(u => u.email === email)) {
                return { success: false, message: "Email already registered." };
            }
            if (password.length < 6) {
                return { success: false, message: "Password must be at least 6 characters." };
            }

            const newUser = { name, email, password, phone: '', vehicle: '' };
            users.push(newUser);
            localStorage.setItem('ecf_users', JSON.stringify(users));

            return { success: true };
        },

        login(email, password) {
            const users = JSON.parse(localStorage.getItem('ecf_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                this.currentUser = user;
                localStorage.setItem('ecf_user', JSON.stringify(user));
                return { success: true };
            }
            return { success: false, message: "Invalid email or password." };
        },

        logout() {
            this.currentUser = null;
            localStorage.removeItem('ecf_user');
            window.location.href = 'index.html';
        },

        updateProfile(updatedData) {
            if (!this.currentUser) return false;
            const updatedUser = { ...this.currentUser, ...updatedData };
            this.currentUser = updatedUser;

            localStorage.setItem('ecf_user', JSON.stringify(updatedUser));

            // Update in users array
            let users = JSON.parse(localStorage.getItem('ecf_users') || '[]');
            users = users.map(u => u.email === updatedUser.email ? updatedUser : u);
            localStorage.setItem('ecf_users', JSON.stringify(users));

            return true;
        }
    },

    // ────────────────────────────────────────────────
    // Stations & Filtering Logic
    // ────────────────────────────────────────────────
    stationsLogic: {
        getFiltered() {
            return App.stations.filter(s => {
                const q = App.state.filters.query.toLowerCase();
                const matchesQuery = !q || 
                    s.name.toLowerCase().includes(q) || 
                    s.area.toLowerCase().includes(q) ||
                    s.address.toLowerCase().includes(q);

                const matchesType = App.state.filters.types.length === 0 || App.state.filters.types.includes(s.type);
                const matchesPrice = s.price <= App.state.filters.maxPrice;
                const matchesSpeed = s.speed >= App.state.filters.minSpeed;

                return matchesQuery && matchesType && matchesPrice && matchesSpeed;
            });
        },

        render(containerId = 'stations-grid', stations = null) {
            const grid = document.getElementById(containerId);
            if (!grid) return;

            const data = stations || this.getFiltered();

            grid.innerHTML = data.length === 0 
                ? '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#666;">No stations match your criteria.</div>'
                : '';

            data.forEach(s => {
                const percent = Math.round((s.available / s.total) * 100);
                let statusColor = 'var(--primary-color)';
                if (percent <= 10) statusColor = 'var(--danger-color)';
                else if (percent <= 50) statusColor = '#f59e0b';

                const isFavorite = App.state.userFavorites.includes(s.id);

                const card = document.createElement('div');
                card.className = 'station-card';
                card.innerHTML = `
                    <div class="card-top">
                        <span class="station-type ${s.type.toLowerCase().replace(' ', '-')}">${s.type}</span>
                        <button class="fav-btn ${isFavorite ? 'active' : ''}" 
                                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                                onclick="App.stationsLogic.toggleFavorite(${s.id})">
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                    <div class="station-info">
                        <h3 class="station-name">${s.name}</h3>
                        <p class="station-location">
                            <i class="fas fa-map-marker-alt"></i> ${s.address} • ${s.dist} km
                        </p>
                        <div class="station-specs">
                            <span><strong>${s.speed} kW</strong></span>
                            <span> • </span>
                            <span><strong>$${s.price.toFixed(2)}/kWh</strong></span>
                        </div>
                    </div>
                    <div class="availability-container">
                        <div class="availability-header">
                            <span>Availability</span>
                            <span style="color:${statusColor}">
                                <span class="status-dot" style="background:${statusColor}"></span>
                                ${s.available} / ${s.total}
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percent}%; background: ${statusColor};"></div>
                        </div>
                    </div>
                    <button class="btn btn-primary start-charge-btn" style="width:100%; margin-top:1rem;">
                        Start Charging
                    </button>
                `;
                grid.appendChild(card);
            });
        },

        toggleFavorite(id) {
            if (!App.auth.currentUser) {
                alert("Please log in to save favorites.");
                window.location.href = 'login.html';
                return;
            }

            if (App.state.userFavorites.includes(id)) {
                App.state.userFavorites = App.state.userFavorites.filter(fid => fid !== id);
            } else {
                App.state.userFavorites.push(id);
            }

            localStorage.setItem('ecf_favorites', JSON.stringify(App.state.userFavorites));
            this.render();  // refresh current view

            // If we're on profile page → refresh favorites grid too
            if (document.getElementById('favorites-grid')) {
                App.ui.loadProfileData();
            }
        }
    },

    // ────────────────────────────────────────────────
    // Real-time Simulation
    // ────────────────────────────────────────────────
    simulation: {
        start() {
            setInterval(() => {
                App.stations.forEach(s => {
                    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                    s.available = Math.max(0, Math.min(s.total, s.available + change));
                });

                // Re-render only if we're showing the station grid
                if (document.getElementById('stations-grid')) {
                    App.stationsLogic.render();
                }
            }, 4000);  // every 4 seconds
        }
    },

    // ────────────────────────────────────────────────
    // UI Helpers
    // ────────────────────────────────────────────────
    ui: {
        updateNavbar(isLoggedIn) {
            const guest = document.getElementById('nav-guest');
            const user = document.getElementById('nav-user');

            if (guest && user) {
                guest.style.display = isLoggedIn ? 'none' : 'flex';
                user.style.display = isLoggedIn ? 'flex' : 'none';

                if (isLoggedIn && App.auth.currentUser) {
                    const nameEl = document.getElementById('user-name-display');
                    if (nameEl) nameEl.textContent = App.auth.currentUser.name;
                }
            }
        },

        loadProfileData() {
            if (!App.auth.currentUser) return;

            // Basic info
            const nameEl = document.getElementById('display-name') || document.getElementById('p-name');
            const emailEl = document.getElementById('display-email');
            const vehicleEl = document.getElementById('p-vehicle');

            if (nameEl) nameEl.value = nameEl.textContent = App.auth.currentUser.name;
            if (emailEl) emailEl.textContent = App.auth.currentUser.email;
            if (vehicleEl) vehicleEl.value = App.auth.currentUser.vehicle || '';

            // Charging history
            const historyList = document.getElementById('history-list');
            if (historyList) {
                historyList.innerHTML = App.state.chargingHistory.map(h => `
                    <li class="history-item">
                        <div>
                            <strong>${h.station}</strong><br>
                            <small>${h.date} • ${h.kwh} kWh</small>
                        </div>
                        <div style="font-weight:700; color:var(--primary-color);">$${h.cost.toFixed(2)}</div>
                    </li>
                `).join('');
            }

            // Favorites
            const favGrid = document.getElementById('favorites-grid');
            if (favGrid) {
                const favStations = App.stations.filter(s => App.state.userFavorites.includes(s.id));
                App.stationsLogic.render('favorites-grid', favStations);
            }
        }
    }
};

// ────────────────────────────────────────────────
// Initialization & Event Listeners
// ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    App.auth.init();

    // ── Home / Stations Page ───────────────────────────────
    if (document.getElementById('home-page') || document.getElementById('stations-grid')) {
        App.stationsLogic.render();
        App.simulation.start();

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                App.state.filters.query = e.target.value;
                App.stationsLogic.render();
            });
        }

        // Charger type checkboxes
        document.querySelectorAll('.filter-type').forEach(cb => {
            cb.addEventListener('change', () => {
                App.state.filters.types = Array.from(document.querySelectorAll('.filter-type:checked'))
                    .map(c => c.value);
                App.stationsLogic.render();
            });
        });

        // Price slider
        const priceSlider = document.getElementById('filter-price');
        if (priceSlider) {
            priceSlider.addEventListener('input', e => {
                App.state.filters.maxPrice = parseFloat(e.target.value);
                document.getElementById('price-val').textContent = `$${e.target.value}`;
                App.stationsLogic.render();
            });
        }

        // Speed radio buttons
        document.querySelectorAll('.filter-speed').forEach(radio => {
            radio.addEventListener('change', e => {
                App.state.filters.minSpeed = parseInt(e.target.value);
                App.stationsLogic.render();
            });
        });

        // Reset filters
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                App.state.filters = { query: '', types: [], maxPrice: 1.0, minSpeed: 0 };
                document.getElementById('search-input').value = '';
                document.getElementById('filter-price').value = 1.0;
                document.getElementById('price-val').textContent = '$1.0';
                document.querySelector('.filter-speed[value="0"]').checked = true;
                document.querySelectorAll('.filter-type').forEach(cb => cb.checked = false);
                App.stationsLogic.render();
            });
        }
    }

    // ── Login ───────────────────────────────────────────────
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const result = App.auth.login(email, password);

            if (result.success) {
                window.location.href = 'index.html';
            } else {
                const errEl = document.getElementById('login-error');
                if (errEl) {
                    errEl.textContent = result.message;
                    errEl.style.display = 'block';
                }
            }
        });
    }

    // ── Register ────────────────────────────────────────────
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('fullname')?.value;
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;

            const result = App.auth.register(name, email, password);

            if (result.success) {
                alert('Registration successful! Please log in.');
                window.location.href = 'login.html';
            } else {
                const errEl = document.getElementById('register-error');
                if (errEl) {
                    errEl.textContent = result.message;
                    errEl.style.display = 'block';
                }
            }
        });
    }

    // ── Profile ─────────────────────────────────────────────
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        if (!App.auth.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        App.ui.loadProfileData();

        profileForm.addEventListener('submit', e => {
            e.preventDefault();
            const updated = {
                name: document.getElementById('p-name')?.value,
                phone: document.getElementById('p-phone')?.value || '',
                vehicle: document.getElementById('p-vehicle')?.value || ''
            };
            if (App.auth.updateProfile(updated)) {
                alert('Profile updated successfully!');
                App.ui.loadProfileData();
            }
        });
    }

    // ── Logout (any page) ───────────────────────────────────
    document.getElementById('logout-btn')?.addEventListener('click', e => {
        e.preventDefault();
        App.auth.logout();
    });
});