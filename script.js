document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Update active tab UI
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content UI
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${target}`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Generic Reset Logic
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('reset', () => {
            const resultId = form.id.replace('-form', '-result');
            const resultElement = document.getElementById(resultId);
            if (resultElement) {
                resultElement.classList.add('hidden');
                if (form.id === 'bmi-form') resetBMIGauge();
            }
        });
    });

    // Tab Switching for Educational Content
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            document.querySelectorAll('.info-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const infoTab = document.getElementById(`info-${target}`);
            if (infoTab) infoTab.classList.add('active');
        });
    });

    function resetBMIGauge() {
        const gaugeFill = document.getElementById('bmi-gauge-fill');
        const needle = document.getElementById('gauge-needle');
        if (gaugeFill && needle) {
            gaugeFill.style.strokeDashoffset = 251.3;
            needle.style.transform = `rotate(0deg)`;
        }
    }

    function updateBMIGauge(bmi) {
        const gaugeFill = document.getElementById('bmi-gauge-fill');
        const needle = document.getElementById('gauge-needle');
        if (!gaugeFill || !needle) return;

        // BMI range for gauge: 15 to 40
        const min = 15;
        const max = 40;
        const clampedBMI = Math.max(min, Math.min(max, bmi));
        const percent = (clampedBMI - min) / (max - min);
        
        // Gauge offset (251.3 is half circle)
        const offset = 251.3 * (1 - percent);
        gaugeFill.style.strokeDashoffset = offset;

        // Needle rotation
        // Origin is 100 100. Default line is (100,100) to (20,100) which is 180deg (left).
        // We want to rotate FROM left (0%) TO right (100%).
        const rotation = percent * 180;
        needle.style.transform = `rotate(${rotation}deg)`;
        
        // Color based on category
        let color = '#3498db'; // Underweight
        if (bmi >= 18.5 && bmi < 25) color = '#6ec1b3'; // Normal (Mint)
        else if (bmi >= 25 && bmi < 30) color = '#ff9100'; // Overweight (Orange)
        else if (bmi >= 30) color = '#e74c3c'; // Obese
        
        gaugeFill.style.stroke = color;
    }

    // BMI Calculation
    const bmiForm = document.getElementById('bmi-form');
    if (bmiForm) {
        bmiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const weight = parseFloat(document.getElementById('bmi-weight').value);
            const height = parseFloat(document.getElementById('bmi-height').value) / 100; // cm to m

            if (weight > 0 && height > 0) {
                const bmi = (weight / (height * height)).toFixed(1);
                displayBMIResult(bmi);
            }
        });
    }

    function displayBMIResult(bmi) {
        const resultContainer = document.getElementById('bmi-result');
        const bmiValue = document.getElementById('bmi-value');
        const bmiThumb = document.getElementById('bmi-thumb');

        bmiValue.innerText = bmi;
        resultContainer.classList.remove('hidden');
        
        // Update the new SVG Gauge
        updateBMIGauge(parseFloat(bmi));

        // Positioning thumb
        let percent = 0;
        if (bmi < 18.5) {
            // Map 10-18.5 to 0-25%
            percent = Math.max(0, ((bmi - 10) / 8.5) * 25);
        } else if (bmi < 25) {
            // Map 18.5-25 to 25-50%
            percent = 25 + (((bmi - 18.5) / 6.5) * 25);
        } else if (bmi < 30) {
            // Map 25-30 to 50-75%
            percent = 50 + (((bmi - 25) / 5) * 25);
        } else {
            // Map 30-45 to 75-100%
            percent = 75 + Math.min(25, (((bmi - 30) / 15) * 25));
        }

        bmiThumb.style.left = `${percent}%`;

        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // BMR Calculation (Roza-Shizgal)
    const bmrForm = document.getElementById('bmr-form');
    if (bmrForm) {
        bmrForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const gender = document.querySelector('input[name="bmr-gender"]:checked').value;
            const weight = parseFloat(document.getElementById('bmr-weight').value);
            const height = parseFloat(document.getElementById('bmr-height').value);
            const age = parseFloat(document.getElementById('bmr-age').value);

            let bmr = 0;
            if (gender === 'male') {
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
            } else {
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
            }

            displayBMRResult(bmr.toFixed(0));
        });
    }

    function displayBMRResult(bmr) {
        const resultContainer = document.getElementById('bmr-result');
        const bmrValue = document.getElementById('bmr-value');
        bmrValue.innerText = bmr;
        resultContainer.classList.remove('hidden');
        
        // Auto-fill BMR into TDEE calculator
        const tdeeBmrInput = document.getElementById('tdee-bmr');
        if (tdeeBmrInput) tdeeBmrInput.value = bmr;

        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // TDEE Calculation
    const tdeeForm = document.getElementById('tdee-form');
    if (tdeeForm) {
        tdeeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bmr = parseFloat(document.getElementById('tdee-bmr').value);
            const activity = parseFloat(document.getElementById('tdee-activity').value);

            if (bmr > 0) {
                const tdee = (bmr * activity).toFixed(0);
                displayTDEEResult(tdee);
            }
        });
    }

    // Ideal Body Weight Calculation
    const ibwForm = document.getElementById('ibw-form');
    if (ibwForm) {
        ibwForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const gender = document.querySelector('input[name="ibw-gender"]:checked').value;
            const height = parseFloat(document.getElementById('ibw-height').value);

            let ibw = 0;
            if (gender === 'male') {
                ibw = height - 100;
            } else {
                ibw = height - 105;
            }

            const resultContainer = document.getElementById('ibw-result');
            document.getElementById('ibw-value').innerText = ibw.toFixed(1);
            resultContainer.classList.remove('hidden');
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // Body Fat % Calculation (U.S. Navy Method)
    const bfpForm = document.getElementById('bfp-form');
    const bfpGenderInputs = document.querySelectorAll('input[name="bfp-gender"]');
    const hipContainer = document.getElementById('bfp-hip-container');

    bfpGenderInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.value === 'female') {
                hipContainer.classList.remove('hidden');
                document.getElementById('bfp-hip').required = true;
            } else {
                hipContainer.classList.add('hidden');
                document.getElementById('bfp-hip').required = false;
            }
        });
    });

    if (bfpForm) {
        bfpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const gender = document.querySelector('input[name="bfp-gender"]:checked').value;
            const height = parseFloat(document.getElementById('bfp-height').value);
            const waist = parseFloat(document.getElementById('bfp-waist').value);
            const neck = parseFloat(document.getElementById('bfp-neck').value);

            let bfp = 0;
            if (gender === 'male') {
                // Formula for men (metric)
                bfp = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
            } else {
                // Formula for women (metric)
                const hip = parseFloat(document.getElementById('bfp-hip').value);
                bfp = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
            }

            const resultContainer = document.getElementById('bfp-result');
            document.getElementById('bfp-value').innerText = bfp.toFixed(1) + '%';
            resultContainer.classList.remove('hidden');
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // PDF Export Logic
    const downloadButtons = document.querySelectorAll('.download-pdf-btn');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            generatePDF(type);
        });
    });

    function generatePDF(type) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const userName = document.getElementById('user-name').value || "Valued User";
        const date = new Date().toLocaleDateString();
        const accentCol = [255, 145, 0]; // Orange
        const textCol = [26, 26, 26]; // Dark Neutral
        const mutedCol = [92, 94, 98];
        const secondaryAccent = [110, 193, 179]; // Mint

        // 1. Header Bar
        doc.setFillColor(75, 77, 82); // Luke's Charcoal
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("BODY COMPOSITION & METABOLIC PROFILE", 15, 13);
        doc.setFontSize(16);
        doc.text("MyPrakrit", 170, 13);

        // 2. Personal Info Section
        doc.setTextColor(...textCol);
        doc.setFontSize(10);
        doc.text("NAME", 15, 30);
        doc.setTextColor(...accentCol);
        doc.setFontSize(12);
        doc.text(userName.toUpperCase(), 15, 37);

        doc.setTextColor(...textCol);
        doc.setFontSize(10);
        doc.text("DATE", 150, 30);
        doc.setTextColor(...accentCol);
        doc.setFontSize(12);
        doc.text(date, 150, 37);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, 42, 195, 42);

        // 3. OVERVIEW SECTION (Grid-like)
        doc.setTextColor(...textCol);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("OVERVIEW", 15, 52);

        // Helper for metric boxes
        const drawMetric = (label, val, x, y) => {
            doc.setFontSize(8);
            doc.setTextColor(...mutedCol);
            doc.text(label, x, y);
            doc.setFontSize(12);
            doc.setTextColor(...textCol);
            doc.text(val, x, y + 7);
        };

        const bmi = document.getElementById('bmi-value').innerText;
        const bmr = document.getElementById('bmr-value').innerText;
        const tdee = document.getElementById('tdee-value').innerText;

        drawMetric("BMI", bmi !== "--" ? bmi : "N/A", 15, 62);
        drawMetric("BMR (RESTING)", bmr !== "--" ? bmr + " kcal" : "N/A", 55, 62);
        drawMetric("TDEE (ACTIVE)", tdee !== "--" ? tdee + " kcal" : "N/A", 105, 62);

        // 4. MAIN CONTENT AREA (Based on Type)
        doc.setFillColor(248, 250, 252); // Very light grey bg for highlights
        doc.rect(15, 80, 180, 40, 'F');
        
        doc.setFontSize(12);
        doc.setTextColor(...textCol);
        doc.text(`${type} DETAILED ANALYSIS`, 20, 90);
        
        doc.setFontSize(24);
        doc.setTextColor(...accentCol);
        let val = "--";
        if (type === 'BMI') val = bmi;
        else if (type === 'BMR') val = bmr + " kcal";
        else if (type === 'TDEE') val = tdee + " kcal";
        else if (type === 'IBW') val = document.getElementById('ibw-value').innerText + " kg";
        else if (type === 'BFP') val = document.getElementById('bfp-value').innerText;
        else if (type === 'WHR') val = document.getElementById('whr-value').innerText;
        
        doc.text(val, 20, 105);

        // 5. SIDEBAR / EDUCATIONAL TEXT
        doc.setTextColor(...textCol);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("WHY THIS MATTERS", 15, 135);

        doc.setFont("helvetica", "normal");
        let infoText = "";
        if (type === 'BMI') infoText = "Body Mass Index is a simple index of weight-for-height that is commonly used to classify underweight, overweight and obesity in adults. While it doesn't measure body fat directly, it correlates highly with direct fat measurements.";
        else if (type === 'BMR') infoText = "Your Basal Metabolic Rate is the number of calories your body needs just to stay alive while at rest. Understanding this helps in determining the minimum caloric intake required for vital functions.";
        else infoText = "Maintaining a healthy body composition is key to longevity. This report provides a baseline to understand your current metabolic and physical profile. Consult a professional for a tailored fitness plan.";

        const splitText = doc.splitTextToSize(infoText, 100);
        doc.text(splitText, 15, 142);

        // Right side - Additional Metrics or Charts placeholder
        doc.setDrawColor(...accentCol);
        doc.setLineWidth(0.5);
        doc.line(125, 130, 125, 200);

        doc.setFont("helvetica", "bold");
        doc.text("METABOLIC NOTES", 130, 135);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text([
            "• Resting metabolism accounts for 60-75% of burn.",
            "• Lean muscle mass increases BMR significantly.",
            "• Hydration affects body composition accuracy.",
            "• Consistency is key for metabolic success."
        ], 130, 145);

        // 6. FOOTER
        doc.setFontSize(8);
        doc.setTextColor(...mutedCol);
        doc.text("Generated by myprakrit.in - Digital Health Companion", 105, 285, { align: "center" });
        doc.text("Confidential Health Report • For informational purposes only", 105, 290, { align: "center" });

        doc.save(`MyPrakrit_Report_${userName.replace(/\s+/g, '_')}_${type}.pdf`);
    }
});
