let token = localStorage.getItem("token") || "";

function authHeaders(extra = {}) {
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

const msgBox = document.getElementById("msg");

const authTitle = document.getElementById("authTitle");
const authInputs = document.getElementById("authInputs");
const authHint = document.getElementById("authHint");

const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const searchCard = document.getElementById("searchCard");
const formCard = document.getElementById("formCard");
const listCard = document.getElementById("listCard");

const deptSearchEl = document.getElementById("deptSearch");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const form = document.getElementById("employeeForm");
const employeeList = document.getElementById("employeeList");

const empIdEl = document.getElementById("empId");
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const deptEl = document.getElementById("department");
const salaryEl = document.getElementById("salary");

const photoEl = document.getElementById("photo");
const photoLabel = document.getElementById("photoLabel");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const updatePhotoBtn = document.getElementById("updatePhotoBtn");
const formTitle = document.getElementById("formTitle");

window.addEventListener("load", async () => {
  // Strict: until login, show ONLY auth
  setLoggedInUI(false);

  // If token exists from previous session, try load employees
  if (token) {
    const ok = await tryLoadEmployees();
    if (ok) setLoggedInUI(true);
    else {
      token = "";
      localStorage.removeItem("token");
      setLoggedInUI(false);
    }
  }
});

function setMsgOk(text) {
  msgBox.innerHTML = `<div class="msg-ok">${escapeHtml(text)}</div>`;
}
function setMsgErr(text) {
  msgBox.innerHTML = `<div class="msg-err">${escapeHtml(text)}</div>`;
}
function clearMsg() { msgBox.innerHTML = ""; }
function escapeHtml(str) {
  return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function setLoggedInUI(isLoggedIn) {
  if (isLoggedIn) {
    // show CRUD
    searchCard.style.display = "block";
    formCard.style.display = "block";
    listCard.style.display = "block";

    // auth: show logout, hide signup/login inputs if you want
    logoutBtn.style.display = "inline-block";
    signupBtn.style.display = "none";
    loginBtn.style.display = "none";
    authInputs.style.display = "none";
    authTitle.textContent = "Logged In ✅";
    authHint.textContent = "You can manage employees now.";
  } else {
    // hide CRUD
    searchCard.style.display = "none";
    formCard.style.display = "none";
    listCard.style.display = "none";

    // show signup/login
    logoutBtn.style.display = "none";
    signupBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    authInputs.style.display = "grid";
    authTitle.textContent = "Signup / Login";
    authHint.textContent = "Signup first. Then login to manage employees.";

    employeeList.innerHTML = "";
    resetForm();
  }
}

// ---------- Signup (does NOT log in automatically) ----------
signupBtn.addEventListener("click", async () => {
  clearMsg();
  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();

  if (!username) return setMsgErr("Username is required");
  if (password.length < 6) return setMsgErr("Password must be at least 6 characters");

  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const text = await res.text();
  if (!res.ok) return setMsgErr(text || "Signup failed");

  setMsgOk("Signup successful ✅ Now login.");
  passwordEl.value = "";
});

// ---------- Login ----------
loginBtn.addEventListener("click", async () => {
  clearMsg();
  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  if (!username || !password) return setMsgErr("Enter username and password");

  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) return setMsgErr("Login failed. Check credentials.");

  const data = await res.json();
  token = data.token;
  localStorage.setItem("token", token);

  setLoggedInUI(true);
  setMsgOk("Login success ✅");
  await loadEmployees();
});

// ---------- Logout ----------
logoutBtn.addEventListener("click", () => {
  token = "";
  localStorage.removeItem("token");
  setLoggedInUI(false);
  setMsgOk("Logged out.");
});

// ---------- Search ----------
searchBtn.addEventListener("click", async () => {
  const dep = deptSearchEl.value.trim();
  if (!dep) return loadEmployees();
  await loadEmployees(dep);
});

clearSearchBtn.addEventListener("click", async () => {
  deptSearchEl.value = "";
  await loadEmployees();
});

// ---------- File label ----------
photoEl.addEventListener("change", () => {
  const file = photoEl.files[0];
  photoLabel.textContent = file ? file.name : "Choose Photo";
});

// ---------- Add / Update ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();

  const id = empIdEl.value;

  if (!id) {
    const file = photoEl.files[0];
    if (!file) return setMsgErr("Photo is required");

    const fd = new FormData();
    fd.append("name", nameEl.value);
    fd.append("email", emailEl.value);
    fd.append("department", deptEl.value);
    fd.append("salary", salaryEl.value);
    fd.append("photo", file);

    const res = await fetch("/employees", {
      method: "POST",
      headers: authHeaders(),
      body: fd
    });

    if (!res.ok) return showError(res);

    setMsgOk("Employee added ✅");
    resetForm();
    await loadEmployees();
  } else {
    const payload = {
      name: nameEl.value,
      email: emailEl.value,
      department: deptEl.value,
      salary: Number(salaryEl.value)
    };

    const res = await fetch(`/employees/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });

    if (!res.ok) return showError(res);

    setMsgOk("Employee updated ✅");
    resetForm();
    await loadEmployees(deptSearchEl.value.trim());
  }
});

cancelBtn.addEventListener("click", () => resetForm());

// ---------- Update Photo ----------
updatePhotoBtn.addEventListener("click", async () => {
  clearMsg();
  const id = empIdEl.value;
  if (!id) return setMsgErr("Select an employee first");

  const file = photoEl.files[0];
  if (!file) return setMsgErr("Choose a new photo first");

  const fd = new FormData();
  fd.append("photo", file);

  const res = await fetch(`/employees/${id}/photo`, {
    method: "PUT",
    headers: authHeaders(),
    body: fd
  });

  if (!res.ok) return showError(res);

  setMsgOk("Photo updated ✅");
  photoEl.value = "";
  photoLabel.textContent = "Choose Photo";
  await loadEmployees(deptSearchEl.value.trim());
});

// ---------- List actions ----------
employeeList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "edit") await startEdit(id);
  if (action === "delete") await deleteEmployee(id);
});

async function tryLoadEmployees() {
  const res = await fetch("/employees", { headers: authHeaders() });
  return res.ok;
}

async function loadEmployees(departmentSearch = "") {
  let url = "/employees";
  if (departmentSearch) {
    url = `/employees/search?department=${encodeURIComponent(departmentSearch)}`;
  }

  const res = await fetch(url, { headers: authHeaders() });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      setMsgErr("Session expired. Please login again.");
      token = "";
      localStorage.removeItem("token");
      setLoggedInUI(false);
      return;
    }
    return showError(res);
  }

  const employees = await res.json();
  renderEmployees(employees);
}

function renderEmployees(employees) {
  employeeList.innerHTML = "";

  if (!employees || employees.length === 0) {
    employeeList.innerHTML = `<p class="hint">No employees found.</p>`;
    return;
  }

  employees.forEach((emp) => {
    const div = document.createElement("div");
    div.className = "employee-card";

    div.innerHTML = `
      <img src="/employees/${emp.id}/photo" />
      <div class="employee-details">
        <p><strong>ID:</strong> ${emp.id}</p>
        <p><strong>Name:</strong> ${escapeHtml(emp.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(emp.email)}</p>
        <p><strong>Department:</strong> ${escapeHtml(emp.department)}</p>
        <p><strong>Salary:</strong> ${emp.salary}</p>
      </div>
      <div class="actions">
        <button type="button" class="secondary" data-action="edit" data-id="${emp.id}">Edit</button>
        <button type="button" class="danger" data-action="delete" data-id="${emp.id}">Delete</button>
      </div>
    `;

    employeeList.appendChild(div);
  });
}

async function startEdit(id) {
  clearMsg();

  const res = await fetch(`/employees/${id}`, { headers: authHeaders() });
  if (!res.ok) return showError(res);

  const emp = await res.json();

  empIdEl.value = emp.id;
  nameEl.value = emp.name || "";
  emailEl.value = emp.email || "";
  deptEl.value = emp.department || "";
  salaryEl.value = emp.salary ?? "";

  submitBtn.textContent = "Update Employee";
  cancelBtn.style.display = "inline-block";
  updatePhotoBtn.style.display = "inline-block";
  formTitle.textContent = `Update Employee (ID: ${emp.id})`;

  photoEl.value = "";
  photoLabel.textContent = "Choose Photo";
}

async function deleteEmployee(id) {
  if (!confirm("Are you sure you want to delete this employee?")) return;

  const res = await fetch(`/employees/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  if (!res.ok) return showError(res);

  setMsgOk("Employee deleted ✅");
  await loadEmployees(deptSearchEl.value.trim());
}

function resetForm() {
  form.reset();
  empIdEl.value = "";

  submitBtn.textContent = "Add Employee";
  cancelBtn.style.display = "none";
  updatePhotoBtn.style.display = "none";
  formTitle.textContent = "Add Employee";

  photoEl.value = "";
  photoLabel.textContent = "Choose Photo";
}

async function showError(res) {
  try {
    const data = await res.json();
    setMsgErr(JSON.stringify(data, null, 2));
  } catch {
    const text = await res.text();
    setMsgErr(text || `Request failed (${res.status})`);
  }
}
