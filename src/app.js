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

<style>
body {
    margin:0;
    font-family:'Segoe UI';
    display:flex;
    background:#f1f5f9;
    transition:0.3s;
}

/* LOADER */
.loader {
    position:fixed;
    width:100%;
    height:100%;
    background:#10b981;
    display:flex;
    justify-content:center;
    align-items:center;
    color:white;
    font-size:24px;
    z-index:999;
}

/* SIDEBAR */
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
    font-size:20px;
}

/* MAIN */
.main {
    flex:1;
    padding:20px;
}

.card {
    background:white;
    padding:20px;
    border-radius:15px;
    box-shadow:0 5px 20px rgba(0,0,0,0.1);
    margin-top:20px;
    animation:fade 0.5s;
}

@keyframes fade {
    from {opacity:0; transform:translateY(10px);}
    to {opacity:1;}
}

/* BMI FLEX */
.bmi-container {
    display:flex;
    gap:20px;
}

/* RIGHT PANEL */
.info-card {
    background:#ecfdf5;
}

button {
    padding:10px 20px;
    border:none;
    border-radius:10px;
    background:#10b981;
    color:white;
    cursor:pointer;
}

button:hover {
    transform:scale(1.05);
}

.section { display:none; }
.active { display:block; }

/* DARK MODE */
.dark {
    background:#0f172a;
    color:white;
}
.dark .card {
    background:#1e293b;
}
.dark .info-card {
    background:#334155;
}

video {
    width:600px;
    border-radius:15px;
}

.result {
    margin-top:10px;
    font-weight:bold;
    color:#f59e0b;
}
</style>

<script>
let chart;
let totalScans = 0;
let stream = null;
let detector;
let modelsLoaded = false;

/* LOADER */
window.onload = () => {
    initChart();

    setTimeout(()=>{
        document.getElementById("loader").style.display="none";

        let saved = JSON.parse(localStorage.getItem("bmiData") || "[]");
        chart.data.datasets[0].data = saved;
        chart.update();
    },1500);
};

/* NAV */
function showSection(id){
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* VOICE */
function speak(text){
    let speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}

/* BMI */
function calcBMI(){
    let h = document.getElementById("h").value;
    let w = document.getElementById("w").value;

    let heightM = h / 100;
    let bmi = w / (heightM * heightM);

    let calories = Math.round(24 * w);

    document.getElementById("res").innerText =
    "BMI: " + bmi.toFixed(2);

    speak("Your BMI is " + bmi.toFixed(2));

    totalScans++;
    document.getElementById("totalScans").innerText = totalScans;
    document.getElementById("lastBMI").innerText = bmi.toFixed(2);

    document.getElementById("calorie").innerText =
    "🔥 Calories: " + calories;

    document.getElementById("water").innerText =
    "💧 Water: " + (w * 0.033).toFixed(1) + " L";

    document.getElementById("protein").innerText =
    "🥩 Protein: " + (w * 0.8).toFixed(0) + " g";

    chart.data.labels.push(chart.data.labels.length+1);
    chart.data.datasets[0].data.push(bmi);
    chart.update();

    localStorage.setItem("bmiData", JSON.stringify(chart.data.datasets[0].data));

    document.getElementById("aiAdvice").innerText =
    "AI Suggestion: Stay active + balanced diet";
}

/* CHART */
function initChart(){
    const ctx = document.getElementById('chart');
    chart = new Chart(ctx, {
        type:'line',
        data:{
            labels:[],
            datasets:[{
                label:'BMI Trend',
                data:[],
                borderColor:'#10b981',
                tension:0.4,
                fill:true,
                backgroundColor:'rgba(16,185,129,0.2)'
            }]
        }
    });
}

/* DARK MODE BUTTON FIX */
function toggleTheme(){
    document.body.classList.toggle("dark");

    let btn = document.getElementById("themeBtn");

    if(document.body.classList.contains("dark")){
        btn.innerText = "☀️";
    } else {
        btn.innerText = "🌙";
    }
}

/* CAMERA */
async function startCamera(){
    stream = await navigator.mediaDevices.getUserMedia({video:true});
    document.getElementById('video').srcObject = stream;
}

/* IMPROVED SCANNER (REAL + STABLE) */
async function loadModels(){
    if(modelsLoaded) return;

    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet
    );

    modelsLoaded = true;
}

async function scan(){
    let result = document.getElementById("heightResult");
    let video = document.getElementById("video");

    result.innerText = "Stabilizing...";

    await loadModels();

    let values = [];
    let attempts = 0;

    let interval = setInterval(async () => {

        const poses = await detector.estimatePoses(video);

        if(poses.length > 0){
            let kp = poses[0].keypoints;

            let head = kp.find(p => p.name==="nose");
            let ankle = kp.find(p => p.name==="left_ankle");

            if(head && ankle){
                let pixel = Math.abs(ankle.y - head.y);
                let height = pixel * 0.75;
                values.push(height);
            }
        }

        attempts++;

        if(attempts >= 5){
            clearInterval(interval);

            if(values.length === 0){
                result.innerText = "Stand properly ❌";
                return;
            }

            let avg = values.reduce((a,b)=>a+b)/values.length;

            result.innerText =
            "Height: " + avg.toFixed(1) + " cm 📏";
        }

    }, 500);
}

function stopCamera(){
    if(stream){
        stream.getTracks().forEach(t => t.stop());
    }
}
</script>

</head>

<body>

<div id="loader" class="loader">🚀 Loading AI System...</div>

<div class="sidebar">
<div onclick="showSection('home')">🏠</div>
<div onclick="showSection('graph')">📊</div>
<div onclick="showSection('camera')">📷</div>
<div id="themeBtn" onclick="toggleTheme()">🌙</div>
</div>

<div class="main">

<h1>🚀 AI HEALTH SYSTEM (FINAL)</h1>

<div id="home" class="section active">

<div class="bmi-container">

<div class="card">
<h2>BMI Calculator</h2>
<input id="h" placeholder="Height (cm)"><br><br>
<input id="w" placeholder="Weight (kg)"><br><br>
<button onclick="calcBMI()">Calculate</button>
<div id="res"></div>
</div>

<div class="card info-card">
<h3>Health Insights</h3>
<div id="calorie"></div>
<div id="water"></div>
<div id="protein"></div>
</div>

</div>

<div class="card">
<h3>📊 Dashboard</h3>
<p>Total Scans: <span id="totalScans">0</span></p>
<p>Last BMI: <span id="lastBMI">-</span></p>
</div>

<div id="aiAdvice" class="card"></div>

</div>

<div id="graph" class="section">
<div class="card">
<h2>📊 BMI Graph</h2>
<canvas id="chart"></canvas>
</div>
</div>

<div id="camera" class="section">
<div class="card">
<h2>📷 Height Scanner</h2>

<video id="video" autoplay></video><br><br>

<button onclick="startCamera()">Start</button>
<button onclick="scan()">Scan</button>
<button onclick="stopCamera()">Stop</button>

<div id="heightResult" class="result"></div>

</div>
</div>

</div>

</body>
</html>
`);
}).listen(80);