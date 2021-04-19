var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: true,
  parameterLimit: 50000
}));

// var cors = require('cors')
// app.use(cors())
// Parse URL-encoded bodies (as sent by HTML forms)
// app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
// app.use(express.json());
var mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "telemetry",
  password: "telemetry",
  database: "telemetry"
});


app.use(function (req, res, next) {
  console.log(`${new Date()} - ${req.method} request for ${req.url}`);
  next();
});
con.connect(function (err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Connected")
});
app.get('/', function (req, res) {
  res.sendFile(__dirname + "/" + "index.htm");
})
//  {"ip": "", "hostname": "", "time": "", "site":"" ,"score": "", "base64": ""}
app.post('/insert', async function (req, res) {

  var record = req.body;
  con.query("SELECT *  FROM information_schema.tables WHERE table_schema = 'telemetry' AND table_name = 'stats' LIMIT 1;", function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    if (result && result.length > 0) {
      //table exists
      con.query("INSERT INTO stats (hostname, time,site,score,base64,created_at) VALUES ('" + record.hostname + "','" + record.time + "','" + record.site + "','" + record.score + "','" + record.base64 + "',now())", function (err, result) {
        if (err) {
          res.send(err);
          return;
        }
        console.log("Data Inserted");

        res.sendStatus(200)

      });

    } else {
      //table does not exists
      con.query("CREATE TABLE stats ( id int NOT NULL AUTO_INCREMENT ,hostname VARCHAR(255), time VARCHAR(255),site VARCHAR(255),score VARCHAR(255),base64 LONGTEXT,created_at DATETIME,   PRIMARY KEY (id))", function (err, result) {
        if (err) {
          res.send(err);
          return;
        }
        console.log("Table created");
        con.query("INSERT INTO stats (hostname, time,site,score,base64,created_at) VALUES ('" + record.hostname + "','" + record.time + "','" + record.site + "','" + record.score + "','" + record.base64 + "',now())", function (err, result) {
          if (err) {
            res.send(err);
            return;
          }
          console.log("Data Inserted");

          res.sendStatus(200)

        });

      });
    }
  });

})
app.get("/read/:page/:perpage", function (req, res) {
  var page = req.params.page;
  var recPerPage = req.params.perpage
  console.log(page);
  con.query("SELECT * FROM stats ORDER BY id DESC LIMIT " + (page - 1) * recPerPage + "," + recPerPage + " ", function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    console.log("Data Read");

    res.send(result)

  });
})
app.post("/fetchByDate", function (req, res) {
  var start = req.body.start;
  console.log(start);
  var end = req.body.end;
  console.log(end);
  con.query("select * from stats where created_at between '" + start + " 00:00:00' and  '" + end + " 23:59:59';", function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    console.log("Data Read by date");

    res.send(result)

  });
})
var server = app.listen(9091, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})
