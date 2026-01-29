from flask import Flask, render_template, redirect, url_for, session, request
from flask_socketio import SocketIO
from meshtastic.serial_interface import SerialInterface
from pubsub import pub
from datetime import datetime

#---------- create the server -----------------
app = Flask(__name__)
app.config['SECRET_KEY'] = 'itsasecret'
socketio = SocketIO(app, cors_allowed_origins="*")

# ------------------ takes the data from the port ------------------
interface = SerialInterface(devPath="COM3")  #

def on_receive(packet):
    if 'decoded' not in packet:
        return
    decoded = packet['decoded']
    src = packet.get('fromId', 'unknown')

    # --------- text messages ----------
    if 'text' in decoded:
        socketio.emit("new_message", {
            "message": decoded['text'],
            "src": src,
            "timestamp": int(datetime.now().timestamp())
        })

    # --------- telemetry ----------
    if 'telemetry' in decoded:
        telemetry = decoded['telemetry']
        env = telemetry.get("environmentMetrics", {})

        temperature = env.get("temperature")
        humidity = env.get("relativeHumidity")
        pressure = env.get("barometricPressure")
        air_quality = env.get("iaq")

        if temperature is None and humidity is None and pressure is None and air_quality is None:
            # If the values are empty it doesn't take any
            return

        data = {
            "node": src,
            "temperature": temperature,
            "humidity": humidity,
            "pressure": pressure,
            "air_quality": air_quality
        }

        socketio.emit("new_telemetry", data)

pub.subscribe(on_receive, "meshtastic.receive")

# ------------------the authentication data ------------------
USERNAME = "smart for green"
PASSWORD = "1234"

# ------------------ routes  ------------------

# page home
@app.route("/")
def home():
    return render_template("home.html")

# page login
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = request.form.get("user")
        password = request.form.get("pass")
        if user == USERNAME and password == PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("monitoring"))
        return render_template("login.html", error="Incorrect username or password")
    return render_template("login.html")

# monitoring page
@app.route("/monitoring")
def monitoring():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    return render_template("monitoring.html")

# logout
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

# ------------------ run ------------------
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
