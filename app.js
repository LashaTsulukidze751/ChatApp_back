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

//get all messages
app.post("/main/chatroom", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try{
    const result = await client.query(
      "SELECT * FROM Messages WHERE (senderid = $1 AND receiverid = $2) OR (senderid = $2 AND receiverid = $1) ORDER BY timestamp",
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
