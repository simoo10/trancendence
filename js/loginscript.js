

function changemode(id) {
    let backgrounda = document.getElementById(id);
    let background = document.getElementsByClassName("signupform");
    let form_background = document.getElementsByClassName("formule");
    let subject = document.getElementsByClassName("subject");
    let signupbtn = document.getElementById("q");
    let darkmode = document.getElementById("darkmode-btn");
    let signin = document.getElementById("login");
    let labels = document.getElementsByTagName("label");
    let input_color = document.getElementsByClassName("input_color");

    const lightMode = {
        background: "#CCC2DC",
        formBackground: "rgb(255, 255, 255)",
        subject: "#374557",
        signupbtn_background: "#000000",
        signupbtn_color: "#ffffff",
        darkmode_img: "url('images/lightmode.png')",
        signin_color: "#000000",
        labels_color: "#364558",
        input_color: "#000000",
    };
    const dakMode = {
        background: "rgb(47, 10, 68)",
        formBackground: "rgb(21, 2, 32)",
        subject: "rgb(255, 255, 255)",
        signupbtn_background: "#ffffff",
        signupbtn_color: "#8A929C",
        darkmode_img: "url('../images/darkmode.png')",
        signin_color: "#ffffff",
        labels_color: "#ffffff",
        input_color: "#ffffff",
    };
    const userData = {
        background: window.getComputedStyle(backgrounda).backgroundColor,
        // formBackground: window.getComputedStyle(form_background).backgroundColor,
        // subject: window.getComputedStyle(subject).color,
    };

    if (userData.background === dakMode.background) {
        //console.log(form_background.style.backgroundColor);
        //background.style.backgroundColor = lightMode.background;
        for(let i = 0; i < background.length; i++){
            background[i].style.backgroundColor = lightMode.background;
        }
        //form_background.style.backgroundColor = lightMode.formBackground;
        for(let i = 0; i < form_background.length; i++){
            form_background[i].style.backgroundColor = lightMode.formBackground;
        }
        //subject.style.color = lightMode.subject;
        for(let i = 0; i < subject.length; i++){
            subject[i].style.color = lightMode.subject;
        }
        signupbtn.style.backgroundColor = lightMode.signupbtn_background;
        signupbtn.style.color = lightMode.signupbtn_color;
        darkmode.style.backgroundImage = lightMode.darkmode_img;
        signin.style.color = lightMode.signin_color;
        for (let i = 0; i < input_color.length; i++) {
            input_color[i].style.color = lightMode.input_color;
        }
    } else {
        // console.log(form_background.style.backgroundColor);
        //background.style.backgroundColor = dakMode.background;
        for(let i = 0; i < background.length; i++){
            background[i].style.backgroundColor = dakMode.background;
        }
        //form_background.style.backgroundColor = dakMode.formBackground;
        for(let i = 0; i < form_background.length; i++){
            form_background[i].style.backgroundColor = dakMode.formBackground;
        }
        //subject.style.color = dakMode.subject;
        for(let i = 0; i < subject.length; i++){
            subject[i].style.color = dakMode.subject;
        }
        signupbtn.style.backgroundColor = dakMode.signupbtn_background;
        signupbtn.style.color = dakMode.signupbtn_color;
        darkmode.style.backgroundImage = dakMode.darkmode_img;
        signin.style.color = dakMode.signin_color;
        for (let i = 0; i < input_color.length; i++) {
            input_color[i].style.color = dakMode.input_color;
        }
    }

    for (let i = 0; i < labels.length; i++) {
        if (window.getComputedStyle(labels[i]).color === dakMode.labels_color) {
            labels[i].style.color = lightMode.labels_color;
        } else {
            labels[i].style.color = dakMode.labels_color;
        }
    }
}

// document.getElementById("login").addEventListener("click",redirect);
// document.getElementById("signupb").addEventListener("click",redirect1);
// function redirect()
// {
//     let signup = document.getElementById("signupa");
//     let signin = document.getElementById("signin");

//     signup.style.display = 'none';
//     signin.style.display = 'block';
// }

// function redirect1()
// {
//     let signup = document.getElementById("signupa");
//     let signin = document.getElementById("signin");

//     signup.style.display = 'block';
//     signin.style.display = 'none';
// }


function loadPage(page) {
    fetch(page)
        .then(response => response.text())
        .then(data => {
            console.log(data);
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');

            // Replace head content
            document.head.innerHTML = doc.head.innerHTML;

            // Replace body content
            document.body.innerHTML = doc.body.innerHTML;

            // Update the URL in the browser's history
            window.history.pushState({}, "", page);
        })
        .catch(error => {
            console.error('Error fetching the page:', error);
        });
}
window.onpopstate = function() {
    loadPage(window.location.pathname.substring(1) || 'index.html');
};


document.getElementById("log-42").addEventListener("click", function() {
    loadPage('login.html');
} );