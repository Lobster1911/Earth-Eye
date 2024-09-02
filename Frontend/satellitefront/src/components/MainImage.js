import React from 'react';
import earthImage from '../components/Earth.jpg'; // Adjust the path as necessary

function MainImage() {
    return (
        <div style={{ height: 'calc(100vh - 60px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={earthImage} alt="Earth from Space" style={{ width: '90%', maxWidth: '100%', height: 'auto' }} />
        </div>
    );
}

export default MainImage;

