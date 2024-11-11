const express = require("express");
const dateTime = require ("./dateTime");
const fs = require("fs");
const bodyparser = require("body-parser");
const path = require("path");
//fotofe üleslaadimiseks multer
const multer = require("multer");

//andmebaasi andmed
const dbInfo = require("../../vp2024config");

//andmebaasiga suhtlemine
const mysql = require("mysql2");

//foto manipulatsiooniks
const sharp = require("sharp");

//paroolide krüpteerimiseks
const bcrypt = require("bcrypt");

//sessioonihaldur
const session = require("express-session");

// a-sünkroonsuse võimaldaja
const asyn= require("async");

const app = express();

//määran view mootori
app.set("view engine", "ejs");

//määran jagatavate avalike failide kasuta
app.use(express.static("public"));

//kasutame body-parserit päringute parsimiseks (kui ekst ss false, kui pildid jm ss true)
app.use(bodyparser.urlencoded({extended: true}));

//seadistame fotode üleslaadimiseks vahevara(middleware), mis määrab kataloogi, kuhu laetakse
const upload = multer({dest: "./public/gallery/orig"});

//sessioonnihaldur
app.use(session({secret:"minuAbsoluutseltsalajaneVõti", saveUninitialized: true, resave: true  }));
let mySession;
//loon andmebaasiühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

app.get("/", (req, res)=>{
	//res.send("express läks käima!");
	console.log(dbInfo.configData.host);
	res.render("index");
});

app.post("/", (req, res) =>{
	let notice =null;
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("Sisselogimise andmed pole täielikud!");
		notice ="Sisselogimise andmeid on puudu";
		res.render("index", {notice: notice});
	}
	else{
		let sqlReq= "SELECT id, password FROM vpusers WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				notice = "Tehnilise vea tõttu ei saa sisse logida";
				console.log(err);
				res.render("index", {notice: notice});
			}
			else{
				if(result[0] !=null){
					//kontrollime kas sisselogimisel sisestatud paroolist saaks sellise räsi nagu andmebaasis 
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
							notice= "Tehniline viga andmete kontrollimisel";
							console.log(err);
							res.render("index", {notice: notice});
						}
						else{
							//kui võrdlus tulemus on positiivne 
							if(compareresult){
								notice = "oled sisse loginud";
								//võtame sessiooni kasutusele
								mySession = req.session;
								mySession.userId = result[0].id								
								res.redirect("/home");
								
							}
							else{
								notice= "Kasutajatunnus või parool oli vigane";
								res.render("index", {notice: notice});
							}
						}
					});
			    }
			    else {
					notice = "Kasutajatunnus või parool oli vale!";
					res.render("index", {notice: notice});
			    }
			}
		});
	}
});

app.get("/logout", (req, res)=>{
	req.session.destroy();
	mySession = null;
	res.redirect("/");
});


app.get("/home", checkLogin, (req, res)=>{
	console.log("Sisse on loginud kasutaja:" + mySession.userId);
	res.render("home");
});


app.get("/signup", (req, res) =>{
	res.render("signup");
});

app.post("/signup", (req, res) =>{
	let notice = "ootan andmeid";
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput ||!req.body.emailInput || !req.body.passwordInput || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log("andmeid on puudu või paroolid ei kattu!");
		notice= "andmeid on puudu või paroolid ei klapi!";
		res.render("signup", {notice: notice});
	}
	else{
		notice = "Andmed korras!";
		bcrypt.genSalt(10, (err, salt)=>{
			if(err){
				notice = "Tehniline viga, kasutajat ei loodud";
				res.render("signup", {notice: notice});
			}
			else{
				bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash)=>{
					if(err){
					notice = "Tehniline viga, kasutajat ei loodud";
				        res.render("signup", {notice: notice});
					}
					else{
						let sqlReq = "INSERT INTO vpusers (first_name, last_name, birth_date, gender, email, password)  VALUES(?,?,?,?,?,?)";
						conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result)=>{
							if(err){
								notice= " Tehniline viga andmebaasi kirjutamisel, kasutajat ei loodud";
                                                                   res.render("signup", {notice: notice});
							}
							else{
								notice = "kasutaja" + req.body.emailInput + "edukalt loodud!";
								res.render("signup", {notice: notice});
								
							}
						});					
						
					}
				}); 
			}
		});
		//res.render("signup", {notice: notice});
	}
});

app.get("/timenow", (req, res)=>{
	const weekdayNow = dateTime.weekDayEt();
	const dateNow = dateTime.dateFormattedEt();
	const timeNow = dateTime.timeFormattedEt();
	res.render("timenow", {nowWD: weekdayNow, nowD: dateNow, nowT: timeNow});
});

app.get("/vanasonad", (req, res)=>{
	let folkWisdom = [];
	fs.readFile("public/textfiles/vanasonad", "utf8", (err, data)=>{
		if(err){
			throw err;
		}
		else {
			folkWisdom = data.split(";");
			res.render("justlist", {h2: "vanasõnad", listData: folkWisdom});
		}
	});
	
});



app.get("/regvisit", (req, res)=>{
	res.render("regvisit");
	
});

app.post("/regvisit", (req, res)=>{
	//console.log(req.body);
	//avan txt faili selliselt, et kui seda pole olemas see luuakse
	fs.open("public/textfiles/log.txt", "a", (err, file) => {
		if(err){
			throw err;
		}
		else {
			const now = new Date();
            		const dateString = now.toLocaleString();
			
			fs.appendFile("public/textfiles/log.txt", req.body.firstNameInput + " " + req.body.lastNameInput + dateString + ";", (err) =>{
				if (err){
					throw err;
				}
				else {
					console.log("Faili kirjutati!");
					res.render("regvisit");
				}
			});
		}
	});
});


app.get("/regvisitDB", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	res.render("regvisitDB", {notice: notice, firstName: firstName, lastName: lastName});
	
});

app.post("/regvisitDB", (req, res)=>{
	let notice= "";
	//kontrollin, kas kõik vajalikud andmed on olemas
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		notice = "osa andmeid on puudu!";
		firstName = req.body.firstNameInput;
		lastName = req.body.lastNameInput;
		res.render("regvisitDB", {notice: notice, firstName: firstName, lastName: lastName});
	}
	else {
		let sqlReq = "INSERT INTO vp2visitlog (firstName, lastName) VALUES(?,?)";
		conn.query(sqlReq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlRes)=>{
			if (err) {
				notice = "Tehnilistel pأµhjustel andmeid ei salvestatud!";
				res.render("regvisitDB", {notice: notice, firstName: firstName, lastName: lastName});
				throw err;
			}
			else {
				res.redirect("/");
			}
		});
	}
});



app.get("/reg", (req, res) => {
    const logFilePath = path.join(__dirname, "public/textfiles/log.txt");
   
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
        }
      
        reg = data.split(";")        
	res.render("reg", { reg: reg });
    });
});

app.get("/eestifilm", (req, res)=>{
	res.render("eestifilm");
});


app.get("/addperson", (req, res) => {
    let notice = "";
    let firstName = "";
    let lastName = "";
    let dateOfBirth = "";
    res.render("addperson", { notice: notice, firstName: firstName, lastName: lastName, dateOfBirth: dateOfBirth });
});

app.post("/addperson", (req, res) => {
    let notice = "";
    let firstName = req.body.firstNameInput || "";
    let lastName = req.body.lastNameInput || "";
    let dateOfBirth = req.body.dateOfBirthInput || "";
     
    
    if (!firstName || !lastName || !dateOfBirth) {
        notice = "Osa andmeid on puudu!";
        res.render("addperson", { notice: notice, firstName: firstName, lastName: lastName, dateOfBirth: dateOfBirth });
    } else {
        let sqlReq = "INSERT INTO person (firstName, lastName, dateOfBirth) VALUES(?, ?, ?)";
        conn.query(sqlReq, [firstName, lastName, dateOfBirth], (err, sqlRes) => {
            if (err) {
                notice = "Tehnilistel p�hjustel andmeid ei salvestatud!";
                res.render("addperson", { notice: notice, firstName: firstName, lastName: lastName, dateOfBirth: dateOfBirth });
                throw err;
            } else {
                res.redirect("/");
            }
        });
    }
});



app.get("/eestifilm/tegelased", (req, res)=>{
	//loon andmebaasipäringu
	let sqlReq = "SELECT id, firstName, lastname, dateOfBirth FROM person";
	conn.query(sqlReq, (err, sqlRes)=> {
		if(err){
			throw err;
		}
		else {
			//console.log(sqlRes);
			res.render("tegelased", {persons: sqlRes});
		}
	});	
});

app.get("/personrelations/:id", (req, res) =>{
	console.log(req.params);
	res.render("personrelations")
});

app.get("/addmovie", (req, res) => {
    let notice = "";
    let title = "";
    let production_year = "";
    res.render("addmovie", { notice: notice, title: title, production_year: production_year });
});


app.post("/addmovie", (req, res) => {
    let notice = "";
    let title = req.body.titleInput || ""; 
    let production_year = req.body.production_yearInput || ""; 
       if (!title || !production_year) {
        notice = "Osa andmeid on puudu!";
        res.render("addmovie", { notice: notice, title: title, production_year: production_year });
    } else {
        let sqlReq = "INSERT INTO movie (title, production_year) VALUES(?, ?)";
        conn.query(sqlReq, [title, production_year], (err, sqlRes) => {
            if (err) {
                notice = "Tehnilistel p�hjustel andmeid ei salvestatud!";
                res.render("addmovie", { notice: notice, title: title, production_year: production_year });
                throw err;
            } else {
                res.redirect("/");
            }
        });
    }
});

app.get("/eestifilm/filmid", (req, res)=>{
	//loon andmebaasipäringu
	let sqlReq = "SELECT title, production_year FROM movie";
	conn.query(sqlReq, (err, sqlRes)=> {
		if(err){
			throw err;
		}
		else {
			//console.log(sqlRes);
			res.render("filmid", {movies: sqlRes});
		}
	});
});

app.get("/addrole", (req, res) => {
    let notice = "";
    let role = "";
    let personId = "";
    let movieId = "";
    
    const sqlPersons = "SELECT id, firstName, lastName FROM person";
    const sqlMovies = "SELECT id, title FROM movie";
    
    conn.query(sqlPersons, (err, persons) => {
        if (err) throw err;

        conn.query(sqlMovies, (err, movies) => {
            if (err) throw err;

            res.render("addrole", { notice: notice, role: role, personId: personId, movieId: movieId, persons: persons, movies: movies });
        });
    });
});

app.post("/addrole", (req, res) => {
    let notice = "";
    let role = req.body.roleInput || "";
    let personId = req.body.personId || "";
    let movieId = req.body.movieId || "";

    if (!role || !personId || !movieId) {
        notice = "Osa andmeid on puudu!";
        
        const sqlPersons = "SELECT id, firstName, lastName FROM person";
        const sqlMovies = "SELECT id, title FROM movie";

        conn.query(sqlPersons, (err, persons) => {
            if (err) throw err;

            conn.query(sqlMovies, (err, movies) => {
                if (err) throw err;

                res.render("addrole", { notice: notice, role: role, personId: personId, movieId: movieId, persons: persons, movies: movies });
            });
        });
    } else {
        let sqlReq = "INSERT INTO role (role, personId, movieId) VALUES (?, ?, ?)";
        conn.query(sqlReq, [role, personId, movieId], (err, sqlRes) => {
            if (err) {
                notice = "Tehnilistel põhjustel andmeid ei salvestatud!";
                
                const sqlPersons = "SELECT id, firstName, lastName FROM person";
                const sqlMovies = "SELECT id, title FROM movie";

                conn.query(sqlPersons, (err, persons) => {
                    if (err) throw err;

                    conn.query(sqlMovies, (err, movies) => {
                        if (err) throw err;

                        res.render("addrole", { notice: notice, role: role, personId: personId, movieId: movieId, persons: persons, movies: movies });
                    });
                });
            } else {
                res.redirect("/");
            }
        });
    }
});

app.get("/addrelations", (req,res)=>{
	//kasutades async moodulit, panen mitu andmebaasipäringut paralleelselt toimima
	// loon SQL päringute(lausa tegevuste ehk funktsioonide) loendi
	const myQueries= [
		function(callback){
			conn.execute("SELECT id, firstName, lastName, dateOfBirth FROM person", (err, result)=>{
				if(err){
					return callback(err)
				}
				else{
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn.execute("SELECT id, title, production_year FROM movie", (err, result)=>{
				if(err){
					return callback(err)
				}
				else{
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn.execute("SELECT id, positionName FROM position", (err, result)=>{
				if(err){
					return callback(err)
				}
				else{
					return callback(null, result);
				}
			});
		}
	];
	//paneme need tegevused paralleeelselt tööle, tulemus tuleb kui kõik on tehthud
	//väljundiks 1 koondlist
	asyn.parallel(myQueries, (err, results)=>{
		if (err){
			throw(err)
		}
		else{
		console.log(results);
		res.render("addrelations", {personList: results[0], movieList: results[1]});
		}
	});
	/* let sqlReq = "SELECT id, firstName, lastName, dateOfBirth FROM person";
	conn.execute(sqlReq, (err, result)=>{
		if(err){
			throw err;
		}
		else{
			console.log(result);
			res.render("addrelations", {personList: result});
		 */
	/* }); */
});


app.get("/photoupload", (req, res)=>{
	res.render("photoupload");
});

app.post("/photoupload", upload.single("photoInput"), (req, res)=>{
	console.log(req.body);
	console.log(req.file);
	const fileName = "vp_" + Date.now() + ".jpg";
	const userId = req.session.userId;
	fs.rename(req.file.path, req.file.destination + "/" + fileName, (err)=>{
			console.log("Faili nime muutmise viga" + err);
	});
	sharp(req.file.destination + "/" + fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/gallery/normal/" + fileName);
	sharp(req.file.destination + "/" + fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/gallery/thumb/" + fileName);
	//salvestame info andmebaasi
	let sqlReq = "INSERT INTO vpphotos (file_name, orig_name, alt_text, privacy, user_id) VALUES(?,?,?,?,?)" 
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId],(err, result)=>{
		if (err) {
			throw err
		}
		else {
			res.render("photoupload");
		}
	});
});

app.get("/gallery", (req, res)=>{
	let sqlReq = "SELECT id, file_name, alt_text FROM vpphotos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC";
	const privacy = 3;
	let photoList = [];
	conn.execute(sqlReq, [privacy], (err, result)=>{
		if(err){
			throw err;
		}
		else {
			console.log(result);
			for(let i = 0; i < result.length; i ++) {
				photoList.push({id: result[i].id, href: "/gallery/thumb/", filename: result[i].file_name, alt: result[i].alt_text});
			}
			res.render("gallery", {listData: photoList});
		}
	});
});

function checkLogin(req, res, next){
	if(mySession !=null){
		if(mySession.userId){
			console.log("Login ok!");
			next();
		}
		else{
			console.lof("Login not detected!");
			res.redirect("/");
		}
	}
	else{
		res.redirect("/");
	}
}

app.listen(5204);

 