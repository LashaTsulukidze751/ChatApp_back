import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const app = express();

app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "ChatApp",
  user: "postgres",
  password: "lasha",
});

//login
app.post("/main/login", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try{
    const result = await client.query(
      "SELECT username FROM Users WHERE username=$1 AND password_hash=$2",
      [data.username, data.password_hash]
    );
    res.status(200).json(result.rows);
  }catch(error){
    res.status(500).json({error})
  }finally{
    client.release()
  }
});

//registration
app.post("/reg", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const validation = check(data);
    if (validation.valid) {
      const result = await client.query(
        "INSERT INTO users (username, password_hash, email, usersurname, gender) VALUES ($1,$2,$3,$4,$5)",
        [data.username, data.password_hash, data.email, data.usersurname, data.gender]
      );
      res.status(200).json({
        message: validation.message,
        added: true,
      });
    } else {
      res.status(400).json({
        message: validation.message,
        added: false,
      });
    }
  } catch (error) {
    res.status(406).json({message:"user already exists"});
  } finally {
    client.release();
  }
});

//reg check
const check = (data) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidCharacters = /[\';"]/;
  if (!data.username || !data.email || !data.password_hash || !data.usersurname || !data.gender) {
    return { valid: false, message: "Not provided all data" };
  } else if (!emailRegex.test(data.email)) {
    return { valid: false, message: "Not valid Email" };
  } else if (!passwordRegex.test(data.password_hash)) {
    return { valid: false, message: "Incude special characters in password" };
  } else if (
    invalidCharacters.test(data.name) ||
    invalidCharacters.test(data.email) ||
    invalidCharacters.test(data.password_hash) ||
    invalidCharacters.test(data.surname)
  ) {
    return { valid: false, message: "sql injection" };
  } else {
    return { valid: true, message: "User added" };
  }
};


//get all users
app.post("/main/chat", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try{
    const result = await client.query(
      "SELECT username, usersurname, profileimage FROM Users WHERE username != $1",
      [data.username]
    );
    res.status(200).json(result.rows);
  }catch(error){
    res.status(500).json({error})
  }finally{
    client.release()
  }
});

//message input
app.post("/main/chatroom/send", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try{
    const result = await client.query(
      "INSERT INTO Messages (senderid, receiverid, content) VALUES ($1,$2,$3)",
      [data.senderid, data.receiverid, data.content]
    );
    res.status(200).json("message sent");
  }catch(error){
    console.log(error)
    res.status(500).json(error)
  }finally{
    client.release();
  }
});

//get 2 user
app.post("/main/chatroom/users", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try{
    const result = await client.query(
      'SELECT userid FROM users WHERE username = $1',
      [data.user]
    );
    res.status(200).json(result.rows);
  }catch(eror){
    console.log(eror)
    res.status(500).json({eror})
  }finally{
    client.release();
  }
});

//get all messages
app.post("/main/chatroom", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try{
    const result = await client.query(
      'SELECT * FROM Messages WHERE (senderid = (SELECT userid FROM users WHERE username = $1) AND receiverid = (SELECT userid FROM users WHERE username = $2))  OR (senderid = (SELECT userid FROM users WHERE username = $2) AND receiverid = (SELECT userid FROM users WHERE username = $1)) ORDER BY timestamp',
      [data.user1, data.user2]
    );
    res.status(200).json(result.rows);
  }catch(eror){
    res.status(500).json({eror})
  }finally{
    client.release();
  }
});

app.listen(4000, () => {
  console.log(`app is listening on port 4000`);
});
