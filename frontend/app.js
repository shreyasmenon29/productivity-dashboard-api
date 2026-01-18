const API = "http://127.0.0.1:8000";

function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";
  setTimeout(() => {
    t.style.display = "none";
  }, 2000);
}

function setStatus(msg) {
  document.getElementById("login_status").innerText = msg;
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function logoutUser() {
  localStorage.removeItem("token");
  setStatus("Not logged in");
  toast("Logged out");
  document.getElementById("task_list").innerHTML = "";
}

async function registerUser() {
  const name = document.getElementById("reg_name").value.trim();
  const email = document.getElementById("reg_email").value.trim();
  const password = document.getElementById("reg_pass").value;

  if (!name || !email || !password) {
    toast("Fill all register fields");
    return;
  }

  const url = `${API}/register?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (data.user_id) {
    toast("Registered ✅");
  } else if (data.message) {
    toast(data.message);
  } else if (data.error) {
    toast(data.error);
  } else {
    toast("Register failed");
  }
}

async function loginUser() {
  const email = document.getElementById("login_email").value.trim();
  const password = document.getElementById("login_pass").value;

  if (!email || !password) {
    toast("Enter email & password");
    return;
  }

  const url = `${API}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (data.access_token) {
    setToken(data.access_token);
    setStatus("Logged in ✅");
    toast("Logged in ✅");
    loadTasks();
  } else if (data.error) {
    toast(data.error);
  } else {
    toast("Login failed");
  }
}

async function createTask() {
  const token = getToken();
  if (!token) {
    toast("Login first");
    return;
  }

  const title = document.getElementById("task_title").value.trim();
  const description = document.getElementById("task_desc").value.trim();
  const priority = document.getElementById("task_priority").value;
  const status = document.getElementById("task_status").value;

  if (!title) {
    toast("Title required");
    return;
  }

  const url = `${API}/tasks?title=${encodeURIComponent(title)}&token=${encodeURIComponent(token)}&description=${encodeURIComponent(description)}&priority=${encodeURIComponent(priority)}&status=${encodeURIComponent(status)}`;
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (data.task_id) {
    toast("Task created ✅");
    document.getElementById("task_title").value = "";
    document.getElementById("task_desc").value = "";
    loadTasks();
  } else if (data.error) {
    toast(data.error);
  } else {
    toast("Task create failed");
  }
}

function clearFilters() {
  document.getElementById("filter_status").value = "";
  document.getElementById("filter_priority").value = "";
  document.getElementById("filter_search").value = "";
  toast("Filters cleared");
  loadTasks();
}

async function loadTasks() {
  const token = getToken();
  if (!token) {
    setStatus("Not logged in");
    toast("Login first");
    return;
  }

  const status = document.getElementById("filter_status").value;
  const priority = document.getElementById("filter_priority").value;
  const search = document.getElementById("filter_search").value.trim();

  let url = `${API}/tasks?token=${encodeURIComponent(token)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (priority) url += `&priority=${encodeURIComponent(priority)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const res = await fetch(url);
  const data = await res.json();

  const list = document.getElementById("task_list");
  list.innerHTML = "";

  if (!Array.isArray(data)) {
    toast("Failed to load tasks");
    return;
  }

  if (data.length === 0) {
    list.innerHTML = "<p class='small'>No tasks found</p>";
    return;
  }

  data.forEach(t => {
    const div = document.createElement("div");
    div.className = "task";

    const left = document.createElement("div");
    left.className = "task-left";

    const title = document.createElement("div");
    title.className = "task-title";
    title.innerText = `${t.id}. ${t.title}`;

    const meta = document.createElement("div");
    meta.className = "small";
    meta.innerText = `Status: ${t.status} | Priority: ${t.priority}`;

    left.appendChild(title);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "actions";

    const delBtn = document.createElement("button");
    delBtn.className = "btn-small";
    delBtn.innerText = "Delete";
    delBtn.onclick = () => deleteTask(t.id);

    right.appendChild(delBtn);

    div.appendChild(left);
    div.appendChild(right);

    list.appendChild(div);
  });
}

async function deleteTask(taskId) {
  const token = getToken();
  if (!token) {
    toast("Login first");
    return;
  }

  const url = `${API}/tasks/${taskId}?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: "DELETE" });
  const data = await res.json();

  if (data.message) {
    toast("Deleted ✅");
    loadTasks();
  } else if (data.error) {
    toast(data.error);
  } else {
    toast("Delete failed");
  }
}

window.onload = () => {
  const token = getToken();
  if (token) {
    setStatus("Logged in ✅");
    loadTasks();
  } else {
    setStatus("Not logged in");
  }

  document.getElementById("filter_search").addEventListener("input", () => {
    loadTasks();
  });

  document.getElementById("filter_status").addEventListener("change", () => {
    loadTasks();
  });

  document.getElementById("filter_priority").addEventListener("change", () => {
    loadTasks();
  });
};
