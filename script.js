document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) lucide.createIcons();

    const masterForm = document.getElementById('master-calculator-form');
    const resultsDashboard = document.getElementById('master-results');
    const downloadBtn = document.getElementById('master-download-pdf');

    // Calculation Constants & Helpers
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
    const setRes = (id, val, text = '') => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || val;
    };

    if (masterForm) {
        masterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateAll();
        });
    }

    function calculateAll() {
        // Collect Inputs
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const age = getVal('age');
        const weight = getVal('weight');
        const height = getVal('height'); // cm
        const neck = getVal('neck');
        const waist = getVal('waist');
        const hip = getVal('hip');
        const activity = getVal('physical-activity');
        const stress = getVal('stress');
        const modification = getVal('modification');

        if (!weight || !height || !age) return;

        // 1. BMI
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        setRes('res-bmi', bmi);
        updateBMIGauge(bmi);
        updateBMIStatus(bmi);

        // 2. IBW (Devine Formula approximation)
        let ibw = 0;
        if (gender === 'male') {
            ibw = 50 + 2.3 * ((height / 2.54) - 60);
        } else {
            ibw = 45.5 + 2.3 * ((height / 2.54) - 60);
        }
        setRes('res-ibw', ibw.toFixed(1));

        // 3. WHR
        if (waist && hip) {
            const whr = (waist / hip).toFixed(2);
            setRes('res-whr', whr);
            updateWHRStatus(whr, gender);
        } else {
            setRes('res-whr', 'N/A');
        }

        // 4. BMR (Mifflin-St Jeor)
        let bmr = 0;
        if (gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
        setRes('res-bmr', bmr.toFixed(0));

        // 5. Daily Calories (TDEE)
        const calories = (bmr * activity * stress).toFixed(0);
        setRes('res-calories', calories);

        // 6. RDI (Modification)
        const rdi = (parseFloat(calories) + modification).toFixed(0);
        setRes('res-rdi', rdi);

        // Show Results
        resultsDashboard.classList.remove('hidden');
        resultsDashboard.classList.add('fade-in'); // Ensure the fade-in class is applied
        resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function updateBMIGauge(bmi) {
        const gauge = document.getElementById('master-bmi-gauge');
        if (!gauge) return;
        
        // Target: 251.3 is approx half-circle stroke length for r=40
        // We'll use a simpler scale for the mini gauge
        const max = 40, min = 15;
        const clamped = Math.max(min, Math.min(max, bmi));
        const percent = (clamped - min) / (max - min);
        const dashArray = 125.6; // approx half circum for r=40
        const offset = dashArray * (1 - percent);
        
        gauge.style.strokeDasharray = dashArray;
        gauge.style.strokeDashoffset = offset;

        // Color
        let color = '#3498db';
        if (bmi >= 18.5 && bmi < 25) color = '#6ec1b3';
        else if (bmi >= 25 && bmi < 30) color = '#ff9100';
        else if (bmi >= 30) color = '#e74c3c';
        gauge.style.stroke = color;
    }

    function updateBMIStatus(bmi) {
        const statusEl = document.getElementById('res-bmi-status');
        let status = "Normal", color = "#6ec1b3", bg = "rgba(110, 193, 179, 0.1)";
        
        if (bmi < 18.5) { status = "Underweight"; color = "#3498db"; bg = "rgba(52, 152, 219, 0.1)"; }
        else if (bmi >= 25 && bmi < 30) { status = "Overweight"; color = "#ff9100"; bg = "rgba(255, 145, 0, 0.1)"; }
        else if (bmi >= 30) { status = "Obese"; color = "#e74c3c"; bg = "rgba(231, 76, 60, 0.1)"; }
        
        statusEl.innerText = status;
        statusEl.style.color = color;
        statusEl.style.backgroundColor = bg;
    }

    function updateWHRStatus(whr, gender) {
        const statusEl = document.getElementById('res-whr-status');
        let risk = "Low Risk", color = "#6ec1b3", bg = "rgba(110, 193, 179, 0.1)";
        
        const threshold = (gender === 'male' ? 0.9 : 0.85);
        if (whr > threshold) {
            risk = "High Risk";
            color = "#e74c3c";
            bg = "rgba(231, 76, 60, 0.1)";
        }
        
        statusEl.innerText = risk;
        statusEl.style.color = color;
        statusEl.style.backgroundColor = bg;
    }

    // PDF Generation
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Compiling Advanced Report...';
            downloadBtn.style.opacity = '0.7';
            downloadBtn.disabled = true;
            if (window.lucide) lucide.createIcons();

            try {
                const reportArea = document.getElementById('capture-report-area');
                
                // Capture the visible area without animations
                document.body.classList.add('pdf-capture-mode');
                await new Promise(r => setTimeout(r, 100));

                const canvas = await html2canvas(reportArea, {
                    scale: 2, 
                    useCORS: true,
                    backgroundColor: '#ffffff', // Ensures a white background is captured
                    windowWidth: 1000,
                    logging: false,
                    onclone: (clonedDoc) => {
                        // Inject a style block into the cloned document to guarantee text visibility
                        const style = clonedDoc.createElement('style');
                        style.textContent = `
                            .result-box { opacity: 1 !important; transform: none !important; animation: none !important; background-color: #f8fafc !important; border-color: #cbd5e1 !important; }
                            .box-label { color: #64748b !important; font-weight: 800 !important; }
                            .box-value { color: #0f172a !important; font-weight: 900 !important; }
                            .box-unit { color: #64748b !important; }
                            /* Force the primary/highlighted boxes to keep their contrast */
                            .primary-metric { background-color: #fffaf5 !important; border-color: #ff8c00 !important; }
                            .highlighted { background-color: #0f172a !important; border-color: #0f172a !important; }
                            .highlighted .box-value, .highlighted .box-label, .highlighted .box-unit { color: #ffffff !important; }
                            .highlighted-alt { background-color: #0ea5e9 !important; border-color: #0ea5e9 !important; }
                            .highlighted-alt .box-value, .highlighted-alt .box-label, .highlighted-alt .box-unit { color: #ffffff !important; }
                            .fade-in-up { opacity: 1 !important; transform: none !important; animation: none !important; }
                        `;
                        clonedDoc.head.appendChild(style);
                    }
                });

                document.body.classList.remove('pdf-capture-mode');

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4');
                const pWidth = doc.internal.pageSize.getWidth();
                const userName = getVal('user-name') ? document.getElementById('user-name').value.toUpperCase() : "VALUED CLIENT";
                const date = new Date().toLocaleDateString();

                // 1. Sleek Header
                doc.setFillColor(15, 23, 42); // --secondary
                doc.rect(0, 0, pWidth, 35, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(22);
                doc.text("MYPRAKRIT HEALTH INTELLIGENCE", pWidth/2, 18, { align: "center" });
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(200, 200, 200);
                doc.text("PRECISION METABOLIC & BIOMETRIC ANALYSIS", pWidth/2, 26, { align: "center" });

                // 2. Client Demographics Box
                doc.setDrawColor(200, 200, 200); // Darker border for contrast
                doc.setFillColor(245, 245, 245); // Slightly darker background for contrast
                doc.roundedRect(15, 45, pWidth - 30, 25, 3, 3, 'FD');
                
                // Deep, high-contrast text to override potential dark-mode PDF viewer inversions
                doc.setTextColor(0, 0, 0); 
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(`CLIENT: ${userName}`, 20, 55);
                doc.text(`DATE: ${date}`, pWidth - 20, 55, { align: 'right' });
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                const genderGroup = document.querySelector('input[name="gender"]:checked');
                const gender = genderGroup ? genderGroup.value.toUpperCase() : 'UNKNOWN';
                const vWeight = getVal('weight') + " kg";
                const vHeight = getVal('height') + " cm";
                const vAge = getVal('age') + " yrs";
                doc.text(`Age: ${vAge}   |   Gender: ${gender}   |   Height: ${vHeight}   |   Current Wt: ${vWeight}`, 20, 63);

                // 3. Insert The Visual Charting (html2canvas result)
                doc.setTextColor(0, 0, 0); // Solid black for guaranteed visibility
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("CORE METRIC DASHBOARD", 15, 85);

                const imgData = canvas.toDataURL('image/jpeg', 1.0); // Maximum quality JPEG

                const imgProps = doc.getImageProperties(imgData);
                const pdfImgWidth = pWidth - 30; // 15 margins
                const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;
                
                // Add a drop shadow effectively
                doc.setFillColor(200, 200, 200);
                doc.rect(16, 91, pdfImgWidth, pdfImgHeight, 'F');
                // The actual captured image
                doc.addImage(imgData, 'JPEG', 15, 90, pdfImgWidth, pdfImgHeight);

                let nextY = 90 + pdfImgHeight + 15;

                // 4. Clinical Interpretations
                doc.setFillColor(15, 23, 42); // Dark bar
                doc.rect(15, nextY, pWidth - 30, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(11);
                doc.text("CLINICAL INTERPRETATIONS & TARGETS", 20, nextY + 6);
                
                nextY += 15;
                doc.setTextColor(20, 20, 20); // Darker text
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                
                const interpretations = [
                    "• METABOLIC RATE (BMR): Your body burns this baseline energy performing basic life functions.",
                    "• ENERGY EXPENDITURE (TDEE): Baseline energy scaled by your reported lifestyle activity factor.",
                    "• TARGET INTAKE (RDI): Your precise calorie goal designed to achieve your specified modification deficit/surplus.",
                    "• BODY COMP STATUS: Health risk indicators derived from your Body Mass Index (BMI) and Waist-to-Hip Ratio (WHR)."
                ];
                
                doc.text(interpretations, 15, nextY, { maxWidth: pWidth - 30, lineHeightFactor: 1.5 });

                nextY += 35;
                doc.setDrawColor(150, 150, 150);
                doc.line(15, nextY, pWidth - 15, nextY);
                
                // 5. Footer
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text("Generated securely by MyPrakrit Intelligence Engine.", pWidth/2, 285, { align: "center" });
                
                // Save
                doc.save(`MyPrakrit_Advanced_Metrics_${Date.now()}.pdf`);
            } catch (err) {
                console.error("PDF Gen Failed:", err);
                alert("Report compilation encountered an issue. Please try again.");
                document.body.classList.remove('pdf-capture-mode');
            } finally {
                // Restore button
                downloadBtn.innerHTML = '<i data-lucide="file-text"></i> Download Advanced Health Report';
                downloadBtn.style.opacity = '1';
                downloadBtn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        });
    }
});

