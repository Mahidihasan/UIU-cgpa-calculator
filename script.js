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
        <option value="">Credit</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
    `;

    const gradeSelect = document.createElement("select");
    gradeSelect.className = "input-field";
    gradeSelect.innerHTML = `
        <option value="">Grade</option>
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

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.title = "Remove course";
    deleteBtn.onclick = () => {
        container.remove();
        updateCourseNumbers();
    };

    const retakeWrapper = document.createElement("div");
    retakeWrapper.className = "checkbox-container";
    const retakeCheckbox = document.createElement("input");
    retakeCheckbox.type = "checkbox";
    retakeCheckbox.id = `retake-${index}`;
    const label = document.createElement("label");
    label.htmlFor = retakeCheckbox.id;
    label.textContent = "Retake";
    retakeWrapper.appendChild(retakeCheckbox);
    retakeWrapper.appendChild(label);

    const prevGradeContainer = document.createElement("div");
    prevGradeContainer.className = "prev-grade-container";
    const prevGradeSelect = document.createElement("select");
    prevGradeSelect.className = "input-field";
    prevGradeSelect.innerHTML = gradeSelect.innerHTML;
    prevGradeContainer.appendChild(prevGradeSelect);

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
    let completed = parseFloat(document.getElementById("completedCredits").value);
    let cgpa = parseFloat(document.getElementById("currentCGPA").value);

    if (isNaN(completed)) completed = 0;
    if (isNaN(cgpa)) cgpa = 0;

    const cappedCGPA = Math.min(cgpa, 4);

    const courseItems = document.querySelectorAll("#courses .course-item");

    let totalNewCredits = 0;      
    let totalNewPoints = 0;       
    let semesterCredits = 0;        
    let semesterPoints = 0;         
    let retakeCredits = 0;          

    courseItems.forEach(item => {
        const selects = item.querySelectorAll("select");
        const credit = parseFloat(selects[0].value);
        const grade = parseFloat(selects[1].value);
        const isRetake = item.querySelector('input[type="checkbox"]').checked;
        const prevGradeSelect = item.querySelector(".prev-grade-container select");
        const prevGrade = prevGradeSelect ? parseFloat(prevGradeSelect.value) : NaN;

        if (!isNaN(credit) && !isNaN(grade)) {
            if (isRetake) {
                if (!isNaN(prevGrade)) {
                    totalNewPoints += (grade - prevGrade) * credit;
                    retakeCredits += credit;
                } else {
                    console.warn("Retake marked but previous grade missing, skipping retake.");
                }
            } else {
                totalNewCredits += credit;
                totalNewPoints += grade * credit;

                semesterCredits += credit;
                semesterPoints += grade * credit;
            }
        } else {
            console.warn("Missing or invalid credit/grade for a course, skipping.");
        }
    });

    // Total credits for CGPA calculation (retakes don't add new credits)
    const totalCredits = completed + totalNewCredits;

    let predicted = "0.00";
    if (totalCredits > 0) {
        const previousPoints = completed * cappedCGPA;
        const newTotalPoints = previousPoints + totalNewPoints;
        predicted = (newTotalPoints / totalCredits).toFixed(2);
        predicted = Math.min(predicted, 4).toFixed(2);
    }

    let semesterGPA = "0.00";
    if (semesterCredits > 0) {
        semesterGPA = (semesterPoints / semesterCredits).toFixed(2);
    }
    //UI
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
    const retake = retakeCredits * (perCredit/2);
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
