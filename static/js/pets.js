// static/js/pets.js
document.addEventListener('DOMContentLoaded', () => {
    const addPetForm = document.getElementById('add-pet-form');
    if (addPetForm) {
        addPetForm.addEventListener('submit', handleAddPet);
    }

    // If on my_pets.html, load pets
    if (document.getElementById('pets-list-container')) {
        loadUserPets();
    }
});

async function handleAddPet(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('add-pet-message');
    messageDiv.textContent = '';

    const petData = {
        name: document.getElementById('pet-name').value,
        type: document.getElementById('pet-type').value,
        breed: document.getElementById('pet-breed').value,
        size: document.getElementById('pet-size').value,
        weight: document.getElementById('pet-weight').value,
        sex: document.getElementById('pet-sex').value,
        age: document.getElementById('pet-age').value,
        additional_info: document.getElementById('pet-additional-info') ? document.getElementById('pet-additional-info').value : '' // Assuming this field exists
    };

    // Basic validation
    if (!petData.name) {
        messageDiv.textContent = 'Pet name is required.';
        messageDiv.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(petData)
        });

        if (response.status === 401) {
            messageDiv.textContent = 'Unauthorized. Please log in again.';
            messageDiv.style.color = 'red';
            // Optionally redirect to login
            // window.location.href = 'login.html'; 
            return;
        }

        const data = await response.json();
        if (data.success) {
            messageDiv.textContent = 'Pet added successfully!';
            messageDiv.style.color = 'green';
            document.getElementById('add-pet-form').reset(); // Clear form
            // Optionally redirect to my_pets.html after a delay
            // setTimeout(() => { window.location.href = 'my_pets.html'; }, 1500);
        } else {
            messageDiv.textContent = data.message || 'Failed to add pet.';
            messageDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Add pet error:', error);
        messageDiv.textContent = 'An error occurred while adding pet.';
        messageDiv.style.color = 'red';
    }
}

async function loadUserPets() {
    const container = document.getElementById('pets-list-container');
    if (!container) return;
    container.innerHTML = '<p>Loading pets...</p>';

    try {
        const response = await fetch('/api/pets');
        if (response.status === 401) {
            container.innerHTML = '<p>You need to be logged in to see your pets. <a href="login.html">Login here</a>.</p>';
            return;
        }
        const data = await response.json();

        if (data.success && data.pets && data.pets.length > 0) {
            container.innerHTML = ''; // Clear loading message
            const ul = document.createElement('ul');
            ul.className = 'space-y-4'; // Add some basic styling
            data.pets.forEach(pet => {
                const li = document.createElement('li');
                li.className = 'p-4 bg-white shadow rounded-lg';
                li.innerHTML = `
                    <h3 class="text-xl font-semibold">${pet.name}</h3>
                    <p><strong>Type:</strong> ${pet.type || 'N/A'}</p>
                    <p><strong>Breed:</strong> ${pet.breed || 'N/A'}</p>
                    <p><strong>Size:</strong> ${pet.size || 'N/A'}</p>
                    <p><strong>Weight:</strong> ${pet.weight || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${pet.sex || 'N/A'}</p>
                    <p><strong>Age:</strong> ${pet.age || 'N/A'}</p>
                    <p><strong>Additional Info:</strong> ${pet.additional_info || 'N/A'}</p>
                `;
                ul.appendChild(li);
            });
            container.appendChild(ul);
        } else if (data.success && data.pets && data.pets.length === 0) {
            container.innerHTML = '<p>You haven\'t added any pets yet. <a href="add_dog.html">Add one now!</a></p>';
        } else {
            container.innerHTML = `<p>Could not load pets: ${data.message || 'Unknown error'}</p>`;
        }
    } catch (error) {
        console.error('Load pets error:', error);
        container.innerHTML = '<p>An error occurred while loading pets.</p>';
    }
}
