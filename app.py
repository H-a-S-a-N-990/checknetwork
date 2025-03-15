from flask import Flask, jsonify, request
import subprocess
import re

app = Flask(__name__)

# Function to measure ping and jitter
def measure_ping(ip):
    try:
        # Run ping command (4 packets)
        ping_output = subprocess.check_output(["ping", "-c", "4", ip], universal_newlines=True)
        
        # Parse ping output
        ping_match = re.search(r"min/avg/max/mdev = (\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+)", ping_output)
        if ping_match:
            return {
                "ping": int(float(ping_match.group(2))),  # avg ping (converted to integer)
                "jitter": float(ping_match.group(4))  # mdev = jitter
            }
        else:
            return None
    except Exception as e:
        print(f"Ping error: {e}")
        return None

# Function to measure packet loss
def measure_packet_loss(ip):
    try:
        # Run ping command (10 packets)
        ping_output = subprocess.check_output(["ping", "-c", "10", ip], universal_newlines=True)
        
        # Parse packet loss percentage
        packet_loss_match = re.search(r"(\d+)% packet loss", ping_output)
        if packet_loss_match:
            return float(packet_loss_match.group(1))
        else:
            return None
    except Exception as e:
        print(f"Packet loss error: {e}")
        return None

# Function to measure bandwidth (using iperf)
def measure_bandwidth(ip):
    try:
        # Run iperf command (replace with your iperf server)
        iperf_output = subprocess.check_output(["iperf", "-c", ip, "-t", "5"], universal_newlines=True)
        
        # Parse iperf output
        bandwidth_match = re.search(r"(\d+\.\d+) Mbits/sec", iperf_output)
        if bandwidth_match:
            return float(bandwidth_match.group(1))
        else:
            return None
    except Exception as e:
        print(f"Bandwidth error: {e}")
        return None

# API endpoint
@app.route("/v2/<ip>", methods=["GET"])
def check_metrics(ip):
    # Check if metrics parameter is present
    if "metrics" not in request.args:
        return jsonify({"status": "error", "message": "Missing metrics parameter"}), 400

    # Run network tests
    ping_metrics = measure_ping(ip)
    packet_loss = measure_packet_loss(ip)
    bandwidth = measure_bandwidth(ip)

    # Prepare response
    response = {
        "ip": ip,
        "metrics": {
            "Ping": ping_metrics["ping"] if ping_metrics else None,
            "jitter": ping_metrics["jitter"] if ping_metrics else None,
            "packet_loss": packet_loss if packet_loss is not None else None,
            "bandwidth": bandwidth if bandwidth is not None else None
        }
    }

    return jsonify(response)

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
