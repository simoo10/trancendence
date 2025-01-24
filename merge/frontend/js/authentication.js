let log42Complete = false;

export function log42(){
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
                console.log(data )
                if (data.url) {
                    log42Complete = true;
                    window.location.href = data.url; // Redirect to Intra42 authentication page
                    
                    
                } else {
                    console.error('URL not found in response');
                    return(false);
                }
            } else {
                console.error('Failed to fetch authentication URL');
                return(false);
            }
        } catch (error) {
            console.error('Error during login:', error);
            return(false);
        }
    });
}
export function isLog42Complete() {
    return log42Complete;
}



export function handleCallbackResponse() {
    // Check if tokens are present in cookies (set by the backend)
    const accessToken = getCookie('access_token');
    const refreshToken = getCookie('refresh_token');

    if (accessToken && refreshToken) {
        console.log('Tokens retrieved:', { accessToken, refreshToken });
        
        // Use the tokens to fetch user data
        fetchUserData(accessToken);
        console.log('good!!!');
        log42Complete = true;
        // login_success= true;
    } else {
        console.error('No tokens found');
        // login_success = false;
    }
}

// Helper function to get cookies
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


export async function fetchUserData(accessToken) {
    try {
        const response = await fetch('http://localhost:8000/api/user_data/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('User data:', userData);
            // login_success= true;
            return (true);
         // Update the UI with user data
        } else if (response.status === 401) {
            console.error('Unauthorized: Invalid or expired token');
            login_success= false;
            // Display user data on the page (e.g., login, email, etc.)
        } else {
            console.error('Failed to fetch user data');
            return (false);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return (false);
    }
}


async function refreshAccessToken(refreshToken) {
    try {
        const response = await fetch('http://localhost:8000/api/token_refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            const newAccessToken = data.access;
            console.log('New access token:', newAccessToken);
            return newAccessToken;
        } else {
            console.error('Failed to refresh access token');
        }
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}


//simple authentication for Sign Up

export function simplelog() {
    document.getElementById('signup-form').addEventListener('submit', async function(event) {
        console.log('Login form submitted');
        event.preventDefault();
    console.log('Login form submitted');
        console.log('Signup form submitted');
        // Gather form data
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password1 = document.getElementById('password1').value;
        console.log(password1);
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
            const response = await fetch('http://localhost:8000/api/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });

            if (response.ok) {
                console.log('Signup successful2');
                const responseData = await response.json();
                // alert("Signup successful!");
                // window.location.href = login.html;
                import(`./main.js`).then(module => {
                    module.handling_navigation('/login');
                    return (true);
                }
                ).catch(error => {
                    console.error('Error in importing the module:', error);
                    return (false);
                });
                // return ('ok');
                // Redirect to the login page
                // window.location.href = 'login.html';
                // document.getElementById('responseMessage').textContent = "Signup successful!";
                // document.getElementById('responseMessage').style.color = 'green';
            } else {
                console.log('Signup failed:3', response.statusText);
                alert("Signup failed: " + response.statusText);
                return ('ko');
                return(false);
                // document.getElementById('responseMessage').textContent = "Signup failed: " + response.statusText;
            }
        } catch (error) {
            console.error('Error:4', error);
            return(false);
            // document.getElementById('responseMessage').textContent = "Network error or server is down";
        }
    });
}

//simple authentication for login

export function login() {
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
                import(`./main.js`).then(module => {
                    module.handling_navigation('/dashboard');
                }).catch(error => {
                    console.error('Error in importing the module:', error);
                });
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

export {log42Complete};