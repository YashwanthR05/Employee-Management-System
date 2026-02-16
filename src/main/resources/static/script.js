const form = document.getElementById("employeeForm");
const employeeList = document.getElementById("employeeList");

const empIdEl = document.getElementById("empId");
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const deptEl = document.getElementById("department");
const salaryEl = document.getElementById("salary");
const photoEl = document.getElementById("photo");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

window.addEventListener("load", loadEmployees);

// ✅ Add or Update
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = empIdEl.value;

  if (!id) {
    // ADD (POST multipart)
    const file = photoEl.files[0];
    if (!file) {
      alert("Please choose a photo.");
      return;
    }

    const fd = new FormData();
    fd.append("name", nameEl.value);
    fd.append("email", emailEl.value);
    fd.append("department", deptEl.value);
    fd.append("salary", salaryEl.value);
    fd.append("photo", file);

    const res = await fetch("/employees", { method: "POST", body: fd });
    if (!res.ok) return showError(res);

    resetForm();
    loadEmployees();
  } else {
    // UPDATE (PUT JSON) - photo unchanged
    const payload = {
      name: nameEl.value,
      email: emailEl.value,
      department: deptEl.value,
      salary: Number(salaryEl.value)
    };

    const res = await fetch(`/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return showError(res);

    resetForm();
    loadEmployees();
  }
});

// ✅ Cancel update
cancelBtn.addEventListener("click", resetForm);

// ✅ Handle Edit/Delete clicks (NO inline onclick)
employeeList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (!action || !id) return;

  if (action === "edit") {
    await startEdit(id);
  } else if (action === "delete") {
    await deleteEmployee(id);
  }
});

// ✅ Load employees
async function loadEmployees() {
  const res = await fetch("/employees");
  const employees = await res.json();

  employeeList.innerHTML = "";

  employees.forEach((emp) => {
    const div = document.createElement("div");
    div.className = "employee-card";

    div.innerHTML = `
      <img src="/employees/${emp.id}/photo" width="80" height="80"/>
      <div class="employee-details">
        <p><strong>Name:</strong> ${emp.name}</p>
        <p><strong>Email:</strong> ${emp.email}</p>
        <p><strong>Department:</strong> ${emp.department}</p>
        <p><strong>Salary:</strong> ${emp.salary}</p>
      </div>
      <div style="display:flex; gap:10px;">
        <button type="button" data-action="edit" data-id="${emp.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${emp.id}">Delete</button>
      </div>
    `;

    employeeList.appendChild(div);
  });
}

// ✅ Fill form for editing
async function startEdit(id) {
  const res = await fetch(`/employees/${id}`);
  if (!res.ok) return alert("Employee not found");

  const emp = await res.json();

  empIdEl.value = emp.id;
  nameEl.value = emp.name || "";
  emailEl.value = emp.email || "";
  deptEl.value = emp.department || "";
  salaryEl.value = emp.salary ?? "";

  // hide photo while updating (since PUT JSON)
  photoEl.value = "";
  photoEl.style.display = "none";

  submitBtn.textContent = "Update Employee";
  cancelBtn.style.display = "inline-block";
}

// ✅ Delete
async function deleteEmployee(id) {
  if (!confirm("Are you sure you want to delete this employee?")) return;

  const res = await fetch(`/employees/${id}`, { method: "DELETE" });
  if (!res.ok) return alert("Delete failed");

  loadEmployees();
}

// ✅ Reset to Add mode
function resetForm() {
  form.reset();
  empIdEl.value = "";

  submitBtn.textContent = "Add Employee";
  cancelBtn.style.display = "none";

  photoEl.style.display = "block";
}

// ✅ Show backend validation errors
async function showError(res) {
  try {
    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  } catch {
    const text = await res.text();
    alert(text);
  }
}
