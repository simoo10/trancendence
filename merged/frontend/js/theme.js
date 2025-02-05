
export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
// window.toggleTheme = toggleTheme;

// export function applySavedTheme() {
//     const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light theme
//     document.documentElement.setAttribute('data-theme', savedTheme);
// }

// // Ensure the theme is applied on page load
// applySavedTheme();