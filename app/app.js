
async function CheckEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        Login();
    }
}

async function Login() {
    const response = await fetch('https://zone01normandie.org/api/auth/signin', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(`${document.getElementById("id").value}:${document.getElementById("pw").value}`)}`,
            'Content-Type': 'application/json'
        }
    });
    if (response.ok) {
        const result = await response.json();
        Query(result)
    } else {
        console.error('Failed to sign in:', response.status, response.statusText);
        alert('Erreur de connexion : mauvais nom d\'utilisateur/e-mail ou mot de passe.');
    }
}

async function Query(jwt) {

    const url = "https://zone01normandie.org/api/graphql-engine/v1/graphql";
    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + jwt,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: `{
                user {
                    attrs,
                    firstName,
                    lastName,
                    totalUp,
                    totalDown,
                    auditRatio,
                    login
                    events(
                        where: {
                            event: {
                                path: {_ilike: "/rouen/div-01"
                            }
                        }
                    }) {
                        level
                      }                  
                }
                transaction(
                    where: {
                        type: { _ilike: "skill%" }
                        event: { 
                            path: { _ilike: "/rouen/div-01" } 
                        }
                    },
                    order_by: { id: asc }
                    ) {
                        type
                        amount
                    }
                }`
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de reseau lors du fetch');
            }
            return response.json();
        })
        .then(fetchedData => {
            connected = true;
            Connected(fetchedData.data);
        })
        .catch(error => {
            console.log('Erreur:', error);
        })
}

async function Connected(userInfo) {
    console.log("userInfo", userInfo);
    SetUserValues(userInfo);

    let connnectedDiv = document.getElementById("connected");
    let loginDiv = document.getElementById("login");

    let discoBtn = document.getElementById("disco");
    discoBtn.onclick = function (userInfo) {
        userInfo = {
            user:[
                {
                  attrs: {
                    Phone: "",
                    email: "",
                    gender: "",
                    country: "",
                    foundus: "",
                    attentes: "" ,
                    lastName: "",
                    Situation: "",
                    firstName: "",
                    addressCity: "",
                    dateOfBirth: "",
                    emergencyTel: "",
                    placeOfBirth: "",
                    addressStreet: "",
                    addressCountry: "",
                    countryOfBirth: "",
                    addressPostalCode: "",
                    emergencyLastName: "",
                    mailcheckAccepted: "",
                    emergencyFirstName: "",
                    emergencyAffiliation: "",
                    addressComplementStreet: ""
                  },
                  firstName: "",
                  lastName: "",
                  totalUp: 0,
                  totalDown: 0,
                  auditRatio: 0.0,
                  login: "",
                  events: [
                    {
                      level: 0
                    }
                  ]
                }
              ],
              transaction: []
        };

        loginDiv.style.visibility = "visible";
        connnectedDiv.style.visibility = "hidden";

        SetUserValues(userInfo);
    };

    let navGit = document.getElementById("navGit");
    navGit.onclick = function () {

    };

    loginDiv.style.visibility = "hidden";
    connnectedDiv.style.visibility = "visible";
}

async function SetUserValues(userInfo) {

    console.log("userInfo", userInfo);

    document.getElementById("id").value = "";
    document.getElementById("pw").value = "";

    let giteaLink = document.getElementById("navGit");
    giteaLink.setAttribute("href", "https://zone01normandie.org/git/" + userInfo.user[0].login);

    let userNameReplace = document.querySelectorAll(".username");
    userNameReplace.forEach((field) => {
        field.innerHTML = userInfo.user[0].login;
    });

    let fullName = document.getElementById("helloName");
    fullName.innerHTML = userInfo.user[0].firstName + " " + userInfo.user[0].lastName;

    info(userInfo);
    audit(userInfo);
    svgBottom(userInfo);
}

async function info(userInfo) {
    let fullName = document.getElementById("firstLastName");
    fullName.innerHTML = "Nom complet : " + userInfo.user[0].firstName + " " + userInfo.user[0].lastName;

    let pseudo = document.getElementById("usr");
    pseudo.innerHTML = "Nom d'utilisateur : " + pseudo.innerHTML;

    let birthDate = document.getElementById("birthDate");

    let date = new Date(userInfo.user[0].attrs.dateOfBirth);

    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    let year = date.getUTCFullYear();

    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;

    let formattedDate = `${day}/${month}/${year}`;
    birthDate.innerHTML = "Date de naissance : " + formattedDate;

    let lvl = document.getElementById("lvl");
    lvl.innerHTML = "Niveau actuel : " + userInfo.user[0].events[0].level;
}

async function audit(userInfo) {

    let auditRatio = (userInfo.user[0].auditRatio).toFixed(1);
    let totalUp = await unitConverter(userInfo.user[0].totalUp);
    let totalDown = await unitConverter(userInfo.user[0].totalDown);

    // Barres
    let doneRect = document.getElementById("doneRect");
    let recRect = document.getElementById("recRect");
    let totalUpValue = totalUp[0];
    let totalDownValue = totalDown[0];

    let lengthValues = await lineLength(totalUpValue, totalDownValue);
    let upLength = lengthValues[0];
    let downLength = lengthValues[1];
    doneRect.setAttribute("width", upLength);
    recRect.setAttribute("width", downLength);

    // Valeurs
    let auditDone = document.getElementById("auditDone");
    let auditRecieved = document.getElementById("auditRecieved");
    let ratio = document.getElementById("ratio");
    let ratioTxt = document.getElementById("ratioTxt");
    let totalUpTxt = totalUp[0] + totalUp[1];
    let totalDownTxt = totalDown[0] + totalDown[1];
    auditDone.innerHTML = totalUpTxt;
    auditRecieved.innerHTML = totalDownTxt;
    ratio.innerHTML = auditRatio;
    if (auditRatio >= 2) {
        doneRect.setAttribute("fill", "teal");
        ratio.setAttribute("fill", "teal");
        ratioTxt.setAttribute("fill", "teal");
        ratioTxt.innerHTML = "Best ratio ever!"
    } else if (auditRatio >= 1.25) {
        doneRect.setAttribute("fill", "teal");
        ratio.setAttribute("fill", "teal");
        ratioTxt.setAttribute("fill", "teal");
        ratioTxt.innerHTML = "Almost perfect!"
    } else if (auditRatio >= 1) {
        doneRect.setAttribute("fill", "yellow");
        ratio.setAttribute("fill", "yellow");
        ratioTxt.setAttribute("fill", "yellow");
        ratioTxt.innerHTML = "You can do better!"
    } else if (auditRatio >= 0.8) {
        doneRect.setAttribute("fill", "orange");
        ratio.setAttribute("fill", "orange");
        ratioTxt.setAttribute("fill", "orange");
        ratioTxt.innerHTML = "Make more audits!"
    } else {
        doneRect.setAttribute("fill", "red");
        ratio.setAttribute("fill", "red");
        ratioTxt.setAttribute("fill", "red");
        ratioTxt.innerHTML = "Careful buddy!"
    }
}


async function svgBottom(userInfo) {
    let tran = userInfo.transaction;

    let trans = [
        {
            type: "skill_prog",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_algo",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_front-end",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_back-end",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_game",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_tcp",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_go",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_js",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_html",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_css",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_unix",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        },
        {
            type: "skill_sql",
            amount: 0,
            angle: 0,
            x: 0,
            y: 0
        }
    ]

    tran.forEach(function (eachObj) {
        trans.forEach(function (finalObj) {
            if (eachObj.type == finalObj.type && eachObj.amount > finalObj.amount) {
                finalObj.amount = eachObj.amount
            }
        })
    });
    console.log("trans", trans);

    // Polygons for representing skills
    const width = 400
    const height = 300
    const radius = Math.min(width, height) / 2 - 30
    let path = "";
    let pathA = "";
    let pathB = "";
    let count = 0
    trans.forEach(function (obj) {
        if (count > 5) {
            obj.angle = (Math.PI * 2 * (count - 6)) / (trans.length / 2) - Math.PI / 2; // Math.PI / 2 allows reduce angle by 90°}
        } else {
            obj.angle = (Math.PI * 2 * count) / (trans.length / 2) - Math.PI / 2; // Math.PI / 2 allows reduce angle by 90°}
        }
        obj.x = (width / 2) + (radius * obj.amount) / 100 * Math.cos(obj.angle);
        obj.y = (height / 2) + (radius * obj.amount) / 100 * Math.sin(obj.angle);
        count += 1;
        path = path + obj.x + "," + obj.y;
        if (count % 6 != 0) {
            path = path + " "
        }

        if (count == 6) {
            pathA = path;
            path = "";
        }
        if (count == 12) {
            pathB = path;
            path = "";
        }
    });
    let polyA = document.getElementById("polyA");
    let polyB = document.getElementById("polyB");
    polyA.setAttribute("points", pathA);
    polyB.setAttribute("points", pathB);
}

async function unitConverter(value) {
    if (value > 1000000) {
        return [(value / 1000000).toFixed(2), " Mb"]
    } else if (value > 1000) {
        return [(value / 1000).toFixed(2), " kb"]
    } else {
        return [value.toFixed(2), " b"]
    }
}

async function lineLength(value1, value2) {
    for (let i = 150; i > 0; i--) {
        if (value1 * i <= 150 && value2 * i <= 150) {
            return [value1 * i, value2 * i]
        }
    }
}
