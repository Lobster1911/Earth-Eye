import React from 'react';
import './HomePage.css';
import backgroundVideo from './EarthISS.mp4';
import Header from '../components/Header';  // Import the Header component

function HomePage() {
    return (
        <div className="homepage">
            <Header />  {/* Add the Header component here */}
            <video autoPlay muted loop className="background-video">
                <source src={backgroundVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="content">
                <h1>EARTH EYE</h1>
                <p>
                "Explore the dynamic world of satellite tracking with our real-time 3D web app. 
                 Monitor satellite paths, predict trajectories, and gain insights
                 into Earth's orbit like never before. Start your journey into space today!"
                </p>
                <p>A Project by Parikshit Padole </p>
            </div>
        </div>
    );
}

export default HomePage;
