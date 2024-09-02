import React, { Component } from 'react';
import "./assets/theme.css";
import { Engine } from './engine';
import Info from './Info';
import Search from './Search/Search';
import SelectedStations from './Selection/SelectedStations';
import qs from 'query-string';
import Highlights from './highlights';
import DateSlider from './Options/DateSlider';
import Header from './components/Header';
import Footer from './components/Footer'; // Import the Footer component


// Some config
const UseDateSlider = false;
const DateSliderRangeInMilliseconds = 24 * 60 * 60 * 1000;  // 24 hours

function getCorsFreeUrl(url) {
    return url;
}

class Globe extends Component {
    state = {
        selected: [],
        stations: [], 
        query: null,
        queryObjectCount: 0,
        initialDate: new Date().getTime(),
        currentDate: new Date().getTime(), 
        referenceFrame: UseDateSlider ? 2 : 1,
        detailedStation: null,  // New state to hold detailed information
        loading: true  // Initial loading state
    }

    componentDidMount() {
        this.engine = new Engine();
        this.engine.referenceFrame = this.state.referenceFrame;
        this.engine.initialize(this.el, {
            onStationClicked: this.handleStationClicked
        });
        this.addStations();
        this.engine.updateAllPositions(new Date());
        setInterval(this.handleTimer, 1000);
    }
    

    componentWillUnmount() {
        this.engine.dispose();
    }

    processQuery = (stations) => {
        const q = window.location.search;
        if (!q) return;

        const params = qs.parse(q);

        if (params.ss) {
            const selectedIds = params.ss.split(',');
            if (!selectedIds || selectedIds.length === 0) return;

            selectedIds.forEach(id => {
                const station = this.findStationById(stations, id);
                if (station) this.selectStation(station);
            });
        }

        if (params.highlight) {
            const query = params.highlight;
            const matches = this.queryStationsByName(stations, query);
            matches.forEach(st => this.engine.highlightStation(st));
            this.setState({...this.state, query, queryObjectCount: matches.length });
        }
    }

    queryStationsByName = (stations, query) => {
        query = query.toLowerCase();
        return stations.filter(st => st.name.toLowerCase().indexOf(query) > -1);
    }

    findStationById = (stations, id) => {
        return stations.find(st => st.satrec && st.satrec.satnum === id);
    }

    handleStationClicked = (station) => {
        if (!station) return;
        this.toggleSelection(station);
    }

    toggleSelection = (station) => {
        if (this.isSelected(station))
            this.deselectStation(station);
        else
            this.selectStation(station);
    }

    isSelected = (station) => {
        return this.state.selected.includes(station);
    }

    selectStation = (station) => {
        const newSelected = this.state.selected.concat(station);
        this.setState({selected: newSelected, detailedStation: station});  // Update detailedStation

        this.engine.addOrbit(station);
    }

    deselectStation = (station) => {
        const newSelected = this.state.selected.filter(s => s !== station);
        this.setState({ selected: newSelected, detailedStation: null });  // Reset detailedStation

        this.engine.removeOrbit(station);
    }

    addStations = () => {
        this.addCelestrakSets();
        // Additional sets can be uncommented and added as needed
    }

    addCelestrakSets = () => {
        this.engine.loadLteFileStations(getCorsFreeUrl('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'), 0xffffff)        
            .then(stations => {
                this.setState({stations, loading: false});  // Set loading to false after stations are loaded
                this.processQuery(stations);
            })
            .catch(error => {
                console.error("Error loading stations:", error);
                this.setState({loading: false});  // Stop loading even if there is an error
            });
    }

    handleTimer = () => {
        if (!UseDateSlider) this.handleDateChange(null, new Date());
    }

    handleSearchResultClick = (station) => {
        if (!station) return;
        this.toggleSelection(station);
    }

    handleRemoveSelected = (station) => {
        if (!station) return;
        this.deselectStation(station);
    }

    handleRemoveAllSelected = () => {
        this.state.selected.forEach(s => this.engine.removeOrbit(s));
        this.setState({selected: [], detailedStation: null});  // Reset detailedStation
    }

    handleReferenceFrameChange = () => {
        this.state.selected.forEach(s => this.engine.removeOrbit(s));
        const newType = this.state.referenceFrame === 1 ? 2 : 1;
        this.setState({referenceFrame: newType});
        this.engine.setReferenceFrame(newType);
        this.state.selected.forEach(s => this.engine.addOrbit(s));
    }

    handleDateChange = (v, d) => {
        const newDate = v ? v.target.value : d;
        this.setState({ currentDate: newDate });

        const date = new Date();
        date.setTime(newDate);
        this.engine.updateAllPositions(date);
    }

    renderDate = (v) => {
        const result = new Date();
        result.setTime(v);
        return result.toString();
    }

    render() {
        const { selected, stations, initialDate, currentDate, detailedStation } = this.state;
        const maxMs = initialDate + DateSliderRangeInMilliseconds;

        return (
            <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
                <Header />  {/* Add the Header component here */}
                <Highlights query={this.state.query} total={this.state.queryObjectCount} />
                <Info stations={stations} refMode={this.state.referenceFrame} />
                <Search stations={this.state.stations} onResultClick={this.handleSearchResultClick} />
                <SelectedStations 
                    selected={selected} 
                    onRemoveStation={this.handleRemoveSelected} 
                    onRemoveAll={this.handleRemoveAllSelected} 
                    onStationClick={this.handleStationClicked}
                    detailedStation={detailedStation}  // Pass detailedStation
                />
                {UseDateSlider && <DateSlider min={initialDate} max={maxMs} value={currentDate} onChange={this.handleDateChange} onRender={this.renderDate} />}
                <div ref={el => this.el = el} style={{ width: '100%', flexGrow: 1 }} /> {/* Adjust height to account for header */}
                <Footer />
            </div>
        );
    }
}

export default Globe;
