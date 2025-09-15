let courseCount = 0;
function createCourseElement(index) {
    const container = document.createElement("div");
    container.className = "course-item";

    const grid = document.createElement("div");
    grid.className = "course-grid";

    const courseInput = document.createElement("input");
    courseInput.type = "text";
    courseInput.placeholder = `Course ${index + 1}`;
    courseInput.className = "input-field";
    courseInput.readOnly = true;

    const creditSelect = document.createElement("select");
    creditSelect.className = "input-field";
    creditSelect.innerHTML = `
        <option value="" disabled selected>Credit</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
    `;

    /*const gradeSelect = document.createElement("select");
    gradeSelect.className = "input-field";
    gradeSelect.innerHTML = `
        <option value="" disabled selected>Grade</option>
        <option value="4">A</option>
        <option value="3.67">A-</option>
        <option value="3.33">B+</option>
        <option value="3">B</option>
        <option value="2.67">B-</option>
        <option value="2.33">C+</option>
        <option value="2">C</option>
        <option value="1.67">C-</option>
        <option value="1.33">D+</option>
        <option value="1">D</option>
        <option value="0">F</option>
    `;*/
    const gradeSelect = document.createElement("select");
    gradeSelect.className = "input-field";
    gradeSelect.innerHTML = `
    <option value="" disabled selected>Grade</option>
    <option value="4" data-range="90–100">A</option>
    <option value="3.67" data-range="86–89">A-</option>
    <option value="3.33" data-range="82–85">B+</option>
    <option value="3" data-range="78–81">B</option>
    <option value="2.67" data-range="74–77">B-</option>
    <option value="2.33" data-range="70–73">C+</option>
    <option value="2" data-range="66–69">C</option>
    <option value="1.67" data-range="62–65">C-</option>
    <option value="1.33" data-range="58–61">D+</option>
    <option value="1" data-range="55–57">D</option>
    <option value="0" data-range="Below 54">F</option>
`;

    // create helper element (will show marks range dynamically)
    const marksHint = document.createElement("div");
    marksHint.style.fontSize = "0.8rem";
    marksHint.style.color = "#666";
    marksHint.style.marginTop = "3px";

    // update marks range when grade changes
    gradeSelect.addEventListener("change", () => {
        const option = gradeSelect.options[gradeSelect.selectedIndex];
        const range = option.getAttribute("data-range");
        marksHint.textContent = range ? `Marks range: ${range}` : "";
    });

    // append select and hint together wherever you are appending
    container.appendChild(gradeSelect);
    container.appendChild(marksHint);


    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.title = "Remove course";
    deleteBtn.onclick = () => {
        container.remove();
        updateCourseNumbers();
    };


    const retakeWrapper = document.createElement("div");
    retakeWrapper.className = "retake-container";

    const retakeCheckbox = document.createElement("input");
    retakeCheckbox.type = "checkbox";
    retakeCheckbox.id = `retake-${index}`;

    const retakeLabel = document.createElement("label");
    retakeLabel.htmlFor = retakeCheckbox.id;
    retakeLabel.textContent = "Retake";

    retakeWrapper.appendChild(retakeCheckbox);
    retakeWrapper.appendChild(retakeLabel);

    // previous grade container
    const prevGradeContainer = document.createElement("div");
    prevGradeContainer.className = "prev-grade-container";
    prevGradeContainer.id = `prevGrade-${index}`;
    prevGradeContainer.style.display = "none";

    const prevGradeSelect = document.createElement("select");
    prevGradeSelect.className = "input-field";
    prevGradeSelect.innerHTML = `
    <option value="" disabled selected>Previous Grade</option>
        <option value="4">A</option>
        <option value="3.67">A-</option>
        <option value="3.33">B+</option>
        <option value="3">B</option>
        <option value="2.67">B-</option>
        <option value="2.33">C+</option>
        <option value="2">C</option>
        <option value="1.67">C-</option>
        <option value="1.33">D+</option>
        <option value="1">D</option>
        <option value="0">F</option>
`;

    prevGradeContainer.appendChild(prevGradeSelect);

    // toggle show/hide
    retakeCheckbox.addEventListener("change", () => {
        prevGradeContainer.style.display = retakeCheckbox.checked ? "block" : "none";
    });

    grid.appendChild(courseInput);
    grid.appendChild(creditSelect);
    grid.appendChild(gradeSelect);
    grid.appendChild(deleteBtn);

    container.appendChild(grid);
    container.appendChild(retakeWrapper);
    container.appendChild(prevGradeContainer);

    return container;
}

// Handle CGPA prediction
function calculateCGPA() {

    //Get user inputs
    let completed = parseFloat(document.getElementById("completedCredits").value); // Total completed credits before this semester
    let cgpa = parseFloat(document.getElementById("currentCGPA").value);           // Current CGPA before this semester

    if (isNaN(completed)) completed = 0;
    if (isNaN(cgpa)) cgpa = 0;

    // Cap CGPA at 4 (UIU system max)
    const cappedCGPA = Math.min(cgpa, 4);

    // All course rows
    const courseItems = document.querySelectorAll("#courses .course-item");

    let totalNewCredits = 0;   // Credits from fresh (non-retake) courses
    let totalNewPoints = 0;    // Points gained from both fresh and retakes
    let semesterCredits = 0;   // Credits in this trimester (fresh courses only)
    let semesterPoints = 0;    // Points in this trimester (fresh courses only)
    let retakeCredits = 0;     // Retake credits (only for showing info)

    //Loop through each course row
    courseItems.forEach(item => {
        const selects = item.querySelectorAll("select");
        const credit = parseFloat(selects[0].value); // course credit
        const grade = parseFloat(selects[1].value);  // new grade value
        const isRetake = item.querySelector('input[type="checkbox"]').checked; // retake checkbox
        const prevGradeSelect = item.querySelector(".prev-grade-container select");
        const prevGrade = prevGradeSelect ? parseFloat(prevGradeSelect.value) : NaN; // old grade if retake

        if (!isNaN(credit) && !isNaN(grade)) {
            if (isRetake) {
                // Retake case
                // We only add the *difference* between new grade and old grade
                // Example: If old grade=2, new grade=4 in 3 credit → +6 points
                if (!isNaN(prevGrade)) {
                    totalNewPoints += (grade - prevGrade) * credit;
                    retakeCredits += credit; // Just for displaying info
                } else {
                    //console.warn("Retake marked but previous grade missing, skipping retake.");
                }
            } else {
                //Fresh course case
                // Add new credits and points
                totalNewCredits += credit;
                totalNewPoints += grade * credit;

                // Trimester GPA is based only on *fresh* courses
                semesterCredits += credit;
                semesterPoints += grade * credit;
            }
        } else {
            console.warn("Missing or invalid credit/grade for a course, skipping.");
        }
    });

    //Total credits for CGPA (retakes don't add credits)
    const totalCredits = completed + totalNewCredits;

    let predicted = "0.00";
    if (totalCredits > 0) {
        //Points from previous semesters
        const previousPoints = completed * cappedCGPA;

        //Add the new points (both fresh & retakes)
        const newTotalPoints = previousPoints + totalNewPoints;

        //Fix: calculate as number → cap at 4 → then format
        let rawPredicted = newTotalPoints / totalCredits;
        rawPredicted = Math.min(rawPredicted, 4);
        predicted = rawPredicted.toFixed(2);
    }

    //Trimester GPA (only fresh courses)
    let semesterGPA = "0.00";
    if (semesterCredits > 0) {
        semesterGPA = (semesterPoints / semesterCredits).toFixed(2);
    }

    //UI update (kept exactly as you had it)
    const detailedResult = document.getElementById("detailedResult");
    detailedResult.innerHTML = `
        <p style="font-size:1.2rem;"><strong>Result</strong></p>
        <div class="installment-item"><strong>Predicted CGPA:</strong> <span style="font-size:1.4rem;">${predicted}</span></div>
        <div class="installment-item">Total Completed Credits: ${completed + semesterCredits}</div>
        <div class="installment-item">Trimester Credits: ${semesterCredits}</div>
        ${retakeCredits > 0 ? `<div class="installment-item">Retake Credits: ${retakeCredits}</div>` : ''}
        <div class="installment-item"><strong>Trimester GPA:</strong> ${semesterGPA}</div>
        ${retakeCredits > 0 ? `<div class="installment-item note">Note: Retakes replace old grades in CGPA but don’t add new credits or count in trimester GPA</div>` : ''}
    `;
    // Show modal
    const modal = document.getElementById("resultModal");
    modal.classList.remove("hidden");
    modal.style.display = "block";
}

// Handle Installment calculation
function calculateInstallments() {
    let tuitionCredits = parseFloat(document.getElementById("tuitionCredits").value);
    let retakeCredits = parseFloat(document.getElementById("retakeCredits").value);
    let perCredit = parseFloat(document.getElementById("tuitionPerCredit").value);
    let waiver = parseFloat(document.getElementById("waiverPercentage").value);

    if (isNaN(tuitionCredits)) tuitionCredits = 0;
    if (isNaN(retakeCredits)) retakeCredits = 0;
    if (isNaN(perCredit)) perCredit = 0;
    if (isNaN(waiver)) waiver = 0;

    const trimester_free = 6500;
    const regular = tuitionCredits - retakeCredits;
    const discounted = regular * perCredit * (1 - waiver / 100);
    const retake = retakeCredits * (perCredit / 2);
    const total = discounted + retake + trimester_free;

    // Clear previous result
    const detailedResult = document.getElementById("detailedResult");
    detailedResult.innerHTML = "";

    if (tuitionCredits === 0) {
        detailedResult.innerHTML = `
            <p style="font-size:1.2rem;"><strong>Installments</strong></p>
            <div class="installment-total">Oops, please fill in the fields!</div>
        `;
    }
    else if (Math.abs(total - trimester_free) < 1) {
        detailedResult.innerHTML = `
        <p style="font-size:1.2rem;"><strong>Installments</strong></p>
        <div class="installment-note">You have a 100% scholarship. Only the semester fee applies.</div>
        <div class="installment-total"><strong>Total payable:</strong> ৳${total.toFixed(2)}</div>
    `;
    }
    else {
        const i1 = total * 0.4;
        const i2 = total * 0.3;
        const i3 = total * 0.3;

        detailedResult.innerHTML = `
            <p style="font-size:1.2rem;"><strong>Installments</strong></p>
            <div class="installment-item">1st Installment (40%): ৳${i1.toFixed(2)}</div>
            <div class="installment-item">2nd Installment (30%): ৳${i2.toFixed(2)}</div>
            <div class="installment-item">3rd Installment (30%): ৳${i3.toFixed(2)}</div>
            <div class="installment-total">Total: ৳${total.toFixed(2)}</div>
        `;
    }

    // Show modal
    const modal = document.getElementById("resultModal");
    modal.classList.remove("hidden");
    modal.style.display = "block";
}
function addCourse() {
    const coursesDiv = document.getElementById("courses");
    const courseElement = createCourseElement(courseCount);
    coursesDiv.appendChild(courseElement);
    courseCount++;
}

function updateCourseNumbers() {
    const courses = document.querySelectorAll("#courses .course-item");
    courses.forEach((course, index) => {
        course.querySelector("input").placeholder = `Course ${index + 1}`;
    });
    courseCount = courses.length;
}

function toggleCalculator() {
    const isChecked = document.getElementById("showTuition").checked;
    const cgpaSection = document.getElementById("cgpaSection");
    const tuitionSection = document.getElementById("tuitionSection");
    const headerTitle = document.getElementById("headerTitle");

    if (isChecked) {
        cgpaSection.classList.add("hidden");
        tuitionSection.classList.remove("hidden");
        headerTitle.textContent = "Tuition Fee Calculator";
    } else {
        cgpaSection.classList.remove("hidden");
        tuitionSection.classList.add("hidden");
        headerTitle.textContent = "UIU CGPA Calculator";
    }
}

function backToCGPACalculator() {
    document.getElementById("showTuition").checked = false;
    toggleCalculator();
}

function refreshCalculator() {
    const isCGPA = !document.getElementById("cgpaSection").classList.contains("hidden");
    if (isCGPA) {
        document.getElementById("completedCredits").value = "";
        document.getElementById("currentCGPA").value = "";
        document.getElementById("result").textContent = "";
        document.getElementById("courses").innerHTML = "";
        courseCount = 0;
        addCourse();
    } else {
        document.getElementById("tuitionCredits").value = "";
        document.getElementById("retakeCredits").value = "";
        document.getElementById("tuitionPerCredit").value = "";
        document.getElementById("waiverPercentage").value = "0";
        document.getElementById("installments").innerHTML = "";
    }
}

// Modal helpers
function closeModal() {
    const modal = document.getElementById("resultModal");
    modal.classList.add("hidden");
    modal.style.display = "none";
}

// On page load
window.onload = () => {
    addCourse();
    document.getElementById("showTuition").checked = false;
};
