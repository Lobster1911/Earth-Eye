import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const SatelliteCharacteristicsModal = ({ show, handleClose, handleSubmit, solarRadiationPressure }) => {
  const [crossSectionalArea, setCrossSectionalArea] = useState('');
  const [reflectivity, setReflectivity] = useState('');
  const [mass, setMass] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted"); // Debugging log
    handleSubmit({
      crossSectionalArea: parseFloat(crossSectionalArea),
      reflectivity: parseFloat(reflectivity),
      mass: parseFloat(mass),
    });
  };

  useEffect(() => {
    if (show) {
      console.log("Modal opened"); // Debugging log
      setCrossSectionalArea('');
      setReflectivity('');
      setMass('');
    }
  }, [show]);

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Satellite Characteristics</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onSubmit}>
          <Form.Group>
            <Form.Label>Cross-Sectional Area (m²)</Form.Label>
            <Form.Control
              type="number"
              value={crossSectionalArea}
              onChange={(e) => setCrossSectionalArea(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Reflectivity</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={reflectivity}
              onChange={(e) => setReflectivity(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Mass (kg)</Form.Label>
            <Form.Control
              type="number"
              value={mass}
              onChange={(e) => setMass(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
        {solarRadiationPressure !== null && solarRadiationPressure !== undefined && (
          <div className="mt-3">
            <h5>Calculated Solar Radiation Pressure: {solarRadiationPressure.toFixed(6)} N/m²</h5>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SatelliteCharacteristicsModal;
