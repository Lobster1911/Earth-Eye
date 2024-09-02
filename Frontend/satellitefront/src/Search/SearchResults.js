import React from 'react';
import { Card, ListGroup, ListGroupItem } from 'react-bootstrap';

const MaxSearchResults = 100;

const filterResults = (stations, searchText) => {
    if (!stations) return null;
    if (!searchText || searchText === '') return null;

    const regex = new RegExp(searchText, 'i');

    return stations.filter(station => regex.test(station.name)).slice(0, MaxSearchResults);
}

const SearchResults = ({ stations, searchText, onResultClick }) => {
    const results = filterResults(stations, searchText);
    if (!results) return null;

    return (
        <Card className='ResultsWrapper mt-3'>
            <Card.Body>
                <ListGroup variant="flush">
                    {results.map((result, i) => (
                        <StationCard key={result.name + i} station={result} onClick={onResultClick} />
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
}

export const StationCard = ({ station, onClick, onRemoveClick, className }) => {
    const noradId = station.satrec && station.satrec.satnum;

    return (
        <ListGroupItem action onClick={e => onClick && onClick(station)} className={className}>
            <div className='d-flex justify-content-between align-items-center'>
                <span title={noradId ? 'NORAD ID: ' + noradId : null}>{station.name}</span>
                {onRemoveClick && <span className='RemoveButton' onClick={e => { e.stopPropagation(); onRemoveClick(station); }}>x</span>}
            </div>
        </ListGroupItem>
    );
}

export default SearchResults;
