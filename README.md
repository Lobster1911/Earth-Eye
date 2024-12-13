# Satellite Tracking and Trajectory Prediction Web Application  (Earth Eye)

This web application enhances Space Situational Awareness (SSA) by providing **real-time satellite tracking**, **trajectory prediction**, and **rocket launch simulation**. It integrates traditional mathematical models and an experimental **LSTM machine learning model** for predictions, offering a user-friendly platform for researchers, professionals, and space enthusiasts.  

## Features  
- **Satellite Tracking:** Visualize satellite orbits in 3D using `Three.js` and `Satellite.js`.  
- **Trajectory Prediction:** Predict future satellite positions using SGP4 and LSTM models.  
- **Rocket Launch Simulation:** Simulate and visualize rocket trajectories based on user inputs and weather data.  
- **Data Export:** Download results in TXT, Excel, or TLE formats.  

## Technologies  
- **Frontend:** React, Three.js, React-Three-Fiber, Bootstrap  
- **Backend:** Flask, TensorFlow, NumPy, Skyfield  
- **APIs:** OpenWeatherMap, Space-Track  

## Setup  
1. Clone the repository:  
   ```bash  
   git clone [repository_url]  
   ```  
2. Install dependencies for the backend:  
   ```bash  
   pip install -r requirements.txt  
   ```  
3. Start the backend server:  
   ```bash  
   flask run  
   ```  
4. Navigate to the frontend directory, install dependencies, and start the React app:  
   ```bash  
   npm install  
   npm start  
   ```  

## Usage  
1. Navigate to the homepage.  
2. Use the **Satellite Tracking** tool for real-time tracking.  
3. Access **Trajectory Prediction** for specific satellites by NORAD ID.  
4. Run **Rocket Launch Simulation** with custom parameters.  

## Future Enhancements  
- Improved LSTM model accuracy with additional training data.  
- Real-time solar radiation pressure calculations.  
- Mobile responsiveness and performance optimization.  

 
