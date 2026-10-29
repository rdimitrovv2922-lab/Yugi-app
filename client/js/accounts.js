const accountForms = document.querySelector('#account-forms');
const accountStatus = document.querySelector('#account-status');
const accountMessage = document.querySelector('#account-message');
const signedInPanel = document.querySelector('#signed-in-panel');
const accountUser = document.querySelector('#account-user');
const logoutButton = document.querySelector('#logout-button');

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(result.error || 'Request failed');
        error.status = response.status;
        throw error;
    }

    return result;
}

function showSignedOut() {
    accountForms.hidden = false;
    signedInPanel.hidden = true;
    accountStatus.textContent = 'Not signed in.';
}

function showSignedIn(user) {
    accountForms.hidden = true;
    signedInPanel.hidden = false;
    accountStatus.textContent = `Signed in as ${user.username}.`;
    accountUser.textContent = `${user.displayName} (@${user.username})`;
}

async function submitAuthForm(event, endpoint) {
    event.preventDefault();

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    accountMessage.textContent = '';

    try {
        const result = await requestJson(endpoint, {
            method: 'POST',
            body: JSON.stringify(values)
        });

        showSignedIn(result.user);
        form.reset();
    } catch (error) {
        accountMessage.textContent = error.message;
    }
}

document.querySelector('#register-form').addEventListener(
    'submit',
    (event) => submitAuthForm(event, '/api/register')
);

document.querySelector('#login-form').addEventListener(
    'submit',
    (event) => submitAuthForm(event, '/api/login')
);

logoutButton.addEventListener('click', async () => {
    accountMessage.textContent = '';

    try {
        await requestJson('/api/logout', { method: 'POST' });
        showSignedOut();
    } catch (error) {
        accountMessage.textContent = error.message;
    }
});

async function checkExistingSession() {
    try {
        const result = await requestJson('/api/me');
        showSignedIn(result.user);
    } catch (error) {
        if (error.status === 401) {
            showSignedOut();
        } else {
            accountStatus.textContent = 'Could not check sign-in status.';
            accountMessage.textContent = error.message;
        }
    }
}

checkExistingSession();