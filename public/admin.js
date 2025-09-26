document.addEventListener('DOMContentLoaded', () => {
    const findUserForm = document.getElementById('find-user-form');
    const userManagementArea = document.getElementById('user-management-area');
    const managingUserTitle = document.getElementById('managing-user-title');
    const balancesForm = document.getElementById('balances-form');
    const mainBalanceInput = document.getElementById('main-balance');
    const cashbackBalanceInput = document.getElementById('cashback-balance');
    const userServicesTableBody = document.getElementById('user-services-table-body');
    const userUpdateMessage = document.getElementById('user-update-message');
    const userFindMessage = document.getElementById('user-find-message');

    let currentManagedUserId = null;

    findUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const userIdText = document.getElementById('find-user-id').value;
        userFindMessage.textContent = '';

        const response = await fetch('/api/admin/find-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userIdText }),
        });
        const result = await response.json();

        if (result.status === 'success') {
            displayUserData(result.user, result.services);
        } else {
            userFindMessage.textContent = result.message;
            userManagementArea.style.display = 'none';
        }
    });

    function displayUserData(user, services) {
        currentManagedUserId = user.id;
        managingUserTitle.textContent = `Managing User: ${user.user_id_text} (${user.email})`;
        mainBalanceInput.value = user.main_balance.toFixed(2);
        cashbackBalanceInput.value = user.cashback_balance.toFixed(2);

        userServicesTableBody.innerHTML = '';
        services.forEach(service => {
            if (!service.is_fixed_price) {
                const currentPrice = service.custom_price !== null ? `$${service.custom_price.toFixed(2)}` : 'Not set';
                const row = `
                    <tr>
                        <td>${service.display_name}</td>
                        <td>${currentPrice}</td>
                        <td>
                            <div class="price-setter">
                                <input type="number" step="0.01" placeholder="New price" data-service-id="${service.id}">
                                <button class="save-price-btn" data-service-id="${service.id}">Set</button>
                            </div>
                        </td>
                    </tr>
                `;
                userServicesTableBody.innerHTML += row;
            }
        });
        userManagementArea.style.display = 'block';
    }
    
    balancesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const response = await fetch('/api/admin/update-balances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentManagedUserId,
                mainBalance: parseFloat(mainBalanceInput.value),
                cashbackBalance: parseFloat(cashbackBalanceInput.value)
            })
        });
        const result = await response.json();
        userUpdateMessage.textContent = result.message;
        setTimeout(() => userUpdateMessage.textContent = '', 3000);
    });

    document.getElementById('add-video-btn').addEventListener('click', () => incrementAction('video'));
    document.getElementById('add-letter-btn').addEventListener('click', () => incrementAction('letter'));

    async function incrementAction(actionType) {
        const response = await fetch('/api/admin/increment-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentManagedUserId, actionType: actionType }),
        });
        const result = await response.json();
        if (result.status === 'success') {
            mainBalanceInput.value = result.updatedUser.main_balance.toFixed(2);
            userUpdateMessage.textContent = `Balance updated for ${actionType}.`;
            setTimeout(() => userUpdateMessage.textContent = '', 3000);
        }
    }

    userServicesTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('save-price-btn')) {
            const serviceId = event.target.dataset.serviceId;
            const priceInput = document.querySelector(`input[data-service-id='${serviceId}']`);
            const price = parseFloat(priceInput.value);

            if (isNaN(price) || price < 0) {
                alert('Please enter a valid price.');
                return;
            }

            const response = await fetch('/api/admin/set-service-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentManagedUserId, serviceId, price }),
            });
            const result = await response.json();
            userUpdateMessage.textContent = result.message;
            setTimeout(() => userUpdateMessage.textContent = '', 3000);
            
            // Обновляем данные на странице
            findUserForm.dispatchEvent(new Event('submit'));
        }
    });
});