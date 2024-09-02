from flask import Flask, request, jsonify
import numpy as np
import requests
from flask_cors import CORS
import configparser
import json
import logging
from skyfield.api import load, EarthSatellite, Topos
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import joblib
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)
CORS(app)

# Load configuration
config = configparser.ConfigParser()
config.read("D:\\Satellite Tracking and Trajectory Prediction Web - Application\\Backend\\Proxy\\config.ini")

try:
    configUsr = config.get("configuration", "username")
    configPwd = config.get("configuration", "password")
except configparser.NoSectionError as e:
    raise Exception(f"Configuration section missing: {e}")
except configparser.NoOptionError as e:
    raise Exception(f"Configuration option missing: {e}")

siteCred = {'identity': configUsr, 'password': configPwd}

uriBase = "https://www.space-track.org"
requestLogin = "/ajaxauth/login"
requestCmdAction = "/basicspacedata/query"


# Register the custom function
def mse(y_true, y_pred):
    return tf.keras.losses.MeanSquaredError()(y_true, y_pred)

tf.keras.utils.get_custom_objects().update({"mse": mse})

# Load the model
model = load_model("D:\\Trajectory model\\satellite_trajectory_model.h5")




# Function to load satellite data from file
def load_satellite_data(file_path):
    satellite_dict = {}
    with open(file_path, "r") as file:
        for line in file:
            # Each line is expected to be in the format: "Satellite Name": "NORAD_ID",
            try:
                name, norad_id = line.strip().split(":")
                # Remove quotes and comma
                name = name.strip().strip('"')
                norad_id = norad_id.strip().strip('",')
                satellite_dict[name] = norad_id
            except ValueError:
                continue  # Skip lines that don't match the expected format
    return satellite_dict

# Load the satellite data from the file
satellite_data = load_satellite_data("Backend\\Proxy\\satellite_data.txt")

@app.route('/', methods=['GET'])
def home():
    print("Proxy Works!")
    return "Proxy Works!", 200

#---------------------Trajectory Prediction---------------------------------------

@app.route('/api/search_satellite', methods=['GET'])
def search_satellite():
    query = request.args.get('name', '').lower()
    if not query:
        return jsonify({'error': 'Satellite name is required'}), 400

    # Normalize and search in the satellite data dictionary
    matching_satellites = {name: id for name, id in satellite_data.items() if query in name.lower()}

    if not matching_satellites:
        return jsonify({'error': f'No satellite found with name containing "{query}"'}), 404

    return jsonify(matching_satellites)

@app.route('/api/tle', methods=['GET'])
def get_tle():
    satellite_identifier = request.args.get('id')

    # Check if the input is a name by searching in the satellite data dictionary
    if not satellite_identifier.isdigit():
        satellite_id = satellite_data.get(satellite_identifier)
        if not satellite_id:
            return jsonify({'error': 'Satellite name not found'}), 404
    else:
        satellite_id = satellite_identifier

    if not satellite_id:
        return jsonify({'error': 'Satellite ID or name is required'}), 400

    with requests.Session() as session:
        try:
            # Login
            resp = session.post(uriBase + requestLogin, data=siteCred)
            if resp.status_code != 200:
                raise Exception("POST fail on login")

            # Fetch TLE data
            tle_url = f"{uriBase}{requestCmdAction}/class/tle_latest/NORAD_CAT_ID/{satellite_id}/orderby/ORDINAL%20asc/limit/1/format/json"
            resp = session.get(tle_url)
            if resp.status_code != 200:
                raise Exception(f"GET fail on request for satellite {satellite_id}")

            # Parse response
            data = json.loads(resp.text)
            if not data:
                return jsonify({'error': 'TLE data not found'}), 404

            return jsonify(data)

        except Exception as e:
            return jsonify({'error': str(e)}), 500


#------------------------------Trajectory Prediction Using LTSM(Experimental)-----------------------------------------------

# Load the saved scaler
scaler_path = "D:\\Trajectory model\\scaler.pkl"
scaler = joblib.load(scaler_path)

@app.route('/api/predict_trajectory', methods=['POST'])
def predict_trajectory():
    data = request.json
    logging.info(f"Received data: {data}")

    # Provide default values for missing keys (if any)
    x = data.get('x', 0.0)
    y = data.get('y', 0.0)
    z = data.get('z', 0.0)
    Vx = data.get('Vx', 0.0)
    Vy = data.get('Vy', 0.0)
    Vz = data.get('Vz', 0.0)

    # Extract features from the request
    input_data = np.array([x, y, z, Vx, Vy, Vz]).reshape(1, -1)

    # Transform the input data using the loaded scaler
    input_data_scaled = scaler.transform(input_data)

    # Reshape the data to fit the LSTM input format (1, sequence_length, num_features)
    sequence_length = 10  # Adjust to the sequence length used during training
    input_sequence = np.array([input_data_scaled] * sequence_length).reshape(1, sequence_length, 6)

    # Predict the trajectory using the model
    predictions_scaled = model.predict(input_sequence)

    # Inverse transform to get actual values
    predictions = scaler.inverse_transform(predictions_scaled)

    # Convert predictions to Python's native float type
    response = {
        'x_pred': float(predictions[0][0]),
        'y_pred': float(predictions[0][1]),
        'z_pred': float(predictions[0][2]),
        'Vx_pred': float(predictions[0][3]),
        'Vy_pred': float(predictions[0][4]),
        'Vz_pred': float(predictions[0][5]),
    }

    return jsonify(response)


#---------------------------------Rocket Launch Simulation---------------------------------------------

# New route to calculate satellite position using Skyfield
# Load your weather API key
WEATHER_API_KEY = 'b6275b12c65c90ec2895ded4d1d69855'  # Replace with your actual API key

@app.route('/api/launch-simulation', methods=['POST'])
def launch_simulation():
    data = request.json

    # Existing inputs
    rocket_name = data.get('rocket_name')
    launch_date = data.get('launch_date')
    launch_site = data.get('launch_site')
    payload_mass = data.get('payload_mass')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    # New inputs
    thrust = data.get('thrust')
    isp = data.get('isp')
    drag_coefficient = data.get('drag_coefficient')
    launch_angle = data.get('launch_angle')
    fuel_mass = data.get('fuel_mass')

    # Fetch weather data using the provided latitude and longitude
    weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={WEATHER_API_KEY}"
    weather_response = requests.get(weather_url)
    if weather_response.status_code != 200:
        return jsonify({'error': 'Failed to fetch weather data from the API'}), 500
    
    weather_data = weather_response.json()

    # Extract wind speed and temperature from the weather data
    wind_speed = weather_data.get('wind', {}).get('speed')
    temperature = weather_data.get('main', {}).get('temp')

    # Ensure that wind_speed and temperature are not None
    if wind_speed is None or temperature is None:
        return jsonify({'error': 'Weather data is incomplete or unavailable'}), 500

    # Call the enhanced simulation function
    trajectory_data = simulate_trajectory(payload_mass, wind_speed, temperature, thrust, isp, drag_coefficient, launch_angle, fuel_mass)

    response_data = {
        'rocket_name': rocket_name,
        'launch_date': launch_date,
        'launch_site': launch_site,
        'payload_mass': payload_mass,
        'weather': {
            'wind_speed': wind_speed,
            'temperature': temperature,
            'wind_direction': weather_data.get('wind', {}).get('deg', 'N/A'),  # Optional
            'cloudiness': weather_data.get('clouds', {}).get('all', 'N/A')  # Optional
        },
        'trajectory': trajectory_data
    }

    return jsonify(response_data)

def simulate_trajectory(payload_mass, wind_speed, temperature, thrust, isp, drag_coefficient, launch_angle, fuel_mass):
    # Constants
    g = 9.81  # Gravity (m/s^2)
    burn_time = fuel_mass / (thrust / (isp * g))  # Simplified burn time calculation

    # Mock simulation data (replace with real calculations)
    time_s = np.linspace(0, burn_time, num=100)
    altitude_km = np.cumsum(np.linspace(0, 0.01, num=100))  # Simplified altitude progression
    velocity_km_s = np.cumsum(np.linspace(0, 0.02, num=100))  # Simplified velocity progression
    latitude_deg = np.cumsum(np.linspace(0, 0.001, num=100))  # Simplified latitude progression
    longitude_deg = np.cumsum(np.linspace(0, 0.001, num=100))  # Simplified longitude progression
    acceleration_m_s2 = np.gradient(velocity_km_s)  # Simplified acceleration calculation

    # Apply weather effects (e.g., drag, wind)
    altitude_km -= wind_speed * drag_coefficient * 0.1  # Simplified effect of wind on altitude

    trajectory = {
        'time_s': time_s.tolist(),
        'altitude_km': altitude_km.tolist(),
        'velocity_km_s': velocity_km_s.tolist(),
        'latitude_deg': latitude_deg.tolist(),
        'longitude_deg': longitude_deg.tolist(),
        'acceleration_m_s2': acceleration_m_s2.tolist()
    }

    return trajectory

if __name__ == '__main__':
    app.run(port=5000)
