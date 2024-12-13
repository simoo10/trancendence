document.addEventListener("DOMContentLoaded", function() {
    let logoanimation = document.getElementById("logo");
    logoanimation.addEventListener("mouseover", function() {
        logoanimation.style.transform = "rotate(360deg)";
        logoanimation.style.transition = "transform 2s";
    }
    );
    logoanimation.addEventListener("mouseout", function() {
        logoanimation.style.transform = "rotate(-360deg)";
        logoanimation.style.transition = "transform 2s";
    }
    );
});