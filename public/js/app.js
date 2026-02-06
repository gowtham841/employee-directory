const API_URL = 'http://localhost:3000/api';

let currentPage = 1;
let totalPages = 1;
let currentFilters = {
  search: '',
  department: 'All',
  sort: ''
};

const employeeTableBody = document.getElementById('employeeTableBody');
const loadingState = document.getElementById('loadingState');
const searchInput = document.getElementById('searchInput');
const departmentFilter = document.getElementById('departmentFilter');
const sortSelect = document.getElementById('sortSelect');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const employeeModal = document.getElementById('employeeModal');
const detailsModal = document.getElementById('detailsModal');
const employeeForm = document.getElementById('employeeForm');
const toast = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', () => {
  loadEmployees();
  setupEventListeners();
});

function setupEventListeners() {
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value;
      currentPage = 1;
      loadEmployees();
    }, 300);
  });

  departmentFilter.addEventListener('change', (e) => {
    currentFilters.department = e.target.value;
    currentPage = 1;
    loadEmployees();
  });

  sortSelect.addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    currentPage = 1;
    loadEmployees();
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadEmployees();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadEmployees();
    }
  });

  addEmployeeBtn.addEventListener('click', () => {
    openModal();
  });

  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      closeModal(e.target.closest('.modal'));
    });
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    closeModal(employeeModal);
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target);
    }
  });

  employeeForm.addEventListener('submit', handleFormSubmit);
}

async function loadEmployees() {
  showLoading(true);

  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 5,
      search: currentFilters.search,
      department: currentFilters.department,
      sort: currentFilters.sort
    });

    const response = await fetch(`${API_URL}/employees?${params}`);
    const data = await response.json();

    if (response.ok) {
      displayEmployees(data.employees);
      updatePagination(data.total, data.limit);
    } else {
      showToast('Error loading employees', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Failed to connect to server', 'error');
  } finally {
    showLoading(false);
  }
}

function displayEmployees(employees) {
  if (employees.length === 0) {
    employeeTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #999;">
          No employees found
        </td>
      </tr>
    `;
    return;
  }

  employeeTableBody.innerHTML = employees.map(emp => `
    <tr onclick="showEmployeeDetails(${emp.id})">
      <td>${escapeHtml(emp.name)}</td>
      <td>${escapeHtml(emp.email)}</td>
      <td>${escapeHtml(emp.department)}</td>
      <td>
        <span class="status-badge status-${emp.status.toLowerCase()}">
          ${escapeHtml(emp.status)}
        </span>
      </td>
      <td>
        <button 
          class="btn btn-edit" 
          onclick="event.stopPropagation(); editEmployee(${emp.id})"
        >
          Edit
        </button>
      </td>
    </tr>
  `).join('');
}

function updatePagination(total, limit) {
  totalPages = Math.ceil(total / limit);
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function showLoading(show) {
  loadingState.style.display = show ? 'block' : 'none';
  employeeTableBody.style.opacity = show ? '0.5' : '1';
}

function openModal(employee = null) {
  const modalTitle = document.getElementById('modalTitle');
  const employeeId = document.getElementById('employeeId');
  
  if (employee) {
    modalTitle.textContent = 'Edit Employee';
    employeeId.value = employee.id;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('employeeEmail').value = employee.email;
    document.getElementById('employeeDepartment').value = employee.department;
    document.getElementById('employeeStatus').value = employee.status;
  } else {
    modalTitle.textContent = 'Add Employee';
    employeeForm.reset();
    employeeId.value = '';
  }

  clearErrors();
  employeeModal.style.display = 'block';
}

function closeModal(modal) {
  modal.style.display = 'none';
  employeeForm.reset();
  clearErrors();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  clearErrors();

  const employeeId = document.getElementById('employeeId').value;
  const formData = {
    name: document.getElementById('employeeName').value.trim(),
    email: document.getElementById('employeeEmail').value.trim(),
    department: document.getElementById('employeeDepartment').value,
    status: document.getElementById('employeeStatus').value
  };

  if (!validateForm(formData)) {
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const url = employeeId 
      ? `${API_URL}/employees/${employeeId}` 
      : `${API_URL}/employees`;
    
    const method = employeeId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      showToast(
        employeeId ? 'Employee updated successfully!' : 'Employee added successfully!',
        'success'
      );
      closeModal(employeeModal);
      loadEmployees();
    } else {
      if (data.error.includes('Email')) {
        showError('emailError', data.error);
      } else {
        showToast(data.error, 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Failed to save employee', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Employee';
  }
}

function validateForm(data) {
  let isValid = true;

  if (data.name.length < 2) {
    showError('nameError', 'Name must be at least 2 characters');
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    showError('emailError', 'Please enter a valid email address');
    isValid = false;
  }

  if (!data.department) {
    showError('departmentError', 'Please select a department');
    isValid = false;
  }

  return isValid;
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function clearErrors() {
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

async function editEmployee(id) {
  try {
    const response = await fetch(`${API_URL}/employees?limit=100`);
    const data = await response.json();
    const employee = data.employees.find(emp => emp.id === id);
    
    if (employee) {
      openModal(employee);
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Failed to load employee data', 'error');
  }
}

async function showEmployeeDetails(id) {
  try {
    const response = await fetch(`${API_URL}/employees?limit=100`);
    const data = await response.json();
    const employee = data.employees.find(emp => emp.id === id);
    
    if (employee) {
      const detailsContent = document.getElementById('employeeDetails');
      detailsContent.innerHTML = `
        <div class="detail-row">
          <div class="detail-label">ID:</div>
          <div class="detail-value">${employee.id}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Name:</div>
          <div class="detail-value">${escapeHtml(employee.name)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Email:</div>
          <div class="detail-value">${escapeHtml(employee.email)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Department:</div>
          <div class="detail-value">${escapeHtml(employee.department)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Status:</div>
          <div class="detail-value">
            <span class="status-badge status-${employee.status.toLowerCase()}">
              ${escapeHtml(employee.status)}
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Created:</div>
          <div class="detail-value">${new Date(employee.created_at).toLocaleString()}</div>
        </div>
      `;
      
      detailsModal.style.display = 'block';
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Failed to load employee details', 'error');
  }
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}