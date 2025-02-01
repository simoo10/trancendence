//all the routes are defined here
import { getCookie } from "./rendringData.js"
import { combinedChat, check_expiration } from "../game/js/setup2.js";


let login_success = false;
// const combinedChat = window.combinedChat;

const routes = [
    {link:'/',template:'landing.html'},
    {link:'/landing',template:'landing.html'},
    {link:'/login',template:'login.html'},
    {link:'/signup',template:'signup.html'},
    {link:'/dashboard',template:'dashboard.html'},
    {link:'/friends',template:'friends.html'},
    {link:'/leaderboard',template:'leaderboard.html'},
    {link:'/test' ,template:'test.html'},
    {link:'/settings',template:'settings.html'},
    {link:'/ping',template:"game.html"},
];

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(";").shift();
//     return null;
//   }
async function fetchUserData(accessToken) {
    accessToken = getCookie('access_token');

    try {
        console.log("access token : ", accessToken);

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
            // You can update the UI here with user data
            document.getElementById('userData').textContent = JSON.stringify(userData, null, 2);
        } else if (response.status === 401) {
            const refreshToken = getCookie("refresh_token");
            console.log("hada refresh_token: ",refreshToken);
        if (!refreshToken) {
            console.log("ana hna!!");
        const refreshResponse = await fetch("http://localhost:8000/api/token_refresh/", {
          method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        document.cookie = access_token=`${data.access}`; SameSite=None; Secure;
      }
    }
        } else {
            console.error('Failed to fetch user data');
            document.getElementById('userData').textContent = 'Failed to fetch user data';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        document.getElementById('userData').textContent = 'Error fetching user data';
    }
}

function handleFetchClick() {
    console.log('Fetching user data!!!!!!!!!');
    const accessToken = document.getElementById('accessToken').value;
    fetchUserData(accessToken);
}

window.handleFetchClick = handleFetchClick;






const content = document.getElementById('page-content');
const game_content = document.getElementById('game-content');
const profile_content = document.getElementById('profiles-content');
let css_link = null;
const navbar = document.getElementById('landing-navbar');
const home_navbar = document.getElementById('home-navbar');
const chat_content = document.getElementById('chat-container');
export let username = "";
//function to handle navigation

export async function handling_navigation(route, updateHistory = true) {
    const parsedUrl = new URL(window.location.href);
    const params = new URLSearchParams(parsedUrl.search);
    const code = params.get("code");
    console.log("code : ", params);
    //http://localhost:8000/api/intra42callback/?code=${code}
    if (code) {
        // window.location.href = `http://localhost:8000/api/intra42callback/?code=${code}`;
        try {
            const response = await fetch(`http://localhost:8000/api/intra42callback/?code=${code}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Data: ", data);
                document.cookie = `access_token=${data.access_token}; SameSite=None; Secure`;
                document.cookie = `refresh_token=${data.refresh_token}; SameSite=None; Secure`;
                // handling_navigation('/dashboard');
            } else {
                throw new Error("Failed to fetch user data");
                handling_navigation('/login');
                return;
            }
        }
        catch (error) {
            console.error("Error !!!!!!!!!!!!!!!!!: ", error);
        }
    }

    const exact_route = routes.find((r) => r.link === route);
    console.log("Exact Route: ",route);

    // hna rah kanshof wash l user mlogi wla la, ila kan mlogi rah ila msha l login wla l signup ghaydoz l dashboard
    // makansh mlogi ghaydir redirect l login finma mash mn ghir landing kaydoz liha ila bgha wakha mamlogish
    if (exact_route && route != '/landing') {
        const access_token = getCookie('access_token');

        console.log("Access Token: ", access_token);

        try {
            if (await check_expiration (route) && (route == '/login' || route == '/signup' ))
                return (handling_navigation('/dashboard'));
            // if (route == '/login' || route == '/signup' )
            //     return (handling_navigation('/dashboard'));
            // i need here to throw an error which specify it needs to go to dashboard when already logged
        }
        catch(error) {
            console.error('2--Error fetching data redirecting to login page:', error);
            if (route != '/login' && route != '/signup' )
                return (handling_navigation('/login'));
        }
    }

    if (exact_route) {
        get_content(exact_route.template);
        if (updateHistory) {
            history.pushState({ route }, "", route);
        }
    } else {
        get_content("404.html");
        history.pushState({ route }, "", route);
    }
}


//function to get the content of the template
import { log42, login, handleCallbackResponse } from "./authentication.js";

export async function get_content(template){

    console.log("Template: ",template,"login: ",login_success);
    try{
        console.log("--->",template);
        let response = null;
        if (template != "game.html") {
            console.log("Fetching the content");
            response = await fetch(`views/${template}`);
        }
        if(template === "game.html" || response.ok ){
            let data = null;
            if (template != "game.html") {
                game_content.style.display = "none";
                data = await response.text();
                import(`./theme.js`).then(module => {
                    const savedTheme = localStorage.getItem('theme') || 'dark';
                    document.documentElement.setAttribute('data-theme', savedTheme);
                    window.toggleTheme = module.toggleTheme;
                } ).catch(error => {
                    console.error('Error in importing the module:', error);
                } );
            }
            
            const css_file = template.split('.')[0];
            if(css_link){
               document.head.removeChild(css_link); 
            }
            css_link = document.createElement('link');
            css_link.rel = 'stylesheet';
            css_link.href = `css/${css_file}.css`;
            document.head.appendChild(css_link);
            console.log("CSS Link: ",css_link);
            if(template==="login.html" || template==="signup.html")
            {
                navbar.style.display = "none";
                home_navbar.style.display = "none";
                if(template==="login.html"){
                    import(`./authentication.js`).then(module => {
                        module.log42();
                        module.login();
                        module.handleCallbackResponse();
                        console.log("Login 5assha t5dem!!------------------------------mal hadhsi>",login_success);
                    }).catch(error => {
                        console.error('Error in importing the module:', error);
                    } );
                }
                else if(template==="signup.html")
                {
                    import(`./authentication.js`).then(module => {
                        module.simplelog();
                    }).catch(error => {
                        console.error('Error in importing the module:', error);
                    } );
                    
                }
            }
            
            else if(template==="landing.html"){
                navbar.style.display = "block";
                home_navbar.style.display = "none";
            }
            else{
                navbar.style.display = "none";
                
                home_navbar.style.display = "block";
            }
            if(template==="dashboard.html"){

                // fetching previous games
                try {
                    const response = await fetch(`http://localhost:8000/game/api/player-stats/${username}/`);
                    console.log("Username: ", username);
                    console.log("Response: ", response);
                    console.log("Response: ", response.status);
                    // Check if the response is OK (status code 200-299)
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Player stats:', data);
                } catch (error) {
                    console.error('Error loading player stats:', error);
                }
                // if(!log42Complete){
                    //     console.log("!!!!!!!!!!!!!!!!!!!!!");
                    //     handling_navigation('/login');
                    //     return;
                    // }
                    console.log("Dashboard 5assha t5dem!!");
                    import(`./rendringData.js`).then(module => {
                        module.fetching_data();
                        module.display_match_history();
                    }).catch(error => {
                        console.error('Error in importing the module:', error);
                    } );
                }
                if(template==="settings.html"){
                    import(`./settings.js`).then(module => {
                        module.uploadAvatar();
                        module.send_editing_data();
                    }).catch(error => {
                        console.error('Error in importing the module:', error);
                    } );
                }
                if(template==="friends.html"){
                    import(`./rendringData.js`).then(module => {
                        module.displayWindow();
                    }
                ).catch(error => {
                    console.error('Error in importing the module:', error);
                } );
            }
            if(template==="landing.html" || template==="login.html" || template==="signup.html"){
                document.title = css_file;
                profile_content.style.display = "none";
                content.style.display = "block";
                chat_content.style.display = "none";
                console.log("chat content: ", chat_content);
                content.innerHTML = data;
            }
            else if (template === "game.html") {
                // hide everything else
                content.style.display = "none";
                profile_content.style.display = "none";
                navbar.style.display = "none";
                home_navbar.style.display = "none";
                // nshowi l game content
                game_content.style.display = "block";
                chat_content.style.display = "block";
                console.log ("start game");
            }
            else {
                const navbar_css = document.createElement('link');
                navbar_css.rel = 'stylesheet';
                navbar_css.href = 'css/home.css';
                document.head.appendChild(navbar_css);
                content.style.display = "none";
                profile_content.style.display = "block";
                chat_content.style.display = "block";
                profile_content.innerHTML = data;

            }
        }
        else{
            throw new Error('Error in fetching the content');
        }
    }
    catch(error){
        content.innerHTML = `<h1>${error.message}</h1>`;
    }
}
//function to pop up a div
function drop(wind){
    wind.style.display = "none";
}
function pop_up(){
    const popup = document.getElementById('concept-modal');
    // const close = pop_up.querySelector('.close-btn');
    popup.style.display = "flex";
    const closeBtn = popup.querySelector(".close-btn");
    closeBtn.addEventListener("click", () => {
        popup.style.display = "none";
    });
}

window.pop_up = pop_up;


//function to change the css file

function change_css(path) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);
}


document.addEventListener("click", (event) => {
    let target = event.target;

    while (target && !target.hasAttribute("data-route"))
    {
        target = target.parentElement;
    }
    if (target && target.hasAttribute("data-route"))
    {
        event.preventDefault();
        const route = target.getAttribute("data-route");
        handling_navigation(route);
    }
});

window.addEventListener("popstate", (event) => {
    const route = event.state?.route || "/landing";
    console.log("Pop State: ",route);
    handling_navigation(route);
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded");
    const initialRoute = window.location.pathname || "/landing";
    handling_navigation(initialRoute, false);
});

export function setUsername(newUsername) {
    username = newUsername;
}
const toggleButton = document.getElementById("toggle-button");
const sidebarMenu = document.getElementById("sidebarMenu");

// Toggle sidebar visibility
toggleButton.addEventListener("click", (e) => {
  sidebarMenu.classList.toggle("show");
  // Stop event propagation
  e.stopPropagation();
});

// Hide sidebar when clicking outside
document.addEventListener("click", (e) => {
  // Check if the click is outside both the sidebar and the toggle button
  if (!sidebarMenu.contains(e.target) && !toggleButton.contains(e.target)) {
    sidebarMenu.classList.remove("show");
  }
});

// Prevent sidebar clicks from hiding it
sidebarMenu.addEventListener("click", (e) => {
  // Allow clicks on links to work
  if (e.target.tagName === "A") return; // Allow navigation
  e.stopPropagation();
});


// export {username};

