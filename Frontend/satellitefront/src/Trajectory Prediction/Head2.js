import React, { useState } from 'react';
import { Navbar, Nav, NavDropdown, Container, Form, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Header.css'; // Import the custom CSS

function Header({ searchQuery, setSearchQuery, handleSearch }) {
    const [query, setQuery] = useState(searchQuery);

    const onSubmit = (e) => {
        e.preventDefault();
        handleSearch(query);
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
            <Container fluid>
                <Navbar.Brand as={Link} to="/">EARTH EYE</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/globe">Track Satellites</Nav.Link>
                        <NavDropdown title="More" id="basic-nav-dropdown">
                            <NavDropdown.Item as={Link} to="/about-us">About Us</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/globe">Track Satellites</NavDropdown.Item>
                            <NavDropdown.Item href="/Track">Trajectory Prediction</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item as={Link} to="/launch-simulation">Launch Simulation</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Form inline onSubmit={onSubmit} className="ml-auto d-flex search-form">
                        <FormControl 
                            type="text" 
                            placeholder="Search" 
                            className="mr-sm-2 search-input" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button variant="outline-success" type="submit" className="search-button">Search</Button>
                    </Form>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;
