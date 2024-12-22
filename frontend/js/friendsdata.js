function friendsList() {
    let arr_data = [
        {
            username: "John",
            fullname: "John Doe",
        },
        {
            username: "Jane",
            fullname: "Jane Doe",
        },
        {
            username: "Jim",
            fullname: "Jim Doe",
        },
        {
            username: "Jill",
            fullname: "Jill Doe",
        },
        {
            username: "Jack",
            fullname: "Jack Doe",
        }
    ];

    const div = document.getElementById("list1");
    for (let i = 0; i < arr_data.length; i++) {
        div.innerHTML += `
        <li class="d-flex" >
            <div class="usr">
                <span class="username">${arr_data[i].username}</span>
                <span class="fullname">${arr_data[i].fullname}</span>
            </div>
            <div class="utility">
                <button type="button" class="play-btn"><i class="bi bi-flag-fill icoon"></i></button>
                <button type="button" class="chat-btn"><i class="bi bi-chat-fill icoon"></i></button>
                <button type="button" class="delete-btn"><i class="bi bi-x-circle-fill icoon"></i></button>
                <button type="button" class="next-btn"><i class="bi bi-arrow-right-circle-fill icoon"></i></button>
            </div>
        </li>
        `;
    }
}

window.onload = friendsList;