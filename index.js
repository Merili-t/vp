const express = require("express");
const dateTime = require ("./dateTime");
const fs = require("fs");
const bodyparser = require("body-parser");
const app = express();
const path = require("path");


//määran view mootori
app.set("view engine", "ejs");

//määran jagatavate avalike failide kasuta
app.use(express.static("public"));

//kasutame body-parserit päringute parsimiseks (kui ekst ss false, kui pildid jm ss true)
app.use(bodyparser.urlencoded({extended: false}))
app.get("/", (req, res)=>{
	//res.send("express läks käima!");
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



app.listen(5204);

