import './style.css'

// DOM Element Selectors
// ---------------------

// Modal Elements
const modalWrapper = document.querySelector('.modal-wrapper');
const modalForm = document.querySelector('.modal-form');
const newTaskBtn = document.querySelector('.header button');  // "New Task" button
const cancelBtn = document.querySelector('.btn-secondary');   // Modal cancel button
const createBtn = document.querySelector('.btn-primary');     // Modal create button

// Form Input Elements
const taskTitleInput = document.querySelector('input[type="text"]');
const taskDescInput = document.querySelector('textarea');
const taskDateInput = document.querySelector('input[type="date"]');
const taskTimeInput = document.querySelector('input[type="time"]');

// Task List Elements
const taskList = document.querySelector('.task-list');        // Container for tasks

// Filter Elements
const filterBtns = document.querySelectorAll('.filter-btn');  // All filter buttons
const allTasksBtn = document.querySelector('.filter-btn.active');
const activeTasksBtn = document.querySelector('.filter-btn:nth-child(2)');
const completedTasksBtn = document.querySelector('.filter-btn:nth-child(3)');
const clearCompletedBtn = document.querySelector('.clear-completed');

// Get count elements
const totalTasksCount = document.querySelector('.tasks-info h5');
const activeTasksCount = document.querySelector('.filter-btn:nth-child(2)');
const completedTasksCount = document.querySelector('.filter-btn:nth-child(3)');

// Classes
// -------

class Task {
    constructor(title, description, date, time) {
        // Unique identifier using timestamp
        this.id = Date.now();
        
        // Task content
        this.title = title;
        this.description = description;
        this.date = date;
        this.time = time;
        
        // Task status
        this.completed = false;
        
        // Metadata
        this.createdAt = new Date().toISOString();
    }

    // Helper method to toggle completion
    toggleComplete() {
        this.completed = !this.completed;
    }

    // Helper method to update task details
    update(newDetails) {
        this.title = newDetails.title || this.title;
        this.description = newDetails.description || this.description;
        this.date = newDetails.date || this.date;
        this.time = newDetails.time || this.time;
    }
}

// Storage Management
// ----------------

const Storage = {
    KEY: 'taskList',  // Key for localStorage

    // Save tasks to localStorage
    save: function(tasks) {
        localStorage.setItem(this.KEY, JSON.stringify(tasks));
    },

    // Get tasks from localStorage
    get: function() {
        const tasksJSON = localStorage.getItem(this.KEY);
        const tasks = tasksJSON ? JSON.parse(tasksJSON) : [];
        
        // Convert plain objects back to Task instances
        return tasks.map(task => {
            const newTask = new Task(task.title, task.description, task.date, task.time);
            newTask.id = task.id;
            newTask.completed = task.completed;
            newTask.createdAt = task.createdAt;
            return newTask;
        });
    },

    // Add a single task
    addTask: function(task) {
        const tasks = this.get();
        tasks.push(task);
        this.save(tasks);
    },

    // Update a task
    updateTask: function(updatedTask) {
        const tasks = this.get();
        const index = tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
            this.save(tasks);
        }
    },

    // Delete a task
    deleteTask: function(taskId) {
        const tasks = this.get();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        this.save(filteredTasks);
    },

    // Clear all tasks
    clear: function() {
        localStorage.removeItem(this.KEY);
    }
};

// Initialize tasks from localStorage
let tasks = Storage.get();

// Task Management Functions
// -----------------------

function addTaskToArray(task) {
    tasks.push(task);
}

function removeTaskFromArray(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
}

function getAllTasks() {
    return tasks;
}

function getActiveTasks() {
    return tasks.filter(task => !task.completed);
}

function getCompletedTasks() {
    return tasks.filter(task => task.completed);
}

function getTaskCount() {
    return {
        total: tasks.length,
        active: getActiveTasks().length,
        completed: getCompletedTasks().length
    };
}

function generateTaskHTML(task) {
    return `
        <div class="task-wrapper" data-id="${task.id}">
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-left">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <h4>${task.title}</h4>
                        <p>${task.description}</p>
                    </div>
                </div>
                <div class="task-actions">
                    <span class="material-icons edit-btn">edit</span>
                    <span class="material-icons delete-btn">delete</span>
                </div>
            </div>
            <div class="task-time">
                <span>Today</span>
                <span>${task.time}</span>
            </div>
        </div>
    `;
}

// Form Handling Functions
// ---------------------

function validateFormData(data) {
    const errors = [];
    
    if (!data.title.trim()) errors.push('Title is required');
    if (!data.description.trim()) errors.push('Description is required');
    if (!data.date) errors.push('Date is required');
    if (!data.time) errors.push('Time is required');
    
    return errors;
}

function showErrors(errors) {
    alert(errors.join('\n'));
}

// Add a flag to track if we're editing
let isEditing = false;
let taskBeingEdited = null;

// Update handleFormSubmit to check for editing mode
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        title: taskTitleInput.value,
        description: taskDescInput.value,
        date: taskDateInput.value,
        time: taskTimeInput.value
    };
    
    // Validate the data
    const errors = validateFormData(formData);
    
    if (errors.length > 0) {
        showErrors(errors);
        return;
    }

    if (isEditing && taskBeingEdited) {
        // Update existing task
        taskBeingEdited.title = formData.title;
        taskBeingEdited.description = formData.description;
        taskBeingEdited.date = formData.date;
        taskBeingEdited.time = formData.time;
        
        // Update DOM
        const taskElement = document.querySelector(`[data-id="${taskBeingEdited.id}"]`);
        taskElement.outerHTML = generateTaskHTML(taskBeingEdited);
        
        // Reset editing state
        isEditing = false;
        taskBeingEdited = null;
    } else {
        // Create new task
        const newTask = new Task(
            formData.title,
            formData.description,
            formData.date,
            formData.time
        );
        
        // Add to array and save
        tasks.push(newTask);
        
        // Add to DOM
        addTaskToDOM(newTask);
    }
    
    // Save changes
    Storage.save(tasks);
    
    // Update counts
    updateTaskCounts();
    
    // Clear form and hide modal
    modalForm.reset();
    hideModal();
}

// Modal Functions
// -------------

function showModal() {
    modalWrapper.classList.add('show');
}

function hideModal() {
    modalWrapper.classList.remove('show');
    setTimeout(() => {
        modalForm.reset();
    }, 300);
    
    // Reset editing state
    isEditing = false;
    taskBeingEdited = null;
}

// Event Listeners
// -------------

newTaskBtn.addEventListener('click', showModal);
cancelBtn.addEventListener('click', hideModal);

modalWrapper.addEventListener('click', (e) => {
    // Only close if clicking the wrapper background, not the modal itself
    if (e.target === modalWrapper) {
        hideModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalWrapper.style.display === 'flex') {
        hideModal();
    }
});

modalForm.addEventListener('submit', function(e) {
    e.preventDefault();  // Prevent form from submitting normally
    handleFormSubmit(e);
});


// Function to add a single task to DOM
function addTaskToDOM(task) {
    // Generate task HTML
    const taskHTML = generateTaskHTML(task);
    
    // Add it to the container
    taskList.insertAdjacentHTML('beforeend', taskHTML);
}

// Function to render all tasks
function renderAllTasks() {
    // Clear existing tasks
    taskList.innerHTML = '';
    
    // Add each task
    tasks.forEach(task => {
        addTaskToDOM(task);
    });
}

// Function to update all counts
function updateTaskCounts() {
    // Get counts
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;
    
    // Update UI
    totalTasksCount.textContent = `You have ${active} tasks left to complete today`;
    activeTasksCount.innerHTML = `Active <span class="count">${active}</span>`;
    completedTasksCount.innerHTML = `Completed <span class="count">${completed}</span>`;
    allTasksBtn.innerHTML = `All <span class="count">${total}</span>`;
}

// Also update counts when page loads
document.addEventListener('DOMContentLoaded', () => {
    renderAllTasks();
    updateTaskCounts();
    addTaskListeners();
    addFilterListeners();
    addClearCompletedListener();
    filterTasks('all');
});

// 1. Update addTaskListeners to include edit and delete
function addTaskListeners() {
    taskList.addEventListener('click', function(e) {
        const taskWrapper = e.target.closest('.task-wrapper');
        if (!taskWrapper) return;  // Exit if not clicking within a task
        
        const taskId = parseInt(taskWrapper.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        
        // Handle delete button click
        if (e.target.classList.contains('delete-btn')) {
            deleteTask(taskId);
        }
        
        // Handle edit button click
        if (e.target.classList.contains('edit-btn')) {
            editTask(task);
        }
    });

    // Existing checkbox listener
    taskList.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            const taskWrapper = e.target.closest('.task-wrapper');
            const taskItem = e.target.closest('.task-item');
            const taskId = parseInt(taskWrapper.dataset.id);
            
            // Find the task
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                // Toggle completion
                task.completed = e.target.checked;
                
                // Toggle completed class
                taskItem.classList.toggle('completed', task.completed);
                
                // Save to storage
                Storage.save(tasks);
                
                // Update counts
                updateTaskCounts();
            }
        }
    });
}

// 2. Delete function
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Remove from array
        tasks = tasks.filter(task => task.id !== taskId);
        
        // Remove from DOM
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        taskElement.remove();
        
        // Save changes
        Storage.save(tasks);
        
        // Update counts
        updateTaskCounts();
    }
}

// 3. Edit function
function editTask(task) {
    // Set editing mode
    isEditing = true;
    taskBeingEdited = task;
    
    // Fill modal with existing task data
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description;
    taskDateInput.value = task.date;
    taskTimeInput.value = task.time;
    
    // Show the modal
    showModal();
}

// 4. Add CSS for completed state
const style = document.createElement('style');
style.textContent = `
    /* Completed task style */
    .task-item.completed .task-content {
        text-decoration: line-through;
        opacity: 0.7;
    }

    /* Action buttons style */
    .task-actions .material-icons {
        cursor: pointer;
    }

    .task-actions .edit-btn:hover {
        color: var(--base-dark);
    }

    .task-actions .delete-btn:hover {
        color: #8c1d18;
    }
`;
document.head.appendChild(style);

// 1. Add click listeners for filter buttons
function addFilterListeners() {
    allTasksBtn.addEventListener('click', () => filterTasks('all'));
    activeTasksBtn.addEventListener('click', () => filterTasks('active'));
    completedTasksBtn.addEventListener('click', () => filterTasks('completed'));
}

// 2. Implement filter function
function filterTasks(filterType) {
    // Remove active class from all buttons
    allTasksBtn.classList.remove('active');
    activeTasksBtn.classList.remove('active');
    completedTasksBtn.classList.remove('active');
    
    // Add active class to clicked button
    switch(filterType) {
        case 'all':
            allTasksBtn.classList.add('active');
            break;
        case 'active':
            activeTasksBtn.classList.add('active');
            break;
        case 'completed':
            completedTasksBtn.classList.add('active');
            break;
    }
    
    // Get all task elements
    const taskElements = document.querySelectorAll('.task-wrapper');
    
    // Show/hide based on filter
    taskElements.forEach(taskElement => {
        const taskId = parseInt(taskElement.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        switch(filterType) {
            case 'all':
                taskElement.style.display = 'block';
                break;
            case 'active':
                taskElement.style.display = task.completed ? 'none' : 'block';
                break;
            case 'completed':
                taskElement.style.display = task.completed ? 'block' : 'none';
                break;
        }
    });
}

function addClearCompletedListener() {
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
}

// 3. Implement clear completed function
function clearCompletedTasks() {
    // Filter out completed tasks
    tasks = tasks.filter(task => !task.completed);
    
    // Remove completed tasks from DOM
    const completedElements = document.querySelectorAll('.task-wrapper .task-item.completed');
    completedElements.forEach(element => {
        element.closest('.task-wrapper').remove();
    });
    
    // Save changes
    Storage.save(tasks);
    
    // Update counts
    updateTaskCounts();
}