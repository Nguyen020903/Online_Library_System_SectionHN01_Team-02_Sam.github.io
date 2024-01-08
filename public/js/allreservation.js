document.addEventListener("DOMContentLoaded", function () {
    var tabs = document.querySelectorAll('.tab-content');
    for (var i = 1; i < tabs.length; i++) {
        tabs[i].style.display = 'none';
    }
});

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
