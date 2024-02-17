var conn = require('./db');
var Pagination = require('./Pagination');
var moment = require('moment');

module.exports = {
    render(req, res, error, success) {
        let startDate = (req.query && req.query.start) ? req.query.start : 'valor_padrão';
        
        res.render('reservations', {
            title: 'Reservas - Restaurante Saboroso!',
            background: 'images/img_bg_2.jpg',
            h1: 'Reserve uma Mesa!',
            body: req.body,
            error,
            success
        });
    },

    getReservations(req) {
        return new Promise((resolve, reject) => {
            let query = req.query || {};
            let page = query.page || 1;
            let dateStart = query.start;
            let dateEnd = query.end;
            let params = [];
            if (dateStart && dateEnd) params.push(dateStart, dateEnd);
            let pag = new Pagination(`
                SELECT SQL_CALC_FOUND_ROWS * FROM
                tb_reservations
                ${(dateStart && dateEnd) ? 'WHERE date BETWEEN ? AND ?' : ''}
                ORDER BY 
                name
                LIMIT ?, ?
            `, params);
            pag.getPage(page).then(data => {
                resolve({
                    data,
                    links: pag.getNavigation(req.query)
                });
            }).catch(reject);
        });
    },

    save(fields) {
        return new Promise((resolve, reject) => {
            if (fields.date.indexOf('/') > -1) {
                let date = fields.date.split('/');
                fields.date = `${date[2]}-${date[1]}-${date[0]}`;
            }
            let query, params = [
                fields.name,
                fields.email,
                fields.people,
                fields.date,
                fields.time
            ];
            if (parseInt(fields.id) > 0) {
                query = `
                    UPDATE tb_reservations 
                        SET name = ?,
                            email = ?,
                            people = ?,
                            date = ?,
                            time = ?
                        WHERE 
                            id = ?
                `;
                params.push(fields.id);
            } else {
                query = `
                    INSERT INTO 
                        tb_reservations (name, email, people, date, time)
                    VALUES 
                        (?, ?, ?, ?, ?)
                `;
            }
            conn.query(query, params, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    },

    delete(id) {
        return new Promise((resolve, reject) => {
            conn.query(`
                DELETE FROM tb_reservations
                    WHERE id = ?
            `, [id], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    },

    chart(req) {
        return new Promise((resolve, reject) => {
            // Verificar se req.query está definido e se contém a propriedade start
            if (!req.query || !req.query.start) {
                reject(new Error("Parâmetros de consulta ausentes"));
                return;
            }
    
            conn.query(`
                SELECT
                    CONCAT(YEAR(date), '-', MONTH(date)) AS date,
                    COUNT(*) AS total,
                    SUM(people) / COUNT(*) AS avg_people
                FROM tb_reservations
                WHERE
                    date BETWEEN ? AND ?
                GROUP BY YEAR(date), MONTH(date) 
                ORDER BY YEAR(date) DESC, MONTH(date) DESC;
            `, [
                req.query.start,
                req.query.end
            ], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    let months = [];
                    let values = [];
                    results.forEach(row => {
                        months.push(moment(row.date).format('MMM YYYY'));
                        values.push(row.total);
                    });
                    resolve({
                        months,
                        values
                    });
                }
            });
        });
    },
    
    
    

    dashboard() {
        return new Promise((resolve, reject) => {
            conn.query(`
                select
                    (select count(*) from tb_contacts) AS nrcontacts,
                    (select count(*) from tb_menus) AS nrmenus,
                    (select count(*) from tb_reservations) AS nrreservations,
                    (select count(*) from tb_users) AS nrusers;
            `, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results[0]);
                }
            });
        });
    }
};
