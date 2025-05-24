import sqlite3
from flask import Flask, jsonify, request, session, redirect, url_for, send_from_directory
from flask_bcrypt import Bcrypt
from flask_session import Session # Server-side session
import os # For generating a good secret key

app = Flask(__name__, static_folder=os.path.join(os.getcwd(), '..', 'static'))
# Configure secret key for session management
app.config['SECRET_KEY'] = os.urandom(24)
# Configure Flask-Session
app.config['SESSION_TYPE'] = 'filesystem' # Store sessions in the filesystem
app.config['SESSION_FILE_DIR'] = './.flask_session/' # Directory to store session files
Session(app)
bcrypt = Bcrypt(app)
DATABASE = 'backend/bookings.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # Access columns by name
    return conn

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    conn = get_db_connection()
    try:
        # Check if email already exists
        existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if existing_user:
            return jsonify({"success": False, "message": "Email already registered"}), 409

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        conn.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', (email, hashed_password))
        conn.commit()
        return jsonify({"success": True, "message": "User registered successfully"}), 201
    except sqlite3.Error as e:
        return jsonify({"success": False, "message": f"Database error: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    if 'user_id' not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    pet_id = data.get('pet_id')
    service_type = data.get('service_type')
    booking_date = data.get('booking_date') # Expected format YYYY-MM-DD
    booking_time = data.get('booking_time') # Expected format HH:MM

    if not all([pet_id, service_type, booking_date, booking_time]):
        return jsonify({"success": False, "message": "Missing required booking information"}), 400

    user_id = session['user_id']
    conn = get_db_connection()
    try:
        # Validate pet_id belongs to the user
        pet = conn.execute('SELECT id FROM pets WHERE id = ? AND user_id = ?', (pet_id, user_id)).fetchone()
        if not pet:
            return jsonify({"success": False, "message": "Invalid pet ID or pet does not belong to user"}), 403

        cursor = conn.execute('''
            INSERT INTO bookings (user_id, pet_id, service_type, booking_date, booking_time)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, pet_id, service_type, booking_date, booking_time))
        conn.commit()
        return jsonify({"success": True, "message": "Booking created successfully", "booking_id": cursor.lastrowid}), 201
    except sqlite3.Error as e:
        return jsonify({"success": False, "message": f"Database error: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/bookings', methods=['GET'])
def get_user_bookings():
    if 'user_id' not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    try:
        bookings_rows = conn.execute('''
            SELECT b.id, b.pet_id, p.name as pet_name, b.service_type, b.booking_date, b.booking_time, b.status, b.created_at
            FROM bookings b
            JOIN pets p ON b.pet_id = p.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date, b.booking_time
        ''', (user_id,)).fetchall()
        bookings_list = [dict(row) for row in bookings_rows]
        return jsonify({"success": True, "bookings": bookings_list}), 200
    except sqlite3.Error as e:
        return jsonify({"success": False, "message": f"Database error: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/available_slots', methods=['GET'])
def get_available_slots():
    date_param = request.args.get('date') # Expected format YYYY-MM-DD
    if not date_param:
        return jsonify({"success": False, "message": "Date parameter is required"}), 400

    # Define business hours and slot duration
    business_hours_start = 9
    business_hours_end = 17 # Exclusive end (last slot starts at 16:00 for 1hr duration)
    slot_duration_hours = 1
    possible_slots = [f"{h:02d}:00" for h in range(business_hours_start, business_hours_end, slot_duration_hours)]

    conn = get_db_connection()
    try:
        booked_slots_rows = conn.execute(
            'SELECT booking_time FROM bookings WHERE booking_date = ?', (date_param,)
        ).fetchall()
        booked_slots = [row['booking_time'] for row in booked_slots_rows]

        available_slots = [slot for slot in possible_slots if slot not in booked_slots]
        
        return jsonify({"success": True, "available_slots": available_slots}), 200
    except sqlite3.Error as e: # Catch potential issues from date format or query
        return jsonify({"success": False, "message": f"Error fetching slots: {e}"}), 500
    except Exception as e: # Catch other potential errors e.g. date parsing
        return jsonify({"success": False, "message": f"An unexpected error occurred: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    conn = get_db_connection()
    try:
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if user and bcrypt.check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['user_email'] = user['email']
            return jsonify({"success": True, "message": "Login successful", "user": {"id": user['id'], "email": user['email']}}), 200
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    except sqlite3.Error as e:
        return jsonify({"success": False, "message": f"Database error: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logout successful"}), 200

@app.route('/api/session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({"success": True, "user": {"id": session['user_id'], "email": session['user_email']}}), 200
    else:
        return jsonify({"success": False, "message": "No active session"}), 401

@app.route('/static/<path:path>')
def send_static(path):
    # This route is technically not needed if static_folder is set correctly in Flask constructor
    # and the static files are referenced as /static/path/to/file.html in HTML
    # However, explicit definition can be useful for clarity or specific rules.
    # For this setup, ensure static_folder in Flask() is pointing to the root 'static' directory.
    # app.static_folder is already set to os.path.join(app.root_path, '..', 'static') via the constructor.
    return send_from_directory(app.static_folder, path)

@app.route('/login.html')
def login_page():
    return send_from_directory(os.path.join(app.root_path, '..'), 'login.html')

@app.route('/register.html')
def register_page():
    return send_from_directory(os.path.join(app.root_path, '..'), 'register.html')

@app.route('/landing.html')
def landing_page_route():
    return send_from_directory(os.path.join(app.root_path, '..'), 'landing.html')

@app.route('/calendar.html')
def calendar_page():
    return send_from_directory(os.path.join(app.root_path, '..'), 'calendar.html')

@app.route('/add_dog.html')
def add_dog_page():
    return send_from_directory(os.path.join(app.root_path, '..'), 'add_dog.html')

@app.route('/my_pets.html')
def my_pets_page():
    # Ensure user is logged in before serving this page, or handle in frontend JS
    # For now, just serve. Frontend JS (loadUserPets) will check auth.
    return send_from_directory(os.path.join(app.root_path, '..'), 'my_pets.html')

@app.route('/my_bookings.html')
def my_bookings_page():
    return send_from_directory(os.path.join(app.root_path, '..'), 'my_bookings.html')

@app.route('/')
def index():
    # Serve landing.html as the default page
    return send_from_directory(os.path.join(app.root_path, '..'), 'landing.html')


if __name__ == '__main__':
    # Create session directory if it doesn't exist
    if not os.path.exists(app.config['SESSION_FILE_DIR']):
        os.makedirs(app.config['SESSION_FILE_DIR'])
    app.run(debug=True)

@app.route('/api/pets', methods=['POST'])
def add_pet():
    if 'user_id' not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({"success": False, "message": "Pet name is required"}), 400

    user_id = session['user_id']
    pet_type = data.get('type')
    breed = data.get('breed')
    size = data.get('size')
    weight = data.get('weight')
    sex = data.get('sex')
    age = data.get('age')
    additional_info = data.get('additional_info')

    conn = get_db_connection()
    try:
        cursor = conn.execute('''
            INSERT INTO pets (user_id, name, type, breed, size, weight, sex, age, additional_info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, name, pet_type, breed, size, weight, sex, age, additional_info))
        conn.commit()
        return jsonify({"success": True, "message": "Pet added successfully", "pet_id": cursor.lastrowid}), 201
    except sqlite3.Error as e:
        return jsonify({"success": False, "message": f"Database error: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/pets', methods=['GET'])
def get_pets():
    if 'user_id' not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    user_id = session['user_id']
    conn = get_db_connection()
    try:
        pets_rows = conn.execute('SELECT * FROM pets WHERE user_id = ?', (user_id,)).fetchall()
        pets_list = [dict(row) for row in pets_rows] # Convert Row objects to dictionaries
        return jsonify({"success": True, "pets": pets_list}), 200
    except sqlite3.Error as e:
        return jsonify({"success": False, "message": f"Database error: {e}"}), 500
    finally:
        if conn:
            conn.close()
