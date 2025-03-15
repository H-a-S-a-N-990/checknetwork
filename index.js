const express = require("express");
const { measure } = require("tc-wrapper");

const app = express();
const PORT = 5000;

app.get("/v2/:ip", async (req, res) => {
    const ip = req.params.ip;
    const metrics = req.query.metrics;

    if (!metrics) {
        return res.status(400).json({ error: "Missing 'metrics' query parameter" });
    }

    try {
        const result = await measure(ip);

        res.json({
            ip: ip,
            metrics: {
                ping: result.delay || 0, // RTT in ms
                jitter: result.jitter || 0, // Delay variation
                packet_loss: result.loss || 0, // Packet loss percentage
                bandwidth: result.rate || 0, // Bandwidth limitation (HTB-based)
                corrupt: result.corrupt || 0 // Packet corruption percentage
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to get metrics", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
