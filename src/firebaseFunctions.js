import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { Buffer } from "buffer";
import { gunzipSync } from "browserify-zlib";

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

export function parseQueryString(queryString) {
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

export function downloadFile(path){
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

export function decompressFromBase64(compressedStr) {
  const compressedBuffer = Buffer.from(compressedStr, "base64");
  const decompressedBuffer = gunzipSync(compressedBuffer);
  return decompressedBuffer.toString("utf8");
}