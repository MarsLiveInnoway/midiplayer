'use client';

import { useState, useRef, useEffect } from 'react';
import { Player } from 'midi-player-js';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<string>('No event yet.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const playerRef = useRef<Player | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample MIDI file as base64 data URI (a simple C major scale)
  const sampleMidiDataUri = 'data:audio/midi;base64,TVRoZAAAAAYAAAABAIBNVHJrAAAAPgD/UQMHoSAA/1gEBAIYCIgA/1kCAAGIAJBARACARAAAgEhAAIBIQACASEAAoEhAAKBIQACgSEAAoEhAQAD/LwAA';

  useEffect(() => {
    // Initialize the MIDI Player
    const newPlayer = new Player((event: any) => {
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

    playerRef.current = newPlayer;

    // Load sample MIDI file
    loadSampleMidi();

    // Cleanup on component unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  const loadSampleMidi = () => {
    if (playerRef.current) {
      setIsLoading(true);
      setError('');
      try {
        playerRef.current.loadDataUri(sampleMidiDataUri);
        setCurrentEvent('Sample MIDI file loaded successfully.');
      } catch (error: any) {
        console.error('Error loading sample MIDI file:', error);
        setError(`Error loading sample MIDI file: ${error.message}`);
        setCurrentEvent(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadMidiFromUrl = async (url: string) => {
    if (!playerRef.current) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Fetch the MIDI file and convert to data URI
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'audio/midi, audio/mid, application/octet-stream',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      const dataUri = `data:audio/midi;base64,${base64}`;
      
      playerRef.current.loadDataUri(dataUri);
      setCurrentEvent('MIDI file loaded successfully from URL.');
    } catch (error: any) {
      console.error('Error loading MIDI file from URL:', error);
      setError(`Error loading MIDI file: ${error.message}`);
      setCurrentEvent(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !playerRef.current) return;

    setIsLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        if (playerRef.current) {
          playerRef.current.loadDataUri(result);
          setCurrentEvent('MIDI file uploaded and loaded successfully.');
        }
      } catch (error: any) {
        console.error('Error loading uploaded MIDI file:', error);
        setError(`Error loading uploaded file: ${error.message}`);
        setCurrentEvent(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
      setCurrentEvent('Error reading file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

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
    }
  };

  const handleLoadFromUrl = () => {
    const url = prompt('Enter MIDI file URL:');
    if (url) {
      loadMidiFromUrl(url);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-center text-sky-400">
          AI MIDI Composer - MVP
        </h1>

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="p-4 bg-gray-700 rounded">
          <p className="text-lg text-center">
            Status: {isLoading ? (
              <span className="text-blue-400">Loading...</span>
            ) : isPlaying ? (
              <span className="text-green-400">Playing</span>
            ) : (
              <span className="text-yellow-400">Paused/Stopped</span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="flex-1 px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex-1 px-6 py-3 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload MIDI File
            </button>
            <button
              onClick={handleLoadFromUrl}
              disabled={isLoading}
              className="flex-1 px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load from URL
            </button>
            <button
              onClick={loadSampleMidi}
              disabled={isLoading}
              className="flex-1 px-4 py-2 font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Sample
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="mt-6 p-4 bg-gray-700 rounded h-64 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2 text-sky-300">Current MIDI Event:</h2>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
            {currentEvent}
          </pre>
        </div>
        
        <p className="text-xs text-center text-gray-500 mt-4">
          MIDI Player JS Integration Example - Fixed Version
        </p>
      </div>
    </main>
  );
}