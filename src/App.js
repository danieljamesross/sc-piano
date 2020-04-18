import React from 'react';
//import { ImageBackground, StyleSheet, Text, View } from "react-native";
import _ from 'lodash';
//import { BasicPiano, ResponsivePiano } from './SomePianos.js';

import { midiToNoteName } from "@tonaljs/midi";
//import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import './App.css';

import DimensionsProvider from './components/DimensionsProvider';
import SoundfontProvider from './components/SoundfontProvider';
import PianoWithRecording from './PianoWithRecording';

// webkitAudioContext fallback needed to support Safari
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';


var noteRange = {
    first: MidiNumbers.fromNote('c3'),
    last: MidiNumbers.fromNote('f4'),
};

const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: noteRange.first,
    lastNote: noteRange.last,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
});

var e;
var pitches = "Empty";


class App extends React.Component {
    state = {
	recording: {
	    mode: 'RECORDING',
	    events: [],
	    pEvents: [],
	    currentTime: 0,
	    currentEvents: [],
	},
    };

    constructor(props) {
	super(props);
	this.scheduledEvents = [];
    }

    getRecordingEndTime = () => {
	if (this.state.recording.events.length === 0) {
	    return 0;
	}
	return Math.max(
	    ...this.state.recording.events.map(event => event.time + event.duration),
	);
    };

    setRecording = value => {
	this.setState({
	    recording: Object.assign({}, this.state.recording, value),
	});
    };

    onClickPlay = () => {
	this.setRecording({
	    mode: 'PLAYING',
	});
	const startAndEndTimes = _.uniq(
	    _.flatMap(this.state.recording.events, event => [
		event.time,
		event.time + event.duration,
	    ]),
	);
	startAndEndTimes.forEach(time => {
	    this.scheduledEvents.push(
		setTimeout(() => {
		    const currentEvents = this.state.recording.events.filter(event => {
			return event.time <= time && event.time + event.duration > time;
		    });
		    this.setRecording({
			currentEvents,
		    });
		}, time * 1000),
	    );
	});
	// Stop at the end
	setTimeout(() => {
	    this.onClickStop();
	}, this.getRecordingEndTime() * 1000);
    };

    onClickStop = () => {
	this.scheduledEvents.forEach(scheduledEvent => {
	    clearTimeout(scheduledEvent);
	});
	this.setRecording({
	    mode: 'RECORDING',
	    currentEvents: [],
	});
    };

    onClickClear = () => {
	this.onClickStop();
	this.setRecording({
	    events: [],
	    mode: 'RECORDING',
	    currentEvents: [],
	    currentTime: 0,
	});
    };

    onClickCopy = str => {
	const el = document.createElement('textarea');
	el.value = str;
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
    };

   
    onClickMinusOctave = () => {
	noteRange.first = noteRange.first - 12;
    };

    onClickPlusOctave = () => {
	noteRange.last = noteRange.last + 12;
    };
    

    render() {
	var getPitchList = () => {
	    e = this.state.recording.events.map(event => event.midiNumber);
	    e = e.map(ee => midiToNoteName(ee)).join(" ");
	    e = "\'(" + e + ")";
	    e = e.toLowerCase();
	    pitches = e;
	    return (
		<div>
		    {e}
		</div>);
	};
	
	
	
	return (
	    <div>
		{/* <ImageBackground source={require('/sc-web-bar.jpg')}
		    style={styles.backgroundImage} /> */}
		<div className="titles">
		    <h2 className="h3"><em>slippery chicken</em></h2>
		    <h1 className="h3">Pitch Seq Generator</h1>
		</div>
		<div className="piano-div">
		    <div className="mt-5">
			<DimensionsProvider>
			    {({ containerWidth, containerHeight }) => (
				<SoundfontProvider
				    instrumentName="acoustic_grand_piano"
				    audioContext={audioContext}
				    hostname={soundfontHostname}
				    render={({ isLoading, playNote, stopNote }) => (
					<PianoWithRecording
					className="PianoSCTheme"
						   recording={this.state.recording}
						   setRecording={this.setRecording}
						   noteRange={noteRange}
						   width={containerWidth}
						   playNote={playNote}
						   stopNote={stopNote}
						   disabled={isLoading}
						   keyboardShortcuts={keyboardShortcuts}
					/>
				    )}
				/>
			    )}
			</DimensionsProvider>
		    </div>
		</div>
		<div className="mt-5">
		    <button onClick={this.onClickMinusOctave}>- 8ve</button>
		    <button onClick={this.onClickPlay}>Play</button>
		    <button onClick={this.onClickStop}>Stop</button>
		    <button onClick={this.onClickClear}>Clear</button>
		    <button onClick={this.onClickCopy(pitches)}>Copy</button>
		    <button onClick={this.onClickPlusOctave}>+ 8ve</button>
		    
		</div>
		<div className="mt-5">
		    <h2 className="h3">Pitch List</h2>
		    <div className="pList">
			<code>
			    {getPitchList()}
			</code>
		    </div>
		</div>
		
	    </div>
	);
    }
}

export default App;
