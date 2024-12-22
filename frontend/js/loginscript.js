

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
function log42(){
    document.getElementById('log-42').addEventListener('click', async () => {
        console.log('Login with 42 button clicked');
        try {
            // Fetch the Intra42 authentication URL from the backend
            const response = await fetch('http://localhost:8000/api/login_with_42/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (response.ok) {
                // Extract the URL and redirect the user
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url; // Redirect to Intra42 authentication page
                } else {
                    console.error('URL not found in response');
                }
            } else {
                console.error('Failed to fetch authentication URL');
            }
        } catch (error) {
            console.error('Error during login:', error);
        }
    });
    }
function loadPage(page) {
    fetch(page)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');

            // Replace head content
            document.head.innerHTML = doc.head.innerHTML;

            // Replace body content
            document.body.innerHTML = doc.body.innerHTML;

            log42();

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



// document.getElementById('simple-log').addEventListener('submit', async function(event) {
//     event.preventDefault(); // Prevent default form submission

//     // Gather form data
//     const username = document.getElementById('username').value;
//     const email = document.getElementById('email').value;
//     const password1 = document.getElementById('password1').value;
//     const password2 = document.getElementById('password2').value;
//     if(password1 !== password2){
//         alert("Password does not match");
//         return;
//     }

//     const signupData = {
//         username: username,
//         email: email,
//         password: password1,
//     };

//     try {
//         // Send data to the backend API
//         const response = await fetch('http://localhost:8000/api/signup/', { // Update URL to your backend endpoint
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(signupData)
//         });

//         if (response.ok) {
//             const responseData = await response.json();
//             document.getElementById('responseMessage').textContent = "Signup successful!";
//             document.getElementById('responseMessage').style.color = 'green';
//         } else {
//             document.getElementById('responseMessage').textContent = "Signup failed: " + response.statusText;
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         document.getElementById('responseMessage').textContent = "Network error or server is down";
//     }
// });

// JavaScript for handling the login button
