import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import * as satellite from 'satellite.js';
import 'leaflet/dist/leaflet.css';
import Header from './Head2';
import SatelliteInfoCard from './SatelliteCard';
import TimeDisplay from './TimeDisplay';
import SatelliteCharacteristicsModal from './SatelliteCharacteristicsModal'; // Import the modal component
import { Spinner } from 'react-bootstrap'; // Correctly import Spinner from react-bootstrap
import Footer from '../components/Footer'; // Import the Footer component

import satelliteIconImg from './tracking.png'; // Adjust the path accordingly

const RADIUS_EARTH_KM = 6371;

const degreesToRadians = (degrees) => degrees * (Math.PI / 180);

const latLonToVector3 = (lat, lon, height) => {
  const phi = degreesToRadians(90 - lat);
  const theta = degreesToRadians(lon);
  return {
    x: (RADIUS_EARTH_KM + height) * Math.sin(phi) * Math.cos(theta),
    y: (RADIUS_EARTH_KM + height) * Math.sin(phi) * Math.sin(theta),
    z: (RADIUS_EARTH_KM + height) * Math.cos(phi),
  };
};

// Define the custom satellite icon
const satelliteIcon = L.icon({
  iconUrl: satelliteIconImg,
  iconSize: [32, 32], // Adjust the size as needed
  iconAnchor: [16, 16], // Anchor the icon at the center
  popupAnchor: [0, -16], // Position the popup above the icon
});

const fetchSatelliteIdByName = async (satelliteName) => {
  try {
    const response = await fetch(`http://localhost:5000/api/search_satellite?name=${encodeURIComponent(satelliteName)}`);
    
    if (!response.ok) {
      throw new Error(`Network response was not ok, status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No satellite found with that name');
    }

    return Object.values(data)[0];
  } catch (error) {
    console.error('Error fetching satellite ID by name:', error);
    return null;
  }
};

const fetchTLEData = async (satelliteNameOrId) => {
  try {
    let satelliteId = satelliteNameOrId;

    if (isNaN(satelliteId)) {
      satelliteId = await fetchSatelliteIdByName(satelliteNameOrId);
      if (!satelliteId) {
        throw new Error('Could not find satellite with that name');
      }
    }

    const response = await fetch(`http://localhost:5000/api/tle?id=${satelliteId}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('TLE data not found in response');
    }

    const tle_line1 = data[0].TLE_LINE1;
    const tle_line2 = data[0].TLE_LINE2;

    if (!tle_line1 || !tle_line2) {
      throw new Error('Incomplete TLE data: TLE_LINE1 or TLE_LINE2 is missing');
    }

    if (tle_line1.length !== 69 || tle_line2.length !== 69) {
      throw new Error('Malformed TLE data: TLE lines are not the correct length');
    }

    return { tle_line1, tle_line2, ...data[0] };

  } catch (error) {
    console.error('Error fetching TLE data:', error);
    return null;
  }
};

const fetchMLPredictedCoordinates = async (inputData) => {
  try {
    const response = await fetch('http://localhost:5000/api/predict_trajectory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputData),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ML-based trajectory prediction');
    }

    const data = await response.json();
    return data; // Assuming the response contains the predicted coordinates
  } catch (error) {
    console.error('Error fetching ML-based trajectory prediction:', error);
    return null;
  }
};

const calculatePositions = (tle_line1, tle_line2, totalDuration = 6, intervalSeconds = 1) => {
  const satrec = satellite.twoline2satrec(tle_line1, tle_line2);
  const positions = [];
  const now = new Date();

  const numPositions = Math.floor((totalDuration * 3600) / intervalSeconds);

  for (let i = 0; i < numPositions; i++) {
    const time = new Date(now.getTime() + i * intervalSeconds * 1000);
    const positionAndVelocity = satellite.propagate(satrec, time);
    if (positionAndVelocity.position && !isNaN(positionAndVelocity.position.x)) {
      const gmst = satellite.gstime(time);
      const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
      const longitude = satellite.degreesLong(positionGd.longitude);
      const latitude = satellite.degreesLat(positionGd.latitude);
      const height = positionGd.height;

      if (!isNaN(latitude) && !isNaN(longitude)) {
        positions.push([latitude, longitude]);
      } else {
        console.error('Invalid position data: ', { latitude, longitude, height });
      }
    } else {
      console.error('Invalid position data during propagation:', positionAndVelocity);
    }
  }

  return positions;
};

const getCurrentPositionAndSpeed = (tle_line1, tle_line2) => {
  try {
    const satrec = satellite.twoline2satrec(tle_line1, tle_line2);
    const now = new Date();
    const positionAndVelocity = satellite.propagate(satrec, now);
    if (positionAndVelocity.position && !isNaN(positionAndVelocity.position.x) && positionAndVelocity.velocity) {
      const gmst = satellite.gstime(now);
      const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
      const longitude = satellite.degreesLong(positionGd.longitude);
      const latitude = satellite.degreesLat(positionGd.latitude);
      const height = positionGd.height;

      const velocity = positionAndVelocity.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z) * 3600; // Convert km/s to km/h

      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { position: [latitude, longitude], speed };
      } else {
        console.error('Invalid current position data: ', { latitude, longitude, height });
        return null;
      }
    } else {
      console.error('Invalid current position data during propagation:', positionAndVelocity);
      return null;
    }
  } catch (error) {
    console.error('Error getting current position:', error);
    return null;
  }
};

const isSignificantChange = (prevTLE, newTLE) => {
  return prevTLE.tle_line1 !== newTLE.tle_line1 || prevTLE.tle_line2 !== newTLE.tle_line2;
};

const MapTrack = () => {
  const [positions, setPositions] = useState([]);
  const [satelliteName, setSatelliteName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [satelliteInfo, setSatelliteInfo] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [predictedData, setPredictedData] = useState(null); // State to store predicted data
  const [modalShow, setModalShow] = useState(false);
  const [solarRadiationPressure, setSolarRadiationPressure] = useState(null);
  const prevTLE = useRef({ tle_line1: '', tle_line2: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (!satelliteName) return;

      setLoading(true);
      setError(null);

      const data = await fetchTLEData(satelliteName);
      if (!data) {
        setError('Could not fetch TLE data or Check your ProxyandRequest.py');
        setLoading(false);
        setPositions([]);
        setSatelliteInfo(null);
        return;
      }

      const { tle_line1, tle_line2, ...info } = data;

      if (!prevTLE.current.tle_line1 || !prevTLE.current.tle_line2 || isSignificantChange(prevTLE.current, { tle_line1, tle_line2 })) {
        console.log('Updating positions due to significant TLE change.');
        prevTLE.current = { tle_line1, tle_line2 };
        setSatelliteInfo(info);
        const positions = calculatePositions(tle_line1, tle_line2, 6, 1);
        setPositions(positions);

        // Fetch ML predicted coordinates
        const predicted = await fetchMLPredictedCoordinates({
          x: positions[0][0],
          y: positions[0][1],
          z: positions[0][2],
          Vx: 0,
          Vy: 0,
          Vz: 0,
        });
        setPredictedData(predicted);

      } else {
        console.log('No significant change in TLE data.');
      }

      setError(null);
      setLoading(false);
    };

    fetchData();

    const intervalId = setInterval(() => {
      const currentPosAndSpeed = getCurrentPositionAndSpeed(prevTLE.current.tle_line1, prevTLE.current.tle_line2);
      if (currentPosAndSpeed) {
        console.log('Updated current position and speed:', currentPosAndSpeed);
        setCurrentData(currentPosAndSpeed);
      }
    }, 1000);

    const tleUpdateId = setInterval(fetchData, 60000);

    return () => {
      clearInterval(intervalId);
      clearInterval(tleUpdateId);
    };
  }, [satelliteName]);

  const handleSearch = (query) => {
    setSatelliteName(query);
  };

  const handleUserInputSubmit = ({ crossSectionalArea, reflectivity, mass }) => {
    const solarConstant = 1361;
    const speedOfLight = 3e8;

    const pressure = (2 * solarConstant * (1 + reflectivity) * crossSectionalArea) / (speedOfLight * mass);

    console.log("Calculated Solar Radiation Pressure:", pressure);

    setSolarRadiationPressure(pressure);
  };

  return (
    <div style={styles.container}>
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        handleSearch={handleSearch} 
      />
      <div style={styles.content}>
        {loading && (
          <div style={styles.loading}>
            <Spinner animation="border" role="status">
              <span className="sr-only"></span>
            </Spinner>
          </div>
        )}
        {error && (
          <div style={styles.error}>
            <p>{error}</p>
          </div>
        )}
        <MapContainer center={[0, 0]} zoom={2} style={styles.mapContainer}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.carto.com/attributions">CARTO'
          />
          {positions.length > 0 && (
            <>
              <Polyline positions={positions} color="white" weight={0.5} opacity={1}/>
              {currentData && (
                <Marker position={currentData.position} icon={satelliteIcon}>
                  <Popup>
                    <div>
                      <p>Current Position: {currentData.position[0].toFixed(2)}, {currentData.position[1].toFixed(2)}</p>
                      <p>Current Speed: {currentData.speed.toFixed(2)} km/h</p>
                      {predictedData && (
                        <div>
                          <p>Predicted Trajectory with LTSM (Experimental):</p>
                          <p>X: {predictedData.x_pred.toFixed(2)}</p>
                          <p>Y: {predictedData.y_pred.toFixed(2)}</p>
                          <p>Z: {predictedData.z_pred.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          )}
        </MapContainer>
        {satelliteInfo && (
          <SatelliteInfoCard 
            satelliteInfo={satelliteInfo} 
            onCharacteristicsSubmit={() => setModalShow(true)} 
          />
        )}
        <TimeDisplay />
      </div>
      <SatelliteCharacteristicsModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
        handleSubmit={handleUserInputSubmit}
        solarRadiationPressure={solarRadiationPressure}
      />
      <Footer />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#222',
    color: '#fff',
    minHeight: '100vh',
  },
  content: {
    display: 'flex',
    width: '100%',
    position: 'relative',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
  },
  error: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: 'red',
    padding: '10px',
    borderRadius: '5px',
  },
  mapContainer: {
    flex: 1,
    height: 'calc(100vh - 70px)',
  },
};

export default MapTrack;
