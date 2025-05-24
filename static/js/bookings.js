// static/js/bookings.js
document.addEventListener('DOMContentLoaded', () => {
    // For calendar.html
    const petSelect = document.getElementById('booking-pet-select');
    const dateInput = document.getElementById('booking-date-input'); // Primary date input
    const bookingForm = document.getElementById('booking-form');

    if (petSelect) {
        loadUserPetsForBooking();
    }
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            const selectedDate = dateInput.value;
            if (selectedDate) {
                loadAvailableSlots(selectedDate);
            } else {
                document.getElementById('available-time-slots').innerHTML = '<p>Please select a date to see available times.</p>';
            }
        });
        // Initialize with current date or a default to trigger slot loading if desired
        // For now, user must pick a date.
        document.getElementById('available-time-slots').innerHTML = '<p>Please select a date to see available times.</p>';
    }
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    // For my_bookings.html
    if (document.getElementById('bookings-list-container')) {
        loadUserBookings();
    }
});

async function loadUserPetsForBooking() {
    const selectElement = document.getElementById('booking-pet-select');
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">Loading pets...</option>';

    try {
        const response = await fetch('/api/pets');
        if (response.status === 401) {
            selectElement.innerHTML = '<option value="">Log in to see pets</option>';
            // Optionally disable booking form elements
            return;
        }
        const data = await response.json();
        if (data.success && data.pets) {
            selectElement.innerHTML = '<option value="">Select a pet</option>'; // Default option
            if (data.pets.length === 0) {
                selectElement.innerHTML = '<option value="">No pets found. Add one first!</option>';
                // Optionally disable booking form
            } else {
                data.pets.forEach(pet => {
                    const option = document.createElement('option');
                    option.value = pet.id;
                    option.textContent = pet.name;
                    selectElement.appendChild(option);
                });
            }
        } else {
            selectElement.innerHTML = '<option value="">Could not load pets</option>';
        }
    } catch (error) {
        console.error('Error loading pets for booking:', error);
        selectElement.innerHTML = '<option value="">Error loading pets</option>';
    }
}

async function loadAvailableSlots(dateString) {
    const slotsContainer = document.getElementById('available-time-slots');
    if (!slotsContainer) return;
    slotsContainer.innerHTML = '<p>Loading available times...</p>';

    try {
        const response = await fetch(`/api/available_slots?date=${dateString}`);
        const data = await response.json();
        if (data.success && data.available_slots) {
            slotsContainer.innerHTML = ''; // Clear loading/previous slots
            if (data.available_slots.length === 0) {
                slotsContainer.innerHTML = '<p>No available slots for this date.</p>';
            } else {
                data.available_slots.forEach(slot => {
                    const button = document.createElement('button');
                    button.type = 'button'; // Important: prevent form submission
                    button.className = 'time-slot-button flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#e7edf4] pl-4 pr-4 text-[#0d141c] text-sm font-medium leading-normal';
                    button.textContent = slot;
                    button.dataset.time = slot; // Store time in data attribute
                    button.addEventListener('click', (e) => {
                        // Handle selection: maybe highlight, store in a hidden input or variable
                        document.querySelectorAll('.time-slot-button').forEach(btn => btn.classList.remove('bg-[#3d98f4]', 'text-slate-50'));
                        e.currentTarget.classList.add('bg-[#3d98f4]', 'text-slate-50');
                        // Store selected time, e.g., in a hidden input or a variable accessible by handleBookingSubmit
                        document.getElementById('selected-time-slot').value = slot;
                    });
                    slotsContainer.appendChild(button);
                });
            }
        } else {
            slotsContainer.innerHTML = `<p>Could not load slots: ${data.message || 'Unknown error'}</p>`;
        }
    } catch (error) {
        console.error('Error loading available slots:', error);
        slotsContainer.innerHTML = '<p>Error loading available slots.</p>';
    }
}

async function handleBookingSubmit(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('booking-message');
    messageDiv.textContent = '';

    const bookingData = {
        pet_id: document.getElementById('booking-pet-select').value,
        service_type: document.getElementById('booking-service-select').value,
        booking_date: document.getElementById('booking-date-input').value,
        booking_time: document.getElementById('selected-time-slot').value // From hidden input
    };

    if (!bookingData.pet_id || !bookingData.service_type || !bookingData.booking_date || !bookingData.booking_time) {
        messageDiv.textContent = 'All fields (pet, service, date, time) are required.';
        messageDiv.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (response.status === 401) {
            messageDiv.textContent = 'Unauthorized. Please log in.';
            messageDiv.style.color = 'red';
            return;
        }
         if (response.status === 403) { // Pet does not belong to user
             const errorData = await response.json();
             messageDiv.textContent = errorData.message || 'Pet validation failed.';
             messageDiv.style.color = 'red';
             return;
         }

        const data = await response.json();
        if (data.success) {
            messageDiv.textContent = 'Booking successful! Redirecting...';
            messageDiv.style.color = 'green';
            setTimeout(() => { window.location.href = 'my_bookings.html'; }, 2000);
        } else {
            messageDiv.textContent = data.message || 'Booking failed.';
            messageDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Booking submission error:', error);
        messageDiv.textContent = 'An error occurred during booking.';
        messageDiv.style.color = 'red';
    }
}

async function loadUserBookings() {
    const container = document.getElementById('bookings-list-container');
    if (!container) return;
    container.innerHTML = '<p>Loading your bookings...</p>';

    try {
        const response = await fetch('/api/bookings');
        if (response.status === 401) {
            container.innerHTML = '<p>You need to be logged in to see your bookings. <a href="login.html">Login here</a>.</p>';
            return;
        }
        const data = await response.json();

        if (data.success && data.bookings && data.bookings.length > 0) {
            container.innerHTML = '';
            const ul = document.createElement('ul');
            ul.className = 'space-y-4';
            data.bookings.forEach(booking => {
                const li = document.createElement('li');
                li.className = 'p-4 bg-white shadow rounded-lg';
                li.innerHTML = `
                    <h3 class="text-xl font-semibold">Booking for: ${booking.pet_name}</h3>
                    <p><strong>Service:</strong> ${booking.service_type}</p>
                    <p><strong>Date:</strong> ${booking.booking_date}</p>
                    <p><strong>Time:</strong> ${booking.booking_time}</p>
                    <p><strong>Status:</strong> ${booking.status}</p>
                `;
                ul.appendChild(li);
            });
            container.appendChild(ul);
        } else if (data.success && data.bookings && data.bookings.length === 0) {
            container.innerHTML = '<p>You have no bookings yet. <a href="calendar.html">Make one now!</a></p>';
        } else {
            container.innerHTML = `<p>Could not load bookings: ${data.message || 'Unknown error'}</p>`;
        }
    } catch (error) {
        console.error('Load bookings error:', error);
        container.innerHTML = '<p>An error occurred while loading bookings.</p>';
    }
}
