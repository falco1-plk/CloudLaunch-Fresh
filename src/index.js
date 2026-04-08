const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

let logs = "System Ready...\n";
let loggedIn = false;

// Run command
function run(cmd, res) {
    exec(cmd, (err, out, stderr) => {
        if (err) {
            logs += "❌ ERROR:\n" + stderr + "\n";
        } else {
            logs += "✅ SUCCESS:\n" + out + "\n";
        }
        res.end("done");
    });
}
// Status
function status(res) {
    exec("docker ps --filter name=cloudlaunch-app --format '{{.Status}}'", (err, out) => {
        res.end(out || "Stopped");
    });
}

// Stats
function stats(res) {
    exec("docker stats --no-stream --format '{{.Name}} | CPU: {{.CPUPerc}} | MEM: {{.MemUsage}}'", 
    (err, out) => res.end(out));
}

http.createServer((req, res) => {

    if (req.url === "/") {
        fs.createReadStream(path.join(__dirname, "public/dashboard.html")).pipe(res);
    }

   else if (req.url === "/admin") {
    if (!loggedIn) {
        fs.createReadStream(path.join(__dirname, "public/login.html")).pipe(res);
    } else {
        fs.createReadStream(path.join(__dirname, "public/admin.html")).pipe(res);
    }
}

    else if (req.url === "/login" && req.method === "POST") {
        let body = '';
        req.on('data', chunk => body += chunk);

        req.on('end', () => {
            const data = new URLSearchParams(body);
            if (data.get("user") === "admin" && data.get("pass") === "1234") {
                loggedIn = true;
                res.end("success");
            } else {
                res.end("fail");
            }
        });
    }

    else if (req.url === "/start") {
        run("docker start cloudlaunch-app || docker run -d -p 4000:80 --name cloudlaunch-app cloudlaunch-app", res);
    }

    else if (req.url === "/stop") {
        run("docker stop cloudlaunch-app", res);
    }

    else if (req.url === "/restart") {
        run("docker restart cloudlaunch-app", res);
    }

   else if (req.url === "/deploy") {
    run(`
    docker rm -f cloudlaunch-app || true &&
    docker build -t cloudlaunch-app . &&
    docker run -d -p 4000:80 --name cloudlaunch-app cloudlaunch-app
    `, res);
}

    else if (req.url === "/logs") {
        res.end(logs);
    }

    else if (req.url === "/status") {
        status(res);
    }

    else if (req.url === "/stats") {
        stats(res);
    }

    else {
        res.end("404");
    }

}).listen(3000);

console.log("Server running on port 3000");