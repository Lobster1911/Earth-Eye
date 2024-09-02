import React from 'react';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';

function StationCard({ station, onRemoveClick, onClick, detailed }) {
    return (
        <Card className='mb-2' onClick={() => onClick(station)}>
            <Card.Body className='d-flex justify-content-between align-items-center'>
                <div>
                    <span>{station.name}</span>
                    {detailed && (
                        <div>
                            <p>ID: {station.satrec.satnum}</p>
                            <p>Launch Date: {station.launchDate || 'Unknown'}</p>
                            <p>Altitude: {station.altitude || 'Unknown'} km</p>
                            {/* Add more details as needed */}
                        </div>
                    )}
                </div>
                <Button 
                    variant='danger' 
                    size='sm' 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onRemoveClick(station); 
                    }}>
                    X
                </Button>
            </Card.Body>
        </Card>
    );
}

export default function SelectedStations({ selected, onRemoveStation, onRemoveAll, onStationClick, detailedStation }) {
    if (!selected || selected.length === 0) return null;

    return (
        <div style={{ position: 'fixed', top: '10%', right: '2%', width: '300px', zIndex: 1000 }}>
            <Container className='bg-dark text-white p-3 rounded'>
                <Row className='mb-3'>
                    <Col>
                        <h5>Selected</h5>
                    </Col>
                    <Col className='text-right'>
                        <Button 
                            variant='outline-light' 
                            size='sm' 
                            onClick={onRemoveAll}>
                            Clear all
                        </Button>
                    </Col>
                </Row>
                {selected.map((station, i) => (
                    <StationCard 
                        station={station} 
                        key={station.name + i} 
                        onRemoveClick={onRemoveStation}
                        onClick={onStationClick}
                        detailed={detailedStation && detailedStation.name === station.name}  // Show detailed info if this is the selected card
                    />
                ))}
            </Container>
        </div>
    );
}
