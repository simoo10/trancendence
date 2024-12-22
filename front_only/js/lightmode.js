

function lightmode(){
    let bodyBackground = document.getElementById("dashboard");
    let sidebarbackground = document.getElementById("sidebarMenu");
    let mainpage = document.getElementById("navbar-2")
    let logo = document.getElementById("logo");
    let search = document.getElementById("search-input");
    let bodyTitle = document.getElementById("dash-title");
    let username = document.getElementsByClassName("username");
    let rank = document.getElementsByClassName("rank");
    let winnigrate = document.getElementsByClassName("winning-rate");
    let latestmatch = document.getElementsByClassName("latest-match");
    let ranking = document.getElementsByClassName("ranking");

    const lightMode={
        bodyBackground : "#E3E3FD",
        sidebarbackground:"#EEF5FF",
        logo : "url('../images/logo2.png')",
        searchcolor:  "#1D1F2E",
        searchbackground:"#ffffff",
        bodytitle:"#000000",
        username:"#000000",
        rank:"#000000",
        winnigratebackground:"#8E91A4",
        rankingbackground:"#8E91A4",
        latestmatchbackground:"#8E91A4",
    };
    const darkmode={
        bodyBackground : "rgb(29, 31, 46)",
        sidebarbackground:"#141622",
        logo : "url('../images/logo1.png')",
        searchcolor:  "#ffffff",
        searchbackground:"#1D1F2E",
        bodytitle:"#ffffff",
        username:"#ffffff",
        rank:"#ffffff",
        winnigratebackground:"#171820",
        rankingbackground:"#171820",
        latestmatchbackground:"#171820",
    };
    const checkdatacolor = window.getComputedStyle(bodyBackground).backgroundColor;
    if(checkdatacolor === darkmode.bodyBackground)
    {
        
        bodyBackground.style.backgroundColor = lightMode.bodyBackground;
        mainpage.style.backgroundColor = lightMode.bodyBackground;
        sidebarbackground.style.backgroundColor = lightMode.sidebarbackground;
        logo.style.imageRendering= lightMode.logo;
        search.style.backgroundColor = lightMode.searchbackground;
        search.style.color = lightMode.searchcolor;
        bodyTitle.style.color = lightMode.bodytitle;
        for(let i =0;i<username.length;i++)
        {
            username[i].style.color = lightMode.username;
            rank[i].style.color = lightMode.rank;
        }
        for(let i=0;i<winnigrate.length;i++)
        {
            winnigrate[i].style.backgroundColor = lightMode.winnigratebackground;
            latestmatch[i].style.backgroundColor = lightMode.latestmatchbackground;
            ranking[i].style.backgroundColor = lightMode.rankingbackground;
        }
    }
    else
    {
        bodyBackground.style.backgroundColor = darkmode.bodyBackground;
        mainpage.style.backgroundColor = darkmode.bodyBackground;
        sidebarbackground.style.backgroundColor = darkmode.sidebarbackground;
        logo.style.imageRendering= darkmode.logo;
        search.style.backgroundColor = darkmode.searchbackground;
        search.style.color = darkmode.searchcolor;
        bodyTitle.style.color = darkmode.bodytitle;
        for(let i =0;i<username.length;i++)
        {
            username[i].style.color = darkmode.username;
            rank[i].style.color = darkmode.rank;
        }
        for(let i=0;i<winnigrate.length;i++)
        {
            winnigrate[i].style.backgroundColor = darkmode.winnigratebackground;
            latestmatch[i].style.backgroundColor = darkmode.latestmatchbackground;
            ranking[i].style.backgroundColor = darkmode.rankingbackground;
        }
    }
}