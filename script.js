// ======================================
// POWERGUARD - JAVASCRIPT
// ======================================

// DATE AND TIME
function updateDateTime() {
    const clock = document.getElementById("dateTime");

    if (clock) {
        clock.textContent = new Date().toLocaleString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);


// DARK MODE
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    const button = document.getElementById("darkModeBtn");

    if (document.body.classList.contains("dark-mode")) {
        button.textContent = "☀️ Light Mode";
    } else {
        button.textContent = "🌙 Dark Mode";
    }
}


// WORKSPACE
const output = document.getElementById("output");

function showWorkspace(title, description, fields, buttonText, action) {
    output.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
        <form id="moduleForm">
            ${fields}
            <button type="submit">${buttonText}</button>
        </form>
        <div id="moduleResult"></div>
    `;

    document.getElementById("moduleForm").addEventListener(
        "submit",
        function (event) {
            event.preventDefault();
            action();
        }
    );
}


// READ INPUT
function read(id, label, min = 0) {
    const element = document.getElementById(id);
    const value = element.value.trim();
    const number = Number(value);

    if (value === "" || !Number.isFinite(number) || number < min) {
        throw new Error(
            `${label} must be a valid number greater than or equal to ${min}.`
        );
    }

    return number;
}


// SHOW RESULT
function showResult(html) {
    document.getElementById("moduleResult").innerHTML = html;
}


// ACTIVITY HISTORY
let historyItems = [];

function addHistory(module, result, status) {
    const time = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });

    historyItems.unshift({ time, module, result, status });
    historyItems = historyItems.slice(0, 10);

    renderHistory();
}

function renderHistory() {
    const body = document.getElementById("historyBody");

    if (historyItems.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="4" class="no-history">
                    No activity yet. Run a calculation to see your history.
                </td>
            </tr>
        `;
        return;
    }

    body.innerHTML = historyItems.map(item => `
        <tr>
            <td>${item.time}</td>
            <td>${item.module}</td>
            <td>${item.result}</td>
            <td>${item.status}</td>
        </tr>
    `).join("");
}

function clearHistory() {
    historyItems = [];
    renderHistory();
}


// DASHBOARD VALUES
function updateDashboard(voltage, current, load, pf) {
    document.getElementById("metricVoltage").innerHTML =
        `${voltage} <small>V</small>`;

    document.getElementById("metricCurrent").innerHTML =
        `${current} <small>A</small>`;

    document.getElementById("metricLoad").innerHTML =
        `${load.toFixed(1)} <small>%</small>`;

    document.getElementById("metricLoadStatus").textContent =
        load > 100 ? "Overloaded" :
        load >= 80 ? "High loading" : "Within entered rating";

    document.getElementById("metricPF").textContent =
        pf.toFixed(2);
}


// ======================================
// 1. TRANSFORMER LOAD MONITORING
// ======================================

function loadMonitoring() {
    showWorkspace(
        "🔋 Transformer Load Monitoring",
        "Enter transformer rating and measured electrical readings.",
        `
        <label for="rating">Transformer Rating (kVA)</label>
        <input id="rating" type="number" min="0.1" step="any"
            placeholder="Example: 100" required>

        <label for="voltage">Line Voltage (V)</label>
        <input id="voltage" type="number" min="0.1" step="any"
            placeholder="Example: 415" required>

        <label for="current">Line Current (A)</label>
        <input id="current" type="number" min="0" step="any"
            placeholder="Example: 100" required>

        <label for="loadPf">Power Factor (0 to 1)</label>
        <input id="loadPf" type="number" min="0" max="1"
            step="any" placeholder="Example: 0.85" required>
        `,
        "Calculate Transformer Load",
        calculateLoad
    );
}

function calculateLoad() {
    try {
        const rating = read("rating", "Transformer rating", 0.1);
        const voltage = read("voltage", "Voltage", 0.1);
        const current = read("current", "Current", 0);
        const pf = read("loadPf", "Power factor", 0.01);

        if (pf > 1) {
            throw new Error("Power factor must not be greater than 1.");
        }

        // Three-phase apparent power in kVA
        const kva = Math.sqrt(3) * voltage * current / 1000;
        const load = kva / rating * 100;
        const kw = kva * pf;

        let status, advice, resultClass;

        if (load > 100) {
            status = "OVERLOADED";
            resultClass = "result-danger";
            advice = "Reduce or redistribute the load. Ask a qualified electrical professional to inspect the transformer.";
        } else if (load >= 80) {
            status = "HIGH LOADING";
            resultClass = "result-warning";
            advice = "Monitor loading and temperature. Check phase balance and cooling with qualified personnel.";
        } else {
            status = "WITHIN RATING";
            resultClass = "result-good";
            advice = "The calculated load is below 80% of the entered rating. Continue routine monitoring.";
        }

        showResult(`
            <div class="result-card">
                <h3>Transformer Analysis</h3>
                <p>Calculated apparent power: <strong>${kva.toFixed(2)} kVA</strong></p>
                <p>Estimated real power: <strong>${kw.toFixed(2)} kW</strong></p>
                <p>Transformer loading: <strong>${load.toFixed(2)}%</strong></p>
                <p>Status: <span class="${resultClass}">${status}</span></p>
                <p><strong>Recommendation:</strong> ${advice}</p>
            </div>
        `);

        updateDashboard(voltage, current, load, pf);
        addHistory("Transformer Load", `${load.toFixed(1)}% loading`, status);

    } catch (error) {
        showResult(`<p class="result-danger">${error.message}</p>`);
    }
}


// ======================================
// 2. ELECTRICAL FAULT CHECK
// ======================================

function faultDetection() {
    showWorkspace(
        "🛡️ Electrical Fault Detection",
        "Compare entered readings with the operating limits you specify.",
        `
        <label for="faultV">Measured Voltage (V)</label>
        <input id="faultV" type="number" min="0" step="any"
            placeholder="Example: 415" required>

        <label for="faultI">Measured Current (A)</label>
        <input id="faultI" type="number" min="0" step="any"
            placeholder="Example: 20" required>

        <label for="minV">Minimum Acceptable Voltage (V)</label>
        <input id="minV" type="number" min="0" step="any"
            placeholder="Example: 380" required>

        <label for="maxV">Maximum Acceptable Voltage (V)</label>
        <input id="maxV" type="number" min="0.1" step="any"
            placeholder="Example: 440" required>

        <label for="maxI">Maximum Acceptable Current (A)</label>
        <input id="maxI" type="number" min="0.1" step="any"
            placeholder="Example: 25" required>
        `,
        "Check Readings",
        checkFault
    );
}

function checkFault() {
    try {
        const voltage = read("faultV", "Measured voltage");
        const current = read("faultI", "Measured current");
        const minV = read("minV", "Minimum voltage");
        const maxV = read("maxV", "Maximum voltage");
        const maxI = read("maxI", "Maximum current", 0.1);

        if (minV >= maxV) {
            throw new Error(
                "Maximum voltage must be greater than minimum voltage."
            );
        }

        const issues = [];

        if (voltage < minV) issues.push("Voltage is below the entered limit.");
        if (voltage > maxV) issues.push("Voltage is above the entered limit.");
        if (current > maxI) issues.push("Current exceeds the entered limit.");

        const status = issues.length ? "LIMIT EXCEEDED" : "WITHIN LIMITS";
        const resultClass = issues.length ? "result-warning" : "result-good";

        let advice = issues.length
            ? "Have a qualified electrician investigate the readings, wiring, connections, and protective devices. Do not touch exposed conductors."
            : "No limit violation was identified in these entered readings. This check cannot rule out every electrical fault.";

        showResult(`
            <div class="result-card">
                <h3>Electrical Reading Check</h3>
                <p>Voltage: <strong>${voltage} V</strong></p>
                <p>Current: <strong>${current} A</strong></p>
                <p>Status: <span class="${resultClass}">${status}</span></p>
                ${
                    issues.length
                    ? `<ul>${issues.map(issue => `<li>${issue}</li>`).join("")}</ul>`
                    : "<p>All entered readings are within the specified limits.</p>"
                }
                <p><strong>Recommendation:</strong> ${advice}</p>
                <p><small>This is a basic software check, not a live fault detector.</small></p>
            </div>
        `);

        addHistory("Fault Check", issues.length
            ? `${issues.length} limit issue(s)` : "Readings within limits", status);

    } catch (error) {
        showResult(`<p class="result-danger">${error.message}</p>`);
    }
}


// ======================================
// 3. POWER FACTOR IMPROVEMENT
// ======================================

function powerFactor() {
    showWorkspace(
        "📊 Power Factor Improvement",
        "Estimate the capacitor bank size needed to reach a target power factor.",
        `
        <label for="realKW">Real Power (kW)</label>
        <input id="realKW" type="number" min="0.1" step="any"
            placeholder="Example: 50" required>

        <label for="initialPF">Present Power Factor (0 to 1)</label>
        <input id="initialPF" type="number" min="0.01" max="1"
            step="any" placeholder="Example: 0.70" required>

        <label for="targetPF">Target Power Factor (0 to 1)</label>
        <input id="targetPF" type="number" min="0.01" max="1"
            step="any" placeholder="Example: 0.95" required>
        `,
        "Calculate Improvement",
        calculatePF
    );
}

function calculatePF() {
    try {
        const kw = read("realKW", "Real power", 0.1);
        const initialPF = read("initialPF", "Present power factor", 0.01);
        const targetPF = read("targetPF", "Target power factor", 0.01);

        if (initialPF > 1 || targetPF > 1) {
            throw new Error("Power factor must not be greater than 1.");
        }

        if (targetPF <= initialPF) {
            throw new Error(
                "Target power factor must be greater than the present power factor."
            );
        }

        const angleInitial = Math.acos(initialPF);
        const angleTarget = Math.acos(targetPF);

        const initialKvar = kw * Math.tan(angleInitial);
        const targetKvar = kw * Math.tan(angleTarget);
        const capacitorKvar = initialKvar - targetKvar;

        showResult(`
            <div class="result-card">
                <h3>Power Factor Analysis</h3>
                <p>Present power factor: <strong>${initialPF.toFixed(2)}</strong></p>
                <p>Target power factor: <strong>${targetPF.toFixed(2)}</strong></p>
                <p>Estimated capacitor bank requirement:
                    <strong>${capacitorKvar.toFixed(2)} kVAr</strong>
                </p>
                <p>Present reactive power: <strong>${initialKvar.toFixed(2)} kVAr</strong></p>
                <p>Target reactive power: <strong>${targetKvar.toFixed(2)} kVAr</strong></p>
                <p class="result-good">The target power factor is higher than the present value.</p>
                <p><strong>Recommendation:</strong> A qualified electrical engineer should verify the load profile and select a properly rated capacitor bank. Check for harmonics and avoid overcompensation.</p>
                <p><small>This is an estimate; it is not an instruction to install a capacitor bank without engineering review.</small></p>
            </div>
        `);

        document.getElementById("metricPF").textContent =
            targetPF.toFixed(2);

        addHistory(
            "Power Factor",
            `${initialPF.toFixed(2)} → ${targetPF.toFixed(2)}`,
            "Calculated"
        );

    } catch (error) {
        showResult(`<p class="result-danger">${error.message}</p>`);
    }
}