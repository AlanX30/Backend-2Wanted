const express = require('express')
const router = express.Router()
const balanceUserModel = require('../models/BalanceUser')
const salasModel = require('../models/Salas')
const csrf = require('csurf')
const withdrawModel = require('../models/Withdraw')
const verifyTokenAdmin = require('../Middlewares/verifyTokenAdmin')
const userModel = require('../models/Users')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const excel = require('exceljs')

const csrfProtection = csrf({ 
    cookie: true 
})

/* ------------------------------------------------------------------------------------------------------- */

const userSignin = process.env.USER_ADMIN_SIGNIN

router.post('/api/admin/signin', csrfProtection, async(req, res) => {

    try{
        const { password, id } = req.body

        const user = await userModel.findOne({userName: userSignin}, {password: 1})

        if(!user){ return res.json({auth: false, error: 'Id is incorrect'}) }

        const validId = await bcrypt.compare(id, user.password)

        if(!validId){ return res.json({auth: false, error: 'Id is incorrect'}) }

        console.log(process.env.ADMINPASSWORDD, process.env.ALGO)
        const validPassword = await bcrypt.compare(password, process.env.ADMINPASSWORDD)
        console.log(password, process.env.ADMINPASSWORDD, validPassword)

        if(!validPassword){ return res.json({auth: false, error: 'Password is incorrect'}) }

        const token = jwt.sign({}, process.env.TOKEN_ADMIN, {
            expiresIn: 600
        })

        res.cookie('tokenAdmin', token, {
            httpOnly: true,
            signed: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 600000
        })

        res.status(200).json({
            admin: true
        })

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/admin/withdraw2wantedlist', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const perPage = 1
        let page  = req.body.page || 1
        
        if(page < 1){
            page = 1
        }

        const list = await withdrawModel.find({type: true}).limit(perPage).sort({date: -1}).skip((perPage * page) - perPage)

        const count = await withdrawModel.countDocuments({type: true})

        const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

        res.json({list, totalPages})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/admin/balanceToExcel', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const balance = await salasModel.find({}, {users: 0, creator: 0}).sort({_id: -1})
    
        var dataBalance = []
    
        for(let i = 0; i < balance.length; i++){
    
            let line123 = balance[i].price * balance[i].line123
            let line4 = (balance[i].price / 2) * balance[i].line4
            let nextLines = (balance[i].price / 4) * (balance[i].usersNumber - balance[i].line123 - balance[i].line4)

            const data = {
                Nombre_de_Sala: balance[i].name,
                Usuarios: balance[i].usersNumber,
                Valor_de_Sala: balance[i].price,
                Acumulado_en_Sala: balance[i].usersNumber * balance[i].price,
                Dinero_ganado_por_usuarios: balance[i].paidUsers,
                Linea_1_2_3: line123,
                Linea_4: line4,
                Linea_5_en_adelante: nextLines,
                Total_Ganancias: line123 + line4 + nextLines
            }
            dataBalance.push(data)
        }

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Balance');

        worksheet.columns = [
            {header: 'Nombre_de_Sala', key: 'Nombre_de_Sala', width: 30},
            {header: 'Usuarios', key: 'Usuarios', width: 10},
            {header: 'Valor_de_Sala', key: 'Valor_de_Sala', width: 15},
            {header: 'Acumulado_en_Sala', key: 'Acumulado_en_Sala', width: 20},
            {header: 'Dinero_ganado_por_usuarios', key: 'Dinero_ganado_por_usuarios', width: 30},
            {header: 'Linea_1_2_3', key: 'Linea_1_2_3', width: 15},
            {header: 'Linea_4', key: 'Linea_4', width: 10},
            {header: 'Linea_5_en_adelante', key: 'Linea_5_en_adelante', width: 25},
            {header: 'Total_Ganancias', key: 'Total_Ganancias', width: 30}
        ]

        dataBalance.forEach( balance => {
            worksheet.addRow(balance)
        })

        const date = new Date

        worksheet.eachColumnKey(columns => {
            columns.alignment = {vertical: 'middle', horizontal: 'center'}
            columns.border = {
                top: {style:'thin'},
                left: {style:'medium'},
                bottom: {style:'thin'},
                right: {style:'medium'}
            }
        })
        
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = {bold: true}
            cell.border = {
                top: {style:'medium'},
                left: {style:'medium'},
                bottom: {style:'medium'},
                right: {style:'medium'}
            }
        })
        await workbook.xlsx.writeFile(`Excel/Balance ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}  ${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.xlsx`)

        res.json({msg: 'Creado Correctmente'})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/admin/mailpersonalized', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const { msg, asunto, user } = req.body
        
        const emailUser = await userModel.findOne({userName: user}, {email: 1})

        if(!emailUser){
            return res.json({error: 'El usuario no existe'})
        }

        const html = require('../PlantillasMail/mailPersonalized').mailPersonalized(msg)

        let transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.USER_ADMIN_EMAIL, 
              pass: process.env.USER_ADMIN_EMAIL_PASSWORD, 
            },
            tls: {
                rejectUnauthorized: false
            }
          })

          await transporter.sendMail({
            from: '"2wanted.com" <admin@2wanted.com>',
            to: emailUser.email,
            subject: asunto,
            html: html
          })  

          res.json({msg: 'Enviado Correctamente'})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/admin/userhistorialbalance', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const { getFechaInicial, getFechaFinal, user } = req.body

        const getUser = await userModel.findOne({userName: user}, {userName: 1})

        if(!getUser){
            return res.json({error: 'El usuario no existe'})  
        }
        
        const perPage = 10
        let page  = req.body.page || 1
        
        if(page < 1){
            page = 1
        }

        if(getFechaFinal && getFechaInicial){

            const fechaInicial = new Date(getFechaInicial)
    
            const fechaFinal = new Date (getFechaFinal)
        
            const fechaBalance = await balanceUserModel.find({$and: [ {user: user, date: {$gte: fechaInicial}},{date: {$lt: fechaFinal}}]})
            .limit(perPage).skip((perPage * page) - perPage).sort({date: -1})
            
            const count = await balanceUserModel.countDocuments({$and: [ {user: user, date: {$gte: fechaInicial}},{date: {$lt: fechaFinal}}]})

            const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

            res.json({data: fechaBalance, totalPages})

        }else{

            const count = await balanceUserModel.countDocuments({user: user})

            const lastestBalance = await balanceUserModel.find({user: user})
            .sort({date: -1}).limit(perPage).skip((perPage * page) - perPage)

            const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

            res.json({data: lastestBalance, totalPages})

        }        

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/admin/depositUsersList', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const { user } = req.body

        const perPage = 10
        let page  = req.body.page || 1
        
        if(page < 1){
            page = 1
        }

        const userDeposits = await balanceUserModel.find({user: user, type: 'deposit'})
        .limit(perPage).skip((perPage * page) - perPage).sort({date: -1})

        const count = await balanceUserModel.countDocuments({user: user, type: 'deposit'})

        const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

        res.json({list: userDeposits, totalPages})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/admin/withdrawUsersList', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const { user } = req.body

        const perPage = 10
        let page  = req.body.page || 1
        
        if(page < 1){
            page = 1
        }

        const userWithdraws = await balanceUserModel.find({user: user, withdraw: true})
        .limit(perPage).skip((perPage * page) - perPage).sort({date: -1})

        const count = await balanceUserModel.countDocuments({user: user, withdraw: true})

        const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

        res.json({list: userWithdraws, totalPages})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/admin/BalanceUserInSala', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const { user, sala } = req.body

        const getUser = await userModel.findOne({userName: user}, {userName: 1})
        const getSala = await salasModel.findOne({name: sala}, {users: {$elemMatch: { user: user }}})

        if(!getUser){
            return res.json({error: 'El usuario no existe'})
        }
        if(!getSala){
            return res.json({error: 'La sala no existe'})
        }

        if(getSala.users.length === 0) {
            return res.json({error: 'El usuario no pertenece a esta sala'})
        }

        const perPage = 20
        let page  = req.body.page || 1
        
        if(page < 1){
            page = 1
        }

        const userInSala = await balanceUserModel.find({user: user, salaName: sala })
        .limit(perPage).skip((perPage * page) - perPage).sort({date: -1})

        const count = await balanceUserModel.countDocuments({user: user, salaName: sala})

        const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

        res.json({list: userInSala, totalPages})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('', async(req, res) => {

    try{
        
        

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('', async(req, res) => {

    try{
        
        

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */

module.exports = router