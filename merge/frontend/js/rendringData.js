//Function to render data of profile in the dashboard
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }
function render_profile(data){
    const jsonString = data.image.replace(/'/g, '"');
    const imageData = JSON.parse(jsonString);
    console.log(imageData);
    const profile_img = imageData.link;
    const profile = document.getElementsByClassName('profile')[0];
    profile.innerHTML = `
            <div class="usr">
            <img src="${profile_img}" alt="profile" class="profile-img">
                <div class=user-info>
                    <span class="username">${data.login}</span>
                    <span class="rank">Rank</span>
                </div>
            </div>
                    `;
    const user_info = document.getElementsByClassName('user-info')[0];
    const profile_img_style = document.getElementsByClassName('profile-img')[0];
    const username_style = document.getElementsByClassName('username')[0];
    const usr_style = document.getElementsByClassName('usr')[0];
    profile.style.display = 'flex';
    profile.style.alignItems = 'center';
    profile.style.marginBottom = '20px';
    usr_style.style.display = 'flex';
    usr_style.style.alignItems = 'flex-start';
    usr_style.style.flexDirection = 'row';
    profile_img_style.style.borderRadius = '50%';
    profile_img_style.style.width = '100px';
    profile_img_style.style.height = '100px';
    profile_img_style.style.marginRight = '15px';
    user_info.style.display = 'flex';
    user_info.style.flexDirection = 'column';
    user_info.style.marginTop = '20px';
    username_style.style.alignItems = 'flex-start';

    

}
export async function fetching_data(){
    const access_token = getCookie('access_token');
    try{
        const response = await fetch('http://localhost:8000/api/user_data/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        });
        if(response.ok){
            const data = await response.json();
            render_profile(data);
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

function friendsRequest() {
    document.getElementById('request-form').addEventListener('submit', async function (event) {
        console.log('submit->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.');
        // sleep(7000);
        event.preventDefault();
    
        const username = document.getElementById('username').value;
        console.log('------->',username);
        if(!username){
            document.getElementById('request-resp').textContent ='Please enter a username';
            document.getElementById('request-resp').style.color="#f4000c";
            return;
        }    
        try {
            const response = await fetch('http://127.0.0.1:8000/api/', {//kteb url dyal endpoint dyalk
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username}),
            });
    
            if (response.ok) {
                const responseData = await response.json();
                document.getElementById('request-resp').textContent ='Request send successfully to '+responseData.username;
            } else {
                const errorData = await response.json();
                document.getElementById('request-resp').textContent = errorData.error;
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('request-resp').textContent = 'Network error. Please try again.';
        }
    });
}

export function displayWindow(window){
    const windows = document.getElementsByClassName('friends-windows');
    if(!window)
    {
        window = 'online-list';
    }
    const my_window = document.getElementById(window);  
    // console.log("---==",z);
    for(let i=0; i<windows.length; i++){
        console.log('d5elt ldisplay--!');
        windows[i].style.display = 'none';
    }
    console.log(window);
   // document.getElementById(window).style.display = 'block';
    my_window.style.display = 'block';
    if(window ==='add-friends'){
        document.getElementsByClassName('lists')[0].style.backgroundColor = 'transparent';
        document.getElementById('search-frds').style.display = 'none';
    }
    else{
        console.log('here1');
        document.getElementById('search-frds').style.display = 'block';
        document.getElementsByClassName('lists')[0].style.backgroundColor = '#141622';
    }
    // if(window==='add-friends')
    // {
    //     // friendsRequest();
    // }
}
window.displayWindow = displayWindow;

let history_matchs=[
    {
        "id": 1,
        "user": 1,
        "opponent": 2,
        "result": "win",
        "date": "2021-09-19",
        "user_goals": 5,
        "opponent_goals": 9,
    },
    {
        "id": 2,
        "user": 1,
        "opponent": 3,
        "result": "lose",
        "date": "2021-09-19",
        "user_goals": 5,
        "opponent_goals": 9,

    },
    {
        "id": 3,
        "user": 1,
        "opponent": 4,
        "result": "win",
        "date": "2021-09-19",
        "user_goals": 10,
        "opponent_goals": 5,
    },
    {
        "id": 4,
        "user": 1,
        "opponent": 5,
        "result": "win",
        "date": "2021-09-19",
        "user_goals": 10,
        "opponent_goals": 4,
    },
    {
        "id": 5,
        "user": 1,
        "opponent": 6,
        "result": "win",
        "date": "2021-09-19",
        "user_goals": 10,
        "opponent_goals": 3,
    },
    {
        "id": 6,
        "user": 1,
        "opponent": 7,
        "result": "lose",
        "date": "2021-09-19",
        "user_goals": 5,
        "opponent_goals": 9,
    },
    {
        "id": 7,
        "user": 1,
        "opponent": 8,
        "result": "win",
        "date": "2021-09-19",
        "user_goals": 10,
        "opponent_goals": 3,
    },

];


export function display_match_history()
{
    const history = document.getElementById("history-body"); 
    history.innerHTML = '';
    for(let i=0; i<history_matchs.length; i++)
    {
        let user = history_matchs[i].user;
        let opponent = history_matchs[i].opponent;
        let result = history_matchs[i].result;
        // let oponent_result = history_matchs[i].result;
        let oponent_result;
        let date = history_matchs[i].date;
        let user_goals = history_matchs[i].user_goals;
        let opponent_goals = history_matchs[i].opponent_goals;
        if(result === 'win'){
            // result = 'Win';
            oponent_result = 'lose';
        }
        else{
            oponent_result = 'win';
        }
        history.innerHTML += `
        <tr class="tr-style">
            <td>${user}</td>
            <td>${result}</td>
            <td>${user_goals}</td>
            <td rowspan="2" class="date-style">${date}</td>
        </tr>
        <tr class="tr-style">
            <td>${opponent}</td>
            <td>${oponent_result}</td>
            <td>${opponent_goals}</td>
        </tr>
        `;
        
    }
        const td = document.getElementsByTagName('td');
        for(let i=0; i<td.length; i++){
            td[i].style.color = '#fff';
            td[i].style.border = 'none';
        }
        const tr = document.getElementsByClassName('tr-style');
        for(let i=0; i<tr.length; i++){
            if(i%2 === 0){
            tr[i].style.border ='none';
            }
            else{
                tr[i].style.borderBottom ='2px solid rgb(218, 215, 215)';
            }
        }
        const date_style = document.getElementsByClassName('date-style');
        for(let i=0; i<date_style.length; i++){
            // date_style[i].style.alignItems = 'center';
            // date_style[i].style.justifyContent = 'center';
           date_style[i].style.alignContent = 'center';
        }
}