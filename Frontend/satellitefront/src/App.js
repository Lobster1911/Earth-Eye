// src/App.js
import React, { Component } from 'react';
import { Route, Routes } from 'react-router-dom';
import "./assets/theme.css";
import HomePage from './HomePage/HomePage';
import Globe from './Globe';
import MapTrack from './Trajectory Prediction/MapTrack';
import AboutUs from './About Us/aboutus';
import LaunchSimulationForm  from './Launch Trajectory/launch';

class App extends Component {
  render() {
    const tleLine1 = '1 25544U 98067A   20348.54791667  .00001288  00000-0  29694-4 0  9993';
    const tleLine2 = '2 25544  51.6442  21.0196 0002073  13.2413 346.8983 15.48911950257257';

    return (
      <div>
        <Routes>
          <Route exact path="/" element={<HomePage />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/globe" element={<Globe />} />
          <Route path="/track" element={<MapTrack tleLine1={tleLine1} tleLine2={tleLine2} />} />
          <Route path="/launch-simulation" element={<LaunchSimulationForm />} />
        </Routes>
      </div>
    );
  }
}

export default App;


//Name: Parikshit Padole 
//StudentID: B00871677
