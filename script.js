let courseCount = 0;

function createCourseElement(index) {
    const container = document.createElement("div");
    container.className = "course-item";

    const grid = document.createElement("div");
    grid.className = "course-grid";

    // Course Name
    const courseInput = document.createElement("input");
    courseInput.type = "text";
    courseInput.placeholder = `Course ${index + 1}`;
    courseInput.className = "input-field";
    courseInput.readOnly = true;

    const creditInput = document.createElement("select");
    creditInput.className = "input-field";
    creditInput.innerHTML = `
   <option value="">Credit</option>
   <option value="1">1</option>
   <option value="2">2</option>
   <option value="3">3</option>
`;

    // Grade
    const gradeInput = document.createElement("select");
    gradeInput.className = "input-field";
    gradeInput.innerHTML = `
    <option value="">Grade</option>
    <option value="4">A</option>
    <option value="3.5">A-</option>
    <option value="3">B+</option>
    <option value="2.5">B</option>
    <option value="2">C+</option>
    <option value="1.5">C</option>
    <option value="1">D</option>
    <option value="0">F</option>
  `;

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.title = "Remove course";
    deleteBtn.onclick = function () {
        container.remove();
        updateCourseNumbers();
    };

    // Retake Checkbox (placed below)
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

    // Previous Grade Container
    const prevGradeContainer = document.createElement("div");
    prevGradeContainer.className = "prev-grade-container";

    const prevGradeSelect = document.createElement("select");
    prevGradeSelect.className = "input-field";
    prevGradeSelect.innerHTML = `
    <option value="">Previous grade</option>
    <option value="4">A</option>
    <option value="3.5">A-</option>
    <option value="3">B+</option>
    <option value="2.5">B</option>
    <option value="2">C+</option>
    <option value="1.5">C</option>
    <option value="1">D</option>
    <option value="0">F</option>
  `;

    prevGradeContainer.appendChild(prevGradeSelect);

    retakeCheckbox.addEventListener("change", () => {
        prevGradeContainer.style.display = retakeCheckbox.checked ? "block" : "none";
        setTimeout(calculateCGPA, 0);
    });

    // Assemble the grid
    grid.appendChild(courseInput);
    grid.appendChild(creditInput);
    grid.appendChild(gradeInput);
    grid.appendChild(deleteBtn);

    // Assemble the container
    container.appendChild(grid);
    container.appendChild(retakeWrapper);
    container.appendChild(prevGradeContainer);

    return container;
}

function updateCourseNumbers() {
    const courses = document.querySelectorAll("#courses .course-item");
    courses.forEach((course, index) => {
        course.querySelector("input[type='text']").placeholder = `Course ${index + 1}`;
    });
    courseCount = courses.length;
}

function addCourse() {
    const coursesDiv = document.getElementById("courses");
    const courseElement = createCourseElement(courseCount);
    coursesDiv.appendChild(courseElement);
    courseCount++;
}

function calculateCGPA() {
    const completedCredits = parseFloat(document.getElementById("completedCredits").value) || 0;
    const currentCGPA = parseFloat(document.getElementById("currentCGPA").value) || 0;
    const courses = document.getElementById("courses").children;

    let totalCredits = completedCredits;
    let totalPoints = completedCredits * currentCGPA;

    Array.from(courses).forEach(course => {
        const inputs = course.querySelectorAll("input, select");
        const credit = parseFloat(inputs[1].value);
        const grade = parseFloat(inputs[2].value);
        const isRetake = inputs[4].checked; // Retake checkbox
        const prevGrade = parseFloat(inputs[6]?.value || 0); // Previous grade select

        if (!isNaN(credit) && !isNaN(grade)) {
            if (isRetake && !isNaN(prevGrade)) {
                totalPoints = totalPoints - (credit * prevGrade) + (credit * grade);
            } else {
                totalPoints += credit * grade;
                totalCredits += credit;
            }
        }
    });

    const predicted = totalPoints / totalCredits;
    const resultElement = document.getElementById("result");

    if (isNaN(predicted)) {
        resultElement.textContent = "Please fill in all required fields.";
        resultElement.className = "result error";
    } else {
        resultElement.textContent = `Predicted CGPA: ${predicted.toFixed(2)}`;
        resultElement.className = "result success";
    }
}

function calculateInstallments() {
    const totalCredits = parseFloat(document.getElementById("tuitionCredits").value);
    const retakeCredits = parseFloat(document.getElementById("retakeCredits").value) || 0;
    const feePerCredit = parseFloat(document.getElementById("tuitionPerCredit").value);

    if (isNaN(totalCredits) || isNaN(feePerCredit)) {
        document.getElementById("installments").innerHTML = `
      <div style="color: #ef4444;">Please fill in total credits and fee per credit.</div>
    `;
        return;
    }

    if (retakeCredits > totalCredits) {
        document.getElementById("installments").innerHTML = `
      <div style="color: #ef4444;">Retake credits cannot exceed total credits.</div>
    `;
        return;
    }

    const first40 = 0.4;
    const second30 = 0.3;
    const third30 = 0.3;

    const regularCredits = totalCredits - retakeCredits;
    const retakeFeePerCredit = feePerCredit / 2; // Retake fee is half of regular fee

    const totalFee = (regularCredits * feePerCredit) + (retakeCredits * retakeFeePerCredit);

    document.getElementById("installments").innerHTML = `
    <div class="installment-item">1st Installment (40%): ৳${(totalFee * first40).toFixed(2)}</div>
    <div class="installment-item">2nd Installment (30%): ৳${(totalFee * second30).toFixed(2)}</div>
    <div class="installment-item">3rd Installment (30%): ৳${(totalFee * third30).toFixed(2)}</div>
    <div class="installment-total">Total Fee: ৳${totalFee.toFixed(2)}</div>
    <div style="margin-top: 8px; font-size: 0.8rem;">
      <strong>Breakdown:</strong> 
      ${regularCredits} regular × ৳${feePerCredit.toFixed(2)} + 
      ${retakeCredits} retake × ৳${retakeFeePerCredit.toFixed(2)}
    </div>
  `;
}

function toggleCalculator() {
    const showTuition = document.getElementById("showTuition");
    const cgpaSection = document.getElementById("cgpaSection");
    const tuitionSection = document.getElementById("tuitionSection");
    const headerTitle = document.getElementById("headerTitle");

    if (showTuition.checked) {
        // Switching to Tuition Calculator
        cgpaSection.classList.add("hidden");
        tuitionSection.classList.remove("hidden");
        headerTitle.textContent = "Tuition Fee Calculator";
    } else {
        // Switching to CGPA Calculator
        cgpaSection.classList.remove("hidden");
        tuitionSection.classList.add("hidden");
        headerTitle.textContent = "CGPA Calculator";
    }
}

function refreshCalculator() {
    // Determine which calculator is currently active
    const cgpaSection = document.getElementById("cgpaSection");
    const isCGPAVisible = !cgpaSection.classList.contains("hidden");

    if (isCGPAVisible) {
        // Refresh CGPA Calculator
        document.getElementById("completedCredits").value = "";
        document.getElementById("currentCGPA").value = "";
        document.getElementById("result").textContent = "";

        const coursesDiv = document.getElementById("courses");
        coursesDiv.innerHTML = "";
        courseCount = 0;
        addCourse(); // Add first course back
    } else {
        // Refresh Tuition Calculator
        document.getElementById("tuitionCredits").value = "";
        document.getElementById("retakeCredits").value = "";
        document.getElementById("tuitionPerCredit").value = "";
        document.getElementById("installments").innerHTML = "";
    }
}

// Initial course load
window.onload = function () {
    addCourse(); // Add first course by default
    document.getElementById("showTuition").checked = false;
    document.getElementById("showCGPACalculator").checked = true;
};