const forgotPassword = token => `
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
        a {
            color: white;
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
                <h1 class="title">Access the following link to change the password</h1>
                <a target="_blank" href='${process.env.URL_HOST}/changepasswordemail/${token}'>${process.env.URL_HOST}/changepasswordemail/${token}</a>

        </div>
    </div>
</body>
`

module.exports = {
    forgotPassword
}