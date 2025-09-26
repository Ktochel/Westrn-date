document.addEventListener('DOMContentLoaded', () => {
    renderPage();
});

async function renderPage() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('/api/get-profile-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData.id }),
        });

        if (!response.ok) throw new Error('Failed to fetch profile data');

        const result = await response.json();
        
        if (result.profileData.needs_girl_selection) {
            document.getElementById('main-content').innerHTML = generateGirlSelectionHTML();
            setupGirlSelection();
            return;
        }

        const { user, girl, services } = result.profileData;

        document.getElementById('user-id-display').textContent = `ID: ${user.user_id_text}`;
        document.getElementById('user-balance-display').textContent = `Balance: $${user.balance.toFixed(2)}`;

        const mainContent = document.getElementById('main-content');
        
        if (user.active_service_id) {
            const activeService = services.find(s => s.id === user.active_service_id);
            mainContent.innerHTML = generateActiveGoalHTML(user, girl, activeService);
        } else {
            mainContent.innerHTML = generateServiceListHTML(girl, services);
        }

        mainContent.addEventListener('click', handleProfileClick);

    } catch (error) {
        console.error('Error rendering page:', error);
        document.getElementById('main-content').innerHTML = `<p style="color:red;">Error loading profile. Please try again later.</p>`;
    }
}

function handleProfileClick(event) {
    const target = event.target;
    const serviceId = target.dataset.serviceId;

    if (target.matches('.info-btn')) {
        const serviceName = target.dataset.serviceName;
        const serviceDesc = target.dataset.serviceDesc;
        showModal(serviceName, serviceDesc, [{ text: 'OK', class: 'confirm-yes', onClick: hideModal }]);
    }
    else if (target.matches('.select-btn')) {
        const serviceName = target.dataset.serviceName;
        const servicePrice = parseFloat(target.dataset.servicePrice);

        if (isNaN(servicePrice) || servicePrice <= 0) {
            showSupportModal();
        } else {
            const message = `You are about to set '${serviceName}' as your active goal. The target is $${servicePrice}. Do you want to proceed?`;
            showModal('Confirm Goal', message, [
                { text: 'Confirm', class: 'confirm-yes', onClick: () => selectService(serviceId) },
                { text: 'Cancel', class: 'confirm-no', onClick: hideModal }
            ]);
        }
    }
    else if (target.matches('.complete-btn')) {
        showSupportModal();
    }
}

async function selectService(serviceId) {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    try {
        await fetch('/api/select-service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData.id, serviceId: serviceId }),
        });
        hideModal();
        renderPage();
    } catch (error) {
        showModal('Error', 'Could not select service.', [{ text: 'OK', onClick: hideModal }]);
    }
}

function generateServiceListHTML(girl, services) {
    let servicesHtml = services.map(service => `
        <div class="service-row">
            <div class="service-name">${service.display_name}</div>
            <div class="service-price">${service.price ? `$${service.price}` : 'Price on Request'}</div>
            <div class="service-buttons">
                <button class="info-btn" data-service-name="${service.display_name}" data-service-desc="${service.description || 'No description available.'}">Info</button>
                <button class="select-btn" data-service-id="${service.id}" data-service-name="${service.display_name}" data-service-price="${service.price}">Select</button>
            </div>
        </div>
    `).join('');

    return `
        <div class="profile-card">
            <img src="${girl.photo_url}" alt="${girl.first_name}" class="profile-photo">
            <h2 class="profile-name">${girl.first_name}</h2>
            <div class="services-list">
                ${servicesHtml}
            </div>
        </div>
    `;
}

function generateActiveGoalHTML(user, girl, service) {
    const progress = user.main_balance;
    const target = service.price;
    const progressPercent = Math.min((progress / target) * 100, 100);
    const goalReached = progress >= target;

    return `
        <div class="profile-card">
            <img src="${girl.photo_url}" alt="${girl.first_name}" class="profile-photo">
            <h2 class="profile-name">${girl.first_name}</h2>
            <div class="active-goal-container">
                <h3>Active Goal: ${service.display_name}</h3>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                    <span class="progress-bar-text">$${progress.toFixed(2)} / $${target}</span>
                </div>
                ${goalReached ? `<button class="complete-btn">Complete Service</button>` : '<p>Your goal is active. The admin will credit your actions.</p>'}
            </div>
        </div>
    `;
}

function generateGirlSelectionHTML() {
    return `
        <div id="girl-selection-container">
            <h2>Find Your Girl to continue</h2>
            <form id="find-girl-form">
                <div class="input-group">
                    <label for="girl_id">Enter Girl's ID</label>
                    <input type="text" id="girl_id" required pattern="[0-9]*" inputmode="numeric">
                </div>
                <button type="submit">Find</button>
            </form>
            <div id="girl-result-container"></div>
        </div>
    `;
}
function setupGirlSelection() {
    const findGirlForm = document.getElementById('find-girl-form');
    const girlResultContainer = document.getElementById('girl-result-container');
    if (!findGirlForm) return;

    findGirlForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const girlId = document.getElementById('girl_id').value;
        const response = await fetch('/api/find-girl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ girl_id_text: girlId }),
        });
        const result = await response.json();
        if (result.status === 'success') {
            const girl = result.girlData;
            girlResultContainer.innerHTML = `
                <h3>Is this your girl?</h3>
                <img src="${girl.photo_url}" alt="${girl.first_name}" class="girl-photo">
                <p>${girl.first_name}</p>
                <div class="confirmation-buttons">
                    <button id="confirm-yes" data-girl-id="${girl.id}">Yes</button>
                    <button id="confirm-no">No</button>
                </div>
            `;
        } else {
            girlResultContainer.innerHTML = `<p style="color: red;">${result.message}</p>`;
        }
    });

    girlResultContainer.addEventListener('click', async (event) => {
        if (event.target.id === 'confirm-no') {
            girlResultContainer.innerHTML = '';
        }
        if (event.target.id === 'confirm-yes') {
            const girlId = event.target.dataset.girlId;
            const userData = JSON.parse(sessionStorage.getItem('userData'));
            await fetch('/api/select-girl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userData.id, girlId: girlId }),
            });
            renderPage();
        }
    });
}