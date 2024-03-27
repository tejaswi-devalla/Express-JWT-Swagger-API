const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { Web3 } = require("web3");
require("dotenv").config();

const app = express();
app.use(express.json());

const INFURA_API = process.env.INFURA_API_KEY;

const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_API}`);

const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

dbPath = path.join(__dirname, "users.db");
let db = null;

const initializationDbPath = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000/api-docs`);
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};
initializationDbPath();

app.post("/register/", async (request, response) => {
  const { name, email, username, password } = request.body;
  const checkUserQuery = `select * from Users where email='${email}' or username='${username}';`;
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400).send("Password is too short");
    } else {
      const hashPassword = await bcrypt.hash(password, 10);
      const registerUserQuery = `insert into Users (name, email, username, password) values ('${name}','${email}','${username}','${hashPassword}');`;
      await db.run(registerUserQuery);
      response.status(200).send("User Registered Successfully");
    }
  } else {
    if (dbUser.email === email && dbUser.username === username) {
      response.status(400).send("User already exists");
    } else if (dbUser.email === email) {
      response.status(400).send("Email already exists");
    } else {
      response.status(400).send("Username already exists");
    }
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `select * from Users where username='${username}';`;
  const dbUser = await db.get(checkUserQuery);
  const payLoad = { username: dbUser.username, email: dbUser.email };
  const jwtToken = jwt.sign(payLoad, "mysecretkey");
  if (dbUser === undefined) {
    response.status(400).send("Invalid User");
  } else {
    const isPassMatches = await bcrypt.compare(password, dbUser.password);
    if (isPassMatches) {
      response.status(200).send({ jwtToken });
    } else {
      response.status(400).send("Invalid Password");
    }
  }
});

const verifyToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader != undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(400).send("Unauthorized");
  } else {
    jwt.verify(jwtToken, "mysecretkey", async (err, decoded) => {
      if (err) {
        response.status(400).send("Invalid JWT Token");
      } else {
        request.user = decoded;
        next();
      }
    });
  }
};

app.get("/protected/", verifyToken, (request, response) => {
  const { username, email } = request.user;
  response.status(200).send({
    message: "Protected Route accessed successfully",
    user: { username, email },
  });
});

app.get("/data/", async (request, response) => {
  try {
    console.log("Fetching Data...");
    const { category, limit } = request.query;
    const dataRes = await axios.get("https://api.publicapis.org/entries");
    const data = dataRes.data.entries;
    let filteredData = data;
    if (category) {
      filteredData = filteredData.filter((data) => data.Category === category);
    }
    if (limit) {
      filteredData = filteredData.slice(0, parseInt(limit));
    }
    response.status(200).send({ filteredData });
    console.log("Data Fetched");
  } catch (err) {
    response
      .status(500)
      .send({ error: `Internal server error: ${err.message}` });
  }
});

app.get("/balance/:address", verifyToken, async (request, response) => {
  try {
    const address = request.params.address;
    if (!web3.utils.isAddress(address)) {
      return response.status(400).send({ error: "Invalid Ethereum address" });
    }
    const balance = await web3.eth.getBalance(address);
    const totBalanceEth = web3.utils.fromWei(balance, "ether");
    response.send({ balance: totBalanceEth });
  } catch (err) {
    response
      .status(500)
      .send({ error: `Internal server error: ${err.message}` });
  }
});
