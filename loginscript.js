
function changemode() {
    let background = document.getElementById("signupform");
    let form_background = document.getElementById("formule");
    let subject=document.getElementById("subject");
    
    if (window.getComputedStyle(background).backgroundColor==="rgb(47, 10, 68)") {
        background.style.backgroundColor="#CCC2DC";
    } else {
        background.style.backgroundColor="rgb(47, 10, 68)";
    }

    if (window.getComputedStyle(form_background).backgroundColor==="rgb(21, 2, 32)") {
        form_background.style.backgroundColor="white";
    } else {
        form_background.style.backgroundColor="rgb(21, 2, 32)";
    }

    if (window.getComputedStyle(subject).color==="rgb(255, 255, 255)") {
        subject.style.color="#374557";
    } else {
        subject.style.color="#ffffff";
    }

    let labels = document.getElementsByTagName("label");
    for (let i = 0; i < labels.length; i++) {
        if (window.getComputedStyle(labels[i]).color==="rgb(255, 255, 255)") {
            labels[i].style.color="#364558";
        } else {
            labels[i].style.color="#ffffff";
        }
    }

    let signupbtn=document.getElementById("q");
    if (window.getComputedStyle(signupbtn).backgroundColor==="rgb(255, 255, 255)") {
        signupbtn.style.backgroundColor="black";
    } else {
        signupbtn.style.backgroundColor="#ffffff";
    }

    if (window.getComputedStyle(signupbtn).color==="rgb(138, 146, 156)") {
        signupbtn.style.color="white";
    } else {
        signupbtn.style.color="#8A929C";
    }
    let darkmode=document.getElementById("darkmode-btn");
    if(darkmode.style.backgroundImage.includes("images/darkmode.png"))
    {
        darkmode.style.backgroundImage="url('images/lightmode.png')";
    }
    else
    {
        darkmode.style.backgroundImage="url('images/darkmode.png')";
    }
    let signin=document.getElementById("login");
    if(window.getComputedStyle(signin).color==="rgb(255, 255, 255)")
    {
        signin.style.color="black";
    }
    else
        signin.style.color="white";
}

