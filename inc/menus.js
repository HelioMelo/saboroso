let connection = require('./db');
let path = require('path');


module.exports = {

    
    // Método para listar os "menus" do banco de dados mySQL
    getMenus() {

        return new Promise((resolve, reject) => {

            connection.query(`

                SELECT * FROM tb_menus ORDER BY title;

            ` ,  (err, results) => {

                if(err) {

                    reject(err);

                }

                console.log(results)
                resolve(results);

            });

        });
 
    },

    // Método para listar os "salvar" novos pratos no banco de dados mySQL
    save(fields, files) {

        // O processo de salvar o dados é uma Promise
        return new Promise((resolve, reject) => {

            // Fazendo um parse para pegar apensa o nome do arquivo
            fields.photo = `images/${path.parse(files.photo.path).base}`;

            let query, queryPhoto = '', params = [

                fields.title,
                fields.description,
                fields.price

            ];

            if(files.photo.name){

                queryPhoto = ', photo = ?';

                params.push(fields.photo)

            }

            if(parseInt(fields.id) > 0 ){

                params.push(fields.id);

                query = `
                
                    UPDATE tb_menus
                        SET title = ?, 
                            description = ?,
                            price = ?
                            ${queryPhoto}
                        WHERE id = ?
        
                `;

            } else { 

                if(!files.photo.name){

                    reject('Envie a foto do prato!!')

                }

                query = `
                    
                    INSERT INTO 
                        tb_menus (title, description, price, photo)
                        VALUES (?, ?, ?, ?)
                `;

            }

            connection.query(query, params, (err, results) => {

                if(err) {

                    // console.log(query, params)
                    reject(err)

                } else {

                    // console.log(query, params)
                    resolve(results)

                }

            })

        })        

    },

    delete(id){

        return new Promise((resolve, reject) => {

            connection.query(`

                DELETE FROM tb_menus 
                    WHERE id = ?

            `, [

                id

            ], (err, results) => {

                if(err) {

                    reject(err)

                } else {

                    resolve(results)

                }

            })

        });

    }
    
}