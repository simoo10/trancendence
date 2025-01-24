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
    });
}