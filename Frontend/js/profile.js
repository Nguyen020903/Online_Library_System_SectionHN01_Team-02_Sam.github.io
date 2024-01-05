document.addEventListener("DOMContentLoaded", function () {
    var tabs = document.querySelectorAll('.tab-content');
    for (var i = 1; i < tabs.length; i++) {
        tabs[i].style.display = 'none';
    }

    // start of profile edit
    const editBtn = document.getElementById('editBtn');
    const nameField = document.getElementById('name');
    const fullNameField = document.getElementById('fullName');
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');

    const profileElements = [nameField, fullNameField, emailField, phoneField];

    let isEditMode = false;

    editBtn.addEventListener('click', function () {
        if (isEditMode) {
            saveChanges();
            isEditMode = false;
            editBtn.innerText = 'Edit Profile';
            disableEditMode();
        } else {
            isEditMode = true;
            editBtn.innerText = 'Save Changes';
            enableEditMode();
        }
    });

    function enableEditMode() {
        profileElements.forEach(element => {
            element.contentEditable = true;
        });
        document.getElementById('profileContainer').classList.add('edit-mode');
    }

    function disableEditMode() {
        profileElements.forEach(element => {
            element.contentEditable = false;
        });
        document.getElementById('profileContainer').classList.remove('edit-mode');
    }

    function saveChanges() {
        console.log('Name:', nameField.innerText);
        console.log('Full Name:', fullNameField.innerText);
        console.log('Email:', emailField.innerText);
        console.log('Phone:', phoneField.innerText);
    }
}); // end of profile edit


function openPopup() {
    var popup = document.getElementById("popup");
    popup.style.display = "block";
}

function closePopup() {
    var popup = document.getElementById("popup");
    popup.style.display = "none";
}

function openTab(tabName) {
    var tabs = document.querySelectorAll('.tab-content');
    var tabLinks = document.querySelectorAll('.verticalNavItems');

    // Remove the 'active' class from all tabs and tab links
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    for (var i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove('active');
    }

    // Add the 'active' class to the selected tab and tab link
    var currentTab = document.getElementById(tabName);
    currentTab.classList.add('active');

    var currentTabLink = document.querySelector(`.verticalNavItems[onclick="openTab('${tabName}')"]`);
    currentTabLink.classList.add('active');

    // Hide all tabs except the selected one
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === tabName) {
            tabs[i].style.display = 'flex'; // Show the selected tab
        } else {
            tabs[i].style.display = 'none'; // Hide other tabs
        }
    }
}
