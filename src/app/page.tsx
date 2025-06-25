'use client';

import { useState, useRef, useEffect } from 'react';
import Player from 'midi-player-js';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<string>('No event yet.');
  const playerRef = useRef<Player | null>(null);

  const midiFileUrl = 'https://bitmidi.com/uploads/16286.mid';

  useEffect(() => {
    // Initialize the MIDI Player
    const newPlayer = new Player((event: any) => {
      // console.log(event); // Log all events for debugging if needed
      let eventString = `Track: ${event.track}, Event: ${event.name}`;
      if (event.noteName) {
        eventString += `, Note: ${event.noteName}`;
      }
      if (event.velocity) {
        eventString += `, Velocity: ${event.velocity}`;
      }
      if (event.value) {
        eventString += `, Value: ${event.value}`;
      }
      if (event.data) {
        eventString += `, Data: ${JSON.stringify(event.data)}`;
      }
      setCurrentEvent(eventString);
    });

    newPlayer.on('play', () => {
      setIsPlaying(true);
      setCurrentEvent('Playback started.');
    });

    newPlayer.on('pause', () => {
      setIsPlaying(false);
      setCurrentEvent('Playback paused.');
    });

    newPlayer.on('stop', () => {
      setIsPlaying(false);
      setCurrentEvent('Playback stopped.');
    });

    newPlayer.on('endOfFile', () => {
      setIsPlaying(false);
      setCurrentEvent('End of MIDI file reached.');
    });

    // Load the MIDI file
    newPlayer.loadDataUri(midiFileUrl)
      .then(() => {
        setCurrentEvent('MIDI file loaded successfully.');
      })
      .catch((error: any) => {
        console.error('Error loading MIDI file:', error);
        setCurrentEvent(`Error loading MIDI file: ${error.message}`);
      });

    playerRef.current = newPlayer;

    // Cleanup on component unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playerRef.current.isPlaying()) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };

  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      // Reset progress to 0, Player itself handles this internally on stop.
      // If you need to explicitly reset UI or other state related to progress, do it here.
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-center text-sky-400">
          AI MIDI Composer - MVP
        </h1>

        <div className="p-4 bg-gray-700 rounded">
          <p className="text-lg text-center">
            Status: {isPlaying ? <span className="text-green-400">Playing</span> : <span className="text-yellow-400">Paused/Stopped</span>}
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handlePlayPause}
            className="flex-1 px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleStop}
            className="flex-1 px-6 py-3 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-150"
          >
            Stop
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-700 rounded h-64 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2 text-sky-300">Current MIDI Event:</h2>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
            {currentEvent}
          </pre>
        </div>
        <p className="text-xs text-center text-gray-500 mt-4">
          MIDI Player JS Integration Example
        </p>
      </div>
    </main>
  );
}
