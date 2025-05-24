# Pet Grooming Appointment System

## Description
A web application designed to streamline the process of booking and managing pet grooming appointments. Users can register, log in, add their pets, and schedule appointments based on available slots.

## Features
*   **User Authentication:** Secure registration, login, and logout functionality.
*   **Pet Management:** Users can add details about their pets (name, type, breed, etc.) and view a list of their registered pets.
*   **Appointment Booking:**
    *   Selection of one of the user's registered pets.
    *   Choice of grooming service.
    *   Date and time selection based on real-time availability.
*   **View Bookings:** Users can view their past and upcoming appointments.
*   **Dynamic UI:** Navigation and available actions in the header change dynamically based on the user's login status.

## Tech Stack
*   **Backend:** Python, Flask
*   **Database:** SQLite
*   **Frontend:** HTML, Tailwind CSS (via CDN for styling), JavaScript (for client-side logic and API interactions)

## Setup and Running

### Prerequisites
*   Python 3.x
*   pip (Python package installer)

### Installation & Setup
1.  **Clone the repository** (or download and extract the project files).
    ```bash
    # If using git:
    # git clone <repository_url>
    # cd <repository_directory>
    ```
2.  **Navigate to the project's root directory.**

3.  **(Recommended) Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    ```
    *   On Windows:
        ```bash
        venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install backend dependencies:**
    Make sure your virtual environment is activated.
    ```bash
    pip install -r backend/requirements.txt
    ```

5.  **Initialize the database:**
    This script will create the `backend/bookings.db` file and the necessary tables.
    ```bash
    python backend/database_setup.py
    ```

### Running the Application
1.  **Start the Flask development server:**
    Ensure your virtual environment is activated and you are in the project root directory.
    ```bash
    python backend/app.py
    ```
2.  **Open your web browser** and navigate to:
    `http://127.0.0.1:5000`
    The landing page should be displayed.

## Project Structure
*   `backend/`:
    *   `app.py`: The main Flask application file containing API endpoints and HTML serving logic.
    *   `database_setup.py`: Script to initialize the SQLite database schema.
    *   `requirements.txt`: Lists Python dependencies for the backend.
    *   `bookings.db`: SQLite database file (created after running `database_setup.py`).
    *   `.flask_session/`: Directory used by Flask-Session for storing server-side session files (created automatically when the app runs).
*   `static/`:
    *   `css/`: Contains CSS files (e.g., `style.css`).
    *   `js/`: Contains client-side JavaScript files (`auth.js`, `pets.js`, `bookings.js`).
*   Root Directory ( `/` ):
    *   HTML files (e.g., `landing.html`, `login.html`, `register.html`, `calendar.html`, `add_dog.html`, `my_pets.html`, `my_bookings.html`).
    *   `README.md`: This file.
