
function changemode() {
    let background = document.getElementById("signupform");
    let form_background = document.getElementById("formule");
    let subject=document.getElementById("subject");
    let signupbtn=document.getElementById("q");
    let darkmode=document.getElementById("darkmode-btn");
    let signin=document.getElementById("login");
    let labels = document.getElementsByTagName("label");
    let input_color = document.getElementsByClassName("input_color");


    const lightMode = {
        background: "#CCC2DC",
        formBackground: "#ffffff",
        subject: "#374557",
        signupbtn_background:"#000000",
        signupbtn_color:"#ffffff",
        darkmode_img:"url('images/lightmode.png')",
        signin_color:"#000000",
        labels_color:"#364558",
        input_color:"#000000",
    };
    const dakMode = {
        background: "rgb(47, 10, 68)",
        formBackground: "rgb(21, 2, 32)",
        subject: "rgb(255, 255, 255)",
        signupbtn_background:"#ffffff",
        signupbtn_color:"#8A929C",
        darkmode_img:"url('images/darkmode.png')",
        signin_color:"#ffffff",
        labels_color:"#ffffff",
        input_color:"#ffffff",
    };
    const userData = {
        background: window.getComputedStyle(background).backgroundColor,
        formBackground: window.getComputedStyle(form_background).backgroundColor,
        subject: window.getComputedStyle(subject).color,
    };

    if (userData.background === dakMode.background) {
        // console.log("dark mode");
        background.style.backgroundColor=lightMode.background;
        form_background.style.backgroundColor=lightMode.formBackground;
        subject.style.color = lightMode.subject;
        signupbtn.style.backgroundColor=lightMode.signupbtn_background;
        signupbtn.style.color=lightMode.signupbtn_color;
        darkmode.style.backgroundImage=lightMode.darkmode_img;
        signin.style.color=lightMode.signin_color;
        for(let i=0;i<input_color.length;i++)
            input_color[i].style.color=lightMode.input_color;
    } else {
        // console.log("light mode");
        background.style.backgroundColor = dakMode.background;
        form_background.style.backgroundColor= dakMode.formBackground;
        subject.style.color= dakMode.subject;
        signupbtn.style.backgroundColor=dakMode.signupbtn_background;
        signupbtn.style.color=dakMode.signupbtn_color;
        darkmode.style.backgroundImage=dakMode.darkmode_img;
        signin.style.color=dakMode.signin_color;
        for(let i=0;i<input_color.length;i++)
            input_color[i].style.color=dakMode.input_color;
    }
    
    for (let i = 0; i < labels.length; i++) {
        if (window.getComputedStyle(labels[i]).color===dakMode.labels_color) {
            labels[i].style.color=lightMode.labels_color;
        } else {
            labels[i].style.color=dakMode.labels_color;
        }
    }

}

