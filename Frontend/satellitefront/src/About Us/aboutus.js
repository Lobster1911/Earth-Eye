import React from 'react';
import './aboutus.css';
import backgroundVideo from '../About Us/Video.mp4'; // Adjust the path accordingly
import Header from '../components/Header';  // Import the Header component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';

function AboutUs() {
    return (
        <div className="about-us">
            <Header />  {/* Add the Header component here */}
            <video autoPlay muted loop className="about-video">
                <source src={backgroundVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="about-content">
                <h2>About Us</h2>
                <p>
                    Earth Eye is your portal to explore our planet, solar system, and beyond. 
                    Our mission is to provide an immersive, real-time 3D web experience that 
                    allows users to view Earth and its surroundings in stunning detail. 
                    Whether you're interested in observing nearby asteroids, tracking 
                    spacecraft, or simply marveling at the beauty of our universe, Earth Eye 
                    has something for everyone.
                </p>
                <p>
                    We leverage the latest technologies to bring you accurate, up-to-date 
                    information about celestial objects and human-made satellites orbiting 
                    our planet. Our team of dedicated professionals works tirelessly to 
                    ensure you have the best possible experience, whether you're a casual 
                    observer or a serious astronomer.
                </p>
                <p>
                    A Project by Parikshit Padole 
                </p>
                <div className="social-links">
                    <a href="https://github.com/Lobster1911" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faGithub} />
                    </a>
                    <a href="https://www.linkedin.com/in/parikshitpadole/" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faLinkedin} />
                    </a>
                    <a href="https://www.instagram.com/parikshit_1911?igsh=ZTlid3VhMTZkZnly" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faInstagram} />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default AboutUs;
