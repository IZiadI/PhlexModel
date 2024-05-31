import "./styles.css";
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { Buffer } from "buffer";
import { gunzipSync } from "browserify-zlib";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";
import $ from "jquery";


function parseQueryString(queryString) {
  var params = {};
  var queryStringWithoutQuestionMark = queryString.substring(1); // Remove the leading '?'
  var keyValuePairs = queryStringWithoutQuestionMark.split('&'); // Split the query string into key-value pairs

  keyValuePairs.forEach(function(keyValuePair) {
      var pair = keyValuePair.split('='); // Split each key-value pair
      var key = decodeURIComponent(pair[0]); // Decode the key
      var value = decodeURIComponent(pair[1] || ''); // Decode the value (if it exists)

      if (key.length) {
          if (params[key]) {
              if (Array.isArray(params[key])) {
                  params[key].push(value);
              } else {
                  params[key] = [params[key], value];
              }
          } else {
              params[key] = value; // Store the key-value pair in the params object
          }
      }
  });

  return params;
}

// Get the query string from the current URL
var queryString = window.location.search;

// Example output: "?name=John&age=30&city=New%20York"
console.log(queryString);

// Now you can use the parseQueryString function from the previous example to parse the query string into a dictionary
var params = parseQueryString(queryString);
console.log(params);

let poseLandmarker;
let runningMode = "IMAGE";
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";
let lastVideoTime = -1;
let modelLoaded = false;


window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

// Before we can use PoseLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      //modelAssetPath: 'Models\\pose_landmarker_heavy.task',
      modelAssetPath: 'src\\pose_landmarker_full.task',
      //modelAssetPath: 'Models\\pose_landmarker_lite.task',
      delegate: "GPU"
    },
    runningMode: runningMode,
    numPoses: 1
  });
};
createPoseLandmarker();

const video = document.getElementById("webcam");
const out = document.getElementById("output_canvas");

video.style.width = `${window.innerWidth}px`;
video.style.height = `${window.innerHeight}px`;

const canvasCtx = out.getContext("2d");
if (window.mobileCheck()) {
  canvasCtx.canvas.height = window.innerWidth;
  canvasCtx.canvas.width = window.innerHeight;
} else { 
  canvasCtx.canvas.width = window.innerWidth;
  canvasCtx.canvas.height = window.innerHeight;
}
const drawingUtils = new DrawingUtils(canvasCtx);

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  console.log("Camera Can be used!");
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  console.log("enabling camera");
  if (!poseLandmarker) {
    console.log("Wait! poseLandmaker not loaded yet.");
  }

  if (webcamRunning === true) {
    webcamRunning = false;
  } else {
    webcamRunning = true;
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {    
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}
//^ Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyDWvuxuXutLo1FJuTEvxc5earHo2T20dFs",
  authDomain: "phlex-d0508.firebaseapp.com",
  projectId: "phlex-d0508",
  storageBucket: "phlex-d0508.appspot.com",
  messagingSenderId: "310184582416",
  appId: "1:310184582416:web:a32a52988ba2874e46d995",
  measurementId: "G-H5VLZFY9E2",
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

window.downloadFile = (path) => {
  return new Promise((resolve, reject) => {
    getDownloadURL(ref(storage, "Exercises/" + path))
      .then((url) => {
        var xhr = new XMLHttpRequest();
        xhr.responseType = "text";
        xhr.onload = (event) => {
          var txt = xhr.response;
          resolve(txt);
        };
        xhr.open("GET", url);
        xhr.send();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

//& Interface Elements
let countdownElement = document.getElementById("countdown");
let counterElement = document.getElementById("counter");
let poseInfoElement = document.getElementById("pose-info");
let timeSpentInfoElement = document.getElementById("timeSpent");

//* Exercise info to be collected
// let target_angles_list = [];
// let pose_angles_list = [];
let target_angles_list = ['L_Neck', 'R_Neck'];
let pose_angles_list = [
  [75, 75, 170, 170, 170, 170, 170, 170, 180, 180, 170, 170, 90, 90],
  [60, 90, 90, 90, 90, 90, 170, 170, 180, 180, 170, 170, 90, 90],
  [90, 60, 170, 170, 170, 170, 170, 170, 180, 180, 170, 170, 90, 90]
];

let poseTiming = {
  1: 6,
  2: 1,
  3: 1,
  4: 0,
  5: 0,
};
let counterMax = 2;
let flag = "RTL"; 

//^ info modification & customization
let fixedAngles = [];
let dynamicAngles = [];
let angleCounts = {};
let customizedAngles = [];


const Main_Angles = {
  L_Neck: [0, 11, 12, 0],
  R_Neck: [0, 12, 11, 1],
  L_Shoulder: [13, 11, 23, 2],
  R_Shoulder: [14, 12, 24, 3],
  L_Elbow: [11, 13, 15, 4],
  R_Elbow: [12, 14, 16, 5],
  L_Wrist: [13, 15, 19, 6],
  R_Wrist: [14, 16, 20, 7],
  L_Hip: [11, 23, 25, 8],
  R_Hip: [12, 24, 26, 9],
  L_Knee: [23, 25, 27, 10],
  R_Knee: [24, 26, 28, 11],
  L_Ankle: [25, 27, 31, 12],
  R_Ankle: [26, 28, 32, 13],
};

let pose;
let L_Marks;
let RT_Angles = [];
let Correct_Angles = [];
let tolerance_deg = 15;
let Num_Of_Pose_Completed = 0;
let Counter = 0;

let countdown = Number.MAX_SAFE_INTEGER;
let countdownMSG = "";
let timeoutId;
let breakTime = 5;
let startTime = new Date();
let endTime = new Date();
let firstTimePose = true;                     // Variable to track if this is first time doing the current pose correct
let inPose = false;                           // Variable to track if currently in a pose

let color = "#E37383";
let Msg = "";

//* info to be stored
let poseTimeSpent = {};


//^ Functions

function decompressFromBase64(compressedStr) {
  const compressedBuffer = Buffer.from(compressedStr, "base64");
  const decompressedBuffer = gunzipSync(compressedBuffer);
  return decompressedBuffer.toString("utf8");
}

function getExercise(exercisePath) {
  window
    .downloadFile(exercisePath)
    .then((txt) => {
      console.log(txt);
      const decompressedString = decompressFromBase64(txt);
      const jsonObject = JSON.parse(decompressedString);
      jsonObject["poses"].forEach((lst) =>
        pose_angles_list.push(lst["mainAngles"])
      );
      target_angles_list = jsonObject["targetedAngles"];

      console.log(target_angles_list);
      console.log(pose_angles_list);
      target_angles_list.forEach((angle) => {
        const bodyPart = angle.substring(2); // extract the body part (e.g. "Neck")
        if (!angleCounts[bodyPart]) {
          angleCounts[bodyPart] = { R: 0, L: 0 };
        }
        angleCounts[bodyPart][angle[0]]++; // increment the count for R or L
      });

      Object.keys(angleCounts).forEach((bodyPart) => {
        if (angleCounts[bodyPart].R === 1 && angleCounts[bodyPart].L === 1) {
          fixedAngles.push(`L_${bodyPart}`, `R_${bodyPart}`);
        } else if (angleCounts[bodyPart].R === 1) {
          dynamicAngles.push(`R_${bodyPart}`);
        } else if (angleCounts[bodyPart].L === 1) {
          dynamicAngles.push(`L_${bodyPart}`);
        }
      });
      for (let i = 1; i <= pose_angles_list.length; i++) {
        poseTimeSpent[i] = 0;
      }

      customizeAngles();
      enableCam();
    })
    .catch((error) => {
      console.log(error);
    });
}

function customizeAngles() {
  if (flag === "R" || flag === "RTL") {
    customizedAngles.push(
      ...dynamicAngles.map((angle) => angle.replace(/^L/, "R"))
    );
    console.log("customizedAngles : " , customizedAngles );
    if (dynamicAngles[0][0] == "L") {
    for (let DA = 0; DA < dynamicAngles.length; DA++) {
      for (let poseNum = 0; poseNum < pose_angles_list.length; poseNum++) {
          let rightAngle = dynamicAngles[DA].replace(/^L/, "R");
          let mainAnglesK = Main_Angles[rightAngle];
          pose_angles_list[poseNum][mainAnglesK[3]] =
            pose_angles_list[poseNum][mainAnglesK[3] - 1];
        } 
      }
    }
  } else if (flag === "L") {
    customizedAngles.push(
      ...dynamicAngles.map((angle) => angle.replace(/^R/, "L"))
    );
    if (dynamicAngles[0][0] == "R") {
    for (let DA = 0; DA < dynamicAngles.length; DA++) {
      for (let poseNum = 0; poseNum < pose_angles_list.length; poseNum++) {
          let lefttAngle = dynamicAngles[DA].replace(/^R/, "L");
          let mainAnglesK = Main_Angles[lefttAngle];
          pose_angles_list[poseNum][mainAnglesK[3]] =
          pose_angles_list[poseNum][mainAnglesK[3] + 1];
        } 
      }
    }
  } else if (flag === "RWL") {
    for (let DA = 0; DA < dynamicAngles.length; DA++) {
      for (let poseNum = 0; poseNum < pose_angles_list.length; poseNum++) {
        if (dynamicAngles[DA][0] == "L") {
          let rightAngle = dynamicAngles[DA].replace(/^L/, "R");
          let mainAnglesK = Main_Angles[rightAngle];
          pose_angles_list[poseNum][mainAnglesK[3]] =
            pose_angles_list[poseNum][mainAnglesK[3] - 1];
        } else {
          let lefttAngle = dynamicAngles[DA].replace(/^R/, "L");
          let mainAnglesK = Main_Angles[lefttAngle];
          pose_angles_list[poseNum][mainAnglesK[3]] =
            pose_angles_list[poseNum][mainAnglesK[3] + 1];
        }
      }
    }
    dynamicAngles.forEach((angle) => {
      customizedAngles.push(angle);
      customizedAngles.push(
        `${angle[0] === "R" ? "L" : "R"}_${angle.substring(2)}`
      );
    });
  }

  customizedAngles.push(...fixedAngles);
}

async function predictWebcam() {
  if (webcamRunning === true && !poseLandmarker) {
    window.requestAnimationFrame(predictWebcam);
    return;
  }
  else if (!modelLoaded)
  {
    modelLoaded = true;
    $(".loader-wrapper").fadeOut("slow");
  }
  out.style.height = videoHeight;
  video.style.height = videoHeight;
  out.style.width = videoWidth;
  video.style.width = videoWidth;
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await poseLandmarker.setOptions({ runningMode: "VIDEO" });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      onResultsPose(result);
    });
  }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function restartPoseDetection() {
  const constraints = {
    video: true
  };
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
  webcamRunning = true;
}

function stopPoseDetection() {
  var tracks = video.srcObject.getTracks();
  tracks.forEach(track => {
    track.stop();
  });
  // Remove the video srcObject
  video.srcObject = null;
  webcamRunning = false;
}

function calculateAngle(point1, point2, point3) {
  const radians =
  Math.atan2(point3[1] - point2[1], point3[0] - point2[0]) -
  Math.atan2(point1[1] - point2[1], point1[0] - point2[0]);
  let angle = Math.round(Math.abs((radians * 180.0) / Math.PI));
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}

function toBeCompared() {
  // RT(Real Time) Angles list will hold angles for the current frame
  let RT = [];
  // Correct Angles list will hold pose angles with which we want to compare our camera feedback
  let Correct = [];
  // Iterate through the list of target angles (angles of interest for each exercise)
  for (let angle_name of customizedAngles) {
    // Val will hold the angle definition (i.e., Key-Value pair in Main_Angles dictionary)
    let Val = Main_Angles[angle_name];
    // Calculate the angle and add it to RT_Angles
    let rt_angle = calculateAngle(
      [L_Marks[Val[0]].x, L_Marks[Val[0]].y],
      [L_Marks[Val[1]].x, L_Marks[Val[1]].y],
      [L_Marks[Val[2]].x, L_Marks[Val[2]].y]
    );
    RT.push(rt_angle);
    let correct_angle = pose_angles_list[Num_Of_Pose_Completed][Val[3]];
    Correct.push(correct_angle);
  }
  return [RT, Correct];
}

function comparePoses(RT_Angles, Correct_Angles) {
  // Initialize Angle_Match variable
  let Match = false;
  let Angle_Match = 0;
  // Iterate through RT_Angles and Correct_Angles to count how many angles are matched within a defined range (i.e., tolerance)
  for (let i = 0; i < RT_Angles.length; i++) {
    let rt_angle = RT_Angles[i];
    let correct_angle = Correct_Angles[i];
    if (customizedAngles[i][2] == "N") {
      if (Math.abs(rt_angle - correct_angle) <= 30) {
        Angle_Match += 1;
      }
    } else {
      if (Math.abs(rt_angle - correct_angle) <= tolerance_deg) {
        Angle_Match += 1;
      }
    }
  }
  
  // If all angles are matched, indicate that one pose is completed
  if (Angle_Match == RT_Angles.length) {
    Angle_Match = 0;
    Num_Of_Pose_Completed += 1;
    Match = true;
  }
  return Match;
}


function onResultsPose(results) {
  if (!results || !results.landmarks) {
    console.log("No pose landmarks detected.");
    return;
  }
  
  document.body.classList.add("loaded");

  
  L_Marks = results.landmarks[0];
  
  [RT_Angles, Correct_Angles] = toBeCompared();
  console.log("Correct Angles ", Correct_Angles);
  console.log("RT Angles ", RT_Angles);
  
  let Match = comparePoses(RT_Angles, Correct_Angles);
  
  if (Match == true) {
    color = "#2AAA8A";
    if (firstTimePose) {
      firstTimePose = false;
      countdown = poseTiming[Num_Of_Pose_Completed];
      callTimer();
      countdownElement.textContent = `Timer : ${countdown}`;
      startTime = new Date();
      inPose = true;
    } else {
      endTime = new Date();
    }
    if (countdown >= 0) {
      Num_Of_Pose_Completed--;
    }
  }
  drawAll(results);
  color = "#E37383";
  // When leaving the pose
  if (!Match && inPose) {
    let currentTime = new Date();
    let poseDuration = (currentTime - startTime) / 1000; // Calculate duration of the current pose interval
    poseTimeSpent[Num_Of_Pose_Completed + 1] += poseDuration; // Add duration to total pose time
    startTime = null; // Reset pose start time
    inPose = false; 
  }
  
  // When returning to the pose
  if (Match && !inPose) {
    startTime = new Date(); // Record start time of the pose
    inPose = true; // Update inPose flag to indicate currently in a pose
  }
  
  poseInfoElement.textContent = `Make pose number : (${
    Num_Of_Pose_Completed + 1
  })`;

  counterElement.textContent = `${Counter} Times Elapsed.`;
  if (Counter >= counterMax) {
    if (flag == "RTL") {
      flag = "L";
      Counter = 0;
      customizedAngles = [];
      customizeAngles();
      stopPoseDetection();
      displayBreakTime(); 
    } else {
      stopPoseDetection();
      canvasCtx.clearRect(0, 0, out.width, out.height);
      canvasCtx.fillStyle = "#5a5959";
      canvasCtx.font = "bold 35px serif";
      const canvasWidth = out.width;
      const canvasHeight = out.height;
      const textWidth = canvasCtx.measureText(
        "Done Exercising , Good job !"
      ).width;
      const x = canvasWidth / 2 - textWidth / 2;
      const y = canvasHeight / 2;
      canvasCtx.fillText("Done Exercising , Good job !", x, y);
    }
  }
}


function drawAll(result) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, out.width, out.height);

  for (const landmark of result.landmarks) {
    drawingUtils.drawLandmarks(landmark, {
      radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
      color: color
    });
    drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {color:color});
  }
  canvasCtx.restore();
}


function callTimer() {
  let timer = setInterval(() => {
    countdown--;
    countdownMSG = countdown.toString();
    countdownElement.textContent = `Timer : ${countdownMSG}`;
    
    if (countdown <= 0) {
      countdownMSG = "Done , Time is up!";
      countdownElement.textContent = `Timer : ${countdownMSG}`;
      if (inPose) {
        let currentTime = new Date();
        let poseDuration = (currentTime - startTime) / 1000; 
        poseTimeSpent[Num_Of_Pose_Completed + 1] += poseDuration; 
        inPose = false;
      }
      firstTimePose = true;
      timeSpentInfoElement.textContent = `Total Time for P${
        Num_Of_Pose_Completed + 1
      } = ${poseTimeSpent[Num_Of_Pose_Completed + 1].toFixed(2)} S`;
      if (Num_Of_Pose_Completed + 1 == pose_angles_list.length) {
        Counter += 1;
        Num_Of_Pose_Completed = 0;
      } else {
        Num_Of_Pose_Completed += 1;
      }
      
      clearInterval(timer);
    }
  }, 1000);
}


function displayBreakTime() {
  canvasCtx.clearRect(0, 0, out.width, out.height); // Clear the canvas first
  canvasCtx.fillStyle = "#5a5959";
  canvasCtx.font = "bold 35px serif";
  const canvasWidth = out.width;
  const canvasHeight = out.height;
  const textWidth = canvasCtx.measureText(
    "Good job, switch to left side!"
  ).width;
  const x = canvasWidth / 2 - textWidth / 2;
  const y = canvasHeight / 2;
  canvasCtx.fillText("Good job, switch to left side!", x, y);
  canvasCtx.fillText(`Start in : ${breakTime}`, x, y + 70); // Display the updated countdown
  
  breakTime--; // decrement break time
  
  if (breakTime > 0) {
    timeoutId = setTimeout(displayBreakTime, 1000); // schedule next update
  } else {
    clearTimeout(timeoutId); // clear the timeout
    restartPoseDetection();
  }
}


if (params["dataPath"]) {
  getExercise(params["dataPath"]);
}
else { enableCam(); }