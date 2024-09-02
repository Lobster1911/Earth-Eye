import React, { useState } from 'react';
import axios from 'axios';
import Header from '../components/Header'; // Adjust the import path according to your file structure
import '../Launch Trajectory/launch.css';
import { Line } from 'react-chartjs-2';
import { CSVLink } from 'react-csv';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register the scales, components, and the zoom plugin with Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    zoomPlugin
);

function LaunchSimulationForm() {
    const [rocketName, setRocketName] = useState('');
    const [launchDate, setLaunchDate] = useState('');
    const [launchSite, setLaunchSite] = useState('');
    const [payloadMass, setPayloadMass] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [thrust, setThrust] = useState('');  // New state for thrust
    const [isp, setIsp] = useState('');  // New state for specific impulse
    const [fuelMass, setFuelMass] = useState('');  // New state for fuel mass
    const [dragCoefficient, setDragCoefficient] = useState('');  // New state for drag coefficient
    const [launchAngle, setLaunchAngle] = useState('');  // New state for launch angle
    const [simulationResult, setSimulationResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            rocket_name: rocketName,
            launch_date: new Date(launchDate).toISOString(),
            launch_site: launchSite,
            payload_mass: parseFloat(payloadMass),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            thrust: parseFloat(thrust),
            isp: parseFloat(isp),
            fuel_mass: parseFloat(fuelMass),
            drag_coefficient: parseFloat(dragCoefficient),
            launch_angle: parseFloat(launchAngle),
        };

        try {
            const response = await axios.post('http://localhost:5000/api/launch-simulation', data);
            setSimulationResult(response.data);
        } catch (error) {
            console.error('Error running simulation:', error);
            setSimulationResult({ error: 'Simulation failed. Please check the inputs or try again later.' });
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = () => {
        if (!simulationResult || !simulationResult.trajectory) return null;

        return {
            labels: simulationResult.trajectory.time_s,
            datasets: [
                {
                    label: 'Altitude (km)',
                    data: simulationResult.trajectory.altitude_km,
                    borderColor: 'rgba(75,192,192,1)',
                    fill: false,
                },
                {
                    label: 'Velocity (km/s)',
                    data: simulationResult.trajectory.velocity_km_s,
                    borderColor: 'rgba(153,102,255,1)',
                    fill: false,
                },
                {
                    label: 'Acceleration (m/s²)',
                    data: simulationResult.trajectory.acceleration_m_s2,
                    borderColor: 'rgba(255,99,132,1)',
                    fill: false,
                },
            ],
        };
    };

    const exportCSVData = () => {
        if (!simulationResult || !simulationResult.trajectory) return [];

        const headers = [
            { label: 'Time (s)', key: 'time_s' },
            { label: 'Altitude (km)', key: 'altitude_km' },
            { label: 'Velocity (km/s)', key: 'velocity_km_s' },
            { label: 'Latitude (°)', key: 'latitude_deg' },
            { label: 'Longitude (°)', key: 'longitude_deg' },
            { label: 'Acceleration (m/s²)', key: 'acceleration_m_s2' },
        ];

        const rows = simulationResult.trajectory.time_s.map((_, i) => ({
            time_s: simulationResult.trajectory.time_s[i],
            altitude_km: simulationResult.trajectory.altitude_km[i],
            velocity_km_s: simulationResult.trajectory.velocity_km_s[i],
            latitude_deg: simulationResult.trajectory.latitude_deg[i],
            longitude_deg: simulationResult.trajectory.longitude_deg[i],
            acceleration_m_s2: simulationResult.trajectory.acceleration_m_s2[i],
        }));

        return { headers, data: rows };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: 'xy',
                },
            },
        },
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Time (s)',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Value',
                },
            },
        },
    };

    return (
        <div className="page-container">
            <Header />
            <div className="content-container">
                <div className="form-card">
                    <h1 className="form-title">Rocket Launch Simulation</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Rocket Name</label>
                            <input
                                type="text"
                                value={rocketName}
                                onChange={(e) => setRocketName(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Launch Date</label>
                            <input
                                type="datetime-local"
                                value={launchDate}
                                onChange={(e) => setLaunchDate(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Launch Site</label>
                            <input
                                type="text"
                                value={launchSite}
                                onChange={(e) => setLaunchSite(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Payload Mass (kg)</label>
                            <input
                                type="number"
                                value={payloadMass}
                                onChange={(e) => setPayloadMass(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Latitude</label>
                            <input
                                type="number"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                required
                                className="form-control"
                                step="any"
                            />
                        </div>

                        <div className="form-group">
                            <label>Longitude</label>
                            <input
                                type="number"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                required
                                className="form-control"
                                step="any"
                            />
                        </div>

                        <div className="form-group">
                            <label>Thrust (N)</label>
                            <input
                                type="number"
                                value={thrust}
                                onChange={(e) => setThrust(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Specific Impulse (s)</label>
                            <input
                                type="number"
                                value={isp}
                                onChange={(e) => setIsp(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Fuel Mass (kg)</label>
                            <input
                                type="number"
                                value={fuelMass}
                                onChange={(e) => setFuelMass(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>Drag Coefficient (Cd)</label>
                            <input
                                type="number"
                                value={dragCoefficient}
                                onChange={(e) => setDragCoefficient(e.target.value)}
                                required
                                className="form-control"
                                step="any"
                            />
                        </div>

                        <div className="form-group">
                            <label>Launch Angle (degrees)</label>
                            <input
                                type="number"
                                value={launchAngle}
                                onChange={(e) => setLaunchAngle(e.target.value)}
                                required
                                className="form-control"
                            />
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Loading...' : 'Run Simulation'}
                        </button>
                    </form>
                </div>

                {simulationResult && (
                    <div className="result-card">
                        {simulationResult.error ? (
                            <p className="error-message">{simulationResult.error}</p>
                        ) : (
                            <>
                                <h2 className="form-title">Simulation Results</h2>
                                <div className="result-details">
                                    <p><strong>Rocket Name:</strong> {simulationResult.rocket_name}</p>
                                    <p><strong>Launch Date:</strong> {new Date(simulationResult.launch_date).toLocaleString()}</p>
                                    <p><strong>Launch Site:</strong> {simulationResult.launch_site}</p>
                                    <p><strong>Payload Mass:</strong> {simulationResult.payload_mass} kg</p>
                                    
                                    {simulationResult.weather ? (
                                        <>
                                            <p><strong>Weather Conditions:</strong></p>
                                            <p>Wind Speed: {simulationResult.weather.wind_speed} m/s</p>
                                            <p>Temperature: {simulationResult.weather.temperature} K</p>
                                            <p>Wind Direction: {simulationResult.weather.wind_direction}°</p>
                                            <p>Cloudiness: {simulationResult.weather.cloudiness}%</p>
                                        </>
                                    ) : (
                                        <p><strong>Weather data is unavailable.</strong></p>
                                    )}
                                </div>

                                <h3>Trajectory Data</h3>
                                <div className="chart-container">
                                    <Line data={generateChartData()} options={chartOptions} />
                                </div>

                                <div className="export-container">
                                    <CSVLink {...exportCSVData()} filename={`trajectory_data_${rocketName}.csv`}>
                                        <button className="btn-export">Export Data to CSV</button>
                                    </CSVLink>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default LaunchSimulationForm;
