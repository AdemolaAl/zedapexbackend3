

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Dark mode is preferred
    var isDarkMode = false;
} else {
    // Light mode is preferred
    var isDarkMode = true;
}
function toggleColor() {
    /*for (let i = 0; i < elements.length; i++) {
        
        const element = elements[i];
        if (isDarkMode) {
            element.style.color = '#1E293B'; // Switch to light mode text color
            element.style.backgroundColor = '#ffffff'; // Switch to light mode background color
        } else {
            element.style.color = '#ffffff'; // Switch to dark mode text color
            element.style.backgroundColor = '#1E293B'; // Switch to dark mode background color
        }
    }*/

    if (isDarkMode) {
        document.documentElement.style.setProperty('--main-color', 'white');
        document.documentElement.style.setProperty('--main-color2', '#F1F5F9');
        document.documentElement.style.setProperty('--main-color3', 'white');
        document.documentElement.style.setProperty('--white', '#1E293B');
        document.getElementById('dark').style.backgroundColor = '#cfcfcf' 
    } else {
        document.documentElement.style.setProperty('--main-color', '#1E293B');
        document.documentElement.style.setProperty('--white', 'white');
        document.documentElement.style.setProperty('--main-color2', '#0F172A');
        document.documentElement.style.setProperty('--main-color3', '#0B1324');
        document.getElementById('dark').style.backgroundColor = '#0B1324' 
    }
    
    isDarkMode = !isDarkMode;
}

toggleColor();