/* global io */
const socket = io();

/* -------- toggle of the msgs -------- */
const toggleBtn = document.getElementById("toggle-msg");
const chatPanel = document.getElementById("chat-panel");

toggleBtn.addEventListener("click", () => {
    chatPanel.classList.toggle("active");

    // remove the indicator when the panel is opened
    if (chatPanel.classList.contains("active")) {
        toggleBtn.classList.remove("has-notification");
    }
});

/* -------- telemtry-------- */
const sensorData = {};

socket.on("new_telemetry", data => {
    if (!data.temperature && !data.humidity && !data.pressure && !data.air_quality) return;

    const tbody = document.getElementById("sensor-data");

    // time/date
    const timestamp = data.timestamp
        ? new Date(data.timestamp * 1000).toLocaleString("fr-FR")
        : new Date().toLocaleString("fr-FR");

    if (sensorData[data.node]) {
        const row = sensorData[data.node];

        const newValues = [
            data.temperature ?? "-",
            data.humidity ?? "-",
            data.pressure ?? "-",
            data.air_quality ?? "-",
            timestamp
        ];

        for (let i = 0; i < 5; i++) {
            if (row.children[i + 1].textContent !== newValues[i]) {
                row.children[i + 1].textContent = newValues[i];
                // effect with color
                row.children[i + 1].style.backgroundColor = "#D2FF28";
                setTimeout(() => {
                    row.children[i + 1].style.backgroundColor = "";
                }, 800); // 0.8 seconde
            }
        }
    } else {
        // new line
        const tr = document.createElement("tr");

        const nodeTd = document.createElement("td");
        nodeTd.textContent = data.node;

        const tempTd = document.createElement("td");
        tempTd.textContent = data.temperature ?? "-";

        const humTd = document.createElement("td");
        humTd.textContent = data.humidity ?? "-";

        const pressTd = document.createElement("td");
        pressTd.textContent = data.pressure ?? "-";

        const airTd = document.createElement("td");
        airTd.textContent = data.air_quality ?? "-";

        const timeTd = document.createElement("td");
        timeTd.textContent = timestamp;

        tr.appendChild(nodeTd);
        tr.appendChild(tempTd);
        tr.appendChild(humTd);
        tr.appendChild(pressTd);
        tr.appendChild(airTd);
        tr.appendChild(timeTd);

        tbody.appendChild(tr);

        //save the row
        sensorData[data.node] = tr;
    }
});

/* -------- msgs -------- */
socket.on("new_message", data => {
    const messages = document.getElementById("messages");

    const msg = document.createElement("div");
    msg.classList.add("message");

    const meta = document.createElement("span");
    meta.textContent = `${data.src} • ${new Date(data.timestamp * 1000).toLocaleString("fr-FR")}`;

    const content = document.createElement("div");
    content.textContent = data.message;

    msg.appendChild(meta);
    msg.appendChild(content);
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;

    // display the red dot if the panel is closed
    if (!chatPanel.classList.contains("active")) {
        toggleBtn.classList.add("has-notification");
    }
});
