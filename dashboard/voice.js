// voice.js - Voice control logic

// Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    console.log("SpeechRecognition Supported");

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Set to true for continuous recognition
    recognition.lang = "en-US"; // Set the language
    recognition.interimResults = false;

    recognition.onstart = function() {
        console.log("Voice recognition started. Speak now.");
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log("You said: " + transcript);

        // Process the recognized text
        processCommand(transcript);
    };

    recognition.onerror = function(event) {
        console.error("Error occurred in recognition: " + event.error);
    };

    recognition.onend = function() {
        console.log("Voice recognition ended.");
    };

    // Function to process commands
    function processCommand(transcript) {
        // Placeholder for command processing
        console.log("Processing command: " + transcript);
        // Add your command logic here
    }

    // Start recognition
    //recognition.start();

    console.log("Voice recognition initialized");

} else {
    console.log("SpeechRecognition Not Supported");
}
