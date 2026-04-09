const http = require('http');

http.createServer((req, res) => {
res.writeHead(200, {'Content-Type': 'text/html'});

res.end(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">
<title>AI Health System</title>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection"></script>
<script defer src="https://cdn.jsdelivr.net/npm/face-api.js"></script>

<style>
body {
    margin:0;
    font-family:'Segoe UI';
    display:flex;
    background:#f1f5f9;
}

.sidebar {
    width:80px;
    background:#10b981;
    height:100vh;
    display:flex;
    flex-direction:column;
    align-items:center;
    padding-top:20px;
    color:white;
}
.sidebar div {
    margin:20px;
    cursor:pointer;
}

.main {
    flex:1;
    padding:20px;
}

.card {
    background:white;
    padding:25px;
    border-radius:20px;
    box-shadow:0 5px 20px rgba(0,0,0,0.1);
    margin-top:20px;
}

button {
    padding:10px 20px;
    border:none;
    border-radius:10px;
    background:#10b981;
    color:white;
    cursor:pointer;
    transition:0.3s;
}
button:hover{
    transform:scale(1.05);
}

video {
    width:600px;
    border-radius:15px;
}

.section { display:none; }
.active { display:block; }

.runner-bg {
    font-size:50px;
    position:absolute;
    opacity:0.1;
    animation:run 6s infinite linear;
}
@keyframes run {
    0%{left:-100px;}
    100%{left:100%;}
}

.result {
    margin-top:10px;
    font-weight:bold;
    color:#f59e0b;
}
</style>

<script>
let chart;
let detector;
let modelsLoaded = false;
let stream = null;

/* NAV */
function showSection(id){
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* BMI */
function calcBMI(){
    let h = document.getElementById("h").value;
    let w = document.getElementById("w").value;

    let heightM = h / 100;
    let bmi = w / (heightM * heightM);

    let idealWeight = 22 * heightM * heightM;
    let diff = (w - idealWeight).toFixed(1);

    let condition = "";
    let weightMsg = "";
    let diet = "";
    let calories = Math.round(24 * w);

    if(bmi < 18.5){
        condition = "Bad ⚠️ (Underweight)";
        weightMsg = "Gain " + Math.abs(diff) + " kg";
        diet = "Milk, Banana, Eggs";
        calories += 500;
    }
    else if(bmi < 25){
        condition = "Balanced ✅";
        weightMsg = "Maintain weight";
        diet = "Balanced diet";
    }
    else if(bmi < 30){
        condition = "Bad ⚠️ (Overweight)";
        weightMsg = "Lose " + diff + " kg";
        diet = "Low sugar, high protein";
        calories -= 400;
    }
    else{
        condition = "Bad ❌ (Obese)";
        weightMsg = "Lose " + diff + " kg";
        diet = "Strict diet";
        calories -= 700;
    }

    document.getElementById("res").innerText =
    "BMI: " + bmi.toFixed(2) + " → " + condition;

    document.getElementById("healthAdvice").innerText = weightMsg;
    document.getElementById("dietPlan").innerText = diet;
    document.getElementById("calorie").innerText = "Calories: " + calories;

    chart.data.labels.push(chart.data.labels.length+1);
    chart.data.datasets[0].data.push(bmi);
    chart.update();
}

/* GRAPH */
function initChart(){
    const ctx = document.getElementById('chart');
    chart = new Chart(ctx, {
        type:'line',
        data:{
            labels:[],
            datasets:[{
                label:'BMI Trend',
                data:[],
                borderColor:'#10b981'
            }]
        }
    });
}

/* CAMERA */
async function startCamera(){
    try {
        stream = await navigator.mediaDevices.getUserMedia({video:true});
        let video = document.getElementById('video');
        video.srcObject = stream;
        video.play();
    } catch(err){
        alert("Camera permission denied ❌");
    }
}

function stopCamera(){
    let video = document.getElementById('video');
    if(stream){
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    document.getElementById("heightResult").innerText = "Camera stopped";
}

function resetScan(){
    document.getElementById("heightResult").innerText = "";
}

/* LOAD MODELS */
async function loadModels(){
    if(modelsLoaded) return;

    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet
    );

    await faceapi.nets.tinyFaceDetector.loadFromUri(
        'https://cdn.jsdelivr.net/npm/face-api.js/models'
    );

    modelsLoaded = true;
}

/* SCAN */
async function scan(){
    let result = document.getElementById("heightResult");
    let video = document.getElementById("video");

    let countdown = 10;
    result.innerText = "Get ready... ⏳ " + countdown;

    let timer = setInterval(() => {
        countdown--;
        result.innerText = "Stand back (full body) ⏳ " + countdown;

        if(countdown === 0){
            clearInterval(timer);
            detectNow();
        }
    }, 1000);
}

/* ACTUAL DETECTION AFTER TIMER */
async function detectNow(){
    let video = document.getElementById("video");
    let result = document.getElementById("heightResult");

    result.innerText = "Detecting... 🤖";

    try{
        await loadModels();

        const poses = await detector.estimatePoses(video);

        if(!poses || poses.length === 0){
            result.innerText = "Full body not detected ❌";
            return;
        }

        let keypoints = poses[0].keypoints;

        let head = keypoints.find(p => p.name==="nose");
        let ankle = keypoints.find(p => p.name==="left_ankle");

        if(!head || !ankle){
            result.innerText = "Show full body (head + feet) ❌";
            return;
        }

        let pixelHeight = Math.abs(ankle.y - head.y);

        let estimatedHeight = pixelHeight * 0.7;

        result.innerText =
        "Estimated Height: " + estimatedHeight.toFixed(1) + " cm 📏";

    } catch(e){
        result.innerText = "Try again ⚠️";
    }
}
</script>

</head>

<body onload="initChart()">

<div class="sidebar">
<div onclick="showSection('home')">🏠</div>
<div onclick="showSection('health')">❤️</div>
<div onclick="showSection('diet')">🍎</div>
<div onclick="showSection('graph')">📊</div>
<div onclick="showSection('camera')">📷</div>
</div>

<div class="main">

<h1> FINAL DEMO WORKING </h1>

<div id="home" class="section active">
<div class="card">
<div class="runner-bg">🏃</div>

<h2>BMI Calculator</h2>
<input id="h" placeholder="Height (cm)"><br>
<input id="w" placeholder="Weight (kg)"><br>
<button onclick="calcBMI()">Calculate</button>

<div id="res"></div>
</div>
</div>

<div id="health" class="section">
<div class="card">
<h2>❤️ Health</h2>
<div id="healthAdvice"></div>
</div>
</div>

<div id="diet" class="section">
<div class="card">
<h2>🍎 Diet Plan</h2>
<div id="dietPlan"></div>
<div id="calorie"></div>
</div>
</div>

<div id="graph" class="section">
<div class="card">
<h2>📊 Graph</h2>
<canvas id="chart"></canvas>
</div>
</div>

<div id="camera" class="section">
<div class="card">

<h2>📷 Height Scanner</h2>

<video id="video" autoplay playsinline></video>

<br><br>

<button onclick="startCamera()">Start</button>
<button onclick="scan()">Scan</button>
<button onclick="stopCamera()">Stop</button>
<button onclick="resetScan()">Reset</button>

<div id="heightResult" class="result"></div>

</div>
</div>

</div>

</body>
</html>
`);
}).listen(80);