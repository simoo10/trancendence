
function changemode()
{
    let background = document.getElementById("signupform");
    let form_background = document.getElementById("formule");
    let subject = document.getElementById("subject");
    console.log(background.style.color);
    if(background.style.color="rgb(47, 10, 68)")
        background.style.backgroundColor="#CCC2DC";
    else
        background.style.backgroundColor="rgb(47, 10, 68)";
    if(form_background.style.color="rgb(21, 2, 32)")
        form_background.style.backgroundColor="white";
    else
        form_background.style.backgroundColor="rgb(21, 2, 32)";
    if(subject.style.color="#ffffff")
        subject.style.color="#374557";
    else
        subject.style.color="#ffffff";
    let label = document.getElementsByTagName("label");
    for(let i=0;i<label.length;i++)
    {
        if(label[i].style.color="#ffffff")
            label[i].style.color="#364558";
        else
            label[i].style.color="#ffffff";
    }
    let signupbtn = document.getElementById("q");
    if(signupbtn.style.backgroundColor="#ffffff")
    {
        signupbtn.style.backgroundColor="black";
    }
    else
    {
        signupbtn.style.backgroundColor="#ffffff";
    }
    if(signupbtn.style.color="#8A929C")
    {
        signupbtn.style.color="white";
    }
    else
    {
        signupbtn.style.color="#8A929C";
    }
    let darkmode=document.getElementById("darkmode-btn");
    if(darkmode.style.backgroundImage="url('images/darkmode.png')")
    {
        darkmode.style.backgroundImage="url('images/lightmode.png')";
    }
    else
    {
        darkmode.style.backgroundImage="url('images/darkmode.png')";
    }
}

