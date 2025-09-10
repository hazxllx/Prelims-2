// API base URL for all requests
const API = 'https://prelim-exam.onrender.com';

// Current step tracker and user data storage
let currentStep = 1;
let userData = {};

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateProgress(); // Update progress bar on page load
    setupForm(); // Initialize the main form
});

// Update progress bar and step counter
function updateProgress() {
    const percent = (currentStep / 15) * 100; // Calculate completion percentage
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = `Step ${currentStep}/15`; // Display current step
}

// Display messages with appropriate styling
function showMessage(msg, type = '') {
    const display = document.getElementById('message-display');
    display.textContent = msg;
    display.className = 'message-display ' + type;

    // Auto-detect message type based on content
    if (msg.includes('ITMC{')) display.className = 'message-display success';
    if (msg.includes('error') || msg.includes('Error')) display.className = 'message-display error';
    if (msg.includes('Uh oh') || msg.includes('required')) display.className = 'message-display warning';
}

// Make API calls with error handling
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (data) options.body = JSON.stringify(data); // Add body if data is provided
        const response = await fetch(API + endpoint, options);
        return await response.json(); // Parse JSON response
    } catch (error) {
        throw new Error('Network error: ' + error.message); // Catch and throw error if network request fails
    }
}

// Toggle loading state on buttons
function setLoading(btn, loading) {
    if (loading) {
        btn.classList.add('loading'); // Add loading class
        btn.disabled = true; // Disable button while loading
    } else {
        btn.classList.remove('loading'); // Remove loading class
        btn.disabled = false; // Enable button after loading is done
    }
}

// Add new input field to form
function addInput(id, placeholder, type = 'text') {
    const form = document.getElementById('main-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.placeholder = placeholder;
    input.required = true; // Mark input as required
    form.insertBefore(input, submitBtn); // Insert input field before submit button
    input.focus(); // Set focus on the new input field
}

// Clear form and action buttons
function clearForm() {
    document.getElementById('main-form').innerHTML = '<button type="submit" class="btn btn-primary">Submit</button>';
    document.getElementById('action-buttons').innerHTML = '';
}

// Clear form without submit button (for button-only steps)
function clearFormNoSubmit() {
    document.getElementById('main-form').innerHTML = '';
    document.getElementById('action-buttons').innerHTML = '';
    // DON'T remove pet-info here, so pets display persists until step 12
}

// Display pet information
function showPets(pets, title) {
    const existing = document.getElementById('pet-info');
    if (existing) existing.remove(); // Remove any existing pet info
    const div = document.createElement('div');
    div.id = 'pet-info';
    div.className = 'pet-info';
    div.innerHTML = `<h3 style="color: #00d4aa; font-family: Orbitron;">${title}</h3>`;
    if (pets && pets.length > 0) {
        pets.forEach(pet => {
            const owner = pet.owner ? (pet.owner.username || pet.owner) : 'Unknown'; // Display pet owner if available
            div.innerHTML += `
                <div class="pet-card">
                    <div style="color: #fff; font-weight: bold;">${pet.name}</div>
                    <div style="color: #b8b8b8;">Type: ${pet.type}</div>
                    <div style="color: #b8b8b8;">Owner: ${owner}</div>
                    <div style="color: #b8b8b8;">ID: ${pet._id}</div>
                </div>
            `;
        });
    } else {
        div.innerHTML += '<div style="color: #b8b8b8;">No pets found.</div>';
    }
    document.getElementById('message-display').after(div); // Display pet info after the message
}

// Setup main form submission handler
function setupForm() {
    const form = document.getElementById('main-form');
    form.onsubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        const btn = form.querySelector('button[type="submit"]');
        setLoading(btn, true); // Set button to loading state
        try {
            await handleCurrentStep(); // Handle the current step
        } catch (error) {
            showMessage('Error: ' + error.message, 'error'); // Show error message
        }
        setLoading(btn, false); // Set button to normal state
    };
}

// Route to appropriate step handler
async function handleCurrentStep() {
    switch(currentStep) {
        case 1:
        case 2: await handleSignup(); break; // Handle signup steps
        case 3:
        case 4: await handleLogin(); break; // Handle login steps
        case 5: await handleEditUsername(); break; // Handle edit username step
        case 6: await handleAddPet(); break; // Handle add pet step
        default: break; // No action for other steps
    }
}

// Handle Step 1-2: User signup
async function handleSignup() {
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;
    const age = document.getElementById('age')?.value;
    userData.username = username;
    userData.password = password;
    let data = { username, password };
    if (age) data.age = age; // Include age if provided
    const result = await apiCall('/signup', 'POST', data); // Make API call for signup
    showMessage(result.message || JSON.stringify(result)); // Show message based on response
    if (result.message && result.message.includes('Age is required')) {
        if (!document.getElementById('age')) {
            addInput('age', 'Age', 'number'); // Add age input if not already present
        }
        currentStep = 2; // Move to step 2
        updateProgress(); // Update progress
    } else if (result.message && result.message.includes('ITMC{2.')) {
        userData.id = result.id;
        userData.code = result.code;
        currentStep = 3; // Move to step 3 (login)
        updateProgress(); // Update progress
        setupLoginForm(); // Setup login form
    }
}

// Handle Step 3-4: User login
async function handleLogin() {
    const username = document.getElementById('login-username')?.value || userData.username;
    const password = document.getElementById('login-password')?.value || userData.password;
    const authKey = document.getElementById('authkey')?.value;
    let data = { username, password };
    if (authKey) data.authKey = authKey; // Include authKey if provided
    const result = await apiCall('/login', 'POST', data); // Make API call for login
    showMessage(result.message || JSON.stringify(result)); // Show message based on response
    if (result.message && result.message.includes('authentication key')) {
        if (!document.getElementById('authkey')) {
            addInput('authkey', 'Auth Key'); // Add auth key input if not already present
            document.getElementById('authkey').value = userData.code; // Set auth key value
        }
        currentStep = 4; // Move to step 4 (login with auth key)
        updateProgress(); // Update progress
    } else if (result.message && result.message.includes('ITMC{4.')) {
        currentStep = 5; // Move to step 5 (edit username)
        updateProgress(); // Update progress
        setupEditUsernameForm(); // Setup form to edit username
    }
}

// Handle Step 5: Edit username
async function handleEditUsername() {
    const newUsername = document.getElementById('new-username').value;
    const result = await apiCall(`/users/${userData.id}`, 'PATCH', { username: newUsername }); // API call to edit username
    showMessage(result.message || JSON.stringify(result)); // Show message based on response
    if (result.message && result.message.includes('ITMC{5.')) {
        userData.username = newUsername; // Update username in userData
        currentStep = 6; // Move to step 6 (add pet)
        updateProgress(); // Update progress
        setupAddPetForm(); // Setup form to add pet
    }
}

// Handle Step 6: Add pet
async function handleAddPet() {
    const petName = document.getElementById('pet-name').value;
    const petType = document.getElementById('pet-type')?.value;
    let data = { name: petName };
    if (petType) {
        data.type = petType;
        data.ownerId = userData.id;
    }
    const result = await apiCall('/pets/new', 'POST', data); // API call to add new pet
    showMessage(result.message || JSON.stringify(result)); // Show message based on response
    if (result.message && result.message.includes('ownerId, name, type required')) {
        if (!document.getElementById('pet-type')) {
            addInput('pet-type', 'Pet Type'); // Add pet type input if not already present
        }
    } else if (result.message && result.message.includes('ITMC{6.')) {
        userData.petId = result.petId; // Save pet ID to userData
        currentStep = 7; // Move to step 7 (view pets)
        updateProgress(); // Update progress
        setupViewPetsForm(); // Setup form to view pets
    }
}

// Setup Step 3-4: Show login form with username and password fields
function setupLoginForm() {
    document.getElementById('step-title').textContent = 'Step 3: Login';
    clearForm(); // Clear any existing form inputs
    const form = document.getElementById('main-form');
    form.innerHTML = `
        <input type="text" id="login-username" placeholder="Username" value="${userData.username}" required>
        <input type="password" id="login-password" placeholder="Password" value="${userData.password}" required>
        <button type="submit" class="btn btn-primary">Login</button>
    `;
}

// Setup Step 5: Show form to change the username
function setupEditUsernameForm() {
    document.getElementById('step-title').textContent = 'Step 5: Edit Username';
    clearForm();
    const form = document.getElementById('main-form');
    form.innerHTML = `
        <input type="text" id="new-username" placeholder="New Username" required>
        <button type="submit" class="btn btn-primary">Update Username</button>
    `;
}

// Setup Step 6: Show form to add a new pet
function setupAddPetForm() {
    document.getElementById('step-title').textContent = 'Step 6: Add Pet';
    clearForm();
    const form = document.getElementById('main-form');
    form.innerHTML = `
        <input type="text" id="pet-name" placeholder="Pet Name" required>
        <button type="submit" class="btn btn-primary">Add Pet</button>
    `;
}

// Setup Step 7: Show button to view user's pets
function setupViewPetsForm() {
    document.getElementById('step-title').textContent = 'Step 7: View My Pets';
    clearFormNoSubmit(); // Clear form but keep submit event intact if any
    const container = document.getElementById('action-buttons');
    const btn = document.createElement('button');
    btn.textContent = 'View My Pets';
    btn.className = 'btn btn-secondary';

    // When clicked, fetch and show user's pets
    btn.onclick = async function() {
        setLoading(this, true); // Show loading state
        try {
            const result = await apiCall(`/users/${userData.id}/pets`);
            showMessage(result.message || 'Pets retrieved');
            if (result.pets) showPets(result.pets, 'Your Pets');
            // If special success message received, move to next step
            if (result.message && result.message.includes('ITMC{7.')) {
                currentStep = 8;
                updateProgress();
                setupFetchAllPetsForm();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };

    container.appendChild(btn);
}

// Setup Step 8: Show button to fetch all pets (admin or user-wide)
function setupFetchAllPetsForm() {
    document.getElementById('step-title').textContent = 'Step 8: Fetch All Pets';
    clearFormNoSubmit();
    const container = document.getElementById('action-buttons');
    const btn = document.createElement('button');
    btn.textContent = 'Fetch All Pets';
    btn.className = 'btn btn-secondary';

    btn.onclick = async function() {
        setLoading(this, true);
        try {
            let result = await apiCall('/pets');
            showMessage(result.message || JSON.stringify(result));

            // If server asks for userId query param, fetch pets for this user
            if (result.message && result.message.includes('userId query required')) {
                result = await apiCall(`/pets?userId=${userData.id}`);
                showMessage(result.message || JSON.stringify(result));

                // Fetch current user's role info
                const userResult = await apiCall(`/users/${userData.id}`);
                if (userResult.user) {
                    showMessage(userResult.message + '\nYour role: ' + userResult.user.role);
                    currentStep = 9;
                    updateProgress();
                    setupChangeRoleForm();
                }
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };

    container.appendChild(btn);
}

// Setup Step 9: Show form to change user's role (admin, vet, student)
function setupChangeRoleForm() {
    document.getElementById('step-title').textContent = 'Step 9: Change Role';
    clearForm();
    const form = document.getElementById('main-form');
    form.innerHTML = `
        <select id="new-role" required>
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="vet">Vet</option>
            <option value="student">Student</option>
        </select>
        <button type="submit" class="btn btn-primary">Change Role</button>
    `;

    // Handle role change form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        setLoading(btn, true);
        try {
            const newRole = document.getElementById('new-role').value;
            const result = await apiCall(`/users/${userData.id}`, 'PATCH', { role: newRole });
            showMessage(result.message || JSON.stringify(result));

            // If success, proceed to next step
            if (result.message && result.message.includes('ITMC{9.')) {
                currentStep = 10;
                updateProgress();
                setupAdminPetsForm();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(btn, false);
    };
}

// Setup Step 10: Show button for admin to view all pets
function setupAdminPetsForm() {
    document.getElementById('step-title').textContent = 'Step 10: View All Pets';
    clearFormNoSubmit();
    const container = document.getElementById('action-buttons');
    const btn = document.createElement('button');
    btn.textContent = 'View All Pets';
    btn.className = 'btn btn-secondary';

    // When clicked, fetch and display all pets
    btn.onclick = async function() {
        setLoading(this, true);
        try {
            const result = await apiCall(`/pets?userId=${userData.id}`);
            showMessage(result.message || 'All pets retrieved');
            if (result.pets) showPets(result.pets, 'All Pets');

            // If success, move to stats steps
            if (result.message && result.message.includes('ITMC{10.')) {
                currentStep = 11;
                updateProgress();
                setupStatsForm();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };

    container.appendChild(btn);
}

// Setup Steps 11-15: Show buttons for stats and final steps
function setupStatsForm() {
    document.getElementById('step-title').textContent = 'Step 11: Pet Count Statistics';
    clearFormNoSubmit();
    const container = document.getElementById('action-buttons');

    // Step 11: Button to get pet count stats
    const step11Btn = document.createElement('button');
    step11Btn.textContent = 'Pet Count Stats';
    step11Btn.className = 'btn btn-secondary';
    step11Btn.onclick = async function() {
        setLoading(this, true);
        try {
            const result = await apiCall('/stats/pets/count');
            showMessage(result.message || JSON.stringify(result));

            // Move to next step on success
            if (result.message && result.message.includes('ITMC{11.')) {
                currentStep = 12;
                updateProgress();
                document.getElementById('step-title').textContent = 'Step 12: Delete Pet';
                this.style.display = 'none';
                step12Btn.style.display = 'block';

                // Remove pet info display for next step
                const petInfoDiv = document.getElementById('pet-info');
                if (petInfoDiv) petInfoDiv.remove();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };
    container.appendChild(step11Btn);

    // Step 12: Button to delete user's pet
    const step12Btn = document.createElement('button');
    step12Btn.textContent = 'Delete My Pet';
    step12Btn.className = 'btn btn-danger';
    step12Btn.style.display = 'none';
    step12Btn.onclick = async function() {
        setLoading(this, true);
        try {
            const result = await apiCall(`/pets/${userData.petId}`, 'DELETE');
            showMessage(result.message || JSON.stringify(result));

            // Move to next step on success
            if (result.message && result.message.includes('ITMC{12.')) {
                currentStep = 13;
                updateProgress();
                document.getElementById('step-title').textContent = 'Step 13: User Age Statistics';
                this.style.display = 'none';
                step13Btn.style.display = 'block';
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };
    container.appendChild(step12Btn);

    // Step 13: Button to get user age stats
    const step13Btn = document.createElement('button');
    step13Btn.textContent = 'User Age Stats';
    step13Btn.className = 'btn btn-secondary';
    step13Btn.style.display = 'none';
    step13Btn.onclick = async function() {
        setLoading(this, true);
        try {
            const result = await apiCall('/stats/users/ages');
            showMessage(result.message || JSON.stringify(result));

            // Move to next step on success
            if (result.message && result.message.includes('ITMC{13.')) {
                currentStep = 14;
                updateProgress();
                document.getElementById('step-title').textContent = 'Step 14: User Count Statistics';
                this.style.display = 'none';
                step14Btn.style.display = 'block';
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };
    container.appendChild(step13Btn);

    // Step 14: Button to get user count stats
    const step14Btn = document.createElement('button');
    step14Btn.textContent = 'User Count Stats';
    step14Btn.className = 'btn btn-secondary';
    step14Btn.style.display = 'none';
    step14Btn.onclick = async function() {
        setLoading(this, true);
        try {
            const result = await apiCall('/stats/users/count');
            showMessage(result.message || JSON.stringify(result));

            // Move to final step on success
            if (result.message && result.message.includes('ITMC{14.')) {
                currentStep = 15;
                updateProgress();
                document.getElementById('step-title').textContent = 'Step 15: Logout';
                this.style.display = 'none';
                step15Btn.style.display = 'block';
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };
    container.appendChild(step14Btn);

    // Step 15: Button to logout 
    const step15Btn = document.createElement('button');
    step15Btn.textContent = 'Logout';
    step15Btn.className = 'btn btn-danger';
    step15Btn.style.display = 'none';
    step15Btn.onclick = async function() {
        setLoading(this, true);
        try {
            const result = await apiCall('/logout', 'POST');
            showMessage(result.message || JSON.stringify(result));

            // On success, show completion message
            if (result.message && result.message.includes('ITMC{15.')) {
                currentStep = 15;
                updateProgress();
                document.getElementById('step-title').textContent = 'Prelims Complete';
                this.style.display = 'none';

                setTimeout(() => {
                    const summary = document.createElement('div');
                    summary.className = 'pet-info';
                    summary.innerHTML = `
                        <h3 style="color: #00d4aa; font-family: Orbitron;">Prelims Part 2 Complete</h3>
                        <div style="color: #fff; text-align: center; padding: 20px;">
                            <p>All ITMC codes collected</p>
                            <br>
                        </div>
                    `;
                    document.getElementById('message-display').after(summary);
                }, 1000);
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
        setLoading(this, false);
    };
    container.appendChild(step15Btn);
}
