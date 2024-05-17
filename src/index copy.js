import "./styles.css";

import {
  parseQueryString,
} from "./firebaseFunctions.js"

import {
  createPoseLandmarker,
  enableCam,
  getExercise
} from "./mediaPipeFunctions.js"

// Get the query string from the current URL
var queryString = window.location.search;

// Now you can use the parseQueryString function from the previous example to parse the query string into a dictionary
var params = parseQueryString(queryString);

createPoseLandmarker();

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  console.log("Camera Can be used!");
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

if (params["dataPath"])
{
  getExercise(params["dataPath"]);  
}

enableCam();