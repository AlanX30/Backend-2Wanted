const salasModel = require('../models/Salas')

const positions = async (req) => {
    
    const salaId = req.body.salaId
    
    const sala = await salasModel.findById(salaId, {creator: 1, line123:1, line4: 1})

    if(sala.line123 < 7 || sala.line4 < 8) {

    /* ------------------------Nivel 1------------------------------------------------------------------------------- */
    
        var parent1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: sala.creator }}})

        var child2_1 = parent1.users[0].childsId.childId1
        var child2_2 = parent1.users[0].childsId.childId2
    
        /* ------------------------/Nivel 1------------------------------------------------------------------------------- */
        
        /* ------------------------Nivel 2------------------------------------------------------------------------------- */
        if(child2_1){
            var parent2_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child2_1 }}})
      
            
            var child3_1 = parent2_1.users[0].childsId.childId1
            var child3_2 = parent2_1.users[0].childsId.childId2
        }
        if(child2_2){
            var parent2_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child2_2 }}})
         
    
            var child3_3 = parent2_2.users[0].childsId.childId1
            var child3_4 = parent2_2.users[0].childsId.childId2
        }
        
    /* ------------------------/Nivel 2------------------------------------------------------------------------------- */
    
    /* ------------------------Nivel 3------------------------------------------------------------------------------- */
    
        if(child3_1){
            var parent3_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_1 }}})
           
            
            var child4_1 = parent3_1.users[0].childsId.childId1
            var child4_2 = parent3_1.users[0].childsId.childId2
        }
        if(child3_2){
            var parent3_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_2 }}})
           
    
            var child4_3 = parent3_2.users[0].childsId.childId1
            var child4_4 = parent3_2.users[0].childsId.childId2
        }
        if(child3_3){
            var parent3_3 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_3 }}})
            
    
            var child4_5 = parent3_3.users[0].childsId.childId1
            var child4_6 = parent3_3.users[0].childsId.childId2
        }
        if(child3_4){
            var parent3_4 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_4 }}})
          
    
            var child4_7 = parent3_4.users[0].childsId.childId1
            var child4_8 = parent3_4.users[0].childsId.childId2
        }
    
    /* ------------------------/Nivel 3------------------------------------------------------------------------------- */
    
    
    
    const allData = [
        child2_1,child2_2,
        child3_1,child3_2,child3_3,child3_4,
        child4_1,child4_2,child4_3,child4_4,child4_5,child4_6,child4_7,child4_8
    ]

    let line123 = 1
    let line4 = 0

    for(let i = 0; i <= 5; i++){
        if(allData[i]){
            line123 = line123 + 1
        }
    }

    for(let i = 6; i <= 13; i++){
        if(allData[i]){
            line4 = line4 + 1
        }
    }

    sala.line123 = line123
    sala.line4 = line4 

    await sala.save()

    }

}

module.exports = positions