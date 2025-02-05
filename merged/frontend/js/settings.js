export function uploadAvatar()
{
    document.getElementById("avatarUpload").click();
}
document.getElementById('avatarUpload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('avatar').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

window.uploadAvatar = uploadAvatar;

export async function send_editing_data()
{
    const access_token = getCookie('access_token');
    console.log("ghayhrblya2!!!");
    document.getElementById("profile-form").addEventListener('submit', async function (event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const fullname = document.getElementById('fullname').value;
        const avatar = document.getElementById('avatar').src;
        const password = document.getElementById('password').value;
        const data={};
        if(username){
            data.username = username;
        }
        if(email){
            data.email = email;
        }
        if(fullname){
            data.fullname = fullname;
        }
        if(avatar){
            data.avatar = avatar;
        }
        if(password){
            data.password = password
        }
        console.log(data);
        try{
            const response = await fetch('http://127.0.0.1:8000/api/',{
                method:'POST',
                headers:{
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify(data),
            });
            if(response.ok){
                const responseData = await response.json();
                document.getElementById('update-resp').textContent ='Request send successfully to '+responseData.username;
            }
            else{
                const errorData = await response.json();
                document.getElementById('update-resp').textContent = errorData.error;
            }
        }
        catch(error){
            console.error('Error:', error);
            document.getElementById('update-resp').textContent = 'Network error. Please try again.';
        }
    });
}