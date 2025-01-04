function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save the theme preference
}
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
});


function log42(){
    document.getElementById('log-42').addEventListener('click', async () => {
        console.log('Login with 42 button clicked');
        const urlParams = new URLSearchParams(window.location.search);
        const login = urlParams.get('login');
        const email = urlParams.get('email');
    console.log(`Logged in user: ${login}, Email: ${email}`);

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
// SIGNUP SIMPLE
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function login() {
    document.getElementById('login-form').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission
    
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
    
        const data = { username, password };
    
        try {
            // Send login data to the Django backend API endpoint
            const response = await fetch('http://127.0.0.1:8000/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
    
            if (response.ok) {
                const responseData = await response.json();
                
                // Store the token in localStorage
                localStorage.setItem('authToken', responseData.token);
    
                // Redirect to the home page
                window.location.href = responseData.redirect_url;
            } else {
                const errorData = await response.json();
                // document.getElementById('errorMessage').textContent = errorData.error;
            }
        } catch (error) {
            console.error('Error:', error);
            // document.getElementById('errorMessage').textContent = 'Network error. Please try again.';
        }
    });
}
function simplelog() {
    document.getElementById('signup-form').addEventListener('submit', async function(event) {
        console.log('Login form submitted');
        event.preventDefault(); // Prevent default form submission
    console.log('Login form submitted');
        
        console.log('Signup form submitted');
        await sleep(9000);
        // Gather form data
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password1 = document.getElementById('password1').value;
        console.log(password1);
        // await sleep(7000);
        const password2 = document.getElementById('password2').value;

        if (password1 !== password2) {
            alert("Passwords do not match");
            return;
        }

        const signupData = {
            username: username,
            email: email,
            password: password1,
        };

        try {
            // Send data to the backend API
            const response = await fetch('http://localhost:8000/api/signup/', { // Update URL to your backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });

            if (response.ok) {
                console.log('Signup successful2');
                await sleep(7000);
                const responseData = await response.json();
                // alert(responseData.message);
                // Redirect to the login page
                // window.location.href = 'login.html';
                // document.getElementById('responseMessage').textContent = "Signup successful!";
                // document.getElementById('responseMessage').style.color = 'green';
            } else {
                console.log('Signup failed:3', response.statusText);
                await sleep(7000);
                // document.getElementById('responseMessage').textContent = "Signup failed: " + response.statusText;
            }
        } catch (error) {
            console.error('Error:4', error);
            await sleep(7000);
            // document.getElementById('responseMessage').textContent = "Network error or server is down";
        }
    });
}




// Call the simplelog function to attach the event listener


//take the data:

async function fetching_data(){
    try{
        const response = await fetch('http://localhost:8000/api/user_data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if(response.ok){
            const data = await response.json();
            console.log(data[0].image);
            sleep(7000);
            const profile = document.getElementsByClassName('profile')[0];
            profile.innerHTML = `
           
            <div class="usr">
            <img src="images/avatar.png" alt="profile">
                <span class="username">${data[0].login}</span>
                <span class="rank">Rank</span>
            </div>
                    `;
                    return;
        }
        else{
            console.error('Failed to fetch data');
        }
    }
    catch(error){
        console.error('Error fetching data:', error);
    }
    // return data;
}
function displayWindow(){
    document.getElementById("add-friends").style.display = "block";
    document.getElementById("online-list").style.display = "none";
    document.getElementById("search-frds").style.display = "none";
    document.getElementsByClassName("lists")[0].style.backgroundColor = "transparent";
}


function loadPage(page) {
    console.log('Loading page:', page);
    sleep(7000);
    fetch(page)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');

            // Replace head content
            document.head.innerHTML = doc.head.innerHTML;

            // Replace body content
            document.body.innerHTML =doc.body.innerHTML;
           loadScript('js/loginscript.js'); 
            if(page==='signup')
            {
                console.log('dkhelt 1');
                sleep(7000);
                simplelog();
                log42();
            }
            if(page==='login')
            {
                console.log('dkhelt 2');
                sleep(7000);
                login();
                log42();
            }
            if(page==='dashboard')
            {
                console.log('dkhelt 3');
                fetching_data();
            }
            if(page==='friends')
            {
                console.log('dkhelt 4');
                fetching_data();
            }
            // Update the URL in the browser's history
            window.history.pushState({}, "", page);
        })
        .catch(error => {
            console.error('Error fetching the page:', error);
        });
}
window.onpopstate = function() {
    loadPage(window.location.pathname.substring(1) || 'index');
};
document.addEventListener('DOMContentLoaded', () => {
    // Load the initial page
    loadPage(window.location.pathname.substring(1) || 'index');
    // fetching_data();
} );

function loadScript(scriptSrc) {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    document.body.appendChild(script);
}
