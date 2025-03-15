const express = require("express");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5000;

// Function to measure ping and jitter
function measurePing(ip) {
  return new Promise((resolve, reject) => {
    exec(`ping -c 4 ${ip}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Ping error: ${error.message}`);
        return;
      }

      const pingMatch = stdout.match(/min\/avg\/max\/mdev = (\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)/);
      if (pingMatch) {
        resolve({
          ping: parseInt(pingMatch[2]), // avg ping
          jitter: parseFloat(pingMatch[4]), // mdev = jitter
        });
      } else {
        reject("No ping match found");
      }
    });
  });
}

// Function to measure packet loss
function measurePacketLoss(ip) {
  return new Promise((resolve, reject) => {
    exec(`ping -c 10 ${ip}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Packet loss error: ${error.message}`);
        return;
      }

      const packetLossMatch = stdout.match(/(\d+)% packet loss/);
      if (packetLossMatch) {
        resolve(parseFloat(packetLossMatch[1]));
      } else {
        reject("No packet loss match found");
      }
    });
  });
}

// Function to measure bandwidth (using iperf)
function measureBandwidth(ip) {
  return new Promise((resolve, reject) => {
    exec(`iperf -c ${ip} -t 5`, (error, stdout, stderr) => {
      if (error) {
        reject(`Bandwidth error: ${error.message}`);
        return;
      }

      const bandwidthMatch = stdout.match(/(\d+\.\d+) Mbits\/sec/);
      if (bandwidthMatch) {
        resolve(parseFloat(bandwidthMatch[1]));
      } else {
        reject("No bandwidth match found");
      }
    });
  });
}

// API endpoint
app.get("/v2/:ip", async (req, res) => {
  const { ip } = req.params;

  if (!req.query.metrics) {
    return res.status(400).json({ status: "error", message: "Missing metrics parameter" });
  }

  try {
    const [pingMetrics, packetLoss, bandwidth] = await Promise.all([
      measurePing(ip),
      measurePacketLoss(ip),
      measureBandwidth(ip),
    ]);

    res.json({
      ip,
      metrics: {
        ping: pingMetrics.ping,
        jitter: pingMetrics.jitter,
        packet_loss: packetLoss,
        bandwidth: bandwidth,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
