import React, { useState } from 'react';
import { Card, Dropdown, DropdownButton, ListGroup, Button } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';
import SatelliteCharacteristicsModal from './SatelliteCharacteristicsModal';

const SatelliteInfoCard = ({ satelliteInfo, onCharacteristicsSubmit }) => {
  const [modalShow, setModalShow] = useState(false);

  if (!satelliteInfo) {
    return null;
  }

  const {
    OBJECT_NAME,
    NORAD_CAT_ID,
    OBJECT_TYPE,
    INTLDES,
    EPOCH,
    INCLINATION,
    RA_OF_ASC_NODE,
    ECCENTRICITY,
    ARG_OF_PERICENTER,
    MEAN_ANOMALY,
    MEAN_MOTION,
    SEMIMAJOR_AXIS,
    PERIOD,
    APOGEE,
    PERIGEE,
  } = satelliteInfo;

  const handleDownload = (type) => {
    const data = [
      ['Satellite Name', OBJECT_NAME],
      ['NORAD Catalog ID', NORAD_CAT_ID],
      ['Type', OBJECT_TYPE],
      ['International Designator', INTLDES],
      ['Epoch', EPOCH],
      ['Inclination', `${INCLINATION}°`],
      ['RA of Ascending Node', `${RA_OF_ASC_NODE}°`],
      ['Eccentricity', ECCENTRICITY],
      ['Argument of Perigee', `${ARG_OF_PERICENTER}°`],
      ['Mean Anomaly', `${MEAN_ANOMALY}°`],
      ['Mean Motion', `${MEAN_MOTION} revs/day`],
      ['Semimajor Axis', `${SEMIMAJOR_AXIS} km`],
      ['Period', `${PERIOD} min`],
      ['Apogee', `${APOGEE} km`],
      ['Perigee', `${PERIGEE} km`],
    ];

    switch (type) {
      case 'TXT':
        const textData = data.map(row => `${row[0]}: ${row[1]}`).join('\n');
        const textBlob = new Blob([textData], { type: 'text/plain' });
        saveAs(textBlob, `${OBJECT_NAME}_info.txt`);
        break;
      case 'PDF':
        const doc = new jsPDF();
        let y = 10;
        data.forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, 10, y);
          y += 10;
        });
        doc.save(`${OBJECT_NAME}_info.pdf`);
        break;
      case 'Excel':
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Info');
        XLSX.writeFile(workbook, `${OBJECT_NAME}_info.xlsx`);
        break;
      case 'TLE':
        const tleData = `TLE Line 1\nTLE Line 2`; // Placeholder
        const tleBlob = new Blob([tleData], { type: 'text/plain' });
        saveAs(tleBlob, `${OBJECT_NAME}_tle.txt`);
        break;
      default:
        break;
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Body>
        <Card.Title>{OBJECT_NAME}</Card.Title>
        <ListGroup variant="flush" style={styles.listGroup}>
          <ListGroup.Item><strong>NORAD Catalog ID:</strong> {NORAD_CAT_ID}</ListGroup.Item>
          <ListGroup.Item><strong>Object Type:</strong> {OBJECT_TYPE}</ListGroup.Item>
          <ListGroup.Item><strong>International Designator:</strong> {INTLDES}</ListGroup.Item>
          <ListGroup.Item><strong>Epoch:</strong> {EPOCH}</ListGroup.Item>
          <ListGroup.Item><strong>Inclination:</strong> {INCLINATION}°</ListGroup.Item>
          <ListGroup.Item><strong>RA of Ascending Node:</strong> {RA_OF_ASC_NODE}°</ListGroup.Item>
          <ListGroup.Item><strong>Eccentricity:</strong> {ECCENTRICITY}</ListGroup.Item>
          <ListGroup.Item><strong>Argument of Perigee:</strong> {ARG_OF_PERICENTER}°</ListGroup.Item>
          <ListGroup.Item><strong>Mean Anomaly:</strong> {MEAN_ANOMALY}°</ListGroup.Item>
          <ListGroup.Item><strong>Mean Motion:</strong> {MEAN_MOTION} revs/day</ListGroup.Item>
          <ListGroup.Item><strong>Semimajor Axis:</strong> {SEMIMAJOR_AXIS} km</ListGroup.Item>
          <ListGroup.Item><strong>Period:</strong> {PERIOD} min</ListGroup.Item>
          <ListGroup.Item><strong>Apogee:</strong> {APOGEE} km</ListGroup.Item>
          <ListGroup.Item><strong>Perigee:</strong> {PERIGEE} km</ListGroup.Item>
        </ListGroup>
        <DropdownButton
          id="dropdown-basic-button"
          title="Download Info"
          variant="primary"
          align="end"
          className="mt-2"
        >
          <Dropdown.Item onClick={() => handleDownload('TXT')}>Download as TXT</Dropdown.Item>
          <Dropdown.Item onClick={() => handleDownload('PDF')}>Download as PDF</Dropdown.Item>
          <Dropdown.Item onClick={() => handleDownload('Excel')}>Download as Excel</Dropdown.Item>
          <Dropdown.Item onClick={() => handleDownload('TLE')}>Download as TLE</Dropdown.Item>
        </DropdownButton>
        <Button variant="secondary" className="mt-3" onClick={() => setModalShow(true)}>
          Enter Characteristics
        </Button>
      </Card.Body>
      <SatelliteCharacteristicsModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
        handleSubmit={onCharacteristicsSubmit} // Pass the onCharacteristicsSubmit function
      />
    </Card>
  );
};

const styles = {
  card: {
    width: '18rem',
    margin: '50px 0 0 20px', // Increase top margin if still overlapping
    padding: '10px',
    backgroundColor: '#fff', // Ensure background contrasts well with text
    color: '#333', // Dark text for readability
    border: '1px solid #ccc', // Optional: adds a subtle border
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Optional: adds subtle shadow
  },
  listGroup: {
    maxHeight: '60vh', // Takes up to 50% of the viewport height
    overflowY: 'auto',
    padding: '5px 10px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#888 #f0f0f0',
  },
};

export default SatelliteInfoCard;
