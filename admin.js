document.addEventListener('DOMContentLoaded', () => {
    const adminToken = localStorage.getItem('adminToken');
    const userRole = localStorage.getItem('userRole');

    if (!adminToken || userRole !== 'admin') {
        window.location.href = 'signin.html?redirect=admin.html';
        showMessage('You must be logged in as an admin to access this page.', 'error');
        return;
    }
    initializeNavigation();
    initializeTabSwitchers();
    document.getElementById('logout-btn').addEventListener('click', () => {
        logout();
    });
    loadOverviewData();
    showLoading();
});

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = 'signin.html';
}

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const hash = window.location.hash.substring(1);
    const initialSection = hash || 'overview';
    const initialLink = document.querySelector(`.admin-nav-link[data-section="${initialSection}"]`);
    if (initialLink) {
        initialLink.classList.add('active');
        document.getElementById(initialSection).classList.add('active');
        loadSectionContent(initialSection);
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            window.location.hash = section;
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.content-section').forEach(s => {
                s.classList.remove('active');
            });
            document.getElementById(section).classList.add('active');
            loadSectionContent(section);
        });
    });
}

function initializeTabSwitchers() {
    document.querySelectorAll('.tab-container').forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-btn');
        if (tabButtons.length > 0) {
            const firstTab = tabButtons[0];
            firstTab.classList.add('active');
            
            const tabName = firstTab.dataset.tab;
            const parent = container.closest('.content-section');
            
            if (parent) {
                const firstContent = parent.querySelector(`#${tabName}-content`);
                if (firstContent) {
                    firstContent.classList.add('active');
                }
                loadTabData(tabName);
            }
        }
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                showLoading();
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const tabName = button.dataset.tab;
                const parent = container.closest('.content-section');
                
                if (parent) {
                    const tabContents = parent.querySelectorAll('.tab-content');
                    if (tabContents.length) {
                        tabContents.forEach(content => {
                            content.classList.remove('active');
                        });
                        const activeContent = parent.querySelector(`#${tabName}-content`);
                        if (activeContent) {
                            activeContent.classList.add('active');
                        }
                    }
                    loadTabData(tabName).finally(() => {
                        hideLoading();
                    });
                } else {
                    hideLoading();
                }
            });
        });
    });
}

async function loadSectionContent(section) {
    switch(section) {
        case 'overview':
            await loadOverviewData();
            break;
        case 'support':
            await loadSupportCenter();
            break;
        default:
            break;
    }
}

// Tab data loading is not needed as there are no tab elements in the current HTML

async function loadOverviewData() {
    try {
        showLoading();
        
        // Fetch total user count
        const userCountResponse = await fetch('/api/users/count/total');
        if (!userCountResponse.ok) {
            throw new Error('Failed to fetch user count');
        }
        const userCountData = await userCountResponse.json();
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.innerHTML = userCountData.count || '-1';
        }
        
        // Fetch total recipe count
        const recipeCountResponse = await fetch('/api/recipes/count/total');
        if (!recipeCountResponse.ok) {
            throw new Error('Failed to fetch recipe count');
        }
        const recipeCountData = await recipeCountResponse.json();
        // Add 304 to the total recipe count from the database
        const totalRecipes = 304 + (recipeCountData.count || 0);
        const totalRecipesElement = document.getElementById('total-recipes');
        if (totalRecipesElement) {
            totalRecipesElement.innerHTML = totalRecipes.toString();
        }
        
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        showError('Failed to load overview data');
        
        // Fallback for recipe count if API fails
        const totalRecipesElement = document.getElementById('total-recipes');
        const totalUsersElement = document.getElementById('total-users');
        if (totalRecipesElement) totalRecipesElement.textContent = '304';
        if (totalUsersElement) totalUsersElement.textContent = '0';
    } finally {
        hideLoading();
    }
}



async function loadSupportCenter() {
    try {
        // No need to fetch tickets if we're just showing credentials
        showMessage('Support credentials loaded', 'success');
    } catch (error) {
        console.error('Error loading support center:', error);
        showError('Failed to load support center');
    }
}

// API and utility functions




function updateEngagementStats(stats) {
    document.getElementById('avg-session-time').textContent = stats.avgSessionTime || 0;
    document.getElementById('recipes-per-user').textContent = stats.recipesPerUser || 0;
    document.getElementById('daily-active-users').textContent = stats.dailyActiveUsers || 0;
    document.getElementById('engagement-rate').textContent = `${stats.engagementRate || 0}%`;
}

// Function has been consolidated with the implementation above


function populateRecipeAnalyticsTable(recipes) {
    const tableBody = document.getElementById('recipe-analytics-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = recipes.map(recipe => `
        <tr>
            <td>${recipe.title}</td>
            <td>${recipe.authorName || 'Anonymous'}</td>
            <td>${recipe.views || 0}</td>
            <td>${recipe.favorites || 0}</td>
            <td>${recipe.rating?.toFixed(1) || 'N/A'}</td>
            <td>${new Date(recipe.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function populateActiveUsersTable(users) {
    const tableBody = document.getElementById('active-users-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.recipesCreated || 0}</td>
            <td>${user.favorites || 0}</td>
            <td>${user.comments || 0}</td>
            <td>${new Date(user.lastActive).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function populateFAQTable(faqs) {
    const tableBody = document.getElementById('faq-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = faqs.map(faq => `
        <tr>
            <td>${faq.question}</td>
            <td>${faq.category}</td>
            <td>${faq.frequency || 0}</td>
            <td>${new Date(faq.lastUpdated).toLocaleDateString()}</td>
            <td>
                <button class="support-btn" onclick="editFAQ('${faq.id}')">Edit</button>
                <button class="support-btn" onclick="sendEmailResponse('${faq.id}')">Email</button>
            </td>
        </tr>
    `).join('');
}

function populateRecentTicketsTable(tickets) {
    const tableBody = document.getElementById('recent-tickets-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = tickets.map(ticket => `
        <tr>
            <td>${ticket.id}</td>
            <td>${ticket.userName}</td>
            <td>${ticket.subject}</td>
            <td>
                <span class="${getStatusClass(ticket.status)}">${ticket.status}</span>
            </td>
            <td>${new Date(ticket.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="support-btn" onclick="viewTicket('${ticket.id}')">View</button>
                <button class="support-btn" onclick="respondToTicket('${ticket.id}')">Respond</button>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'open':
            return 'status-open';
        case 'in progress':
            return 'status-in-progress';
        case 'resolved':
            return 'status-resolved';
        default:
            return '';
    }
}

function showError(message) {
    console.error(message);
    showMessage(message, 'error');
}

// Global functions for button actions
window.editFAQ = function(id) {
    alert(`Edit FAQ with ID: ${id}`);
};

window.sendEmailResponse = function(id) {
    window.location.href = `mailto:support@recspicy.com?subject=FAQ Response: ${id}`;
};

window.viewTicket = function(id) {
    alert(`View ticket with ID: ${id}`);
};

window.respondToTicket = function(id) {
    alert(`Respond to ticket with ID: ${id}`);
};

function showLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// The following functions need to be implemented to fetch data from API
// They're referenced but not defined in the original code
async function fetchRecipesByMetric(metric) {
    try {
        const response = await fetch(`/api/recipes/analytics/${metric}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching recipes by ${metric}:`, error);
        return [];
    }
}

async function fetchEngagementStats() {
    try {
        const response = await fetch('/api/analytics/engagement');
        return await response.json();
    } catch (error) {
        console.error('Error fetching engagement stats:', error);
        return {
            avgSessionTime: 0,
            recipesPerUser: 0,
            dailyActiveUsers: 0,
            engagementRate: 0
        };
    }
}

async function fetchMostActiveUsers() {
    try {
        const response = await fetch('/api/users/active');
        return await response.json();
    } catch (error) {
        console.error('Error fetching most active users:', error);
        return [];
    }
}

async function fetchFAQs() {
    try {
        const response = await fetch('/api/faqs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
    }
}

async function fetchNewQuestions() {
    try {
        const response = await fetch('/api/faqs/new');
        return await response.json();
    } catch (error) {
        console.error('Error fetching new questions:', error);
        return [];
    }
}

async function fetchEmailResponses() {
    try {
        const response = await fetch('/api/faqs/emails');
        return await response.json();
    } catch (error) {
        console.error('Error fetching email responses:', error);
        return [];
    }
}

async function fetchRecentTickets() {
    try {
        const response = await fetch('/api/support/tickets');
        return await response.json();
    } catch (error) {
        console.error('Error fetching recent tickets:', error);
        return [];
    }
}
