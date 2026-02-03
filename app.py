from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import requests
import sqlite3
import hashlib
from datetime import datetime, timedelta
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

# OpenWeatherMap API key - You need to get this from openweathermap.org
WEATHER_API_KEY = 'aefd2427e1f31bd91e3457cc0993768f'
WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

def init_db():
    """Initialize the database"""
    conn = sqlite3.connect('weather_app.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def login_required(f):
    """Decorator to require login for certain routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_weather_data(city):
    """Get current weather data from OpenWeatherMap API"""
    try:
        url = f"{WEATHER_BASE_URL}/weather"
        params = {
            'q': city,
            'appid': WEATHER_API_KEY,
            'units': 'metric'
        }
        response = requests.get(url, params=params)
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error fetching weather data: {e}")
        return None

def get_forecast_data(city):
    """Get 5-day weather forecast from OpenWeatherMap API"""
    try:
        url = f"{WEATHER_BASE_URL}/forecast"
        params = {
            'q': city,
            'appid': WEATHER_API_KEY,
            'units': 'metric'
        }
        response = requests.get(url, params=params)
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error fetching forecast data: {e}")
        return None

def predict_rainfall(weather_data, forecast_data):
    """Simple rainfall prediction based on weather conditions"""
    predictions = []
    
    if weather_data and 'weather' in weather_data:
        current_condition = weather_data['weather'][0]['main'].lower()
        humidity = weather_data.get('main', {}).get('humidity', 0)
        
        # Simple prediction logic
        rain_probability = 0
        if 'rain' in current_condition:
            rain_probability = 80
        elif 'cloud' in current_condition:
            rain_probability = min(60, humidity * 0.6)
        elif humidity > 70:
            rain_probability = min(40, humidity * 0.4)
        else:
            rain_probability = 10
            
        predictions.append({
            'day': 'Today',
            'probability': rain_probability,
            'condition': weather_data['weather'][0]['description'].title()
        })
    
    if forecast_data and 'list' in forecast_data:
        for i, item in enumerate(forecast_data['list'][:5]):
            if i == 0:
                continue  # Skip today as we already have it
                
            condition = item['weather'][0]['main'].lower()
            humidity = item['main']['humidity']
            
            rain_prob = 0
            if 'rain' in condition:
                rain_prob = 75 + (humidity - 50) * 0.3
            elif 'cloud' in condition:
                rain_prob = min(55, humidity * 0.55)
            elif humidity > 65:
                rain_prob = min(35, humidity * 0.35)
            else:
                rain_prob = 5
                
            date = datetime.fromtimestamp(item['dt'])
            predictions.append({
                'day': date.strftime('%A'),
                'date': date.strftime('%Y-%m-%d'),
                'probability': min(95, max(5, rain_prob)),
                'condition': item['weather'][0]['description'].title()
            })
    
    return predictions

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        if not username or not email or not password:
            flash('All fields are required!')
            return render_template('register.html')
        
        try:
            conn = sqlite3.connect('weather_app.db')
            c = conn.cursor()
            c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                     (username, email, hash_password(password)))
            conn.commit()
            conn.close()
            flash('Registration successful! Please log in.')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username or email already exists!')
            return render_template('register.html')
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = sqlite3.connect('weather_app.db')
        c = conn.cursor()
        c.execute('SELECT id, username FROM users WHERE username = ? AND password = ?',
                 (username, hash_password(password)))
        user = c.fetchone()
        conn.close()
        
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password!')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', username=session['username'])

@app.route('/weather', methods=['POST'])
@login_required
def get_weather():
    city = request.form.get('city', '').strip()
    if not city:
        return jsonify({'error': 'City name is required'})
    
    weather_data = get_weather_data(city)
    forecast_data = get_forecast_data(city)
    
    if not weather_data:
        return jsonify({'error': 'City not found or API error'})
    
    predictions = predict_rainfall(weather_data, forecast_data)
    
    return jsonify({
        'current': weather_data,
        'forecast': forecast_data,
        'predictions': predictions
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True)