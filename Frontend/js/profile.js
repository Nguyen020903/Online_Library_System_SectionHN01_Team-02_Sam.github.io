document.addEventListener("DOMContentLoaded", function () {
    // Hide all tabs except the default one
    var tabs = document.querySelectorAll('.tab-content');
    for (var i = 1; i < tabs.length; i++) {
        tabs[i].style.display = 'none';
    }
});

function openTab(tabName) {
    var tabs = document.querySelectorAll('.tab-content');

    // Remove the 'active' class from all tabs
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    // Add the 'active' class to the selected tab
    var currentTab = document.getElementById(tabName);
    currentTab.classList.add('active');

    // Hide all tabs except the selected one
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === tabName) {
            tabs[i].style.display = 'flex'; // Show the selected tab
        } else {
            tabs[i].style.display = 'none'; // Hide other tabs
        }
    }
}

function openTab(tabName) {
    var tabs = document.querySelectorAll('.verticalNavItems');

    tabs.forEach(function(tab) {
        tab.classList.remove('active1');
    });

    var currentTab = document.querySelector('.verticalNavItems[data-tab="' + tabName + '"]');
    currentTab.classList.add('active1');
}
