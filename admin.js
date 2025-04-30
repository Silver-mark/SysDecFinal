import { getAllRecipes } from './recipeService.js';
import { getAllUsers } from './authService.js';
import { getFeedback } from './supportService.js';

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
        case 'recipe-analytics':
            await loadRecipeAnalytics();
            break;
        case 'user-engagement':
            await loadUserEngagement();
            break;
        case 'faq-management':
            await loadFAQManagement();
            break;
        case 'support':
            await loadSupportCenter();
            break;
        default:
            break;
    }
}

async function loadTabData(tabName) {
    switch(tabName) {
        case 'most-viewed':
            await loadMostViewedRecipes();
            break;
        case 'most-favorited':
            await loadMostFavoritedRecipes();
            break;
        case 'highest-rated':
            await loadHighestRatedRecipes();
            break;
        case 'all-faqs':
            await loadAllFAQs();
            break;
        case 'new-questions':
            await loadNewQuestions();
            break;
        case 'email-responses':
            await loadEmailResponses();
            break;
        default:
            break;
    }
}

async function loadOverviewData() {
    try {
        const stats = await fetchDashboardStats();
        updateDashboardStats(stats);
        const topRecipes = await fetchTopPerformingRecipes();
        populateTopRecipesTable(topRecipes);
    } catch (error) {
        console.error('Error loading overview data:', error);
        showError('Failed to load overview data');
    }
}

async function loadRecipeAnalytics() {
    try {
        await loadMostViewedRecipes();
    } catch (error) {
        console.error('Error loading recipe analytics:', error);
        showError('Failed to load recipe analytics');
    }
}

async function loadMostViewedRecipes() {
    try {
        const recipes = await fetchRecipesByMetric('views');
        populateRecipeAnalyticsTable(recipes);
    } catch (error) {
        console.error('Error loading most viewed recipes:', error);
        showError('Failed to load most viewed recipes');
    }
}

async function loadMostFavoritedRecipes() {
    try {
        const recipes = await fetchRecipesByMetric('favorites');
        populateRecipeAnalyticsTable(recipes);
    } catch (error) {
        console.error('Error loading most favorited recipes:', error);
        showError('Failed to load most favorited recipes');
    }
}

async function loadHighestRatedRecipes() {
    try {
        const recipes = await fetchRecipesByMetric('rating');
        populateRecipeAnalyticsTable(recipes);
    } catch (error) {
        console.error('Error loading highest rated recipes:', error);
        showError('Failed to load highest rated recipes');
    }
}

async function loadUserEngagement() {
    try {
        const stats = await fetchEngagementStats();
        updateEngagementStats(stats);
        const users = await fetchMostActiveUsers();
        populateActiveUsersTable(users);
    } catch (error) {
        console.error('Error loading user engagement data:', error);
        showError('Failed to load user engagement data');
    }
}

async function loadFAQManagement() {
    try {
        await loadAllFAQs();
    } catch (error) {
        console.error('Error loading FAQ management:', error);
        showError('Failed to load FAQ management');
    }
}

async function loadAllFAQs() {
    try {
        const faqs = await fetchFAQs();
        populateFAQTable(faqs);
    } catch (error) {
        console.error('Error loading FAQs:', error);
        showError('Failed to load FAQs');
    }
}

async function loadNewQuestions() {
    try {
        const questions = await fetchNewQuestions();
        populateFAQTable(questions);
    } catch (error) {
        console.error('Error loading new questions:', error);
        showError('Failed to load new questions');
    }
}

async function loadEmailResponses() {
    try {
        const responses = await fetchEmailResponses();
        populateFAQTable(responses);
    } catch (error) {
        console.error('Error loading email responses:', error);
        showError('Failed to load email responses');
    }
}

async function loadSupportCenter() {
    try {
        const tickets = await fetchRecentTickets();
        populateRecentTicketsTable(tickets);
    } catch (error) {
        console.error('Error loading support center:', error);
        showError('Failed to load support center');
    }
}

function updateDashboardStats(stats) {
    document.getElementById('total-users').textContent = stats.totalUsers || 0;
    document.getElementById('total-recipes').textContent = stats.totalRecipes || 0;
    document.getElementById('total-favorites').textContent = stats.totalFavorites || 0;
    document.getElementById('total-views').textContent = stats.totalViews || 0;
}

function updateEngagementStats(stats) {
    document.getElementById('avg-session-time').textContent = stats.avgSessionTime || 0;
    document.getElementById('recipes-per-user').textContent = stats.recipesPerUser || 0;
    document.getElementById('daily-active-users').textContent = stats.dailyActiveUsers || 0;
    document.getElementById('engagement-rate').textContent = `${stats.engagementRate || 0}%`;
}

function populateTopRecipesTable(recipes) {
    const tableBody = document.getElementById('top-recipes-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = recipes.map(recipe => `
        <tr>
            <td>${recipe.title}</td>
            <td>${recipe.views || 0}</td>
            <td>${recipe.favorites || 0}</td>
            <td>${recipe.rating?.toFixed(1) || 'N/A'}</td>
            <td>
                <a href="recipe.html?id=${recipe.id}" class="support-btn">View</a>
            </td>
        </tr>
    `).join('');
}

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
    alert(message);
}

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