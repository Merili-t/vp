const express = require("express");
const dateTime = require ("./dateTime");
const fs = require("fs");
const bodyparser = require("body-parser");
const path = require("path");

//andmebaasi andmed
const dbInfo = require("../../vp2024config");
//andmebaasiga suhtlemine
const mysql = require("mysql2");

const app = express();

//määran view mootori
app.set("view engine", "ejs");

//määran jagatavate avalike failide kasuta
app.use(express.static("public"));

//kasutame body-parserit päringute parsimiseks (kui ekst ss false, kui pildid jm ss true)
app.use(bodyparser.urlencoded({extended: false}));

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

app.get("/eestifilm/tegelased", (req, res)=>{
	//loon andmebaasipärongu
	let sqlReq = "SELECT firstName, lastname, dateOfBirth FROM person";
	conn.query(sqlReq, (err, sqlRes)=> {
		if(err){
			throw err;
		}
		else {
			//console.log(sqlRes);
			res.render("tegelased", {persons: sqlRes});
		}
	});
	//res.render("tegelased");
	
});

app.get("/eestifilm/lisa", (req, res)=>{
	res.render ("addperson");
});


app.listen(5204);

