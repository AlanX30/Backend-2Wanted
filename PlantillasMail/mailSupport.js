const mailSupport = (msg, asunto, user, email) => {
    return `
    <head>
    <style>
        .title {
            color: white;
        }
        .container {
            width: 80%;
            max-width: 1000px;
            background: #343a40;
            border-radius: 10px;
            margin: 60px auto 50px;
            border: 4px solid #212529;
            padding: 25px;
            box-shadow: 0 -1px 8px #000;
        }
        .body {
            background: linear-gradient(to left, #f46b45, #eea849);
            border-radius: 10px;
            padding: 25px;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
        }
        .logo1 {
            height: 55px;
        }
        .logo2 {
            height: 30px;
            margin-top: 21px;
            margin-left: 4px;
        }
        p {
            font-weight: 600;
            color: #f09e49;
            font-size: 20px;
        }

    </style>
</head>
<body>
    <div class="body">
        <div class="container">
                <div class="logos-container">
                    <img class="logo1" src="https://i.ibb.co/rcGw6hh/logo-1.png" alt="logo-1" border="0">
                    <img class="logo2" src="https://i.ibb.co/6FQ2zHT/2WANTED.png" alt="2WANTED" border="0" />
                </div>
                <h1 class="title">Mensaje de usuario a soporte</h1>
                <p>Usuario: <span>${user}</span> </p>
                <p>Email de Usuario: <span>${email}</span> </p>
                <p>Asunto: <span>${asunto}</span> </p>
                <p>Mensaje:</p>
                <p>${msg}</p>
        </div>
    </div>
</body>
`
}


module.exports = {
    mailSupport
}