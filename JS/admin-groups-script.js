// Array to hold real data from MongoDB
let groups = [];

document.addEventListener("DOMContentLoaded", () => {
    loadGroups();
});

// 1. Fetch data from MongoDB [READ]
async function loadGroups() {
    const container = document.getElementById('groups-container');
    container.innerHTML = '<p style="text-align: center; margin-top: 40px; color: #888;">Loading groups from database...</p>';

    try {
        const response = await fetch('/api/groups');
        groups = await response.json();
        renderGroups(groups);
    } catch (error) {
        console.error("Failed to load groups:", error);
        container.innerHTML = '<p style="text-align: center; color: #FF4D4D;">Error connecting to server.</p>';
    }
}

// 2. Render groups into the UI
function renderGroups(data) {
    const container = document.getElementById('groups-container');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; margin-top: 40px; color: #888;">No groups found in database.</p>';
        return;
    }

    data.forEach(group => {
        const badgeText = group.status === 'accepted' ? 'Accepted' : 'Pending';
        
        const card = document.createElement('div');
        card.className = 'group-card';
        // Using mongo _id for actions
        card.innerHTML = `
            <div class="group-header-row" onclick="toggleGroup(this)">
                <div class="group-info-main">
                    <h4>${group.groupName || 'Unnamed Group'}</h4>
                    <div class="project-names">
                        <span>${group.projects ? group.projects[0] : 'No Thai Title'}</span>
                        <span>${group.projects ? group.projects[1] : 'No English Title'}</span>
                    </div>
                </div>
                <div class="status-side">
                    <span class="status-badge ${group.status}" onclick="event.stopPropagation(); toggleStatus('${group._id}', '${group.status}')" style="cursor: pointer;">
                        ${badgeText}
                    </span>
                    <button class="btn-delete-icon" onclick="event.stopPropagation(); deleteGroup('${group._id}')" style="background: none; border: none; color: #ff4d4f; cursor: pointer; margin-left: 10px;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                </div>
            </div>
            <div class="group-body">
                <div class="info-label">Group Members</div>
                <div class="info-list">
                    ${group.members ? group.members.map(m => `<div>${m}</div>`).join('') : '<div>No members</div>'}
                </div>
                
                <div class="info-label">Project Advisor</div>
                <div class="info-list">
                    <div>${group.advisor || 'Not assigned'}</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Update status in MongoDB [UPDATE]
async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'accepted' ? 'pending' : 'accepted';
    if (!confirm(`Change status to ${newStatus}?`)) return;

    try {
        const response = await fetch(`/api/groups/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            loadGroups(); // Refresh UI
        }
    } catch (error) {
        alert("Failed to update status.");
    }
}

// 4. Delete group from MongoDB [DELETE]
async function deleteGroup(id) {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

    try {
        const response = await fetch(`/api/groups/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Group deleted successfully.");
            loadGroups(); // Refresh UI
        }
    } catch (error) {
        alert("Failed to delete group.");
    }
}

function toggleGroup(element) {
    const card = element.closest('.group-card');
    card.classList.toggle('active');
}